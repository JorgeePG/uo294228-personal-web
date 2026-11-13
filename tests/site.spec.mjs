import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const pages=['','sobre-mi/','intereses/','multimedia/','series-y-peliculas/','videojuegos/','buscar/','ayuda/','en/','en/sobre-mi/','en/intereses/','en/multimedia/','en/series-y-peliculas/','en/videojuegos/','en/buscar/','en/ayuda/','404.html','en/404.html','public/transcripciones/war-on-wheels.html'];
const axe=fs.readFileSync('node_modules/axe-core/axe.min.js','utf8');
for(const route of pages)test(`responsive, links and axe: /${route}`,async({page,request})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/'+route);
 await expect(page.locator('body > header input[type="search"]')).toBeVisible();
 await expect(page.locator('body > header button[type="submit"]')).toBeVisible();
 for(const width of [320,375,768,1280,1920]){
  await page.setViewportSize({width,height:900});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 }
 await page.addScriptTag({content:axe});
 const result=await page.evaluate(async()=>{const r=await axe.run();return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.html)}));});
 expect(result).toEqual([]);expect(errors).toEqual([]);
 const links=await page.locator('a[href]').evaluateAll(els=>els.map(e=>e.href));
 for(const url of new Set(links.filter(u=>u.startsWith('http://127.0.0.1:4173'))))expect((await request.get(url)).status(),url).toBe(200);
});
test('keyboard skip, gallery, focus restoration and disclosure',async({page})=>{
 await page.goto('/intereses/');await page.keyboard.press('Tab');await expect(page.getByRole('link',{name:'Saltar al contenido'})).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('main')).toBeFocused();
 await page.keyboard.press('Tab');await page.keyboard.press('Enter');await expect(page.locator('dialog')).toBeVisible();await expect(page.getByRole('button',{name:'Cerrar imagen'})).toBeFocused();await page.keyboard.press('Escape');await expect(page.locator('dialog')).not.toBeVisible();await expect(page.locator('[data-enlarge]').first()).toBeFocused();await page.keyboard.press('Tab');await page.keyboard.press('Enter');await expect(page.locator('details').first()).toHaveAttribute('open','');
});

test('only expanded vehicle cards share height; closed cards stay compact',async({page})=>{
 for(const width of [1440,768,375]){
  await page.setViewportSize({width,height:1000});await page.goto('/intereses/');await page.evaluate(()=>document.fonts.ready);
  const cards=page.locator('#vehiculos main > ul > li > article');
  const heights=()=>cards.evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().height));
  const before=await heights();
  await cards.nth(0).locator('summary').click();await expect(cards.nth(0)).toHaveAttribute('data-expanded','');
  const first=(await heights())[0];expect(first).toBeGreaterThan(before[0]+50);
  await expect.poll(async()=>Math.abs((await heights())[1]-before[1])).toBeLessThan(1);
  await cards.nth(0).locator('summary').click();await expect(cards.nth(0)).not.toHaveAttribute('data-expanded');
  await cards.nth(2).locator('summary').click();await expect(cards.nth(2)).toHaveAttribute('data-expanded','');
  const second=(await heights())[2];
  await cards.nth(0).locator('summary').click();
  await expect.poll(async()=>{const h=await heights();return Math.max(Math.abs(h[0]-h[2]),Math.abs(h[0]-Math.max(first,second)),Math.abs(h[1]-before[1]),Math.abs(h[3]-before[3]));}).toBeLessThan(1.1);
  await cards.nth(0).locator('summary').click();
  await expect.poll(async()=>Math.abs((await heights())[2]-second)).toBeLessThan(1.1);
  await cards.nth(2).locator('summary').click();
  await expect.poll(async()=>Math.max(...(await heights()).map((h,i)=>Math.abs(h-before[i])))).toBeLessThan(1);
 }
});
test('carousel keyboard, circular navigation and stable height',async({page})=>{
 await page.goto('/videojuegos/');await page.emulateMedia({reducedMotion:'reduce'});
 const track=page.locator('[data-track]');await track.focus();const height=await track.evaluate(e=>e.getBoundingClientRect().height);
 for(const count of ['2 de 3','3 de 3','1 de 3']){await page.keyboard.press('ArrowRight');await expect(page.locator('[aria-live]')).toHaveText(count);await expect.poll(()=>track.evaluate(e=>e.getBoundingClientRect().height)).toBe(height);}
 await page.getByRole('button',{name:'Siguiente',exact:true}).click();await expect(page.locator('[aria-live]')).toHaveText('2 de 3');
 await page.setViewportSize({width:375,height:812});await expect(page.locator('[aria-live]')).toHaveText('2 de 3');
 for(const width of [320,375,768]){await page.setViewportSize({width,height:812});for(let i=0;i<3;i++){await page.keyboard.press('ArrowRight');await page.getByRole('button').last().click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();}}
});
test('search accents, multi-term, no results, injection and English',async({page})=>{
 await page.goto('/buscar/');const input=page.locator('main').getByRole('searchbox');
 for(const q of ['aviacion','T-90M','tanques aviones']){await input.fill(q);await page.locator('main').getByRole('button',{name:'Buscar',exact:true}).click();await expect(page.locator('[data-results] li').first()).toBeVisible();}
 await input.fill('<img src=x onerror=alert(1)>');await page.locator('main').getByRole('button',{name:'Buscar',exact:true}).click();await expect(page.getByRole('status')).toContainText('Sin resultados');await expect(page.locator('[data-results] img')).toHaveCount(0);
 await page.goto('/en/buscar/?q=aircraft');await expect(page.locator('[data-results] li').first()).toBeVisible();await expect(page.getByRole('status')).toContainText('results');
});
test('search failure offers recovery',async({page})=>{await page.route('**/search-index.json',r=>r.abort());await page.goto('/buscar/?q=museo');await expect(page.getByRole('status')).toContainText('mapa del sitio');});
test('without JavaScript and images',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();await page.route(/\.(webp|jpg|png)$/,r=>r.abort());await page.goto('http://127.0.0.1:4173/intereses/');await expect(page.getByRole('navigation',{name:'Navegación principal'})).toBeVisible();await page.locator('summary').first().click();await expect(page.locator('details').first()).toHaveAttribute('open','');await context.close();
});
test('language switch retains current page',async({page})=>{await page.goto('/videojuegos/');await page.getByRole('link',{name:'English',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('lang','en');await expect(page.getByRole('heading',{level:1})).toHaveText('Video games');await page.getByRole('link',{name:'Español',exact:true}).click();await expect(page).toHaveURL(/\/videojuegos\/index.html$/);});
test('CV, references and both profile portraits are published in both languages',async({page})=>{
 for(const lang of ['', 'en/']){
  await page.goto('/'+lang+'sobre-mi/');
  await expect(page.locator('main')).toContainText('SERVEO');await expect(page.locator('main')).toContainText('Qdrant');
  await expect(page.locator('main')).toContainText('José Ramón Blanco González');await expect(page.locator('main')).toContainText('Juan Menéndez Blanco');
  const portraits=page.locator('[data-reference-portrait]');await expect(portraits).toHaveCount(2);for(const portraitImage of await portraits.all()){await portraitImage.scrollIntoViewIfNeeded();await expect.poll(()=>portraitImage.evaluate(i=>i.complete&&i.naturalWidth===200&&i.naturalHeight===200)).toBeTruthy();}
  await expect(page.locator('main img[src*="twave-equipo"]')).toHaveCount(0);
  await expect(page.locator('main a[href*="linkedin.com/in/"]')).toHaveCount(2);
  await expect(page.locator('footer a[href*="github.com/JorgeePG"]')).toBeVisible();
  for(const width of [375,1280]){await page.setViewportSize({width,height:900});const portrait=await page.locator('img[alt*="Jorge Puente García"]').boundingBox();expect(Math.abs(portrait.width-portrait.height)).toBeLessThan(1);}
 }
});
test('collecting interest is searchable in Spanish and English',async({page})=>{
 await page.goto('/buscar/?q=coleccionismo');await expect(page.locator('[data-results]')).toContainText('Videojuegos');
 await page.goto('/en/buscar/?q=collecting');await expect(page.locator('[data-results]')).toContainText('Video games');
});

test('header search works by button and Enter in both languages and on transcript',async({page})=>{
 for(const [route,term,title,viaEnter] of [['sobre-mi/','tanques','Buscar',false],['en/intereses/','tanks','Search',true],['public/transcripciones/war-on-wheels.html','coleccionismo','Buscar',true],['404.html','T-90M','Buscar',false]]){
  await page.goto('/'+route);const header=page.locator('body > header');await header.getByRole('searchbox').fill(term);
  if(viaEnter)await header.getByRole('searchbox').press('Enter');else await header.getByRole('button',{name:title,exact:true}).click();
  await expect(page.locator('main h1')).toHaveText(title);await expect(page.locator('[data-results] li').first()).toBeVisible();
 }
});

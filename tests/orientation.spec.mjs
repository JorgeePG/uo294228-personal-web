import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const inventory=JSON.parse(fs.readFileSync('public/search-coverage.json','utf8')).pages;

test('all pages show their position and working ancestor links',async({page,request})=>{
 const observed=[];
 for(const {file} of inventory){
  await page.goto('/'+file);
  const main=page.locator('main'),trail=page.getByRole('navigation',{name:file.startsWith('en/')?'Breadcrumb':'Ruta de navegación',exact:true});
  await expect(main.locator('h1')).toHaveCount(1);
  await expect(page.locator('body > a[href="#contenido"]')).toHaveCount(1);
  if(['index.html','en/index.html'].includes(file)){await expect(trail).toHaveCount(0);continue;}
  await expect(trail).toHaveAttribute('aria-label',file.startsWith('en/')?'Breadcrumb':'Ruta de navegación');
  await expect(trail.locator('[aria-current="page"]')).toHaveCount(1);
  const links=await trail.locator('a').evaluateAll(nodes=>nodes.map(node=>node.href));
  for(const link of links)expect((await request.get(link)).status()).toBe(200);
  observed.push({file,position:await trail.textContent(),ancestors:links});
 }
 await test.info().attach('orientation-observed.json',{body:Buffer.from(JSON.stringify(observed,null,2)),contentType:'application/json'});
});

test('both site maps cover all public content and search without error pages',async({page,request})=>{
 for(const locale of ['', 'en/']){
  await page.goto('/'+locale+'ayuda/index.html');
  const map=page.locator('[data-site-map]');
  const links=await map.locator('a').evaluateAll(nodes=>nodes.map(node=>new URL(node.href).pathname.slice(1)));
  const expected=inventory.filter(({file})=>file!=='404.html'&&file!=='en/404.html'&&file!==locale+'ayuda/index.html'&&(file.startsWith('public/')||file.startsWith('en/')===!!locale)).map(({file})=>file).sort();
  expect([...links].sort()).toEqual(expected);
  await expect(map.locator('[aria-current="page"]')).toHaveText(locale?'Help and site map':'Ayuda y mapa del sitio');
  for(const file of links)expect((await request.get('/'+file)).status()).toBe(200);
  await map.getByRole('link',{name:/War on Wheels/}).click();
  await expect(page.locator('main h1')).toHaveText('War on Wheels — transcript');
  await page.getByRole('navigation',{name:'Ruta de navegación',exact:true}).getByRole('link').last().click();
  await expect(page.locator('main h1')).toHaveText('Vídeo y podcast');
 }
});

test('orientation stays usable on narrow screens and without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:812}});
 const page=await context.newPage();
 for(const route of ['ayuda/index.html','en/buscar/index.html','public/transcripciones/war-on-wheels.html']){
  await page.goto('http://127.0.0.1:4173/'+route);
  const trail=page.getByRole('navigation',{name:/Breadcrumb|Ruta de navegación/});
  await expect(trail.locator('[aria-current="page"]')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await trail.getByRole('link').first().click();
  await expect(page.locator('main h1')).toBeVisible();
 }
 await context.close();
});

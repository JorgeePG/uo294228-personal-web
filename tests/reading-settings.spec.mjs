import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const axe=fs.readFileSync('node_modules/axe-core/axe.min.js','utf8');
test('reading settings: keyboard, persistence across languages, reset and system motion',async({page})=>{
 await page.goto('/intereses/');
 const panel=page.locator('[data-reading-settings]');
 const trigger=page.locator('[data-reading-trigger]');
 await trigger.focus();await page.keyboard.press('Enter');
 await expect(panel).toHaveAttribute('open','');
 await expect(panel.getByRole('button',{name:'Cerrar ajustes',exact:true})).toBeFocused();
 await page.keyboard.press('Shift+Tab');await expect(panel.getByRole('button',{name:'Restablecer ajustes',exact:true})).toBeFocused();
 await page.keyboard.press('Tab');await expect(panel.getByRole('button',{name:'Cerrar ajustes',exact:true})).toBeFocused();
 await page.keyboard.press('Tab');await expect(panel.locator('[data-reading-panel]')).toBeFocused();
 await page.keyboard.press('Tab');await expect(panel.getByLabel('Tamaño del texto')).toBeFocused();
 await panel.getByLabel('Tamaño del texto').selectOption('150');
 await panel.getByLabel('Más espacio entre letras y líneas').check();
 await panel.getByLabel('Tipografía sencilla en los títulos').check();
 await panel.getByLabel('Destacar todos los enlaces').check();
 await panel.getByLabel('Reducir movimiento').check();
 await expect.poll(()=>page.locator('h1').evaluate(e=>getComputedStyle(e).fontFamily)).toBe('Arial, sans-serif');
 await expect.poll(()=>page.locator('main a').first().evaluate(e=>getComputedStyle(e).textDecorationLine)).toBe('underline');
 await panel.getByLabel('Fuente OpenDyslexic para dislexia',{exact:true}).check();
 await expect.poll(()=>page.locator('h1').evaluate(e=>getComputedStyle(e).fontFamily)).toContain('OpenDyslexic');
 await page.keyboard.press('Escape');await expect(panel).not.toHaveAttribute('open');await expect(trigger).toBeFocused();
 await page.getByRole('link',{name:'English',exact:true}).click();
 await trigger.click();
 await expect(page.getByLabel('Text size',{exact:true})).toHaveValue('150');
 await expect(page.getByLabel('Reduce motion',{exact:true})).toBeChecked();
 await expect(page.getByLabel('OpenDyslexic font for dyslexia',{exact:true})).toBeChecked();
 await page.reload();await trigger.click();
 await expect(page.getByLabel('Text size',{exact:true})).toHaveValue('150');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.getByRole('button',{name:'Reset settings',exact:true}).click();
 await expect(page.getByLabel('Text size',{exact:true})).toHaveValue('100');
 await expect(page.getByLabel('Reduce motion',{exact:true})).not.toBeChecked();
 await expect(page.getByLabel('OpenDyslexic font for dyslexia',{exact:true})).not.toBeChecked();
 expect(await page.evaluate(()=>localStorage.getItem('jorge-reading-v1'))).toBeNull();
 expect(await page.locator('html').evaluate(e=>getComputedStyle(e).scrollBehavior)).toBe('auto');
 await page.getByRole('button',{name:'Close settings',exact:true}).click();
 await expect(trigger).toBeFocused();
});
test('maximum reading settings keep content, controls and open cards usable on all routes',async({page})=>{
 test.setTimeout(120000);
 await page.addInitScript(()=>localStorage.setItem('jorge-reading-v1',JSON.stringify({size:'200',spacing:true,font:true,dyslexia:true,links:true,motion:true})));
 for(const route of ['','sobre-mi/','intereses/','multimedia/','series-y-peliculas/','videojuegos/','buscar/','ayuda/','404.html','en/','en/sobre-mi/','en/intereses/','en/multimedia/','en/series-y-peliculas/','en/videojuegos/','en/buscar/','en/ayuda/','en/404.html','public/transcripciones/war-on-wheels.html']){
  await page.goto('/'+route);await page.evaluate(()=>document.fonts.ready);
  const panel=page.locator('[data-reading-settings]');await page.locator('[data-reading-trigger]').click();
  for(const width of [320,375,768,1280]){
   await page.setViewportSize({width,height:900});
   await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),{message:route+' at '+width}).toBeTruthy();
   for(const element of await panel.locator('input,select,button').all()){
    const box=await element.boundingBox();expect(box.x,route).toBeGreaterThanOrEqual(0);expect(box.x+box.width,route).toBeLessThanOrEqual(width);
   }
   const bounds=await panel.boundingBox();expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.y).toBeGreaterThanOrEqual(0);expect(bounds.y+bounds.height).toBeLessThanOrEqual(900);
   await panel.getByRole('button',{name:/Restablecer ajustes|Reset settings/}).scrollIntoViewIfNeeded();
   await expect(panel.getByRole('button',{name:/Cerrar ajustes|Close settings/})).toBeInViewport();
   await expect(panel.getByRole('button',{name:/Restablecer ajustes|Reset settings/})).toBeInViewport();
  }
  await page.addScriptTag({content:axe});
  expect(await page.evaluate(async()=>{const r=await axe.run();return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.html)}));}),route).toEqual([]);
  if(route==='intereses/'){
   await panel.getByRole('button',{name:'Cerrar ajustes',exact:true}).click();
   const cards=page.locator('#vehiculos main > ul article');
   await cards.nth(0).locator('summary').click();await cards.nth(2).locator('summary').click();
   await expect.poll(()=>cards.evaluateAll(nodes=>Math.abs(nodes[0].getBoundingClientRect().height-nodes[2].getBoundingClientRect().height))).toBeLessThan(1.1);
   expect(await cards.nth(1).getAttribute('data-expanded')).toBeNull();
  }
 }
});
test('preferences work when storage is blocked; no dead controls without JavaScript',async({browser,page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Storage blocked','SecurityError');}}));
 await page.goto('/');await page.locator('[data-reading-trigger]').click();
 await page.getByLabel('Tamaño del texto').selectOption('125');
 await expect.poll(()=>page.locator('html').evaluate(e=>getComputedStyle(e).fontSize)).toBe('20px');
 await expect(page.locator('[data-reading-storage-warning]')).toBeVisible();expect(errors).toEqual([]);
 const context=await browser.newContext({javaScriptEnabled:false});
 const native=await context.newPage();await native.goto('http://127.0.0.1:4173/');
 await expect(native.locator('[data-reading-settings]')).not.toBeVisible();
 await expect(native.locator('[data-reading-trigger]')).not.toBeVisible();
 await expect(native.getByRole('navigation',{name:'Navegación principal'})).toBeVisible();
 await context.close();
});
test('floating launcher follows scroll, modal does not shift content, backdrop closes and fonts load on demand',async({page})=>{
 const fonts=[];page.on('request',request=>{if(/OpenDyslexic.*\.woff2/.test(request.url()))fonts.push(request.url());});
 await page.setViewportSize({width:375,height:667});await page.goto('/sobre-mi/');
 await page.evaluate(()=>document.fonts.ready);expect(fonts).toEqual([]);
 const trigger=page.locator('[data-reading-trigger]');const original=await trigger.boundingBox();
 await page.locator('footer').scrollIntoViewIfNeeded();
 const scrolled=await trigger.boundingBox();expect(scrolled.y).toBe(original.y);
 const before=await page.locator('main').boundingBox();
 await trigger.click();const panel=page.locator('[data-reading-settings]');
 expect(await panel.evaluate(e=>e.matches(':modal'))).toBe(true);
 const after=await page.locator('main').boundingBox();expect(after.height).toBe(before.height);
 for(let index=0;index<14;index++){
  await page.keyboard.press('Tab');expect(await panel.evaluate(e=>e.contains(document.activeElement))).toBe(true);
 }
 await panel.getByLabel('Fuente OpenDyslexic para dislexia',{exact:true}).check();
 await page.evaluate(()=>document.fonts.ready);
 expect(fonts.some(url=>url.includes('Regular.woff2'))).toBe(true);
 expect(fonts.some(url=>url.includes('Bold.woff2'))).toBe(true);
 expect(await page.evaluate(()=>[...document.fonts].filter(f=>f.family==='OpenDyslexic'&&f.status==='loaded').length)).toBeGreaterThanOrEqual(2);
 await panel.getByLabel('Tamaño del texto').selectOption('200');
 for(const checkbox of await panel.locator('input[type="checkbox"]').all())await checkbox.check();
 for(const [width,height] of [[568,320],[320,480]]){
  await page.setViewportSize({width,height});
  await panel.getByRole('button',{name:'Restablecer ajustes'}).scrollIntoViewIfNeeded();
  const close=panel.getByRole('button',{name:'Cerrar ajustes'});
  await expect(close).toBeInViewport();
  const closeBox=await close.boundingBox();expect(closeBox.y).toBeGreaterThanOrEqual(0);expect(closeBox.y+closeBox.height).toBeLessThanOrEqual(height);
  expect(await panel.evaluate(element=>element.scrollTop)).toBe(0);
  await expect(panel.getByRole('button',{name:'Restablecer ajustes'})).toBeInViewport();
  const bounds=await panel.boundingBox();expect(bounds.y).toBeGreaterThanOrEqual(0);expect(bounds.y+bounds.height).toBeLessThanOrEqual(height);
 }
 await panel.getByRole('button',{name:'Restablecer ajustes'}).click();
 await expect(panel.getByLabel('Fuente OpenDyslexic para dislexia')).not.toBeChecked();
 await page.mouse.click(3,3);await expect(panel).not.toBeVisible();await expect(trigger).toBeFocused();
 await page.setViewportSize({width:375,height:667});
 const contact=page.locator('main a[href^="mailto:"]').first();
 await contact.evaluate(element=>window.scrollTo({top:scrollY+element.getBoundingClientRect().top-innerHeight+40,behavior:'instant'}));
 await contact.focus();
 const linkBox=await contact.boundingBox();const triggerBox=await trigger.boundingBox();
 expect(linkBox.x+linkBox.width<=triggerBox.x||linkBox.y+linkBox.height<=triggerBox.y||linkBox.y>=triggerBox.y+triggerBox.height).toBe(true);
});

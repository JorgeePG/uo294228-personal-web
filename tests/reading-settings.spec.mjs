import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const axe=fs.readFileSync('node_modules/axe-core/axe.min.js','utf8');
test('reading settings: keyboard, persistence across languages, reset and system motion',async({page})=>{
 await page.goto('/intereses/');
 const panel=page.locator('[data-reading-settings]');
 await panel.locator('summary').focus();await page.keyboard.press('Enter');
 await expect(panel).toHaveAttribute('open','');
 await page.keyboard.press('Tab');await expect(panel.getByLabel('Tamaño del texto')).toBeFocused();
 await panel.getByLabel('Tamaño del texto').selectOption('150');
 await panel.getByLabel('Más espacio entre letras y líneas').check();
 await panel.getByLabel('Tipografía sencilla en los títulos').check();
 await panel.getByLabel('Destacar todos los enlaces').check();
 await panel.getByLabel('Reducir movimiento').check();
 await expect.poll(()=>page.locator('h1').evaluate(e=>getComputedStyle(e).fontFamily)).toBe('Arial, sans-serif');
 await expect.poll(()=>page.locator('main a').first().evaluate(e=>getComputedStyle(e).textDecorationLine)).toBe('underline');
 await page.keyboard.press('Escape');await expect(panel).not.toHaveAttribute('open');await expect(panel.locator('summary')).toBeFocused();
 await page.getByRole('link',{name:'English',exact:true}).click();
 await page.locator('[data-reading-settings] summary').click();
 await expect(page.getByLabel('Text size',{exact:true})).toHaveValue('150');
 await expect(page.getByLabel('Reduce motion',{exact:true})).toBeChecked();
 await page.reload();await page.locator('[data-reading-settings] summary').click();
 await expect(page.getByLabel('Text size',{exact:true})).toHaveValue('150');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.getByRole('button',{name:'Reset settings',exact:true}).click();
 await expect(page.getByLabel('Text size',{exact:true})).toHaveValue('100');
 await expect(page.getByLabel('Reduce motion',{exact:true})).not.toBeChecked();
 expect(await page.evaluate(()=>localStorage.getItem('jorge-reading-v1'))).toBeNull();
 expect(await page.locator('html').evaluate(e=>getComputedStyle(e).scrollBehavior)).toBe('auto');
 await page.getByRole('button',{name:'Close settings',exact:true}).click();
 await expect(page.locator('[data-reading-settings] summary')).toBeFocused();
});
test('maximum reading settings keep content, controls and open cards usable on all routes',async({page})=>{
 test.setTimeout(120000);
 await page.addInitScript(()=>localStorage.setItem('jorge-reading-v1',JSON.stringify({size:'200',spacing:true,font:true,links:true,motion:true})));
 for(const route of ['','sobre-mi/','intereses/','multimedia/','series-y-peliculas/','videojuegos/','buscar/','ayuda/','404.html','en/','en/sobre-mi/','en/intereses/','en/multimedia/','en/series-y-peliculas/','en/videojuegos/','en/buscar/','en/ayuda/','en/404.html','public/transcripciones/war-on-wheels.html']){
  await page.goto('/'+route);await page.evaluate(()=>document.fonts.ready);
  const panel=page.locator('[data-reading-settings]');await panel.locator('summary').click();
  for(const width of [320,375,768,1280]){
   await page.setViewportSize({width,height:900});
   await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),{message:route+' at '+width}).toBeTruthy();
   for(const element of await panel.locator('input,select,button').all()){
    const box=await element.boundingBox();expect(box.x,route).toBeGreaterThanOrEqual(0);expect(box.x+box.width,route).toBeLessThanOrEqual(width);
   }
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
 await page.goto('/');await page.locator('[data-reading-settings] summary').click();
 await page.getByLabel('Tamaño del texto').selectOption('125');
 await expect.poll(()=>page.locator('html').evaluate(e=>getComputedStyle(e).fontSize)).toBe('20px');
 await expect(page.locator('[data-reading-storage-warning]')).toBeVisible();expect(errors).toEqual([]);
 const context=await browser.newContext({javaScriptEnabled:false});
 const native=await context.newPage();await native.goto('http://127.0.0.1:4173/');
 await expect(native.locator('[data-reading-settings]')).not.toBeVisible();
 await expect(native.getByRole('navigation',{name:'Navegación principal'})).toBeVisible();
 await context.close();
});

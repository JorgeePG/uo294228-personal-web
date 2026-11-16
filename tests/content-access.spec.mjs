import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const pages=JSON.parse(fs.readFileSync('public/search-coverage.json','utf8')).pages;

test('all public pages remain understandable without graphics, CSS or JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:375,height:812}});
 const page=await context.newPage();
 await page.route(/\.(?:css|webp|jpg|png|woff2|webm)(?:\?|$)/,route=>route.abort());
 const observed=[];
 for(const {file} of pages){
  await page.goto('http://127.0.0.1:4173/'+file);
  const main=page.locator('main');
  await expect(main.getByRole('heading',{level:1})).toBeVisible();
  await expect(page.getByRole('navigation',{name:/Navegación principal|Main navigation/,exact:true})).toBeVisible();
  const badAlt=await page.locator('main img').evaluateAll(images=>images.filter(i=>!i.hasAttribute('alt')).length);
  expect(badAlt).toBe(0);
  // El SVG decorativo también se retira: los controles conservan su texto.
  await page.locator('svg,canvas').evaluateAll(nodes=>nodes.forEach(node=>node.remove()));
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link',{name:/Saltar al contenido|Skip to content/,exact:true})).toBeFocused();
  await page.keyboard.press('Enter');await expect(main).toBeFocused();
  observed.push({file,title:await main.locator('h1').textContent(),mainTextCharacters:(await main.textContent()).trim().length,mainLinks:await main.locator('a').count(),missingImageAlt:badAlt});
 }
 await test.info().attach('simplified-navigation-observed.json',{body:Buffer.from(JSON.stringify({method:'Sin JavaScript; peticiones de estilos, fuentes e imágenes bloqueadas; SVG/canvas decorativos retirados. No es una sesión con lector de pantalla.',pages:observed},null,2)),contentType:'application/json'});
 await context.close();
});

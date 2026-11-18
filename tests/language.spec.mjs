import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const pages=JSON.parse(fs.readFileSync('public/search-coverage.json','utf8')).pages;
test('language control identifies both choices and current language on every page',async({page,request})=>{
 for(const entry of pages){
  await page.goto('/'+entry.file);const english=entry.file.startsWith('en/');const group=page.getByRole('group',{name:english?'Language':'Idioma',exact:true});await expect(group).toBeVisible();await expect(group.locator('[data-current-language]')).toHaveText(english?'English':'Español');await expect(group.locator('[aria-current="true"]')).toHaveCount(1);const link=group.getByRole('link',{name:english?'Español':'English',exact:true});await expect(link).toHaveAttribute('lang',english?'es':'en');await expect(link).toHaveAttribute('hreflang',english?'es':'en');
  const href=await link.getAttribute('href');const destination=new URL(href,page.url());const expected=entry.file.startsWith('public/')?'en/multimedia/index.html':english?entry.file.slice(3):'en/'+entry.file;expect(destination.pathname).toBe('/'+expected);expect((await request.get(destination.href)).status()).toBe(200);
 }
});
test('language switch retains the latest search, extra parameters and fragment by keyboard',async({page})=>{
 await page.goto('/buscar/?q=t-72&origen=prueba#contenido');await expect(page.locator('[data-results] a').first()).toBeVisible();const input=page.locator('#consulta');await input.fill('T-90M');await input.press('Enter');await expect(page.locator('[data-results-status]')).toContainText('T-90M');const english=page.getByRole('group',{name:'Idioma',exact:true}).getByRole('link',{name:'English',exact:true});await english.focus();await page.keyboard.press('Enter');await expect(page.locator('html')).toHaveAttribute('lang','en');await expect(page.locator('#consulta')).toHaveValue('T-90M');await expect(page.locator('[data-results] a').first()).toBeVisible();const url=new URL(page.url());expect(url.searchParams.get('q')).toBe('T-90M');expect(url.searchParams.get('origen')).toBe('prueba');expect(url.hash).toBe('#contenido');await page.getByRole('link',{name:'Español',exact:true}).click();await expect(page.locator('#consulta')).toHaveValue('T-90M');await expect(page.locator('html')).toHaveAttribute('lang','es');
});
test('language choices remain readable and touchable across widths and enlarged text',async({page})=>{
 for(const lang of ['', 'en/'])for(const width of [320,375,650,768,900,1280]){
  await page.setViewportSize({width,height:900});await page.goto('/'+lang);const group=page.locator('body > header > [data-language]');for(const choice of await group.locator('[data-language-options] > *').all()){const box=await choice.boundingBox();expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(!lang&&[320,1280].includes(width)){const directory=(process.env.UX_EVIDENCE_DIR||'validacion')+'/screenshots';fs.mkdirSync(directory,{recursive:true});await page.screenshot({path:`${directory}/language-${width}-${Date.now()}.png`,fullPage:true});}
  await page.evaluate(()=>{document.documentElement.dataset.readingSize='200';document.documentElement.dataset.readingSpacing='true';});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(group.getByRole('link')).toBeVisible();
 }
});
test('native language links work without JavaScript and transcript declares its destination',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,locale:'en-US'});try{
  const page=await context.newPage();await page.goto('/intereses/');await expect(page.locator('html')).toHaveAttribute('lang','es');await page.getByRole('link',{name:'English',exact:true}).click();await expect(page).toHaveURL(/\/en\/intereses\/index\.html$/);await expect(page.locator('[data-current-language]')).toHaveText('English');await page.getByRole('link',{name:'Español',exact:true}).click();await expect(page).toHaveURL(/\/intereses\/index\.html$/);
  await page.goto('/public/transcripciones/war-on-wheels.html');const link=page.getByRole('group',{name:'Idioma',exact:true}).getByRole('link',{name:'English',exact:true});await expect(link).toHaveAccessibleDescription(/sección multimedia en inglés/);await link.click();await expect(page).toHaveURL(/\/en\/multimedia\/index\.html$/);
 }finally{await context.close();}
});
test('shared transcript declares English content and Spanish reading controls separately',async({page})=>{
 await page.goto('/public/transcripciones/war-on-wheels.html');
 await expect(page.locator('html')).toHaveAttribute('lang','es');await expect(page.locator('main')).toHaveAttribute('lang','en');
 for(const selector of ['body > header','footer','[data-reading-trigger]','[data-reading-settings]'])expect(await page.locator(selector).evaluate(element=>element.closest('[lang]').getAttribute('lang'))).toBe('es');
 await page.locator('[data-reading-trigger]').click();await expect(page.getByLabel('Tamaño del texto',{exact:true})).toBeVisible();
 const entries=JSON.parse(fs.readFileSync('public/search-index-en.json','utf8'));expect(entries.find(entry=>entry.url.includes('war-on-wheels.html')).lang).toBe('en');
});

import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const pages=JSON.parse(fs.readFileSync('public/search-coverage.json','utf8')).pages;

test('H44 reading controls have unique explicit labels on every route and remain clickable',async({page})=>{
 for(const entry of pages){
  await page.goto('/'+entry.file);
  const controls=await page.locator('[data-reading-control][type="checkbox"]').evaluateAll(nodes=>nodes.map(input=>({id:input.id,count:document.querySelectorAll('#'+input.id).length,labels:[...input.labels].map(label=>({for:label.htmlFor,text:label.textContent.trim(),controlMatches:label.control===input}))})));
  expect(controls).toHaveLength(5);
  for(const input of controls){expect(input.id).not.toBe('');expect(input.count).toBe(1);expect(input.labels).toHaveLength(1);expect(input.labels[0].for).toBe(input.id);expect(input.labels[0].controlMatches).toBe(true);expect(input.labels[0].text.length).toBeGreaterThan(5);}
 }
 await page.goto('/');await page.locator('[data-reading-trigger]').click();
 for(const control of await page.locator('[data-reading-control][type="checkbox"]').all()){
  const id=await control.getAttribute('id'),label=page.locator(`label[for="${id}"]`);await label.click();await expect(control).toBeChecked();await label.click();await expect(control).not.toBeChecked();
 }
});

test('AAA link names distinguish profiles and downloads and standalone targets are at least 44 px',async({page})=>{
 for(const prefix of ['', 'en/']){
  await page.goto('/'+prefix+'sobre-mi/');
  for(const name of ['José Ramón Blanco González','Juan Menéndez Blanco','Jorge Puente García'])await expect(page.getByRole('link',{name:new RegExp('LinkedIn.*'+name)})).toHaveCount(1);
  for(const link of await page.locator('[data-reference-card] a').all())expect((await link.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await page.addScriptTag({path:'node_modules/axe-core/axe.min.js'});const references=await page.evaluate(async()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2aaa']}}));expect(references.violations).toEqual([]);expect(references.incomplete.filter(rule=>rule.id==='identical-links-same-purpose')).toEqual([]);
  await page.goto('/'+prefix+'multimedia/');const video=await page.locator('video a').textContent(),audio=await page.locator('audio a').textContent();expect(video).toContain('Matilda II');expect(audio).toContain('War on Wheels');expect(video).not.toBe(audio);
  await page.addScriptTag({path:'node_modules/axe-core/axe.min.js'});const media=await page.evaluate(async()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2aaa']}}));expect(media.violations).toEqual([]);expect(media.incomplete.filter(rule=>rule.id==='identical-links-same-purpose')).toEqual([]);
  await page.goto('/'+prefix+'buscar/?q=t-72');await expect(page.locator('[data-results] a').first()).toBeVisible();for(const link of await page.locator('[data-results] a').all())expect((await link.boundingBox()).height).toBeGreaterThanOrEqual(44);
 }
});

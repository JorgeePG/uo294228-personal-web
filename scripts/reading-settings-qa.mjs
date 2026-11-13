import {chromium} from '@playwright/test';
const output='validacion/revision-2026-11-12';
const browser=await chromium.launch({channel:'chrome'});
try {
 const page=await browser.newPage();
 for(const [name,width,route] of [['desktop',1440,''],['mobile',375,''],['english',1280,'en/']]){
  await page.setViewportSize({width,height:1050});await page.goto('http://127.0.0.1:4173/'+route);await page.evaluate(()=>document.fonts.ready);
  await page.locator('[data-reading-settings] summary').click();
  await page.screenshot({path:`${output}/reading-${name}.png`});
 }
 await page.goto('http://127.0.0.1:4173/');await page.setViewportSize({width:320,height:1050});
 await page.locator('[data-reading-settings] summary').click();
 await page.locator('[data-reading-control="size"]').selectOption('200');
 for(const checkbox of await page.locator('[data-reading-panel] input').all())await checkbox.check();
 await page.locator('[data-reading-panel]').screenshot({path:`${output}/reading-maximum-mobile.png`});
 await page.locator('[data-reading-close]').click();
 await page.screenshot({path:`${output}/reading-maximum-home-mobile.png`,fullPage:true});
} finally {await browser.close();}

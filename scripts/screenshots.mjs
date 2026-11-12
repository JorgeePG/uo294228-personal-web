import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome'});
const output='validacion/revision-2026-11-12';await fs.mkdir(output,{recursive:true});
try{const page=await browser.newPage();for(const [name,route,width] of [['about-desktop','sobre-mi/',1440],['about-mobile','sobre-mi/',375],['about-en','en/sobre-mi/',1440],['home-mobile','',375],['games-mobile','videojuegos/',375]]){await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('http://127.0.0.1:4173/'+route);await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(async image=>{image.loading='eager';await image.decode();}));});await page.screenshot({path:`${output}/${name}.png`,fullPage:true});} }finally{await browser.close();}

import lighthouse from 'lighthouse';
import {launch} from 'chrome-launcher';
import fs from 'node:fs/promises';
const chrome=await launch({chromeFlags:['--headless','--disable-gpu']});
const summary=[];
// Permitir una carpeta fechada evita sustituir mediciones históricas al cerrar V2.
const output=process.env.UX_PERF_OUTPUT||'validacion/revision-2026-11-12';await fs.mkdir(output,{recursive:true});
const requested=process.argv.slice(2);
if(requested.length){const existing=JSON.parse(await fs.readFile(`${output}/performance-summary.json`,'utf8'));summary.push(...existing.pages.filter(p=>!requested.includes(p.name)));}
try{
 for(const [route,name] of [['','home'],['sobre-mi/','about'],['intereses/','vehicles'],['multimedia/','media'],['series-y-peliculas/','films'],['videojuegos/','games'],['buscar/','search']]){
  if(requested.length&&!requested.includes(name))continue;
  const r=await lighthouse('http://127.0.0.1:4173/'+route,{port:chrome.port,output:['json','html'],onlyCategories:['performance','accessibility','best-practices','seo'],logLevel:'error'});
  await fs.writeFile(`${output}/lighthouse-${name}-mobile.json`,r.report[0]);
  await fs.writeFile(`${output}/lighthouse-${name}-mobile.html`,r.report[1]);
  summary.push({name,scores:Object.fromEntries(Object.entries(r.lhr.categories).map(([k,v])=>[k,Math.round(v.score*100)])),lcp:r.lhr.audits['largest-contentful-paint'].numericValue,cls:r.lhr.audits['cumulative-layout-shift'].numericValue,load:r.lhr.audits.metrics.details.items[0].observedLoad});
  console.log(JSON.stringify(summary.at(-1)));
 }
}finally{await chrome.kill();await fs.writeFile(`${output}/performance-summary.json`,JSON.stringify({date:new Date().toISOString(),environment:'localhost; mobile simulated throttling; Lighthouse 13.6.0; not production/network field measurements',pages:summary},null,2));}

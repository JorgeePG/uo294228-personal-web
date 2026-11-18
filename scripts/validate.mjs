import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const output=process.env.UX_VALIDATION_OUTPUT||'validacion/revision-2026-11-12';await fs.mkdir(output,{recursive:true});
// Validar las páginas públicas; excluir copias de investigación y salidas de QA.
// El rastreador del índice usa las mismas exclusiones de directorios de trabajo.
async function collect(dir,ext){const out=[];for(const item of await fs.readdir(dir,{withFileTypes:true})){if(['node_modules','validacion','test-results','playwright-report','.cache','.git','scripts'].includes(item.name))continue;const p=path.join(dir,item.name);if(item.isDirectory())out.push(...await collect(p,ext));else if(p.endsWith(ext))out.push(p);}return out;}
const report={date:new Date().toISOString(),validator:'Nu Html Checker 26.11.9',results:[]};
const missing=[];
for(const file of [...await collect('.','.html'),...await collect('.','.css')]){
 const source=await fs.readFile(file,'utf8');const refs=[];
 if(file.endsWith('.html')){for(const m of source.matchAll(/(?:href|src)="([^"]+)"/g))refs.push(m[1]);for(const m of source.matchAll(/srcset="([^"]+)"/g))refs.push(...m[1].split(',').map(v=>v.trim().split(/\s+/)[0]));}
 else for(const m of source.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g))refs.push(m[1]);
 for(const ref of refs){if(/^(https?:|mailto:|data:|#)/.test(ref))continue;const target=path.resolve(path.dirname(file),decodeURIComponent(ref.split(/[?#]/)[0]));try{await fs.access(target);}catch{missing.push({file,ref});}}
}
report.resources={missing,passed:missing.length===0};if(missing.length)process.exitCode=1;
for(const type of ['html','css']){
 const files=await collect('.',`.${type}`);
 const result=spawnSync('java',['-jar',String(require('vnu-jar')),'--format','json','--stdout','--Werror',...(type==='css'?['--css']:[]),...files],{encoding:'utf8',maxBuffer:10*1024*1024});
 let details;try{details=JSON.parse(result.stdout);}catch{details={stdout:result.stdout,stderr:result.stderr,error:result.error?.message};}
 await fs.writeFile(`${output}/${type}.json`,JSON.stringify(details,null,2));
 report.results.push({type,files:files.length,exitCode:result.status,messages:details.messages?.length,passed:result.status===0});
}
await fs.writeFile(`${output}/validation-summary.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.results.some(r=>!r.passed))process.exitCode=1;

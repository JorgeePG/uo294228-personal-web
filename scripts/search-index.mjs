import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {parse} from 'parse5';

// Exclusiones explícitas: no ocultamos páginas de contenido para mejorar las notas.
const exclusions=new Map([
 ['404.html','Página de error; no aporta contenido recuperable.'],
 ['en/404.html','Error page; no searchable content.'],
 ['buscar/index.html','Interfaz de resultados; evita resultados autorreferentes.'],
 ['en/buscar/index.html','Results interface; avoids self-referential results.']
]);
const origin='https://personal.invalid/';
const clean=text=>text.replace(/\s+/g,' ').trim();
const attr=(node,name)=>node.attrs?.find(a=>a.name===name)?.value;
function all(node,predicate){return [...(predicate(node)?[node]:[]),...(node.childNodes||[]).flatMap(child=>all(child,predicate))];}
function content(node) {
 // El parser decodifica entidades HTML; el contenido cerrado de details y las
 // otras diapositivas SÍ son contenido. Menús, diálogos y código no lo son.
 if(['script','style','template','nav','dialog','noscript'].includes(node.tagName))return '';
 if(node.nodeName==='#text')return node.value;
 if(node.tagName==='img')return attr(node,'alt')||'';
 return (node.childNodes||[]).map(content).join(' ');
}
async function publicHTML(directory='') {
 const files=[];
 for(const entry of await fs.readdir(directory||'.',{withFileTypes:true})){
  if(['.git','node_modules','validacion','test-results','playwright-report','.cache','scripts'].includes(entry.name))continue;
  const filename=path.posix.join(directory,entry.name);
  if(entry.isDirectory())files.push(...await publicHTML(filename));
  else if(filename.endsWith('.html'))files.push(filename);
 }
 return files;
}
export async function buildSearchIndexes() {
 const knownPages=await publicHTML();
 const documents=new Map(), linked=new Set(['index.html','en/index.html']);
 const queue=[...linked], links=[], assets=new Set();
 // Recorremos los enlaces internos reales, no una lista manual de títulos.
 // Si un HTML enlazado falta o no tiene contenido principal, build falla.
 for(let position=0;position<queue.length;position++){
  const file=queue[position];
  const html=await fs.readFile(file,'utf8');
  const tree=parse(html), main=all(tree,n=>n.tagName==='main')[0];
  if(!main)throw new Error(`Search coverage: ${file} has no main element`);
  const lang=attr(main,'lang')||attr(all(tree,n=>n.tagName==='html')[0],'lang')||'es';
  const title=clean(content(all(main,n=>n.tagName==='h1')[0]||main));
  const text=clean(content(main));
  // Los nombres de tarjetas y secciones expresan el tema de la página. Se
  // conservan aparte para distinguirlos de una mención incidental o un alt.
  const headings=all(main,n=>/^h[2-6]$/.test(n.tagName||'')).map(n=>clean(content(n))).filter(Boolean);
  if(!text||!title)throw new Error(`Search coverage: empty content in ${file}`);
  documents.set(file,{title,text,headings,lang});
  for(const anchor of all(tree,n=>n.tagName==='a')){
   const href=attr(anchor,'href');if(!href)continue;
   const url=new URL(href,origin+file);
   if(url.origin!==new URL(origin).origin)continue; // Fuera del sitio: no rastrear terceros.
   let target=decodeURIComponent(url.pathname).slice(1);
   if(target.endsWith('/'))target+='index.html';
   if(!target)target='index.html';
   if(!target.endsWith('.html')){assets.add(target);continue;}
   links.push({from:file,to:target});
   if(exclusions.has(target))continue;
   if(!linked.has(target)){linked.add(target);queue.push(target);}
  }
 }
 const eligible=knownPages.filter(file=>!exclusions.has(file));
 const missing=eligible.filter(file=>!linked.has(file));
 if(missing.length)throw new Error('Search coverage: orphan public pages: '+missing.join(', '));
 // HTML conocidos 404/resultados se contabilizan aunque no sean destinos del menú.
 const coverage={schema:1,pages:[...new Set([...knownPages,...linked])].sort().map(file=>({file,state:exclusions.has(file)?'excluded':'indexed',reason:exclusions.get(file)||'Contenido principal enlazado',language:documents.get(file)?.lang|| (file.startsWith('en/')?'en':'es')})),links,nonHTMLAssets:[...assets].sort(),indexes:{},pairs:[]};
 for(const lang of ['es','en']){
  const entries=[...documents].filter(([file])=>file.startsWith('en/')=== (lang==='en') || file.startsWith('public/transcripciones/')).map(([file,item])=>({title:item.title,url:path.posix.relative('public',file),lang:item.lang,text:item.text,headings:item.headings})).sort((a,b)=>a.url<b.url?-1:a.url>b.url?1:0);
  const filename=`public/search-index${lang==='en'?'-en':''}.json`;
  const json=JSON.stringify(entries,null,2)+'\n';
  await fs.writeFile(filename,json);
  coverage.indexes[lang]={file:filename,entries:entries.length,bytes:Buffer.byteLength(json),sha256:createHash('sha256').update(json).digest('hex')};
 }
 // La transcripción única conserva inglés y se ofrece en los dos índices. No se
 // inventa una traducción ni se excluye contenido por no coincidir con la interfaz.
 for(const file of eligible.filter(file=>!file.startsWith('en/')&&!file.startsWith('public/'))){
  if(!documents.has('en/'+file))throw new Error('Search coverage: missing English counterpart of '+file);
  coverage.pairs.push({es:file,en:'en/'+file});
 }
 await fs.writeFile('public/search-coverage.json',JSON.stringify(coverage,null,2)+'\n');
 console.log(`Search indexes: ${coverage.indexes.es.entries} ES / ${coverage.indexes.en.entries} EN; ${coverage.pages.filter(p=>p.state==='indexed').length} content pages, ${exclusions.size} explicit exclusions.`);
}

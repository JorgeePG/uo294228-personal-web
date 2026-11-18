import fs from 'node:fs/promises';
import path from 'node:path';
import {parse,generate} from 'css-tree';
import {createHash} from 'node:crypto';
import {readingSettings} from './reading-settings.mjs';
import {searchPage} from './search-page.mjs';
import {buildSearchIndexes} from './search-index.mjs';
import {applySiteOrientation} from './site-orientation.mjs';
import {applyHelpFeedback} from './help-feedback.mjs';
import {languageSwitcher} from './language-switcher.mjs';
const pages=['index.html','404.html',...['sobre-mi','intereses','multimedia','series-y-peliculas','videojuegos','buscar','ayuda'].map(p=>p+'/index.html')];
const translations=JSON.parse(await fs.readFile('scripts/translations.json','utf8'));
Object.assign(translations,JSON.parse(await fs.readFile('scripts/translation-details.json','utf8')));
Object.assign(translations,{'Buscar en el sitio':'Search this site','Buscar en la web':'Search the website','Resultados de búsqueda':'Search results','13 de noviembre de 2026':'13 November 2026','14 de noviembre de 2026':'14 November 2026','16 de noviembre de 2026':'16 November 2026','18 de noviembre de 2026':'18 November 2026'});
const profile=JSON.parse(await fs.readFile('profile.pending.json','utf8'));
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const label=value=>{if(typeof value==='string')return escape(value);if(value?.es&&value?.en){translations[escape(value.es)]=escape(value.en);return escape(value.es);}return '';};
const readingPanel=readingSettings(label);
const safeURL=value=>{const url=new URL(value);if(!['https:','mailto:'].includes(url.protocol))throw new Error('Profile URL must use HTTPS or mailto');return escape(url.href);};
// El nombre accesible identifica el perfil sin alargar el texto visual del pie.
const social=profile.socialProfiles.map(p=>`<a href="${safeURL(p.url)}" aria-label="${label({es:`${p.label.es||p.label} de Jorge Puente García`,en:`${p.label.en||p.label} profile of Jorge Puente García`})}">${label(p.label)}</a>`).join(' · ');
const referenceLabel=p=>label({es:`LinkedIn de ${p.name}`,en:`LinkedIn profile of ${p.name}`});
let extra='';
for(const [key,title] of [['education','Formación'],['experience','Experiencia'],['references','Referencias']]){
 const entries=profile[key].filter(p=>key!=='references'||p.consent===true||p.publishPublicProfile===true);
 if(entries.length)extra+=`<section data-profile><h2>${title}</h2><ul${key==='references'?' data-reference-cards':''}>${entries.map(p=>`<li${key==='references'?' data-reference-card':''}>${p.photo?`<img data-reference-portrait src="../${escape(p.photo.path)}" width="200" height="200" loading="lazy" alt="${label(p.photo.alt)}">`:''}<div><strong>${label(p.title||p.name)}</strong>${p.organisation||p.role?' — '+label(p.organisation||p.role):''}${p.start?' · '+label(p.start)+' – '+label(p.end||{es:'Actualidad',en:'Present'}):p.end?' · '+label(p.end):''}<p>${label(p.description||'')}</p>${p.contact?`<a href="${safeURL(p.contact)}"${key==='references'?` aria-label="${referenceLabel(p)}"`:''}>${key==='references'?'LinkedIn':label({es:'Contacto',en:'Contact'})}</a>`:''}</div></li>`).join('')}</ul></section>`;
}
if(profile.skills?.length)extra+=`<section data-profile><h2>${label({es:'Competencias e idiomas',en:'Skills and languages'})}</h2><ul>${profile.skills.map(p=>`<li>${label(p)}</li>`).join('')}</ul><p>${label(profile.languages)}</p></section>`;
if(profile.professionalEmail)extra+=`<section data-profile><h2>${label({es:'Contacto profesional',en:'Professional contact'})}</h2><p><a href="${safeURL('mailto:'+profile.professionalEmail)}">${escape(profile.professionalEmail)}</a></p></section>`;
Object.assign(translations,{'Formación':'Education','Experiencia':'Experience','Referencias':'References','Actualidad':'Present'});
let css='';for(const file of ['styles.css','styles-media-01.css','styles-media-02.css','styles-media-03.css','styles-media-04.css','refinements.css'])css+=await fs.readFile('public/css/'+file,'utf8');
const compiledCSS=generate(parse(css));
const cssVersion=createHash('sha256').update(compiledCSS).digest('hex').slice(0,12);
await fs.writeFile('public/css/site.min.css',compiledCSS);
let fonts='';for(const n of [5,6,7,8,13,14])fonts+=await fs.readFile(`public/fonts/font-face-${String(n).padStart(2,'0')}.css`,'utf8');
fonts+=await fs.readFile('public/fonts/opendyslexic.css','utf8');
await fs.writeFile('public/fonts/fonts.css',fonts.replaceAll('font-display: optional','font-display: swap'));
const fontsVersion=createHash('sha256').update(fonts.replaceAll('font-display: optional','font-display: swap')).digest('hex').slice(0,12);
for(const file of [...pages,'public/transcripciones/war-on-wheels.html']) {
 let text=await fs.readFile(file,'utf8');
 if(file==='404.html'&&!text.includes('Navegación principal')){
  const home=await fs.readFile('index.html','utf8');
  const banner=home.match(/<a href="#contenido">[\s\S]*?<\/header>/)[0].replace(/ aria-current="page"/g,'').replace(/(<a data-language[^>]*href=")[^"]+/, '$1en/404.html');
  text=text.replace(/(<body[^>]*>)/,`$1${banner}`);
 }
 const headerStart=text.indexOf('<header',text.indexOf('<body'));
 const headerEnd=text.indexOf('</header>',headerStart)+9;
 if(headerStart>=0&&headerStart<text.indexOf('<main')){
  const old=text.slice(headerStart,headerEnd);
  const brand=old.match(/<a\b[\s\S]*?<\/a>/)[0];
  const nav=old.match(/<nav\b[\s\S]*?<\/nav>/)[0];
  const target=file.startsWith('public/')?'en/multimedia/index.html':'en/'+file;
  const language=languageSwitcher('es',path.posix.relative(path.posix.dirname(file),target),{sharedTranscript:file.startsWith('public/')});
  const action=file.startsWith('public/')?'../../buscar/index.html':file.includes('/')?'../buscar/index.html':'buscar/index.html';
  const form=`<form data-header-search role="search" aria-label="Buscar en el sitio" action="${action}" method="get"><label for="busqueda-cabecera">Buscar en el sitio</label><input id="busqueda-cabecera" type="search" name="q" placeholder="Buscar en la web" maxlength="120" required><button type="submit"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><circle cx="7" cy="7" r="5"></circle><path d="M11 11l5 5"></path></svg><span>Buscar</span></button></form>`;
  text=text.slice(0,headerStart)+old.match(/^<header[^>]*>/)[0]+brand+form+language+nav+'</header>'+text.slice(headerEnd);
 }
 text=text.replace(/<!-- reading-widget -->[\s\S]*?<!-- \/reading-widget -->/,'');
 text=text.replace('</body>',`<!-- reading-widget -->${readingPanel}<!-- /reading-widget --></body>`);
 text=text.replace(/datetime="2026-11-\d{2}">\d{1,2} de noviembre de 2026/g,'datetime="2026-11-18">18 de noviembre de 2026');
 // Única plantilla comentada para los controles ES/EN; no mantener copias a mano.
 if(file==='buscar/index.html'){
  // Retirar el encabezado de la plantilla anterior; la nueva coloca el campo
  // compacto antes del título de resultados. El reemplazo es idempotente.
  text=text.replace(/(<main\b[^>]*>)\s*<header><h1>[^<]*<\/h1><\/header>/,'$1');
  if(!text.includes('data-search-page'))text=text.replace('<main ','<main data-search-page ');
  text=text.replace(/<form role="search"[\s\S]*?<\/script>/,searchPage(label));
 }
 if(file==='ayuda/index.html'){
  text=text.replace(/<!-- reading-help -->[\s\S]*?<!-- \/reading-help -->/,'');
  const heading=label({es:'Ajusta la lectura a tu gusto',en:'Adjust reading to your preferences'});
  const description=label({es:'Pulsa el botón flotante Accesibilidad, disponible en la esquina inferior de cualquier página. Se abre un panel con texto hasta el 200 %, fuente OpenDyslexic para dislexia, espaciado, títulos sencillos, enlaces destacados y movimiento reducido. Prueba los ajustes y elige los que te resulten cómodos. OpenDyslexic es opcional y se aplica a toda la web; tiene prioridad sobre la tipografía sencilla. Cerrar ajustes o Escape cierra el panel y devuelve el foco al botón. Restablecer ajustes recupera el diseño original y elimina las preferencias guardadas.',en:'Press the floating Accessibility button in the bottom corner of any page. A panel opens with text up to 200%, the OpenDyslexic font for dyslexia, spacing, simple headings, highlighted links and reduced motion. Try the settings and choose what feels comfortable. OpenDyslexic is optional and applies across the website; it takes priority over the simple heading font. Close settings or Escape closes the panel and returns focus to the button. Reset settings restores the original design and removes saved preferences.'});
  const storage=label({es:'Los ajustes son opcionales, se guardan localmente y se comparten entre las páginas y los dos idiomas en este navegador. No se envían a ningún servicio. Si el navegador impide guardarlos, funcionan durante la visita a esa página. Sin JavaScript, puedes seguir navegando y usar el zoom y las ayudas de tu navegador.',en:'Settings are optional, saved locally and shared across pages and both languages in this browser. They are not sent to any service. If storage is blocked, they work for the current page visit. Without JavaScript, you can still navigate and use browser zoom and accessibility features.'});
  text=text.replace('</main>',`<!-- reading-help --><section><h2>${heading}</h2><p>${description}</p><p>${storage}</p></section><!-- /reading-help --></main>`);
 }
 // Incluir rutas ../: antes se omitía la variante intermedia en páginas interiores.
 text=text.replace(/([\w./-]+)-480\.webp 480w, ([\w./-]+)-960\.webp 960w/g,'$1-480.webp 480w, $1-768.webp 768w, $2-960.webp 960w');
 const prefix=file.startsWith('public/')?'../':file.includes('/')?'../public/':'public/';
 text=text.replace(/\s*<script\b[^>]*src="[^"]*\/language\.js[^\"]*"[^>]*><\/script>/g,'');
 text=text.replace('</head>',`<script src="${prefix}js/language.js" defer></script>\n</head>`);
 text=text.replace(/href="([^"?]*fonts\/fonts\.css)(?:\?[^"]*)?"/g,`href="$1?v=${fontsVersion}"`);
 text=text.replace(/\s*<script\b[^>]*src="[^"]*reading-settings\.js[^\"]*"[^>]*><\/script>/g,'');
 text=text.replace('</head>',`<script src="${prefix}js/reading-settings.js"></script>\n</head>`);
 text=text.replace(/\s*<link rel="stylesheet" href="[^"]*\/css\/[^\"]+">/g,'');
 text=text.replace('</head>',`<link rel="stylesheet" href="${prefix}css/site.min.css?v=${cssVersion}">\n</head>`);
 for(const match of [...text.matchAll(/<script\b[^>]*src="([^"]+)"/g)]){
  const src=match[1].split('?')[0];if(/^https?:/.test(src))continue;
  const code=await fs.readFile(path.join(path.dirname(file),src));const version=createHash('sha256').update(code).digest('hex').slice(0,12);
  text=text.replace(match[0],match[0].replace(match[1],src+'?v='+version));
 }
 text=text.replace(/<!-- profile-links -->[\s\S]*?<!-- \/profile-links -->/,'');
 if(social)text=text.replace('</footer>',`<!-- profile-links --><p data-updated>${social}</p><!-- /profile-links --></footer>`);
 if(file==='sobre-mi/index.html'){
  text=text.replace(/<!-- profile-details -->[\s\S]*?<!-- \/profile-details -->/,'');
  if(extra)text=text.replace('</main>',`<!-- profile-details -->${extra}<!-- /profile-details --></main>`);
 }
 if(!text.includes('rel="preload"'))text=text.replace('</head>',['barlow-condensed-700-latin.woff2','ibm-plex-sans-400-latin.woff2','ibm-plex-sans-700-latin.woff2'].map(name=>`<link rel="preload" href="${prefix}fonts/${name}" as="font" type="font/woff2" crossorigin>`).join('\n')+'\n</head>');
 if(file==='index.html'){
  text=text.replace(/<nav aria-label="Ruta de navegación">[\s\S]*?<\/nav>/,'');
  if(!text.includes('data-overview'))text=text.replace('</main>',`<section data-overview aria-labelledby="explora"><h2 id="explora">Explora mis intereses</h2><p><a href="sobre-mi/index.html">Sobre mí y mi formación</a> · <a href="intereses/index.html">Vehículos y museos</a> · <a href="multimedia/index.html">Vídeo y podcast</a> · <a href="series-y-peliculas/index.html">Series y películas</a> · <a href="videojuegos/index.html">Videojuegos</a></p></section></main>`);
 }
 text=applyHelpFeedback(text,file,label);
 text=applySiteOrientation(text,file,label);
 await fs.writeFile(file,text);
 if(file.startsWith('public/')) continue;
 // Translate text and accessible labels, never URLs or source attribution names.
 let english=text.replace('<html lang="es">','<html lang="en">');
 for(const [es,en] of Object.entries(translations).sort((a,b)=>b[0].length-a[0].length))english=english.replaceAll(es,en);
 english=english.replace(/(href|src|srcset|action)="([^"]+)"/g,(all,attr,value)=>{
   if(/^(https?:|mailto:|#)/.test(value)) return all;
   if(attr==='srcset')return `${attr}="${value.split(',').map(v=>{const [url,size]=v.trim().split(/\s+/);return path.posix.relative(path.posix.dirname('en/'+file),path.posix.normalize(path.posix.join(path.posix.dirname(file),url)))+' '+size;}).join(', ')}"`;
   const [url,query]=value.split('?');
   const resolved=path.posix.normalize(path.posix.join(path.posix.dirname(file),url));
   const target=pages.includes(resolved)?'en/'+resolved:resolved;
   return `${attr}="${path.posix.relative(path.posix.dirname('en/'+file),target)}${query?'?'+query:''}"`;
 });
 english=english.replace(/<!-- language-switch -->[\s\S]*?<!-- \/language-switch -->/,languageSwitcher('en',path.posix.relative(path.posix.dirname('en/'+file),file)));
 english=english.replace('aria-label="Ruta de navegación"','aria-label="Breadcrumb"');
 english=english.replace('en/en/','en/');
 const dest='en/'+file;await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,english);
}
// Después de generar traducciones y enlaces, indexar el HTML que realmente se sirve.
await buildSearchIndexes();

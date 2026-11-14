import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
const coverage=JSON.parse(fs.readFileSync('public/search-coverage.json','utf8'));
const indexes=Object.fromEntries(['es','en'].map(lang=>[lang,JSON.parse(fs.readFileSync(coverage.indexes[lang].file,'utf8'))]));
const fields=page=>({form:page.locator('main form[role="search"]'),input:page.locator('#consulta'),status:page.locator('[data-results-status]'),links:page.locator('[data-results] a')});
async function submit(page,query){const ui=fields(page);await ui.input.fill(query);await ui.input.press('Enter');await expect(ui.status).not.toHaveText(/Buscando…|Searching…/);return {status:await ui.status.textContent(),titles:await ui.links.allTextContents(),hrefs:await ui.links.evaluateAll(nodes=>nodes.map(n=>n.href))};}
// Cada caso produce un registro observado dentro del JSON íntegro de Playwright.
// Los datos sintéticos se identifican como tales; no se confunden con el sitio real.
function scenario(id,title,input,expected,exercise){test(`${id} ${title}`,async({page,request})=>{
 test.info().annotations.push({type:'case-id',description:id},{type:'input',description:input},{type:'expected',description:expected});
 const observed=await exercise({page,request});
 await test.info().attach('observed.json',{body:Buffer.from(JSON.stringify(observed,null,2)),contentType:'application/json'});
});}
scenario('S01','empty and whitespace queries','q vacío y tres espacios','Mensaje para escribir un término; cero peticiones de índice y q eliminado',async({page})=>{
 const requests=[];page.on('request',r=>{if(/search-index.*\.json/.test(r.url()))requests.push(r.url());});await page.goto('/buscar/');
 const seen=[];for(const query of ['', '   ']){const result=await submit(page,query);expect(result.status).toContain('Escribe un término');expect(result.titles).toEqual([]);expect(new URL(page.url()).searchParams.has('q')).toBe(false);seen.push(result);}
 expect(requests).toEqual([]);return {seen,requests};
});
scenario('S02','case and accent equivalence','AVIACIÓN y aviacion','Misma lista no vacía y mismo orden',async({page})=>{
 await page.goto('/buscar/');const accented=await submit(page,'AVIACIÓN'),plain=await submit(page,'aviacion');expect(accented.hrefs.length).toBeGreaterThan(0);expect(plain.hrefs).toEqual(accented.hrefs);return {accented,plain};
});
scenario('S03','all terms and repeated terms','tanques aviones; tanques aviones tanques; tanques terminoimposiblexyz','Todos los términos presentes; repetir no cambia el orden; un término ausente da cero',async({page})=>{
 await page.goto('/buscar/');const both=await submit(page,'tanques aviones');expect(both.titles.length).toBeGreaterThan(0);
 for(const href of both.hrefs){const item=indexes.es.find(item=>new URL(item.url,'http://127.0.0.1:4173/public/search-index.json').href===href);expect(item.text.toLowerCase()).toContain('tanques');expect(item.text.toLowerCase()).toContain('aviones');}
 const repeated=await submit(page,'tanques aviones tanques');expect(repeated.hrefs).toEqual(both.hrefs);const missing=await submit(page,'tanques terminoimposiblexyz');expect(missing.titles).toEqual([]);return {both,repeated,missing};
});
scenario('S04','real title relevance','videojuegos','Videojuegos es el primer resultado aunque otras páginas lo mencionen',async({page})=>{
 await page.goto('/buscar/');const result=await submit(page,'videojuegos');expect(result.titles[0]).toBe('Videojuegos');expect(result.titles.length).toBeGreaterThan(1);return result;
});
scenario('S05','ranking and deterministic tie break','Índice sintético de tres documentos; aviacion','Título AVIACIÓN primero; empate de cuerpo: ayuda antes de videojuegos',async({page})=>{
 await page.route('**/search-index.json',route=>route.fulfill({json:[{title:'Documento Z',text:'aviación',url:'../videojuegos/index.html'},{title:'AVIACIÓN',text:'simulado',url:'../sobre-mi/index.html'},{title:'Documento A',text:'aviación',url:'../ayuda/index.html'}]}));
 await page.goto('/buscar/');const result=await submit(page,'aviacion');expect(result.titles).toEqual(['AVIACIÓN','Documento A','Documento Z']);return {synthetic:true,...result};
});
scenario('S06','no results and recovery guidance','terminoimposiblexyz','Cero resultados y propuesta de reformulación',async({page})=>{
 await page.goto('/buscar/');const result=await submit(page,'terminoimposiblexyz');expect(result.titles).toEqual([]);expect(result.status).toContain('Sin resultados');expect(result.status).toContain('Prueba');return result;
});
scenario('S07','query length at input and URL boundaries','140 letras a, entrada y ?q=','Campo y parámetro q limitados a 120 unidades UTF-16',async({page})=>{
 await page.goto('/buscar/?q='+ 'a'.repeat(140));await expect(fields(page).status).toContainText('Sin resultados');expect(await fields(page).input.inputValue()).toHaveLength(120);expect(new URL(page.url()).searchParams.get('q')).toHaveLength(120);
 await fields(page).input.fill('b'.repeat(140));expect(await fields(page).input.inputValue()).toHaveLength(120);await fields(page).input.press('Enter');await expect(fields(page).status).toContainText('Sin resultados');return {inputLength:(await fields(page).input.inputValue()).length,urlLength:new URL(page.url()).searchParams.get('q').length};
});
scenario('S08','query HTML is inert','<img src=x onerror=alert(1)>','Sin diálogo JS ni nodos img; entrada tratada como texto',async({page})=>{
 const dialogs=[];page.on('dialog',async d=>{dialogs.push(d.message());await d.dismiss();});await page.goto('/buscar/');const result=await submit(page,'<img src=x onerror=alert(1)>');expect(dialogs).toEqual([]);await expect(page.locator('[data-results] img')).toHaveCount(0);return {...result,dialogs,images:await page.locator('[data-results] img').count()};
});
scenario('S09','HTTP failure retry and memory cache','Primer índice HTTP 503; reintento; segunda consulta','Mensaje, mapa y botón; el reintento funciona; siguiente consulta no vuelve a descargar',async({page})=>{
 let requests=0;await page.route('**/search-index.json',route=>{requests++;return requests===1?route.fulfill({status:503,body:'temporarily unavailable'}):route.continue();});await page.goto('/buscar/?q=coleccionismo');
 await expect(fields(page).status).toContainText('No se ha podido');await expect(page.getByRole('link',{name:'Consultar el mapa del sitio',exact:true})).toBeVisible();await page.getByRole('button',{name:'Reintentar búsqueda',exact:true}).click();await expect(fields(page).links).not.toHaveCount(0);await expect(page.locator('[data-search-retry]')).not.toBeVisible();const retryResult=await fields(page).links.allTextContents();await submit(page,'T-90M');expect(requests).toBe(2);return {requests,retryResult,final:await fields(page).status.textContent()};
});
scenario('S10','malformed and unsafe indexes fail closed','JSON sintético inválido; enlace javascript:','Recuperación accesible sin renderizar resultados inseguros',async({page})=>{
 const results=[];for(const json of [{bad:true},[{title:'Inseguro',text:'tanque',url:'javascript:alert(1)'}]]){
  await page.route('**/search-index.json',route=>route.fulfill({json}));await page.goto('/buscar/?q=tanque');await expect(fields(page).status).toContainText('No se ha podido');await expect(fields(page).links).toHaveCount(0);results.push(await fields(page).status.textContent());await page.unroute('**/search-index.json');
 }return {synthetic:true,results};
});
scenario('S11','latest query wins with a shared pending download','Índice retenido; T-90M seguido de aviacion','Una descarga; solo se publica la última consulta',async({page})=>{
 let release;const gate=new Promise(resolve=>release=resolve);let requests=0;
 await page.route('**/search-index.json',async route=>{requests++;await gate;await route.continue();});await page.goto('/buscar/');await fields(page).input.fill('T-90M');await fields(page).input.press('Enter');await expect(fields(page).status).toHaveText('Buscando…');await fields(page).input.fill('aviacion');await fields(page).input.press('Enter');release();await expect(fields(page).status).toContainText('«aviacion»');expect(requests).toBe(1);return {requests,status:await fields(page).status.textContent(),titles:await fields(page).links.allTextContents()};
});
scenario('S12','reload preserves query and unrelated URL parameters','?q=coleccionismo&origen=prueba','Resultados reproducibles tras recarga y origen conservado',async({page})=>{
 await page.goto('/buscar/?q=coleccionismo&origen=prueba');await expect(fields(page).links).not.toHaveCount(0);const before=await fields(page).links.allTextContents();await page.reload();await expect(fields(page).links).not.toHaveCount(0);expect(await fields(page).links.allTextContents()).toEqual(before);expect(new URL(page.url()).searchParams.get('origen')).toBe('prueba');return {before,after:await fields(page).links.allTextContents(),url:page.url()};
});
scenario('S13','English interface and shared English transcript','EN aircraft; ES y EN dreadnoughts','Resultados de idioma correspondiente; la transcripción única aparece en ambos índices',async({page})=>{
 await page.goto('/en/buscar/');const english=await submit(page,'aircraft');expect(english.titles.length).toBeGreaterThan(0);expect(english.status).toContain('results');expect(english.hrefs.every(href=>href.includes('/en/')||href.endsWith('/public/transcripciones/war-on-wheels.html'))).toBe(true);
 const shared=[];for(const lang of ['', 'en/']){await page.goto('/'+lang+'buscar/');const result=await submit(page,'dreadnoughts');expect(result.hrefs.some(href=>href.includes('transcripciones/war-on-wheels.html'))).toBe(true);const link=page.locator('[data-results] a[href*="transcripciones/"]');await expect(link).toHaveAttribute('lang','en');shared.push(result);}return {english,shared};
});
scenario('S14','header submit by Enter and button','ES sobre-mi Enter; EN intereses botón; 404 y transcripción','Formulario GET alcanza los resultados y conserva el idioma de la interfaz',async({page})=>{
 const results=[];for(const [route,q,button] of [['sobre-mi/','tanques',false],['en/intereses/','aircraft',true],['404.html','T-90M',true],['public/transcripciones/war-on-wheels.html','coleccionismo',false]]){
  await page.goto('/'+route);const header=page.locator('body > header');await header.getByRole('searchbox').fill(q);if(button)await header.getByRole('button',{name:/^(Buscar|Search)$/}).click();else await header.getByRole('searchbox').press('Enter');await expect(fields(page).links).not.toHaveCount(0);expect(new URL(page.url()).searchParams.get('q')).toBe(q);results.push({from:route,to:page.url(),status:await fields(page).status.textContent()});
 }return results;
});
scenario('S15','keyboard focus and live status','Tab desde consulta; Enter en Buscar; Tab a resultado','Foco estable, anuncio polite/atomic y enlaces alcanzables sin ratón',async({page})=>{
 await page.goto('/buscar/');const ui=fields(page);await ui.input.focus();await page.keyboard.type('T-90M');await page.keyboard.press('Tab');await expect(ui.form.getByRole('button',{name:'Buscar',exact:true})).toBeFocused();await page.keyboard.press('Enter');await expect(ui.links).not.toHaveCount(0);await expect(ui.form.getByRole('button',{name:'Buscar',exact:true})).toBeFocused();await expect(ui.status).toHaveAttribute('aria-live','polite');await expect(ui.status).toHaveAttribute('aria-atomic','true');await page.keyboard.press('Tab');await expect(ui.links.first()).toBeFocused();return {status:await ui.status.textContent(),focused:await page.locator(':focus').textContent()};
});
scenario('S16','mobile and desktop search results','320, 375, 768, 1280, 1920 px; AVIACIÓN','Sin desbordamiento global; controles y resultados accesibles; axe sin infracciones',async({page})=>{
 await page.goto('/buscar/');const result=await submit(page,'AVIACIÓN');const widths=[];for(const width of [320,375,768,1280,1920]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(fields(page).input).toBeVisible();await expect(fields(page).links.first()).toBeVisible();widths.push(width);}
 await page.addScriptTag({path:'node_modules/axe-core/axe.min.js'});const violations=await page.evaluate(async()=> (await axe.run()).violations.map(v=>v.id));expect(violations).toEqual([]);return {widths,violations,...result};
});
scenario('S17','coverage freshness equivalence and result links','19 HTML públicos; 15 contenidos; siete pares ES/EN y transcripción compartida','Cada HTML está indexado o excluido explícitamente; párrafos/alt vigentes; links HTTP 200',async({page,request})=>{
 test.setTimeout(90000);const rows=[];expect(coverage.pages).toHaveLength(19);expect(coverage.pages.filter(p=>p.state==='indexed')).toHaveLength(15);expect(coverage.pairs).toHaveLength(7);
 for(const entry of coverage.pages){
  await page.goto('/'+entry.file);const records=Object.values(indexes).flat().filter(item=>new URL(item.url,'http://127.0.0.1:4173/public/search-index.json').pathname==='/'+entry.file);
  if(entry.state==='excluded'){expect(records).toHaveLength(0);expect(entry.reason.length).toBeGreaterThan(5);continue;}
  expect(records.length).toBeGreaterThan(0);const title=await page.locator('main h1').textContent();expect(records[0].title).toBe(title.trim());
  const texts=await page.locator('main p').evaluateAll(nodes=>nodes.filter(n=>!n.closest('dialog,nav,noscript')).flatMap(n=>{const walker=document.createTreeWalker(n,NodeFilter.SHOW_TEXT),parts=[];while(walker.nextNode()){const text=walker.currentNode.textContent.replace(/\s+/g,' ').trim();if(text)parts.push(text);}return parts;}));
  for(const text of texts)expect(records[0].text,entry.file).toContain(text);
  const alts=await page.locator('main img[alt]').evaluateAll(nodes=>nodes.filter(n=>!n.closest('dialog')).map(n=>n.alt));for(const alt of alts)expect(records[0].text).toContain(alt);
  expect((await request.get('/'+entry.file)).status()).toBe(200);rows.push({file:entry.file,records:records.length,paragraphs:texts.length,alts:alts.length});
 }
 expect(indexes.es).toHaveLength(8);expect(indexes.en).toHaveLength(8);return {rows,exclusions:coverage.pages.filter(p=>p.state==='excluded'),indexEntries:{es:indexes.es.length,en:indexes.en.length}};
});
scenario('S18','deployment under an arbitrary subdirectory','Servidor local montado en /curso/portfolio/','Cabecera, índice y destinos permanecen bajo el prefijo y responden HTTP 200',async({page,request})=>{
 const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,UX_PORT:'4174',UX_BASE_PATH:'/curso/portfolio'},stdio:['ignore','pipe','pipe']});
 try {
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>{if(code)reject(new Error('Mounted server failed: '+code));});});
  const base='http://127.0.0.1:4174/curso/portfolio/';await page.goto(base+'sobre-mi/');await page.locator('body > header').getByRole('searchbox').fill('aviacion');await page.locator('body > header').getByRole('searchbox').press('Enter');await expect(fields(page).links).not.toHaveCount(0);
  const hrefs=await fields(page).links.evaluateAll(nodes=>nodes.map(n=>n.href));for(const href of hrefs){expect(href.startsWith(base)).toBe(true);expect((await request.get(href)).status()).toBe(200);}return {url:page.url(),hrefs};
 } finally {server.kill();}
});

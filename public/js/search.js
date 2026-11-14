// Buscador estático propio: el formulario GET de la cabecera navega hasta aquí.
// Limitar el selector a main evita interceptar ese formulario o duplicar envíos.
const form = document.querySelector('main form[role="search"]');
const output = document.querySelector('[data-results]');
const status = document.querySelector('[data-results-status]');
const english = document.documentElement.lang === 'en';
// NFD separa letras y marcas: aviación/AVIACION y niño/nino resultan equivalentes.
// Son coincidencias parciales literales, sin sinónimos, corrección ni sintaxis booleana.
const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
// Resolver desde el script conserva el subdirectorio de GitHub Pages y cualquier
// otro prefijo de despliegue; no se presupone que la web viva en / del dominio.
const indexURL = new URL(english ? '../search-index-en.json' : '../search-index.json', document.currentScript.src);
const siteRoot = new URL('../', indexURL);
const retry = form.querySelector('[data-search-retry]');
const recovery = document.querySelector('[data-search-recovery]');
let pendingIndex;
let revision = 0;
async function loadIndex() {
  // Una promesa compartida evita descargas simultáneas. no-cache revalida la
  // primera carga de cada visita; el índice validado permanece en memoria después.
  if (!pendingIndex) pendingIndex = (async () => {
    try {
      const response = await fetch(indexURL,{cache:'no-cache'});
      if (!response.ok) throw new Error('Index HTTP error');
      const items = await response.json();
      if (!Array.isArray(items)) throw new Error('Invalid index');
      return items.map(item => {
        if (typeof item.title !== 'string' || typeof item.text !== 'string' || typeof item.url !== 'string') throw new Error('Invalid document');
        const url = new URL(item.url,indexURL);
        // Defensa adicional: el índice de datos no puede introducir javascript:,
        // sitios ajenos o enlaces que escapen de la base de este despliegue.
        if (url.origin !== siteRoot.origin || !url.pathname.startsWith(siteRoot.pathname) || !url.pathname.endsWith('.html')) throw new Error('Unsafe result URL');
        return {...item,href:url.href,titleKey:normalize(item.title),textKey:normalize(item.text)};
      });
    } catch (error) {
      pendingIndex = undefined; // Un fallo no envenena la caché: Reintentar vuelve a pedirlo.
      throw error;
    }
  })();
  return pendingIndex;
}
async function search() {
  const current = ++revision;
  // maxlength cubre escritura y slice cubre q manipulada en la URL. Ambos
  // cuentan unidades UTF-16; recortar tras trim permite ignorar espacios de borde.
  const query = String(new FormData(form).get('q') || '').trim().slice(0,120);
  form.elements.q.value = query;
  const address = new URL(location.href);
  if (query) address.searchParams.set('q',query); else address.searchParams.delete('q');
  history.replaceState(null,'',address); // Permite recargar/compartir sin perder la consulta.
  retry.hidden = true;
  recovery.hidden = true;
  output.replaceChildren();
  if (!query) { status.textContent = english ? 'Enter a search term.' : 'Escribe un término de búsqueda.'; return; }
  status.textContent = english ? 'Searching…' : 'Buscando…';
  try {
    const index = await loadIndex();
    if (current !== revision) return; // Solo la consulta más reciente puede actualizar la interfaz.
    const terms = [...new Set(normalize(query).split(/\s+/))];
    // AND: deben aparecer TODOS los términos. Un término repetido no altera el
    // ranking. Cada término aporta 4 por título y 1 por contenido (acumulables).
    // El desempate por URL es explícito, reproducible y no depende del idioma del SO.
    const results = index.filter(item => terms.every(term => (item.titleKey+' '+item.textKey).includes(term)))
      .map(item => ({...item,score:terms.reduce((score,term)=>score+(item.titleKey.includes(term)?4:0)+(item.textKey.includes(term)?1:0),0)}))
      .sort((a,b) => b.score-a.score || (a.url<b.url?-1:a.url>b.url?1:0));
    for (const item of results) {
      const li = document.createElement('li'); const a = document.createElement('a'); const p = document.createElement('p');
      // Datos y consulta nunca pasan por innerHTML. Incluso <img onerror=...>
      // se trata como texto; los destinos ya se han validado al cargar el índice.
      a.href = item.href; a.textContent = item.title;
      if (item.lang === 'en') { a.lang='en'; a.hreflang='en'; }
      p.textContent = item.text.slice(0,220)+(item.text.length>220?'…':'');
      li.append(a,p);
      if (item.lang === 'en' && !english) {
        const language = document.createElement('small');language.textContent='Contenido en inglés';li.append(language);
      }
      output.append(li);
    }
    status.textContent = results.length ? (english ? `${results.length} results for “${query}”.` : `${results.length} resultados para «${query}».`) : (english ? 'No results. Try “museum”, “aviation” or a shorter term.' : 'Sin resultados. Prueba «museo», «aviación» o un término más corto.');
  } catch {
    if (current !== revision) return;
    status.textContent = english ? 'Search is unavailable. Use the site map or try again.' : 'No se ha podido cargar el buscador. Consulta el mapa del sitio o vuelve a intentarlo.';
    retry.hidden=false;recovery.hidden=false;
  }
  // role=status/aria-live=polite anuncia el resultado completo. El foco permanece
  // en el control utilizado y Tab permite llegar a los enlaces sin saltos forzados.
}
form.addEventListener('submit',event=>{event.preventDefault();search();});
retry.addEventListener('click',()=>search());
const query = new URLSearchParams(location.search).get('q');
if (query !== null) { form.elements.q.value = query.trim().slice(0,120); search(); }

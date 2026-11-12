const form = document.querySelector('form[role="search"]');
const output = document.querySelector('[data-results]');
const status = document.querySelector('[data-results-status]');
const english = document.documentElement.lang === 'en';
const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const indexURL = new URL(english ? '../search-index-en.json' : '../search-index.json', document.currentScript.src);
let index;
form.addEventListener('submit', async event => {
  event.preventDefault();
  const query = new FormData(form).get('q').trim().slice(0, 120);
  output.replaceChildren();
  if (!query) { status.textContent = english ? 'Enter a search term.' : 'Escribe un término de búsqueda.'; return; }
  status.textContent = english ? 'Searching…' : 'Buscando…';
  try {
    if (!index) { const response = await fetch(indexURL); if (!response.ok) throw new Error(); index = await response.json(); }
    const terms = normalize(query).split(/\s+/);
    const results = index.map(item => ({ ...item, score: terms.reduce((score, term) => score + (normalize(item.title).includes(term) ? 4 : 0) + (normalize(item.text).includes(term) ? 1 : 0), 0) }))
      .filter(item => terms.every(term => normalize(item.title + ' ' + item.text).includes(term))).sort((a,b) => b.score - a.score);
    for (const item of results) {
      const li = document.createElement('li'); const a = document.createElement('a'); const p = document.createElement('p');
      a.href = new URL(item.url, indexURL).href; a.textContent = item.title; p.textContent = item.text.slice(0, 220) + '…'; li.append(a,p); output.append(li);
    }
    status.textContent = results.length ? (english ? `${results.length} results for “${query}”.` : `${results.length} resultados para «${query}».`) : (english ? 'No results. Try “museum”, “aviation” or a shorter term.' : 'Sin resultados. Prueba «museo», «aviación» o un término más corto.');
    history.replaceState(null, '', '?q=' + encodeURIComponent(query));
  } catch { status.textContent = english ? 'Search is unavailable. Use the site map or try again.' : 'No se ha podido cargar el buscador. Consulta el mapa del sitio o vuelve a intentarlo.'; }
});
const query = new URLSearchParams(location.search).get('q');
if (query) { form.elements.q.value = query.slice(0, 120); form.requestSubmit(); }

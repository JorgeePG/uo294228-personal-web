import path from 'node:path';

// El menú permanece breve; el mapa también descubre la transcripción anidada.
// Estas rutas son relativas al archivo, por lo que funcionan bajo GitHub Pages.
const sections=[
 ['index.html',{es:'Inicio',en:'Home'}],
 ['sobre-mi/index.html',{es:'Sobre mí',en:'About me'}],
 ['intereses/index.html',{es:'Vehículos y museos',en:'Vehicles and museums'}],
 ['multimedia/index.html',{es:'Vídeo y podcast',en:'Video and podcast'}],
 ['series-y-peliculas/index.html',{es:'Series y películas',en:'Films and TV series'}],
 ['videojuegos/index.html',{es:'Videojuegos',en:'Video games'}],
 ['buscar/index.html',{es:'Buscar',en:'Search'}],
 ['ayuda/index.html',{es:'Ayuda y mapa del sitio',en:'Help and site map'}]
];
const transcript='public/transcripciones/war-on-wheels.html';
const transcriptTitle={es:'Transcripción de War on Wheels (inglés)',en:'War on Wheels transcript (English)'};

export function applySiteOrientation(html,file,label){
 const href=target=>path.posix.relative(path.posix.dirname(file),target);
 html=html.replace(/<nav aria-label="Ruta de navegación"[\s\S]*?<\/nav>/g,'');
 if(file!=='index.html'){
  const title=file===transcript?transcriptTitle:sections.find(([route])=>route===file)?.[1]||{es:'Página no encontrada',en:'Page not found'};
  const ancestors=[['index.html',sections[0][1]],...(file===transcript?[sections[3]]:[])];
  const trail=ancestors.map(([route,text])=>`<a href="${href(route)}">${label(text)}</a>`).join(' / ');
  // La transcripción conserva su contenido inglés y navegación española declarada.
  const lang=file===transcript?' lang="es"':'';
  // Antes del main: «Saltar al contenido» también omite esta navegación repetida.
  html=html.replace(/(<main\b[^>]*>)/,`<nav aria-label="Ruta de navegación"${lang}>${trail} / <span aria-current="page">${label(title)}</span></nav>$1`);
 }
 if(file==='ayuda/index.html'){
  const items=sections.map(([route,text])=>{
   const entry=route===file?`<span aria-current="page">${label(text)}</span>`:`<a href="${href(route)}">${label(text)}</a>`;
   const children=route==='multimedia/index.html'?`<ul><li><a href="${href(transcript)}">${label(transcriptTitle)}</a></li></ul>`:'';
   return `<li>${entry}${children}</li>`;
  }).join('');
  const map=`<!-- site-map --><section data-site-map><h2>${label({es:'Mapa del sitio',en:'Site map'})}</h2><ul>${items}</ul></section><!-- /site-map -->`;
  html=html.replace(/(?:<!-- site-map -->)?<section(?: data-site-map)?><h2>Mapa del sitio<\/h2>[\s\S]*?<\/section>(?:<!-- \/site-map -->)?/,map);
 }
 return html;
}

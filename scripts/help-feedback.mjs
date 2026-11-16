// Ayuda mantenida junto al build: las dos interfaces reciben las mismas opciones
// de recuperación, sin formularios que simulen enviar mensajes ni servicios externos.
export function applyHelpFeedback(html,file,label){
 const t=(es,en)=>label({es,en});
 if(file==='404.html'){
  const body=`<h1>${t('Esta página no existe.','This page does not exist.')}</h1><p>${t('Quizá el enlace haya cambiado o se haya escrito mal.','The link may have changed or been typed incorrectly.')}</p><p><a href="index.html">${t('Volver al inicio','Return home')}</a> · <a href="ayuda/index.html">${t('Consultar el mapa del sitio','View the site map')}</a></p>`;
  html=html.replace(/(<main\b[^>]*>)[\s\S]*?<\/main>/,`$1${body}</main>`);
 }
 if(file==='ayuda/index.html'){
  html=html.replace(/<!-- search-guidance -->[\s\S]*?<!-- \/search-guidance -->/,'');
  const help=`<!-- search-guidance --><section data-search-guidance><h2>${t('Cómo buscar','How to search')}</h2><p>${t('Escribe una o varias palabras en el buscador de la cabecera y pulsa Buscar o Enter. Puedes escribir con o sin tildes y mayúsculas. Si escribes varias palabras, los resultados deben contenerlas todas.','Enter one or more words in the header search field and press Search or Enter. Accents and capital letters do not change the results. When you enter several words, results must contain all of them.')}</p><p>${t('Si no encuentras lo que buscas, prueba con menos palabras o consulta el mapa del sitio. Si falla la carga, pulsa Reintentar búsqueda. Sin JavaScript puedes seguir los enlaces del menú y del mapa.','If you cannot find what you need, try fewer words or use the site map. If loading fails, press Retry search. Without JavaScript, you can still use the menu and site map links.')}</p></section><!-- /search-guidance -->`;
  html=html.replace('<section><h2>¿Algo no funciona?</h2>',help+'<section><h2>¿Algo no funciona?</h2>');
 }
 return html;
}

// Los enlaces HTML funcionan sin JavaScript. Como mejora progresiva, conservar
// parámetros y fragmento al cambiar a la página equivalente (incluida q).
// Se sincroniza al activar, enfocar o copiar el enlace: una búsqueda posterior
// puede haber cambiado la URL mediante replaceState sin recargar la página.
for(const link of document.querySelectorAll('[data-language-link]')) {
 const sync=()=>{
  const destination=new URL(link.href);
  destination.search=location.search;
  destination.hash=location.hash;
  link.href=destination.href;
 };
 sync();
 for(const event of ['click','focus','contextmenu'])link.addEventListener(event,sync);
}

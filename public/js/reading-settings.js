// Preferencias locales opcionales. La web conserva su navegación nativa sin ellas.
(() => {
 const root = document.documentElement;
 const key = 'jorge-reading-v1';
 const defaults = {size:'100',spacing:false,font:false,links:false,motion:false};
 const normalise = value => ({
  size: ['100','125','150','200'].includes(value?.size) ? value.size : '100',
  ...Object.fromEntries(['spacing','font','links','motion'].map(name => [name,value?.[name] === true]))
 });
 let settings = {...defaults};
 let storageAvailable = true;
 try { settings = normalise(JSON.parse(localStorage.getItem(key))); } catch { storageAvailable = false; }
 function apply() {
  if (settings.size === '100') root.removeAttribute('data-reading-size');
  else root.setAttribute('data-reading-size',settings.size);
  for (const name of ['spacing','font','links','motion']) root.toggleAttribute('data-reading-'+name,settings[name]);
  document.dispatchEvent(new Event('reading-settings-change'));
 }
 apply();
 root.setAttribute('data-reading-ready','');
 document.addEventListener('DOMContentLoaded',() => {
  const panel = document.querySelector('[data-reading-settings]');
  if (!panel) return;
  const controls = [...panel.querySelectorAll('[data-reading-control]')];
  const warning = panel.querySelector('[data-reading-storage-warning]');
  const summary = panel.querySelector('summary');
  function sync() {
   controls.forEach(control => {
    const name = control.dataset.readingControl;
    if (name === 'size') control.value = settings.size;
    else control.checked = settings[name];
   });
   warning.hidden = storageAvailable;
  }
  function save(reset = false) {
   try {
    if (reset) localStorage.removeItem(key);
    else localStorage.setItem(key,JSON.stringify(settings));
    storageAvailable = true;
   } catch { storageAvailable = false; }
   apply();
   sync();
  }
  panel.addEventListener('change',event => {
   const control = event.target;
   if (!controls.includes(control)) return;
   settings[control.dataset.readingControl] = control.type === 'checkbox' ? control.checked : control.value;
   settings = normalise(settings);
   save();
  });
  panel.querySelector('[data-reading-reset]').addEventListener('click',() => { settings = {...defaults}; save(true); });
  function close() { panel.open = false; summary.focus(); }
  panel.querySelector('[data-reading-close]').addEventListener('click',close);
  panel.addEventListener('keydown',event => { if (event.key === 'Escape') { event.preventDefault(); close(); } });
  window.addEventListener('storage',event => {
   if (event.key !== key && event.key !== null) return;
   try { settings = normalise(JSON.parse(event.newValue)); apply(); sync(); } catch { /* Ignorar valores ajenos inválidos. */ }
  });
  sync();
 });
})();

// Preferencias locales opcionales. La web conserva su navegación nativa sin ellas.
(() => {
 const root = document.documentElement;
 const key = 'jorge-reading-v1';
 const options = ['spacing','font','dyslexia','links','motion'];
 const defaults = {size:'100',...Object.fromEntries(options.map(name=>[name,false]))};
 const normalise = value => ({
  size: ['100','125','150','200'].includes(value?.size) ? value.size : '100',
  ...Object.fromEntries(options.map(name => [name,value?.[name] === true]))
 });
 let settings = {...defaults};
 let storageAvailable = true;
 try { settings = normalise(JSON.parse(localStorage.getItem(key))); } catch { storageAvailable = false; }
 function apply() {
  if (settings.size === '100') root.removeAttribute('data-reading-size');
  else root.setAttribute('data-reading-size',settings.size);
  for (const name of options) root.toggleAttribute('data-reading-'+name,settings[name]);
  document.dispatchEvent(new Event('reading-settings-change'));
  document.fonts.ready.then(()=>document.dispatchEvent(new Event('reading-settings-change')));
 }
 apply();
 root.setAttribute('data-reading-ready','');
 document.addEventListener('DOMContentLoaded',() => {
  const panel = document.querySelector('[data-reading-settings]');
  const trigger = document.querySelector('[data-reading-trigger]');
  if (!panel || !trigger || typeof panel.showModal !== 'function') return;
  root.setAttribute('data-reading-dialog-ready','');
  const controls = [...panel.querySelectorAll('[data-reading-control]')];
  const warning = panel.querySelector('[data-reading-storage-warning]');
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
  trigger.addEventListener('click',() => {
   panel.showModal();
   trigger.setAttribute('aria-expanded','true');
   root.setAttribute('data-reading-open','');
   panel.querySelector('[data-reading-panel]').scrollTop = 0;
  });
  panel.querySelector('[data-reading-close]').addEventListener('click',()=>panel.close());
  panel.addEventListener('keydown',event => {
   if (event.key !== 'Tab') return;
   const controls = [...panel.querySelectorAll('button, input, select, [tabindex="0"]')].filter(element=>!element.disabled && element.getClientRects().length);
   const first = controls[0], last = controls.at(-1);
   if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
   else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  panel.addEventListener('close',() => {
   root.removeAttribute('data-reading-open');
   trigger.setAttribute('aria-expanded','false');
   trigger.focus({preventScroll:true});
  });
  // El diálogo nativo resuelve Escape, el foco y el fondo inerte.
  let backdropPressed = false;
  const outside = event => {
   const box = panel.getBoundingClientRect();
   return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
  };
  panel.addEventListener('pointerdown',event => { backdropPressed = event.target === panel && outside(event); });
  panel.addEventListener('click',event => {
   if (backdropPressed && event.target === panel && outside(event)) panel.close();
   backdropPressed = false;
  });
  // Mantener visibles los enlaces/controles que reciben foco al tabular.
  document.addEventListener('focusin',event => {
   if (panel.open || trigger.contains(event.target) || !(event.target instanceof HTMLElement)) return;
   const target = event.target.getBoundingClientRect();
   const button = trigger.getBoundingClientRect();
   if (target.right > button.left && target.left < button.right && target.bottom > button.top && target.top < button.bottom) {
    event.target.scrollIntoView({block:'center',behavior:'instant'});
   }
  });
  window.addEventListener('storage',event => {
   if (event.key !== key && event.key !== null) return;
   try { settings = normalise(JSON.parse(event.newValue)); apply(); sync(); } catch { /* Ignorar valores ajenos inválidos. */ }
  });
  sync();
 });
})();

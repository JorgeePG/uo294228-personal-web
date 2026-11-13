// Las fotos siguen siendo enlaces a sus archivos si JavaScript no está disponible.
// Solo las fichas abiertas comparten altura; los details conservan su teclado nativo.
const gallery = document.querySelector('#vehiculos main > ul');
if (gallery) {
  const cards = [...gallery.querySelectorAll('article')];
  let heightFrame = 0;
  function matchExpandedHeights() {
    const expanded = cards.filter(card => card.querySelector('details[open]'));
    cards.forEach(card => card.toggleAttribute('data-expanded', expanded.includes(card)));
    // Medir de nuevo sin el mínimo anterior permite reducir la altura al cerrar.
    gallery.style.setProperty('--expanded-card-height', '0px');
    const height = Math.max(0, ...expanded.map(card => card.getBoundingClientRect().height));
    gallery.style.setProperty('--expanded-card-height', `${Math.ceil(height)}px`);
  }
  function scheduleHeights() {
    cancelAnimationFrame(heightFrame);
    heightFrame = requestAnimationFrame(matchExpandedHeights);
  }
  gallery.querySelectorAll('details').forEach(details => details.addEventListener('toggle', scheduleHeights));
  if (typeof ResizeObserver === 'function') new ResizeObserver(scheduleHeights).observe(gallery);
  window.addEventListener('resize', scheduleHeights);
  document.addEventListener('reading-settings-change', scheduleHeights);
  document.fonts.ready.then(scheduleHeights);
  scheduleHeights();
}
const dialog = document.querySelector('#photo-dialog');

if (dialog && typeof dialog.showModal === 'function') {
  const enlargedImage = dialog.querySelector('img');
  const caption = dialog.querySelector('figcaption');

  document.querySelectorAll('[data-enlarge]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      enlargedImage.src = link.href;
      enlargedImage.alt = link.querySelector('img').alt;
      caption.textContent = link.closest('figure').querySelector('figcaption').textContent.trim();
      dialog.showModal();
    });
  });

  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  enlargedImage.addEventListener('error', () => {
    caption.textContent = document.documentElement.lang === 'en' ? 'The image could not be loaded. Close it and try again.' : 'No se ha podido cargar la imagen. Ciérrala y vuelve a intentarlo.';
  });
}

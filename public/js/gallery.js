// Las fotos siguen siendo enlaces a sus archivos si JavaScript no está disponible.
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
  dialog.addEventListener('close', () => enlargedImage.removeAttribute('src'));
}

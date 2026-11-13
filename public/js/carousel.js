// El carrusel se puede deslizar sin JavaScript; este archivo añade botones y estado.
document.querySelectorAll('[data-carousel]').forEach((showcase) => {
  const track = showcase.querySelector('[data-track]');
  const slides = Array.from(track.children);
  const controls = showcase.querySelector('[data-controls]');
  const previous = controls.querySelector('[data-previous]');
  const next = controls.querySelector('[data-next]');
  const status = controls.querySelector('[aria-live]');
  if (slides.length < 2) return;
  const english = document.documentElement.lang === 'en';

  let current = 0;
  let scrollFrame = 0;
  let targetLeft = 0;
  let navigating = false;
  let navigationTimer = 0;

  function update(index) {
    current = (index + slides.length) % slides.length;
    status.textContent = `${current + 1} ${english ? 'of' : 'de'} ${slides.length}`;
    const previousLabel = current === 0 ? (english ? 'Go to last' : 'Ir al último') : (english ? 'Previous' : 'Anterior');
    const nextLabel = current === slides.length - 1 ? (english ? 'Back to first' : 'Volver al primero') : (english ? 'Next' : 'Siguiente');
    previous.setAttribute('aria-label', previousLabel);
    next.setAttribute('aria-label', nextLabel);
    previous.textContent = `← ${current === 0 ? (english ? 'Last' : 'Último') : previousLabel}`;
    next.textContent = `${current === slides.length - 1 ? (english ? 'First' : 'Primero') : nextLabel} →`;
    slides.forEach((slide, position) => { slide.inert = position !== current; });
  }

  function goTo(index) {
    const wrapped = index < 0 || index >= slides.length;
    update(index);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.hasAttribute('data-reading-motion');
    targetLeft = slides[current].offsetLeft - slides[0].offsetLeft;
    navigating = true;
    clearTimeout(navigationTimer);
    navigationTimer = setTimeout(() => { navigating = false; }, 1200);
    track.scrollTo({
      left: targetLeft,
      behavior: wrapped || reduceMotion ? 'instant' : 'smooth'
    });
  }

  previous.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => goTo(current + 1));
  track.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(current + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(() => {
      if (navigating) {
        if (Math.abs(track.scrollLeft - targetLeft) > 1) return;
        navigating = false;
        clearTimeout(navigationTimer);
      }
      const positions = slides.map((slide) => Math.abs(slide.getBoundingClientRect().left - track.getBoundingClientRect().left));
      update(positions.indexOf(Math.min(...positions)));
    });
  }, { passive: true });

  track.dataset.enhanced = '';
  controls.hidden = false;
  update(0);
  new ResizeObserver(() => {
    targetLeft = slides[current].offsetLeft - slides[0].offsetLeft;
    track.scrollTo({ left: targetLeft, behavior: 'instant' });
  }).observe(track);
});

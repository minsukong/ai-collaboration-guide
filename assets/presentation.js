(() => {
  'use strict';
  const slides = [...document.querySelectorAll('main > section')];
  if (!slides.length) return;
  const isDeck = document.body.dataset.mode === 'slides';
  const links = [...document.querySelectorAll('.chapter-nav a')];
  const counter = document.querySelector('#counter');
  const progress = document.querySelector('#progress');
  const prev = document.querySelector('#prev');
  const next = document.querySelector('#next');
  let current = 0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function mark(index) {
    current = Math.max(0, Math.min(slides.length - 1, index));
    links.forEach((link, i) => i === current ? link.setAttribute('aria-current', 'step') : link.removeAttribute('aria-current'));
    counter.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    progress.style.width = `${(current + 1) / slides.length * 100}%`;
    prev.disabled = current === 0;
    next.disabled = current === slides.length - 1;
  }
  function show(index, updateHash = true) {
    index = Math.max(0, Math.min(slides.length - 1, index));
    if (isDeck) {
      slides.forEach((slide, i) => slide.hidden = i !== index);
      window.scrollTo(0, 0);
    } else {
      slides[index].scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' });
    }
    mark(index);
    if (updateHash) history.replaceState(null, '', `#${slides[index].id}`);
  }
  links.forEach((link, i) => link.addEventListener('click', event => { event.preventDefault(); show(i); }));
  prev.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch (_) { /* Browser permissions can block fullscreen; navigation remains available. */ }
  }
  document.querySelector('#fullscreen').addEventListener('click', fullscreen);
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.altKey || event.metaKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable) return;
    if (event.key.toLowerCase() === 'f') { event.preventDefault(); fullscreen(); return; }
    if (event.target.closest('button,a') && event.key === ' ') return;
    if (['ArrowRight', 'PageDown'].includes(event.key) || (isDeck && ['ArrowDown', ' '].includes(event.key))) { event.preventDefault(); show(current + 1); }
    if (['ArrowLeft', 'PageUp'].includes(event.key) || (isDeck && event.key === 'ArrowUp')) { event.preventDefault(); show(current - 1); }
    if (event.key === 'Home') { event.preventDefault(); show(0); }
    if (event.key === 'End') { event.preventDefault(); show(slides.length - 1); }
  });
  let touchStart = null;
  document.addEventListener('touchstart', event => { touchStart = { x: event.changedTouches[0].screenX, y: event.changedTouches[0].screenY }; }, { passive: true });
  document.addEventListener('touchend', event => {
    if (!isDeck || !touchStart || event.target.closest('a,button')) return;
    const dx = event.changedTouches[0].screenX - touchStart.x;
    const dy = event.changedTouches[0].screenY - touchStart.y;
    if (Math.abs(dx) > 75 && Math.abs(dx) > Math.abs(dy) * 1.5) show(current + (dx < 0 ? 1 : -1));
    touchStart = null;
  }, { passive: true });
  if (!isDeck) {
    let scheduled = false;
    addEventListener('scroll', () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        let best = 0;
        slides.forEach((slide, i) => { if (slide.getBoundingClientRect().top <= innerHeight * .45) best = i; });
        mark(best); scheduled = false;
      });
    }, { passive: true });
  }
  const hashIndex = slides.findIndex(slide => `#${slide.id}` === location.hash);
  show(hashIndex < 0 ? 0 : hashIndex, false);
  addEventListener('hashchange', () => {
    const index = slides.findIndex(slide => `#${slide.id}` === location.hash);
    if (index >= 0) show(index, false);
  });
})();

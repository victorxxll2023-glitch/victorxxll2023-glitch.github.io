(() => {
  'use strict';
  const art = document.querySelector('.hacker-art');
  if (!art) return;
  const trigger = art.querySelector('.hacker-trigger');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let cycleTimer = 0;
  let finishTimer = 0;
  let lastDisruption = -Infinity;
  const paused = () => preference.matches || document.documentElement.classList.contains('motion-paused');
  const canAnimate = () => visible && !document.hidden && !paused();

  function stop() {
    clearTimeout(cycleTimer);
    clearTimeout(finishTimer);
    cycleTimer = finishTimer = 0;
    art.classList.remove('is-disrupted');
  }
  function disrupt() {
    if (!canAnimate() || performance.now() - lastDisruption < 2200) return;
    lastDisruption = performance.now();
    art.classList.add('is-disrupted');
    clearTimeout(finishTimer);
    finishTimer = setTimeout(() => art.classList.remove('is-disrupted'), 1000);
  }
  function cycle(delay = 8200) {
    clearTimeout(cycleTimer);
    if (!canAnimate()) return;
    cycleTimer = setTimeout(() => {
      disrupt();
      cycle();
    }, delay);
  }
  function sync() {
    stop();
    art.classList.toggle('is-inactive', !canAnimate());
    if (trigger) {
      trigger.disabled = paused();
      trigger.title = paused() ? 'Efeitos pausados. O personagem continua visível.' : 'Reproduzir uma interferência visual no personagem';
    }
    if (canAnimate()) cycle(1600);
  }
  trigger?.addEventListener('click', () => { disrupt(); cycle(); });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }, { threshold: .15 }).observe(art);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('portfolio-motion', sync);
  preference.addEventListener('change', sync);
  sync();
})();

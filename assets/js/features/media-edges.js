/* Bend the edge of visible editorial media during a fast desktop wheel gesture. */
(() => {
  const frames = '.approach_marquee_item, .home_card_visual > .project_card_visual, .split_section_image, [data-case-media-rail] .media_preview';
  const enabled = matchMedia('(min-width: 62rem) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  const visible = new Set();
  let observer;
  let lastWheel = -Infinity;
  let lastY = 0;
  let lastTime = 0;
  let settleTimer;
  let direction = '';

  function setDirection(next) {
    if (direction === next) return;
    direction = next;
    for (const frame of visible) {
      if (next) frame.dataset.scrollEdge = next;
      else frame.removeAttribute('data-scroll-edge');
    }
  }

  function onWheel(event) {
    if (!event.ctrlKey) lastWheel = performance.now();
  }

  function onScroll() {
    const now = performance.now();
    const y = window.scrollY;
    const speed = (y - lastY) / Math.max(8, now - lastTime);
    lastY = y;
    lastTime = now;

    // Keyboard scrolling, restored positions and slow wheel input keep straight edges.
    if (!visible.size || now - lastWheel > 150 || Math.abs(speed) < (direction ? 1.25 : 2.4)) return;
    const root = document.documentElement;
    if (root.hasAttribute('data-loader-active') || root.hasAttribute('data-transitioning')) return;

    setDirection(speed > 0 ? 'down' : 'up');
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => setDirection(''), 110);
  }

  function clear() {
    observer?.disconnect();
    observer = undefined;
    clearTimeout(settleTimer);
    setDirection('');
    visible.clear();
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('scroll', onScroll);
  }

  function mount(page) {
    clear();
    if (!enabled.matches || !window.IntersectionObserver) return;
    const targets = page.querySelectorAll(frames);
    if (!targets.length) return;

    lastWheel = -Infinity;
    lastY = window.scrollY;
    lastTime = performance.now();
    observer = new IntersectionObserver((entries, source) => {
      if (source !== observer) return;
      for (const {target, isIntersecting} of entries) {
        if (isIntersecting) {
          visible.add(target);
          if (direction) target.dataset.scrollEdge = direction;
        } else if (visible.delete(target)) {
          target.removeAttribute('data-scroll-edge');
        }
      }
    });
    targets.forEach(frame => observer.observe(frame));
    window.addEventListener('wheel', onWheel, {passive: true});
    window.addEventListener('scroll', onScroll, {passive: true});
  }

  function boot() {
    const mountCurrent = () => mount(document.querySelector('[data-barba="container"]') || document);
    enabled.addEventListener('change', mountCurrent);
    window.barba?.hooks.beforeLeave(clear);
    window.barba?.hooks.afterEnter(({next}) => mount(next.container));
    mountCurrent();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once: true});
  else boot();
})();

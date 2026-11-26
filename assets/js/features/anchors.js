/* Shared Lenis anchor owner. Uses the boilerplate's existing Lenis instance; survives Barba swaps. */
(() => {
  if (window.JKAnchors) return;
  const SETTINGS = {
    duration: 1.2,
    centreDuration: .75
  };
  // Expo-out for service headings; keep the existing in-out curve for the header/footer anchors.
    const centreEase = x => x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
  const easing = x => x < .5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
  function go(el, event) {
    const selector = el.getAttribute("data-anchor-target") || (el.getAttribute("href") === "#back-to-top" ? "top" : null);
    let target = null;
    if (selector === "self") target = el;
    else if (selector === "parent") target = el.parentElement;
    else if (selector !== "top") target = document.querySelector(selector);
    if (selector !== "top" && !target) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    let y = 0;
    if (target) {
      const r = target.getBoundingClientRect();
      y = scrollY + r.top;
      const align = el.dataset.anchorAlign;
      if (align === "center") y -= (innerHeight - r.height) / 2;
      if (align === "end") y += r.height - innerHeight;
    }
    y = Math.max(0, Math.min(y, document.documentElement.scrollHeight - innerHeight));
    const motion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const engine = typeof lenis !== "undefined" ? lenis : window.lenis;
    if (engine) {
      const centre = el.hasAttribute("data-lenis-centre");
      if (centre) engine.scrollTo(target, {
        offset: -(innerHeight - target.offsetHeight) / 2,
        duration: SETTINGS.centreDuration,
        easing: centreEase,
        immediate: motion
      }); else engine.scrollTo(y, {
        duration: SETTINGS.duration,
        easing: easing,
        immediate: motion
      });
    } else window.scrollTo({
      top: y,
      behavior: motion ? "instant" : "smooth"
    });
  }
  document.addEventListener("click", (event => {
    const el = event.target.closest('[data-anchor-target],a[href="#back-to-top"]');
    if (el) go(el, event);
  }), true);
  document.addEventListener("keydown", (event => {
    if (![ "Enter", " " ].includes(event.key)) return;
    const el = event.target.closest('[data-anchor-target],a[href="#back-to-top"]');
    if (el && !el.matches("a,button")) go(el, event);
  }), true);
  window.JKAnchors = {};
})();

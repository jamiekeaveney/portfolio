/* Desktop footer entrance; tablet and mobile keep ordinary document flow. */
(() => {
  const states = new Map;
  function dispose(page) {
    states.forEach(((mm, el) => {
      if (page.contains(el)) {
        mm.revert();
        states.delete(el);
      }
    }));
  }
  function init(page) {
    page.querySelectorAll(".footer-editorial-panel[data-footer-parallax]").forEach((footer => {
      if (states.has(footer)) return;
      const mm = gsap.matchMedia();
      states.set(footer, mm);
      mm.add("(min-width:992px) and (prefers-reduced-motion:no-preference)", (() => {
        const inner = footer.querySelector("[data-footer-parallax-inner]");
        if (!inner) return;
        gsap.fromTo(inner, {
          yPercent: -15
        }, {
          yPercent: 0,
          ease: "none",
          scrollTrigger: {
            trigger: footer,
            start: "clamp(top bottom)",
            end: "clamp(top top)",
            scrub: true,
            invalidateOnRefresh: true
          }
        });
      }));
    }));
  }
  function boot() {
    if (!window.gsap || !window.ScrollTrigger) return;
    if (window.barba) {
      barba.hooks.afterEnter((d => init(d.next.container)));
      barba.hooks.afterOnce((d => init(d.next.container)));
      barba.hooks.beforeLeave((d => dispose(d.current.container)));
    } else init(document);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {
    once: true
  }); else boot();
})();

/* Home-only scroll Flip. The preview's caption never contributes to the media ratio. */
(() => {
  const instances = new Map;
  const motion = window.JKScrollMediaMotion;
  function init(scope) {
    const page = scope?.querySelector ? scope : document.querySelector('[data-barba="container"]');
    const home = page?.querySelector(".hero_reel_media");
    if (!home || instances.has(home) || !window.ScrollTrigger) return;
    window.JKLightbox?.mount(page);
    const target = home.querySelector(".showreel_wrap");
    const destination = page.querySelector('.hero_reel_destination[data-flip-element="wrapper"]');
    const end = page.querySelector('[data-flip-element="end"]');
    if (!target || !destination || !end) return;
    const originalStyle = target.getAttribute("style");
    const staticMedia = matchMedia("(max-width: 61.9375rem), (prefers-reduced-motion: reduce)");
    const fade = [ ...page.querySelectorAll("[data-flip-fade]") ].filter((el => !el.matches("[data-home-scroll],[data-home-intro-exit],[data-home-arrow-exit],.scroll_arrow_mask") && !el.querySelector("[data-home-scroll],[data-home-intro-exit],[data-home-arrow-exit],.scroll_arrow_mask")));
    let track, refreshFrame, suspended = false;
    const restore = () => originalStyle === null ? target.removeAttribute("style") : target.setAttribute("style", originalStyle);
    function paint(trigger) {
      if (suspended || !trigger) return;
      const from = home.getBoundingClientRect();
      const to = destination.getBoundingClientRect();
      const container = target.offsetParent?.getBoundingClientRect() || from;
      motion.place(target, from, to, container, trigger.progress);
      if (fade.length) gsap.set(fade, {autoAlpha: Math.max(0, 1 - trigger.progress / .4)});
    }
    function afterRefresh(trigger) {
      paint(trigger);
      // Refresh can temporarily move the viewport to scroll zero before restoring it.
      cancelAnimationFrame(refreshFrame);
      refreshFrame = requestAnimationFrame(() => paint(track));
    }
    function build() {
      if (suspended || target.dataset.miniShowreelStatus === 'active') return;
      track?.kill(); track = null;
      restore();
      if (staticMedia.matches) return;
      target.style.position = 'absolute';
      track = ScrollTrigger.create({id:'jk-home-showreel',trigger:end,start:0,end:'bottom bottom',
        onUpdate:paint,onRefresh:afterRefresh});
      paint(track);
    }
    const size = new ResizeObserver(() => {
      if (!track || suspended) return;
      track.refresh();
      paint(track);
    });
    size.observe(home);
    size.observe(destination);
    const state = {
      page: page,
      target: target,
      build: build,
      suspend() {
        suspended = true;
        track?.disable(false);
      },
      resume() {
        suspended = false;
        build();
      },
      cleanup() {
        suspended = true;
        size.disconnect();
        cancelAnimationFrame(refreshFrame);
        track?.kill();
        staticMedia.removeEventListener("change", build);
        restore();
        instances.delete(home);
      }
    };
    instances.set(home, state);
    staticMedia.addEventListener("change", build);
    build();
  }
  window.initFlipOnScroll = init;
  window.JKHomeScroll = {
    suspend(root) {
      for (const s of instances.values()) if (s.target === root) s.suspend();
    },
    resume(root) {
      for (const s of instances.values()) if (s.target === root) s.resume();
    }
  };
  function boot() {
    init();
    if (window.barba) {
      // The boilerplate kills outgoing ScrollTriggers in afterLeave. Create incoming ones afterwards.
      barba.hooks.afterEnter((d => init(d.next.container)));
      barba.hooks.afterOnce((d => init(d.next.container)));
      barba.hooks.beforeLeave((d => {
        for (const s of instances.values()) if (s.page === d.current.container) s.suspend();
      }));
      barba.hooks.afterLeave((d => {
        for (const s of [ ...instances.values() ]) if (s.page === d.current.container) s.cleanup();
      }));
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {
    once: true
  }); else boot();
})();

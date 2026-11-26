/* Home-only scroll Flip. The preview's caption never contributes to the media ratio. */
(() => {
  const instances = new Map;
  const motion = window.JKScrollMediaMotion;
  function init(scope) {
    const page = scope?.querySelector ? scope : document.querySelector('[data-barba="container"]');
    const home = page?.querySelector(".hero_reel_media");
    if (!home || instances.has(home) || !window.Flip || !window.ScrollTrigger) return;
    window.JKLightbox?.mount(page);
    const target = home.querySelector(".showreel_wrap");
    const destination = page.querySelector('.hero_reel_destination[data-flip-element="wrapper"]');
    const end = page.querySelector('[data-flip-element="end"]');
    if (!target || !destination || !end) return;
    const originalStyle = target.getAttribute("style");
    const staticMedia = matchMedia("(max-width: 61.9375rem), (prefers-reduced-motion: reduce)");
    const fade = [ ...page.querySelectorAll("[data-flip-fade]") ].filter((el => !el.matches("[data-home-scroll],[data-home-intro-exit],[data-home-arrow-exit],.scroll_arrow_mask") && !el.querySelector("[data-home-scroll],[data-home-intro-exit],[data-home-arrow-exit],.scroll_arrow_mask")));
    let timeline, render, timer, refreshFrame, suspended = false, dead = false;
    const restore = () => originalStyle === null ? target.removeAttribute("style") : target.setAttribute("style", originalStyle);
    function afterRefresh() {
      // ScrollTrigger can measure at scroll zero. Paint after it restores the viewport.
      cancelAnimationFrame(refreshFrame);
      refreshFrame = requestAnimationFrame(() => render?.());
    }
    function build() {
      if (dead || suspended || target.dataset.miniShowreelStatus === "active") return;
      timeline?.scrollTrigger?.kill();
      timeline?.kill();
      render = null;
      restore();
      if (staticMedia.matches) return;
      // Interpolate one viewport rectangle. Scroll compensation is immediate;
      // only the A-to-B playhead is scrubbed, so vertical movement cannot lag twice.
      const startRect = target.getBoundingClientRect(), endRect = destination.getBoundingClientRect();
      const from = {x:startRect.left,y:startRect.top + scrollY,w:startRect.width,h:startRect.height};
      const to = {x:endRect.left,y:endRect.top + scrollY,w:endRect.width,h:endRect.height};
      const playhead = {value:0};
      render = () => {
        if (dead || suspended || !timeline?.scrollTrigger) return;
        const st=timeline.scrollTrigger, p=playhead.value, y=scrollY;
        const beyond=Math.max(0,y-st.end), before=Math.min(0,y-st.start);
        const host=home.getBoundingClientRect();
        const viewportY=(from.y-st.start)*(1-p)+(to.y-st.end)*p-beyond-before;
        gsap.set(target,{position:'absolute',left:0,top:0,
          x:from.x+(to.x-from.x)*p-host.left,y:viewportY-host.top,
          width:from.w+(to.w-from.w)*p,height:from.h+(to.h-from.h)*p});
      };
      timeline=gsap.timeline({scrollTrigger:{id:'jk-home-showreel',trigger:end,
        start:0,end:'bottom bottom',scrub:motion.settings.scrub,onUpdate:()=>render?.(),onRefresh:afterRefresh}});
      timeline.to(playhead,{value:1,duration:1,ease:motion.flightEase,onUpdate:()=>render?.()},0);
      if (fade.length) timeline.fromTo(fade, {
        autoAlpha: 1
      }, {
        autoAlpha: 0,
        duration: .4,
        ease: "none"
      }, 0);
      timeline.scrollTrigger.refresh();
      timeline.scrollTrigger.update();
      timeline.progress(timeline.scrollTrigger.progress);
      render();
    }
    let viewportWidth = innerWidth;
    const resize = () => {
      if (innerWidth === viewportWidth && !matchMedia("(min-width:62rem)").matches) return;
      viewportWidth = innerWidth;
      clearTimeout(timer);
      timer = setTimeout(build, 120);
    };
    const state = {
      page: page,
      target: target,
      build: build,
      suspend() {
        suspended = true;
        timeline?.scrollTrigger?.disable(false);
      },
      resume() {
        suspended = false;
        build();
      },
      cleanup() {
        dead = true;
        clearTimeout(timer);
        cancelAnimationFrame(refreshFrame);
        timeline?.scrollTrigger?.kill();
        timeline?.kill();
        window.removeEventListener("resize", resize);
        staticMedia.removeEventListener("change", build);
        restore();
        instances.delete(home);
      }
    };
    instances.set(home, state);
    window.addEventListener("resize", resize);
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

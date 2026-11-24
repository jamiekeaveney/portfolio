/* Home-only scroll Flip. The preview's caption never contributes to the media ratio. */
(() => {
  const instances = new Map;
  const tiltStrength = .25;
  const motion = window.JKScrollMediaMotion;
  function init(scope) {
    const page = scope?.querySelector ? scope : document.querySelector('[data-barba="container"]');
    const home = page?.querySelector(".scaling-video__wrapper");
    if (!home || instances.has(home) || !window.Flip || !window.ScrollTrigger) return;
    window.JKLightbox?.mount(page);
    const target = home.querySelector(".mini-showreel");
    const destination = page.querySelector('.scaling-element__big-box[data-flip-element="wrapper"]');
    const end = page.querySelector('[data-flip-element="end"]');
    if (!target || !destination || !end) return;
    const originalStyle = target.getAttribute("style");
    const fade = [ ...page.querySelectorAll("[data-flip-fade]") ].filter((el => !el.matches("[data-home-scroll],[data-home-intro-exit],[data-home-arrow-exit],.scroll-arrow__mask") && !el.querySelector("[data-home-scroll],[data-home-intro-exit],[data-home-arrow-exit],.scroll-arrow__mask")));
    let playhead, timeline, render, timer, suspended = false, dead = false;
    const restore = () => originalStyle === null ? target.removeAttribute("style") : target.setAttribute("style", originalStyle);
    function build() {
      if (dead || suspended || target.dataset.miniShowreelStatus === "active") return;
      timeline?.scrollTrigger?.kill();
      timeline?.kill();
      restore();
      if (matchMedia("(max-width: 61.9375rem), (prefers-reduced-motion: reduce)").matches) return;
      // Interpolate one viewport rectangle. Scroll compensation is immediate;
      // only the A-to-B playhead is scrubbed, so vertical movement cannot lag twice.
      const startRect = target.getBoundingClientRect(), endRect = destination.getBoundingClientRect();
      const from = {x:startRect.left,y:startRect.top + scrollY,w:startRect.width,h:startRect.height};
      const to = {x:endRect.left,y:endRect.top + scrollY,w:endRect.width,h:endRect.height};
      playhead = {value:0};
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
        start:0,end:'bottom bottom',scrub:motion.settings.scrub,onUpdate:()=>render?.()}});
      timeline.to(playhead,{value:1,duration:1,ease:'sine.inOut',onUpdate:()=>render?.()},0);
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
    const face=target.querySelector('.mini-showreel__card');
    let swing=0;
    function tilt(time,dt=16.667){
      if(!face)return;
      const track=timeline?.scrollTrigger;
      if(!track||suspended||!track.enabled){swing=0;face.style.removeProperty('transform');face.style.removeProperty('transform-origin');return;}
      face.style.transformOrigin='top left';
      swing=motion.updateTilt(face,swing,track.getVelocity(),dt,playhead.value,tiltStrength);
    }
    gsap.ticker.add(tilt);
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
        face?.style.removeProperty('transform');
        timeline?.scrollTrigger?.disable(false);
      },
      resume() {
        suspended = false;
        build();
      },
      cleanup() {
        dead = true;
        gsap.ticker.remove(tilt);
        face?.style.removeProperty('transform');
        face?.style.removeProperty('transform-origin');
        clearTimeout(timer);
        timeline?.scrollTrigger?.kill();
        timeline?.kill();
        window.removeEventListener("resize", resize);
        restore();
        instances.delete(home);
      }
    };
    instances.set(home, state);
    window.addEventListener("resize", resize);
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

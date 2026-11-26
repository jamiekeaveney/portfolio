/* Osmo directional marquee: native Designer layout, shared distance-based speed. */
(() => {
  /* TUNE HERE — durations/delays in seconds unless labelled Ms; distances in rem or %. */
  const SETTINGS = {
    defaultSpeed: 30,
    defaultScrollTravel: 10,
    defaultCopies: 2,
    phoneBreakpoint: 479,
    tabletBreakpoint: 991,
    phoneDurationMultiplier: .25,
    tabletDurationMultiplier: .5,
    resizeDebounceMs: 150
  };
  const states = new Map;
  function init(page) {
    if (!page) return;
    page.querySelectorAll("[data-marquee-scroll-direction-target]").forEach((root => {
      if (states.has(root)) return;
      const scroll = root.querySelector("[data-marquee-scroll-target]");
      const content = scroll?.querySelector("[data-marquee-collection-target]");
      if (!content) return;
      let loop, shift, trigger, resizeTimer, frozen = false, visible = false, direction = root.dataset.marqueeDirection === "right" ? -1 : 1;
      const baseDirection = direction;
      const entryStart = root.dataset.marqueeStart === "entry";
      let phase = entryStart ? 0 : .5;
      const reduced = matchMedia("(prefers-reduced-motion: reduce)");
      function syncPlayback() {
        loop?.paused(frozen || !visible || reduced.matches || document.hidden || document.documentElement.hasAttribute('data-loader-active'));
      }
      // A pinned section above this marquee can change its scroll coordinates.
      // Playback follows the visible element, including the footer's own parallax.
      const visibility = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        syncPlayback();
      });
      visibility.observe(root);
      function build() {
        if (frozen) return;
        if (loop) phase = loop.progress();
        loop?.kill();
        trigger?.kill(false);
        shift?.kill();
        loop = trigger = shift = null;
        scroll.querySelectorAll("[data-marquee-clone]").forEach((el => el.remove()));
        gsap.set(content, {
          xPercent: 0
        });
        const amount = Number(root.dataset.marqueeScrollSpeed ?? SETTINGS.defaultScrollTravel);
        scroll.style.marginLeft = -amount + "%";
        scroll.style.width = 100 + amount * 2 + "%";
        const width = content.getBoundingClientRect().width;
        if (!width) return;
        const copies = Math.max(Number(root.dataset.marqueeDuplicate ?? SETTINGS.defaultCopies), Math.ceil(scroll.offsetWidth / width) + 1);
        for (let i = 0; i < copies; i++) {
          const clone = content.cloneNode(true);
          clone.setAttribute("data-marquee-clone", "");
          clone.setAttribute("aria-hidden", "true");
          clone.removeAttribute("id");
          clone.querySelectorAll("[id]").forEach((el => el.removeAttribute("id")));
          clone.querySelectorAll("a,button,[tabindex]").forEach((el => el.setAttribute("tabindex", "-1")));
          scroll.appendChild(clone);
        }
        const collections = scroll.querySelectorAll("[data-marquee-collection-target]");
        if (reduced.matches) {
          gsap.set(collections, {
            xPercent: 0
          });
          gsap.set(scroll, { x: 0 });
          return;
        }
        const multiplier = innerWidth < SETTINGS.phoneBreakpoint ? SETTINGS.phoneDurationMultiplier : innerWidth < SETTINGS.tabletBreakpoint ? SETTINGS.tabletDurationMultiplier : 1;
        const duration = Number(root.dataset.marqueeSpeed ?? SETTINGS.defaultSpeed) * (width / innerWidth) * multiplier;
        loop = gsap.fromTo(collections, {
          xPercent: 0
        }, {
          xPercent: -100,
          duration: duration,
          ease: "none",
          repeat: -1,
          paused: true,
          onReverseComplete() {
            this.totalTime(this.totalTime() + this.duration() * 100);
          }
        });
        loop.totalTime(duration * (100 + phase)).timeScale(direction);

        shift = gsap.fromTo(scroll, {
          x: () => baseDirection * amount * innerWidth / 100
        }, {
          x: () => -baseDirection * amount * innerWidth / 100,
          ease: "none",
          paused: true
        });
        trigger = ScrollTrigger.create({
          trigger: root,
          start: "top bottom",
          end: "bottom top",
          animation: shift,
          scrub: 0,
          invalidateOnRefresh: true,
          refreshPriority: -1
        });
        syncPlayback();
      }
      let lastWidth = innerWidth;
      const resize = () => {
        if (innerWidth === lastWidth) return;
        lastWidth = innerWidth;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout((() => {
          build();
          if (!frozen) ScrollTrigger.refresh();
        }), SETTINGS.resizeDebounceMs);
      };
      const motionChanged = () => {
        if (frozen) return;
        build();
        ScrollTrigger.refresh();
      };
      let lastY=window.scrollY;
      const followScroll=()=>{
        const y=Math.max(0,Math.min(window.scrollY,ScrollTrigger.maxScroll(window)));
        if(Math.abs(y-lastY)<1)return;
        direction=y>lastY?baseDirection:-baseDirection;
        lastY=y;
        loop?.timeScale(direction);
        root.dataset.marqueeStatus=direction===baseDirection?'normal':'inverted';
      };
      window.addEventListener('scroll',followScroll,{passive:true});
      document.addEventListener('visibilitychange', syncPlayback);
      reduced.addEventListener('change', motionChanged);
      const state = {
        release: syncPlayback,
        freeze() {
          frozen = true;
          visibility.disconnect();
          window.removeEventListener('scroll',followScroll);
          document.removeEventListener('visibilitychange', syncPlayback);
          reduced.removeEventListener('change', motionChanged);
          clearTimeout(resizeTimer);
          window.removeEventListener("resize", resize);
          loop?.pause();
          shift?.pause();
          trigger?.kill(false);
        },
        dispose() {
          this.freeze();
          loop?.kill();
          shift?.kill();
        }
      };
      states.set(root, state);
      build();
      window.addEventListener("resize", resize);
      document.fonts?.ready.then((() => {
        if (!frozen) {
          build();
          ScrollTrigger.refresh();
        }
      }));
    }));
  }
  function freeze(page) {
    if (page) states.forEach(((s, el) => {
      if (page.contains(el)) s.freeze();
    }));
  }
  function dispose(page) {
    if (page) states.forEach(((s, el) => {
      if (page.contains(el)) {
        s.dispose();
        states.delete(el);
      }
    }));
  }
  function boot() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    if (window.barba) {
      barba.hooks.beforeLeave((d => freeze(d.current.container)));
      barba.hooks.afterEnter((d => init(d.next.container)));
      barba.hooks.afterOnce((d => init(d.next.container)));
      barba.hooks.after((d => dispose(d.current.container)));
    }
    document.addEventListener('jk:loader-finished',()=>states.forEach(s=>s.release()));
    init(document);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {
    once: true
  }); else boot();
})();

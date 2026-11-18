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
      let loop, shift, trigger, resizeTimer, frozen = false, direction = root.dataset.marqueeDirection === "right" ? -1 : 1;
      const baseDirection = direction;
      const entryStart = root.dataset.marqueeStart === "entry";
      let started = !entryStart;
      function start() {
        if (!frozen) {
          started = true;
          loop?.paused(false);
        }
      }
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      function build() {
        if (frozen) return;
        const phase = loop ? loop.progress() : entryStart ? 0 : .5;
        loop?.kill();
        trigger?.kill(false);
        shift?.kill();
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
        if (reduced) {
          gsap.set(collections, {
            xPercent: 0
          });
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
        loop.totalTime(duration * (100 + phase)).timeScale(direction).paused(!started);
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
          onEnter: start,
          onEnterBack: start,
          onUpdate(self) {
            const y=window.scrollY, max=ScrollTrigger.maxScroll(window);
            if (innerWidth <= SETTINGS.tabletBreakpoint || y <= 1 || y >= max-1) return;
            if (Math.abs(self.getVelocity()) < 15) return;
            direction = self.direction === 1 ? baseDirection : -baseDirection;
            loop.timeScale(direction);
            root.setAttribute("data-marquee-status", self.direction === 1 ? "normal" : "inverted");
          }
        });
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
      const state = {
        freeze() {
          frozen = true;
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
    init(document);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {
    once: true
  }); else boot();
})();

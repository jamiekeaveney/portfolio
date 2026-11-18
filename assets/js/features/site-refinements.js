/* R9: native sticky easing, section navigation and one portrait handoff. */
(() => {
  "use strict";
  let stickies = null, portrait = null, resizeTimer;
  const desktop = matchMedia("(min-width:992px) and (hover:hover) and (pointer:fine)");
  const reduced = matchMedia("(prefers-reduced-motion:reduce)");
  function disposePortrait() {
    portrait?.destroy();
    portrait = null;
  }
  function mountPortrait(page) {
    disposePortrait();
    const source = page.querySelector("[data-portrait-source]"), target = page.querySelector("[data-portrait-destination]");
    if (!source || !target || !desktop.matches || reduced.matches) return;
    const sourceImage = source.querySelector("img"), targetImage = target.querySelector("img");
    if (!sourceImage || !targetImage) return;
    const clone = sourceImage.cloneNode(true);
    clone.removeAttribute("id");
    clone.alt = "";
    clone.className = "about-portrait-flight";
    clone.setAttribute("aria-hidden", "true");
    page.append(clone);
    const originalStyle = source.getAttribute("style");
    let from, to, disposed = false;
    const reset = () => {
      source.style.width = "";
      source.style.marginRight = "";
      source.style.height = "";
    };
    function measure() {
      reset();
      const a = source.getBoundingClientRect(), b = target.getBoundingClientRect(), p = page.getBoundingClientRect();
      from = {
        x: a.left - p.left,
        y: a.top - p.top,
        w: a.width,
        h: a.height
      };
      to = {
        x: b.left - p.left,
        y: b.top - p.top,
        w: b.width,
        h: b.height
      };
      gsap.set(clone, {
        position: "absolute",
        left: from.x,
        top: from.y,
        width: from.w,
        height: from.h,
        transformOrigin: "0 0",
        zIndex: 8,
        pointerEvents: "none",
        borderRadius: getComputedStyle(target).borderRadius,
        objectFit: "cover"
      });
    }
    function paint(p) {
      if (disposed || !from?.w) return;
      sourceImage.style.visibility = p > 0 ? "hidden" : "";
      targetImage.style.visibility = p < 1 ? "hidden" : "";
      const collapse = Math.min(1, p / .65);
      source.style.width = from.w * (1 - collapse) + "px";
      source.style.height = from.h + "px";
      source.style.marginRight = (1 - collapse) * .12 + "em";
      gsap.set(clone, {
        visibility: p > 0 && p < 1 ? "visible" : "hidden",
        x: (to.x - from.x) * p,
        y: (to.y - from.y) * p,
        scaleX: 1 + (to.w / from.w - 1) * p,
        scaleY: 1 + (to.h / from.h - 1) * p,
        rotation: 0
      });
    }
    const playhead = {
      value: 0
    };
    measure();
    const tween = gsap.to(playhead, {
      value: 1,
      ease: "none",
      onUpdate: () => paint(playhead.value),
      scrollTrigger: {
        trigger: page.querySelector(".editorial-hero") || source,
        start: "top top",
        endTrigger: target,
        end: "center center",
        scrub: .22,
        invalidateOnRefresh: true,
        onRefresh() {
          measure();
          paint(playhead.value);
        }
      }
    });
    paint(tween.scrollTrigger.progress);
    portrait = {
      destroy() {
        disposed = true;
        tween.scrollTrigger?.kill();
        tween.kill();
        clone.remove();
        reset();
        sourceImage.style.visibility = "";
        targetImage.style.visibility = "";
      }
    };
  }
  function mount(page) {
    stickies?.destroy();
    const library = window.JKStickyLibrary;
    if (library) {
      const found = library.findSticky();
      found.forEach((el => {
        if (!page.contains(el) || el.closest(".pin-spacer,[data-footer-parallax],[data-scroll-next-wrap],[data-horizontal-section],.footer-wrap,.sticky-footer") || el.hasAttribute("data-home-scroll")) return;
        if (getComputedStyle(el).position === "sticky") el.setAttribute("data-site-eased-sticky", "");
      }));
      stickies = library.sticky.all("[data-site-eased-sticky]", {
        ease: "expo",
        distance: .45,
        media: "(min-width:992px) and (hover:hover) and (pointer:fine)",
        ticker: fn => {
          gsap.ticker.add(fn);
          return () => gsap.ticker.remove(fn);
        }
      });
    }
    const source = page.querySelector("[data-portrait-source]");
    if (source && parseFloat(source.style.width) === 0) page.addEventListener("jk:inline-ready", (() => mountPortrait(page)), {
      once: true
    }); else if (source && source.style.width) page.addEventListener("jk:inline-ready", (() => mountPortrait(page)), {
      once: true
    }); else mountPortrait(page);
  }
  document.addEventListener("click", (event => {
    const arrow = event.target.closest(".scroll-arrow__mask");
    if (!arrow || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const page = arrow.closest('[data-barba="container"]');
    if (!page) return;
    let selector = arrow.getAttribute("data-anchor-target") || arrow.getAttribute("href"), target;
    if (innerWidth < 992 && selector === "#showreel") selector = "#about";
    try {
      target = selector?.startsWith("#") ? page.querySelector(selector) : null;
    } catch {}
    if (!target || target.getBoundingClientRect().height < 1) {
      const section = arrow.closest("section,.hero,.editorial-hero");
      target = section?.nextElementSibling;
    }
    if (!target) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const nav = document.querySelector(".sitenav__bar"), offset = innerWidth < 992 ? -(nav?.getBoundingClientRect().bottom || 80) - 24 : 0;
    const smooth = window.JKProject?.lenis();
    if (smooth) smooth.scrollTo(target, {
      offset: offset,
      duration: reduced.matches ? 0 : 1.2,
      easing: t => 1 - Math.pow(2, -10 * t),
      force: true
    }); else window.scrollTo({
      top: Math.max(0, target.getBoundingClientRect().top + scrollY + offset),
      behavior: reduced.matches ? "instant" : "smooth"
    });
  }), true);
  function boot() {
    if (!window.gsap || !window.ScrollTrigger) return;
    const freeze = window.freezeContainer;
    if (freeze) window.freezeContainer = function(page) {
      stickies?.freeze();
      return freeze(page);
    };
    if (window.barba) {
      barba.hooks.beforeLeave((() => stickies?.freeze()));
      barba.hooks.afterLeave((() => {
        stickies?.destroy();
        stickies = null;
        disposePortrait();
      }));
      barba.hooks.afterEnter((d => mount(d.next.container)));
      barba.hooks.afterOnce((d => mount(d.next.container)));
    } else mount(document);
    let lastWidth = innerWidth;
    window.addEventListener("resize", (() => {
      if (lastWidth === innerWidth) return;
      lastWidth = innerWidth;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout((() => {
        if (!document.documentElement.hasAttribute("data-transitioning")) mount(document.querySelector('[data-barba="container"]') || document);
      }), 220);
    }), {
      passive: true
    });
    ScrollTrigger.addEventListener("refresh", (() => stickies?.refresh()));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {
    once: true
  }); else boot();
})();

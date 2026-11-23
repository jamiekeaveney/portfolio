/* One owner for muted inline video. Explicit hover modes stay paused until hovered. */
(() => {
  /* TUNE HERE — durations/delays in seconds unless labelled Ms; distances in rem or %. */
  const SETTINGS = {
    posterFadeDuration: .3,
    ease: "expo.out",
    visibilityThreshold: .01
  };
  const states = new WeakMap;
  function destroy(page) {
    const s = states.get(page);
    if (!s) return;
    s.abort.abort();
    s.io.disconnect();
    s.mo.disconnect();
    s.entries.forEach(((e, v) => {
      v.pause();
      gsap.killTweensOf(e.image);
    }));
    states.delete(page);
  }
  function init(page) {
    if (!page) return;
    destroy(page);
    const abort = new AbortController, sig = {
      signal: abort.signal
    }, entries = new Map, reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let px = -1, py = -1, scanQueued = false;
    const isVisible = v => {
      const r = v.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
    };
    function wanted(v, e) {
      if (!v.isConnected || document.hidden || reduced || !isVisible(v)) return false;
      const mode = v.dataset.videoMode || "viewport";
      if (mode.includes("active") && !v.closest('.is-active,[data-work-state="active"]')) return false;
      if (mode.includes("hover")) {
        const list = v.closest("[data-work-list-media]");
        if (list) return list.dataset.workState === "active" && (e.host.matches(":hover") || e.host.contains(document.activeElement));
        return e.host.matches(":hover") || e.host.contains(document.activeElement);
      }
      return true;
    }
    function sync(v, e) {
      const play = wanted(v, e);
      if (play === e.playing) return;
      e.playing = play;
      if (play) {
        if (!v.getAttribute("src") && v.dataset.src) {
          v.src = v.dataset.src;
          v.load();
        }
        v.play().then((() => {
          const reveal = () => {
            if (e.playing && !abort.signal.aborted) {
              const frame = v.closest(".slide-thumbnail,.work-card__poster");
              frame?.style.setProperty("--project-video-ready", "1");
            }
            if (e.playing && !abort.signal.aborted && e.image) gsap.to(e.image, {
              opacity: 0,
              duration: SETTINGS.posterFadeDuration,
              ease: SETTINGS.ease,
              overwrite: true
            });
          };
          if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(reveal); else if (v.readyState >= 2) reveal();
        })).catch((() => {
          e.playing = false;
        }));
      } else {
        v.pause();
        if (e.image) gsap.to(e.image, {
          opacity: 1,
          duration: SETTINGS.posterFadeDuration,
          ease: SETTINGS.ease,
          overwrite: true
        });
      }
    }
    const io = new IntersectionObserver((changes => changes.forEach((({target: target}) => {
      const e = entries.get(target);
      if (e) sync(target, e);
    }))), {
      threshold: SETTINGS.visibilityThreshold
    });
    function scan() {
      scanQueued = false;
      entries.forEach(((e, v) => {
        if (!page.contains(v)) {
          v.pause();
          io.unobserve(v);
          entries.delete(v);
        }
      }));
      page.querySelectorAll("video").forEach((v => {
        if (entries.has(v) || v.controls || v.closest('.case-index__card,[data-video-ignore],[data-bunny-player-init],.lightbox,[role="dialog"]') || !(v.muted || v.hasAttribute("muted") || v.closest('[data-video="playpause"]'))) return;
        const host = v.closest(".work-list__center") || v.closest(".work-card__thumb,.home-slide-image") || v.parentElement;
        const media = v.closest(".work-card__thumb,.home-slide-image");
        const image = null;
 // Home/Work retain their own thumbnail hover presentation.
                const e = {
          host: host,
          image: image,
          playing: undefined
        };
        entries.set(v, e);
        io.observe(v);
        sync(v, e);
      }));
      entries.forEach(((e, v) => sync(v, e)));
    }
    const mo = new MutationObserver((() => {
      if (!scanQueued) {
        scanQueued = true;
        queueMicrotask(scan);
      }
    }));
    mo.observe(page, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [ "data-work-state", "class" ]
    });
    const update = () => entries.forEach(((e, v) => sync(v, e)));
    page.addEventListener("pointerover", update, sig);
    page.addEventListener("pointerout", (() => requestAnimationFrame(update)), sig);
    page.addEventListener("pointermove", update, {
      passive: true,
      ...sig
    });
    page.addEventListener("focusin", update, sig);
    page.addEventListener("focusout", (() => requestAnimationFrame(update)), sig);
    window.addEventListener("scroll", update, {
      passive: true,
      ...sig
    });
    document.addEventListener("visibilitychange", update, sig);
    states.set(page, {
      abort: abort,
      io: io,
      mo: mo,
      entries: entries
    });
    scan();
  }
  function boot() {
    const page = document.querySelector('[data-barba="container"]') || document.body;
    init(page);
    if (window.barba) {
      barba.hooks.beforeLeave((d => destroy(d.current.container)));
      barba.hooks.afterOnce((d => init(d.next.container)));
      barba.hooks.afterEnter((d => init(d.next.container)));
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {
    once: true
  }); else boot();
})();

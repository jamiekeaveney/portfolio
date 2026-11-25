JKProject.register((s => {
  /* TUNE HERE — durations/delays in seconds unless labelled Ms; distances in rem or %. */
  const SETTINGS = {
    minimumWidth: 992,
    duration: 1,
    ease: "expo.out",
    expandedLabel: "View with details",
    compactLabel: "View full width"
  };
  const {page: page, root: root, rail: rail, details: details, first: first, toggle: toggle, abort: abort} = s;
  if (!first || innerWidth < SETTINGS.minimumWidth || matchMedia("(pointer:coarse)").matches) return;
  let flip, busy = false, unlock = () => {};
  const media = [ ...rail.querySelectorAll(".case_media") ];
  const label = () => s.expanded ? SETTINGS.expandedLabel : SETTINGS.compactLabel;
  s.cursorLabel = label;
  const change = () => {
    if (!s.ready || busy) return;
    busy = true;
    s.busy = true;
    flip?.kill();
    const expanding = !s.expanded;
    const savedY = scrollY;
    const smooth = JKProject.lenis(), wasStopped = smooth?.isStopped, lock = new AbortController;
    smooth?.stop();
    const block = e => e.preventDefault();
    window.addEventListener("wheel", block, {
      passive: false,
      capture: true,
      signal: lock.signal
    });
    window.addEventListener("touchmove", block, {
      passive: false,
      capture: true,
      signal: lock.signal
    });
    window.addEventListener("keydown", (e => {
      if ([ "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " " ].includes(e.key) && !e.target.closest("input,textarea,[contenteditable]")) e.preventDefault();
    }), {
      capture: true,
      signal: lock.signal
    });
    unlock = () => {
      lock.abort();
      if (!wasStopped) smooth?.start();
    };
    const keepScroll = () => {
      JKProject.lenis()?.scrollTo(savedY, {
        immediate: true,
        force: true
      });
      window.scrollTo(0, savedY);
    };
    // The details remain in their own grid column at their original width throughout.
        gsap.to(details, {
      autoAlpha: expanding ? 0 : 1,
      duration: SETTINGS.duration,
      ease: SETTINGS.ease,
      overwrite: "auto"
    });
    const state = Flip.getState(media);
    s.expanded = expanding;
    root.setAttribute("data-list-grid-view", expanding ? "grid" : "list");
    rail.classList.toggle("case_media_rail_expanded", expanding);
    keepScroll();
    details.style.pointerEvents = expanding ? "none" : "";
    if (toggle) {
      toggle.textContent = label();
      toggle.setAttribute("aria-expanded", String(expanding));
    }
    flip = Flip.from(state, {
      duration: SETTINGS.duration,
      ease: SETTINGS.ease,
      scale: true,
      nested: true,
      onComplete() {
        gsap.set(media, {
          clearProps: "transform,width,height,borderRadius"
        });
        JKProject.lenis()?.resize();
        ScrollTrigger.refresh();
        keepScroll();
        busy = false;
        s.busy = false;
        unlock();
      }
    });
  };
  s.toggleMedia = change;
  media.forEach((el => {
    el.setAttribute("data-cursor-marquee-text", "View full width");
    el.addEventListener("click", (e => {
      if (e.target.closest("a,button") || e.target.controls) return;
      change();
    }), {
      signal: abort.signal
    });
  }));
  if (toggle) {
    toggle.setAttribute("role", "button");
    toggle.textContent = label();
    toggle.addEventListener("click", (e => {
      e.preventDefault();
      change();
    }), {
      signal: abort.signal
    });
    toggle.addEventListener("keydown", (e => {
      if (e.key === " ") {
        e.preventDefault();
        change();
      }
    }), {
      signal: abort.signal
    });
  }
  s.cleanups.push((() => {
    flip?.kill();
    unlock();
    rail.classList.remove("case_media_rail_expanded");
    details.style.pointerEvents = "";
    gsap.set(details, {
      clearProps: "opacity,visibility"
    });
  }));
}));

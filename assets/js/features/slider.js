// -----------------------------------------
// SLIDER — Horizontal scroll with vertical toggle
// -----------------------------------------
// Vertical scroll → horizontal movement (1:1 feel)
// Infinite loop, drag, parallax, GSAP Flip toggle
// Works with Barba + Lenis
//
// Call: initSlider(container)
// HTML: .slider > .slide-track > .slide
// Toggle: [data-slider-toggle] button (optional)

const initSlider = (() => {
  const BP = 991;
  const mq = matchMedia(`(max-width:${BP}px)`);

  const CFG = {
    LERP:       0.1,
    DRAG_MULT:  2,
    DRAG_T:     3,
    CLICK_MS:   300,
    COPIES:     3,
    PARALLAX:   0.2,
  };

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const lerp  = (a, b, t) => a + (b - a) * t;
  const now   = () => performance.now();

  let instance = null;


  // ── Helpers ──

  function cssVarPercent(el, name) {
    const raw = getComputedStyle(el).getPropertyValue(name).trim();
    if (!raw) return NaN;
    const v = parseFloat(raw);
    if (Number.isNaN(v)) return NaN;
    return clamp(raw.endsWith("%") ? v / 100 : v, 0, 1);
  }

  function getPitch(track) {
    const slides = track.querySelectorAll(".slide[data-slide-original]");
    if (slides.length > 1) {
      const a = slides[0].getBoundingClientRect().left;
      const b = slides[1].getBoundingClientRect().left;
      if (b - a > 0) return b - a;
    }
    const el = slides[0];
    if (!el) return 0;
    const cs = getComputedStyle(el);
    return el.getBoundingClientRect().width + parseFloat(cs.marginLeft || 0) + parseFloat(cs.marginRight || 0);
  }

  function clearImgStyles(el) {
    if (!el) return;
    el.style.objectPosition = "";
    el.style.opacity = "";
    el.style.transition = "";
    el.style.filter = "";
  }


  // ── Destroy ──

  function destroy() {
    if (!instance) return;
    if (instance.raf) cancelAnimationFrame(instance.raf);
    instance.abort.abort();

    // Remove clones
    if (instance.track) {
      instance.track.querySelectorAll(".slide:not([data-slide-original])").forEach(el => el.remove());
      instance.origImgs.forEach(clearImgStyles);
      instance.track.style.transform = "";
      instance.track.style.willChange = "";
      instance.track.classList.remove("is-horizontal", "is-vertical");
      instance.slider.classList.remove("is-horizontal", "is-vertical");
    }

    instance = null;
  }


  // ── Horizontal scroll engine ──

  function startHorizontalLoop(s) {
    if (s.raf) cancelAnimationFrame(s.raf);

    // Show clones
    s.track.querySelectorAll(".slide:not([data-slide-original])").forEach(el => {
      el.style.display = "";
    });

    // Recalculate
    s.allSlides = [...s.track.querySelectorAll(".slide")];
    s.allImgs = s.allSlides.map(el =>
      el.querySelector(".slider-image") || el.querySelector(".slide-image img")
    );

    s.pitch = getPitch(s.track);
    const seq = s.pitch * s.total;
    const startX = -(seq * Math.floor((CFG.COPIES + 1) / 2));
    s.current = s.target = startX;
    s.track.style.transform = `translate3d(${startX}px,0,0)`;
    s.track.style.willChange = "transform";

    function tick() {
      if (s.mode !== "horizontal") return;

      s.current = lerp(s.current, s.target, CFG.LERP);
      if (Math.abs(s.target - s.current) < 0.5) s.current = s.target;

      const len = s.pitch * s.total;
      if (len > 0) {
        while (s.current > -len)              { s.current -= len; s.target -= len; s.allImgs.forEach(clearImgStyles); }
        while (s.current < -len * CFG.COPIES) { s.current += len; s.target += len; s.allImgs.forEach(clearImgStyles); }
      }

      s.track.style.transform = `translate3d(${s.current}px,0,0)`;

      // Parallax
      if (s.parallax) {
        const vp = innerWidth / 2;
        const half = s.parallax * 100 / 2;
        for (let i = 0; i < s.allSlides.length; i++) {
          const img = s.allImgs[i];
          if (!img) continue;
          const r = s.allSlides[i].getBoundingClientRect();
          if (r.right < -200 || r.left > innerWidth + 200) continue;
          const n = clamp(((r.left + r.width / 2) - vp) / Math.max(1, vp), -1, 1);
          img.style.objectPosition = `${50 - n * half}% 50%`;
        }
      }

      // Progress counter
      if (s.prog && s.total && s.pitch) {
        const seqLen = s.pitch * s.total;
        let t = (-s.current) % seqLen;
        if (t < 0) t += seqLen;
        const pct = (t / seqLen) * 100;
        s.ui += (pct - s.ui) * 0.15;
        const display = Math.round(clamp(s.ui, 0, 100)).toString().padStart(2, "0");
        if (s.prog.textContent !== display) s.prog.textContent = display;
      }

      s.raf = requestAnimationFrame(tick);
    }

    s.raf = requestAnimationFrame(tick);
  }

  function stopHorizontalLoop(s) {
    if (s.raf) {
      cancelAnimationFrame(s.raf);
      s.raf = null;
    }
    s.track.style.willChange = "";
  }


  // ── Mode toggle with GSAP Flip ──

  function setMode(s, newMode, animate) {
    if (s.mode === newMode) return;
    const oldMode = s.mode;
    s.mode = newMode;

    // Get flip state from originals only
    const originals = s.track.querySelectorAll(".slide[data-slide-original]");
    const flipState = animate && typeof Flip !== "undefined"
      ? Flip.getState(originals)
      : null;

    if (newMode === "vertical") {
      // Stop horizontal engine
      stopHorizontalLoop(s);

      // Hide clones
      s.track.querySelectorAll(".slide:not([data-slide-original])").forEach(el => {
        el.style.display = "none";
      });

      // Switch CSS classes
      s.track.classList.remove("is-horizontal");
      s.track.classList.add("is-vertical");
      s.slider.classList.remove("is-horizontal");
      s.slider.classList.add("is-vertical");
      s.track.style.transform = "";

      // Update toggle label
      if (s.toggleLabel) s.toggleLabel.textContent = "Carousel";

    } else {
      // Switch CSS classes
      s.track.classList.remove("is-vertical");
      s.track.classList.add("is-horizontal");
      s.slider.classList.remove("is-vertical");
      s.slider.classList.add("is-horizontal");

      // Start horizontal engine
      startHorizontalLoop(s);

      // Update toggle label
      if (s.toggleLabel) s.toggleLabel.textContent = "Grid";
    }

    // Animate with Flip
    if (flipState) {
      Flip.from(flipState, {
        duration: 0.8,
        ease: "power3.inOut",
        stagger: 0.03,
        absolute: true,
        onComplete: () => {
          if (newMode === "horizontal") {
            // Recalculate after flip settles
            s.pitch = getPitch(s.track);
          }
        }
      });
    }
  }


  // ── Create ──

  function create(container) {
    const root   = container || document;
    const slider = root.querySelector(".slider");
    const track  = root.querySelector(".slide-track");
    if (!slider || !track) return;

    destroy();

    const abort = new AbortController();
    const sig   = { signal: abort.signal };

    // Mark originals
    const originals = [...track.querySelectorAll(".slide")];
    originals.forEach(el => el.setAttribute("data-slide-original", ""));

    const s = {
      slider, track, abort,
      raf: null,
      total: originals.length,
      pitch: 0,
      parallax: CFG.PARALLAX,
      originals,
      origImgs: originals.map(el =>
        el.querySelector(".slider-image") || el.querySelector(".slide-image img")
      ),
      allSlides: [],
      allImgs: [],
      prog: root.querySelector("[data-slider-progress]"),
      mode: null,
      current: 0,
      target: 0,
      dragging: false,
      dragged: false,
      dragStartX: 0,
      dragStartY: 0,
      dragLastX: 0,
      clickUntil: 0,
      ui: 0,
      toggleLabel: null,
    };

    instance = s;

    if (!s.total) return;

    // Read parallax
    const p = cssVarPercent(slider, "--work-page--slider-parallax");
    if (!Number.isNaN(p)) s.parallax = p;

    // Clone slides for infinite loop (hidden initially if vertical)
    const frag = document.createDocumentFragment();
    for (let i = 0; i < CFG.COPIES; i++) {
      originals.forEach(el => {
        const clone = el.cloneNode(true);
        clone.removeAttribute("data-slide-original");
        frag.appendChild(clone);
      });
    }
    track.appendChild(frag);


    // ── Toggle button ──

    const toggleBtn = root.querySelector("[data-slider-toggle]");
    if (toggleBtn) {
      s.toggleLabel = toggleBtn.querySelector("[data-slider-toggle-label]") || toggleBtn;
      toggleBtn.addEventListener("click", () => {
        const next = s.mode === "horizontal" ? "vertical" : "horizontal";
        setMode(s, next, true);
      }, sig);
    }


    // ── Events (horizontal mode only, but always bound) ──

    // Wheel
    slider.addEventListener("wheel", e => {
      if (s.mode !== "horizontal") return;
      e.preventDefault();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      s.target -= delta;
    }, { passive: false, ...sig });

    // Click → navigate via Barba
    let programmaticClick = false;
    track.addEventListener("click", e => {
      if (programmaticClick) return;
      if (s.mode === "horizontal" && (s.dragged || now() < s.clickUntil)) {
        e.preventDefault();
        return;
      }
      // In vertical mode, let native clicks through
      if (s.mode === "vertical") return;

      const link = e.target.closest(".slide")?.querySelector("a[href]");
      if (!link) return;
      e.preventDefault();
      e.stopPropagation();
      programmaticClick = true;
      link.click();
      programmaticClick = false;
    }, sig);

    // Drag (horizontal only)
    slider.addEventListener("pointerdown", e => {
      if (s.mode !== "horizontal") return;
      if (e.pointerType === "mouse") e.preventDefault();
      s.dragging = true;
      s.dragged = false;
      s.dragStartX = s.dragLastX = e.clientX;
      s.dragStartY = e.clientY;
      track.classList.add("dragging");
    }, sig);

    slider.addEventListener("pointermove", e => {
      if (!s.dragging || s.mode !== "horizontal") return;
      const dx = e.clientX - s.dragLastX;
      s.target += dx * CFG.DRAG_MULT;
      s.dragLastX = e.clientX;
      if (Math.abs(e.clientX - s.dragStartX) > CFG.DRAG_T) s.dragged = true;
    }, sig);

    const pointerUp = () => {
      if (!s.dragging) return;
      s.dragging = false;
      track.classList.remove("dragging");
      if (s.dragged) s.clickUntil = now() + CFG.CLICK_MS;
      s.dragged = false;
    };

    slider.addEventListener("pointerup", pointerUp, sig);
    slider.addEventListener("pointercancel", pointerUp, sig);
    slider.addEventListener("pointerleave", pointerUp, sig);
    slider.addEventListener("dragstart", e => e.preventDefault(), sig);

    // Resize
    let resizeRaf;
    window.addEventListener("resize", () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        if (mq.matches && s.mode === "horizontal") {
          // Crossed to mobile — force vertical
          setMode(s, "vertical", false);
          return;
        }
        if (s.mode === "horizontal") {
          const oldSeq = s.pitch * s.total;
          const ratio  = oldSeq ? (s.current / oldSeq) : 0;
          s.pitch = getPitch(s.track);
          const newSeq = s.pitch * s.total;
          s.current = s.target = ratio * newSeq;
          s.track.style.transform = `translate3d(${s.current}px,0,0)`;
        }
      });
    }, sig);


    // ── Init mode ──

    if (mq.matches) {
      // Mobile: always vertical, no toggle
      s.mode = "vertical";
      track.querySelectorAll(".slide:not([data-slide-original])").forEach(el => {
        el.style.display = "none";
      });
      track.classList.add("is-vertical");
      slider.classList.add("is-vertical");
    } else {
      // Desktop/tablet: start horizontal
      track.classList.add("is-horizontal");
      slider.classList.add("is-horizontal");
      s.mode = "horizontal";
      startHorizontalLoop(s);
      if (s.toggleLabel) s.toggleLabel.textContent = "Grid";
    }
  }

  // Breakpoint cross — force vertical on mobile
  const onBreakpoint = () => {
    if (!instance) return;
    if (mq.matches && instance.mode === "horizontal") {
      setMode(instance, "vertical", false);
    }
  };
  if (mq.addEventListener) mq.addEventListener("change", onBreakpoint);
  else mq.addListener(onBreakpoint);

  return create;
})();
// -----------------------------------------
// HORIZONTAL SCROLL CAROUSEL
// -----------------------------------------
// Vertical scroll → horizontal movement (1:1 feel)
// Infinite loop, drag, parallax, works with Barba + Lenis
//
// Call: initSlider(container) from your function registry
// Requires: .slider, .slide-track, .slide elements

const initSlider = (() => {
  const BP = 991;
  const mq = matchMedia(`(max-width:${BP}px)`);

  const CFG = {
    LERP:       0.1,     // Higher = snappier, more 1:1 feel
    DRAG_MULT:  2,       // Pointer drag sensitivity
    DRAG_T:     3,       // Pixels before drag registers
    CLICK_MS:   300,     // Click suppression after drag
    COPIES:     3,       // Clone sets for infinite loop
    PARALLAX:   0.2,     // Default parallax amount (overridden by --work-page--slider-parallax)
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
    const slides = track.querySelectorAll(".slide");
    if (slides.length > 1) {
      const a = slides[0].getBoundingClientRect().left;
      const b = slides[1].getBoundingClientRect().left;
      if (b - a > 0) return b - a;
    }
    const el = slides[0];
    if (!el) return 0;
    const cs = getComputedStyle(el);
    return el.getBoundingClientRect().width + parseFloat(cs.marginLeft) + parseFloat(cs.marginRight);
  }

  function clearStyles(el) {
    if (!el) return;
    el.style.transform = "";
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

    if (instance.track) {
      [...instance.track.querySelectorAll(".slide")].forEach((el, i) => {
        if (i >= instance.total) el.remove();
      });
      instance.imgs.forEach(clearStyles);
      instance.track.style.transform = "";
      instance.track.style.willChange = "";
    }

    instance = null;
  }


  // ── Create ──

  function create(container) {
    if (mq.matches) return;

    const root   = container || document;
    const slider = root.querySelector(".slider");
    const track  = root.querySelector(".slide-track");
    if (!slider || !track) return;

    destroy();

    const abort = new AbortController();
    const sig   = { signal: abort.signal };

    const s = {
      slider, track, abort,
      raf: null,
      total: 0,
      pitch: 0,
      parallax: CFG.PARALLAX,
      slides: [],
      imgs: [],
      prog: null,

      // Position state
      current: 0,
      target:  0,

      // Drag state
      dragging: false,
      dragged:  false,
      dragStartX: 0,
      dragLastX:  0,
      clickUntil: 0,

      // Progress display
      ui: 0,
    };

    instance = s;
    track.style.willChange = "transform";

    // Read parallax from CSS variable
    const p = cssVarPercent(slider, "--work-page--slider-parallax");
    if (!Number.isNaN(p)) s.parallax = p;

    // Clone slides for infinite loop
    const originals = [...track.querySelectorAll(".slide")];
    s.total = originals.length;
    if (!s.total) return;

    const frag = document.createDocumentFragment();
    for (let i = 0; i < CFG.COPIES; i++) {
      originals.forEach(el => frag.appendChild(el.cloneNode(true)));
    }
    track.appendChild(frag);

    s.slides = [...track.querySelectorAll(".slide")];
    s.imgs   = s.slides.map(el =>
      el.querySelector(".slider-image") || el.querySelector(".slide-image img")
    );

    // Measure
    s.pitch = getPitch(track);
    const seq = s.pitch * s.total;

    // Start centred in the middle copy set
    const startX = -(seq * Math.floor((CFG.COPIES + 1) / 2));
    s.current = s.target = startX;
    track.style.transform = `translate3d(${startX}px,0,0)`;

    s.prog = root.querySelector("[data-slider-progress]");


    // ── Events ──

    // Wheel: 1:1 mapping — deltaY pixels of scroll = deltaY pixels horizontal
    slider.addEventListener("wheel", e => {
      e.preventDefault();
      // Use whichever axis has more movement (supports trackpad horizontal swipe too)
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      s.target -= delta;
    }, { passive: false, ...sig });

    // Click → navigate via Barba
    let programmaticClick = false;
    track.addEventListener("click", e => {
      if (programmaticClick) return;
      if (s.dragged || now() < s.clickUntil) { e.preventDefault(); return; }
      const link = e.target.closest(".slide")?.querySelector("a[href]");
      if (!link) return;
      e.preventDefault();
      e.stopPropagation();
      programmaticClick = true;
      link.click();
      programmaticClick = false;
    }, sig);

    // Pointer drag
    slider.addEventListener("pointerdown", e => {
      if (e.pointerType === "mouse") e.preventDefault();
      s.dragging = true;
      s.dragged = false;
      s.dragStartX = s.dragLastX = e.clientX;
      track.classList.add("dragging");
    }, sig);

    slider.addEventListener("pointermove", e => {
      if (!s.dragging) return;
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
      if (mq.matches) return;
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        const oldSeq = s.pitch * s.total;
        const ratio  = oldSeq ? (s.current / oldSeq) : 0;
        s.pitch = getPitch(track);
        const newSeq = s.pitch * s.total;
        s.current = s.target = ratio * newSeq;
        track.style.transform = `translate3d(${s.current}px,0,0)`;
      });
    }, sig);


    // ── Render loop ──

    function tick() {
      // Lerp toward target
      s.current = lerp(s.current, s.target, CFG.LERP);

      // Snap if close enough
      if (Math.abs(s.target - s.current) < 0.5) s.current = s.target;

      // Infinite wrap — keep both values in sync to avoid jump
      const len = s.pitch * s.total;
      if (len > 0) {
        while (s.current > -len)          { s.current -= len; s.target -= len; s.imgs.forEach(clearStyles); }
        while (s.current < -len * CFG.COPIES) { s.current += len; s.target += len; s.imgs.forEach(clearStyles); }
      }

      // Apply
      track.style.transform = `translate3d(${s.current}px,0,0)`;

      // Parallax
      if (s.parallax) {
        const vp   = innerWidth / 2;
        const half = s.parallax * 100 / 2;
        for (let i = 0; i < s.slides.length; i++) {
          const img = s.imgs[i];
          if (!img) continue;
          const r = s.slides[i].getBoundingClientRect();
          if (r.right < -200 || r.left > innerWidth + 200) continue;
          const n = clamp(((r.left + r.width / 2) - vp) / Math.max(1, vp), -1, 1);
          img.style.objectPosition = `${50 - n * half}% 50%`;
        }
      }

      // Progress counter
      if (s.prog && !mq.matches && s.total && s.pitch) {
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

  // Reload on breakpoint cross
  if (mq.addEventListener) mq.addEventListener("change", () => location.reload());
  else mq.addListener(() => location.reload());

  return create;
})();
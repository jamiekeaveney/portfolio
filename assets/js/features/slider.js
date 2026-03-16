// -----------------------------------------
// SLIDER
// -----------------------------------------

const initSlider = (() => {
  const BP = 991;
  const mq = matchMedia(`(max-width:${BP}px)`);
  const CFG = { SPEED: 1.75, LERP: 0.05, MAX_V: 150, COPIES: 6, DRAG_T: 3, CLICK_MS: 400 };

  const clamp = (n, a, b) => (n < a ? a : n > b ? b : n);
  const now = () => performance.now();

  let instance = null; // only one slider at a time

  function cssVarPercent(root, name) {
    const raw = getComputedStyle(root).getPropertyValue(name).trim();
    if (!raw) return NaN;
    const v = parseFloat(raw);
    if (Number.isNaN(v)) return NaN;
    return clamp(raw.endsWith("%") ? v / 100 : v, 0, 1);
  }

  function getPitch(track) {
    const slides = track.querySelectorAll(".slide");
    if (slides.length > 1) {
      const a = slides[0].getBoundingClientRect();
      const b = slides[1].getBoundingClientRect();
      const p = b.left - a.left;
      if (p > 0) return p;
    }
    const el = slides[0];
    if (!el) return 0;
    const cs = getComputedStyle(el);
    return el.getBoundingClientRect().width + parseFloat(cs.marginLeft) + parseFloat(cs.marginRight);
  }

  function clearImg(el) {
    if (!el) return;
    el.style.transform = "";
    el.style.objectPosition = "";
    el.style.opacity = "";
    el.style.transition = "";
    el.style.filter = "";
  }

  function destroy() {
    if (!instance) return;

    // Stop animation loop
    if (instance.raf) cancelAnimationFrame(instance.raf);

    // Remove event listeners via AbortController
    instance.abort.abort();

    // Remove cloned slides
    if (instance.track) {
      const originals = [...instance.track.querySelectorAll(".slide")].slice(0, instance.total);
      [...instance.track.querySelectorAll(".slide")].forEach((el, i) => {
        if (i >= instance.total) el.remove();
      });
      instance.imgs.forEach(clearImg);
      instance.track.style.transform = "";
      instance.track.style.willChange = "";
    }

    instance = null;
  }

  function create(container) {
    if (mq.matches) return; // desktop only

    const root = container || document;
    const slider = root.querySelector(".slider");
    const track = root.querySelector(".slide-track");
    if (!slider || !track) return;

    // Clean up any previous instance
    destroy();

    const abort = new AbortController();
    const sig = { signal: abort.signal };

    const s = {
      slider,
      track,
      abort,
      raf: null,
      total: 0,
      pitch: 0,
      parallax: 0.2,
      slides: [],
      imgs: [],
      prog: null,
      x: 0,
      tx: 0,
      ui: 0,
      drag: false,
      dragged: false,
      start: 0,
      last: 0,
      clickUntil: 0,
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
    for (let i = 0; i < CFG.COPIES - 1; i++) {
      originals.forEach(el => frag.appendChild(el.cloneNode(true)));
    }
    track.appendChild(frag);

    s.slides = [...track.querySelectorAll(".slide")];
    s.imgs = s.slides.map(el => el.querySelector(".slider-image") || el.querySelector(".slide-image img"));

    s.pitch = getPitch(track);
    const seq = s.pitch * s.total;
    const start = -(seq * 2);
    s.x = s.tx = start;
    track.style.transform = `translate3d(${start}px,0,0)`;

    s.prog = root.querySelector("[data-slider-progress]");
    s.ui = 0;

    // --- Events ---

    // Click → navigate via Barba (avoids full page reload)
    track.addEventListener("click", e => {
      if (s.dragged || now() < s.clickUntil) { e.preventDefault(); return; }
      const slide = e.target.closest(".slide");
      const link = slide?.querySelector("a[href]");
      if (!link) return;

      e.preventDefault();
      e.stopPropagation();

      if (typeof barba === "undefined") { location.href = link.href; return; }

      // Pass the [data-case-link] element as trigger so the work-to-case
      // transition's custom check and FLIP logic can find it
      const caseLink = slide?.closest("[data-case-link]") || slide;
      barba.go(link.href, caseLink);
    }, sig);

    // Wheel → horizontal scroll
    slider.addEventListener("wheel", e => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      s.tx -= clamp(e.deltaY * CFG.SPEED, -CFG.MAX_V, CFG.MAX_V);
    }, { passive: false, ...sig });

    // Drag
    slider.addEventListener("pointerdown", e => {
      if (e.pointerType === "mouse") e.preventDefault();
      s.drag = true;
      s.start = s.last = e.clientX;
      s.dragged = false;
      track.classList.add("dragging");
    }, sig);

    slider.addEventListener("pointermove", e => {
      if (!s.drag) return;
      s.tx += (e.clientX - s.last) * 2;
      s.last = e.clientX;
      s.dragged = Math.abs(e.clientX - s.start) > CFG.DRAG_T;
    }, sig);

    const pointerUp = () => {
      if (!s.drag) return;
      s.drag = false;
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
        const t = (s.x + oldSeq * 2) / oldSeq;
        s.pitch = getPitch(track);
        const newSeq = s.pitch * s.total;
        s.x = s.tx = -(newSeq * 2) + t * newSeq;
        track.style.transform = `translate3d(${s.x}px,0,0)`;
      });
    }, sig);

    // --- Animation loop ---

    function loop() {
      s.x += (s.tx - s.x) * CFG.LERP;

      const len = s.pitch * s.total;

      if (s.x > -len) { s.x -= len; s.tx -= len; s.imgs.forEach(clearImg); }
      else if (s.x < -len * 4) { s.x += len; s.tx += len; s.imgs.forEach(clearImg); }

      track.style.transform = `translate3d(${s.x}px,0,0)`;

      // Parallax on images
      if (s.parallax) {
        const vp = innerWidth / 2;
        const half = s.parallax * 100 / 2;
        for (let i = 0; i < s.slides.length; i++) {
          const img = s.imgs[i];
          if (!img) continue;
          const r = s.slides[i].getBoundingClientRect();
          if (r.right < -500 || r.left > innerWidth + 500) continue;
          const n = clamp(((r.left + r.width / 2) - vp) / Math.max(1, vp), -1, 1);
          img.style.objectPosition = (50 - n * half) + "% 50%";
        }
      }

      // Progress counter
      if (s.prog && !mq.matches && s.total && s.pitch) {
        const len2 = s.pitch * s.total;
        let t = (-s.x) % len2;
        if (t < 0) t += len2;
        const pct = (t / len2) * 100;
        s.ui += (pct - s.ui) * 0.2;
        const display = Math.round(clamp(s.ui, 0, 100)).toString().padStart(2, "0");
        if (s.prog.textContent !== display) s.prog.textContent = display;
      }

      s.raf = requestAnimationFrame(loop);
    }

    s.raf = requestAnimationFrame(loop);
  }

  // Reload on breakpoint cross (preserves original behaviour)
  if (mq.addEventListener) mq.addEventListener("change", () => location.reload());
  else mq.addListener(() => location.reload());

  // Public API: call initSlider(container) from the function registry
  return create;
})();
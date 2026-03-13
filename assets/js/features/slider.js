function createSliderInstance(root, track, container) {
  const BP = 991;
  const mq = window.matchMedia(`(max-width:${BP}px)`);
  const cfg = {
    SPEED: 1.75,
    LERP: 0.05,
    MAX_V: 150,
    COPIES: 6,
    DRAG_T: 3,
    CLICK_MS: 400
  };

  const s = {
    root,
    track,
    container,
    ui: 0,
    parallax: 0.2,
    drag: false,
    dragged: false,
    clickUntil: 0,
    start: 0,
    last: 0,
    x: 0,
    tx: 0,
    total: 0,
    pitch: 0,
    slides: [],
    imgs: [],
    prog: null,
    rafId: 0,
    resizeRaf: 0,
    originals: [],
    listeners: [],
    built: false
  };

  const clamp = (n, a, b) => (n < a ? a : n > b ? b : n);
  const now = () => performance.now();
  const seq = () => s.pitch * s.total;

  function addListener(el, event, handler, options) {
    el.addEventListener(event, handler, options);
    s.listeners.push({ el, event, handler, options });
  }

  function cssVarPercent(el, name) {
    const raw = getComputedStyle(el).getPropertyValue(name).trim();
    if (!raw) return NaN;

    if (raw.endsWith("%")) {
      const v = parseFloat(raw);
      return Number.isNaN(v) ? NaN : clamp(v / 100, 0, 1);
    }

    const v = parseFloat(raw);
    return Number.isNaN(v) ? NaN : clamp(v, 0, 1);
  }

  function measurePitch() {
    const els = s.track.querySelectorAll(".slide");

    if (els.length > 1) {
      const a = els[0].getBoundingClientRect();
      const b = els[1].getBoundingClientRect();
      const p = b.left - a.left;
      if (p > 0) return p;
    }

    const e = els[0];
    if (!e) return 0;

    const c = getComputedStyle(e);
    return (
      e.getBoundingClientRect().width +
      parseFloat(c.marginLeft) +
      parseFloat(c.marginRight)
    );
  }

  function clear(el) {
    if (!el) return;
    el.style.transform = "";
    el.style.objectPosition = "";
    el.style.opacity = "";
    el.style.transition = "";
    el.style.filter = "";
  }

  function isInteractive(target) {
    return (
      target instanceof Element &&
      !!target.closest(
        'a[href], button, input, textarea, select, label, summary, [role="button"], [data-slider-no-drag]'
      )
    );
  }

  function loop() {
    s.x += (s.tx - s.x) * cfg.LERP;

    const len = seq();
    if (!len) {
      s.rafId = requestAnimationFrame(loop);
      return;
    }

    if (s.x > -len) {
      s.x -= len;
      s.tx -= len;
      s.imgs.forEach(clear);
    } else if (s.x < -len * 4) {
      s.x += len;
      s.tx += len;
      s.imgs.forEach(clear);
    }

    s.track.style.transform = `translate3d(${s.x}px,0,0)`;

    if (s.parallax) {
      const vp = window.innerWidth / 2;
      const half = (s.parallax * 100) / 2;

      for (let i = 0; i < s.slides.length; i++) {
        const img = s.imgs[i];
        if (!img) continue;

        const r = s.slides[i].getBoundingClientRect();
        if (r.right < -500 || r.left > window.innerWidth + 500) continue;

        const n = clamp(((r.left + r.width / 2) - vp) / Math.max(1, vp), -1, 1);
        img.style.objectPosition = `${50 - n * half}% 50%`;
      }
    }

    if (s.prog && !mq.matches && s.total && s.pitch) {
      let t = (-s.x) % len;
      if (t < 0) t += len;

      const pct = (t / len) * 100;
      s.ui += (pct - s.ui) * 0.2;

      const n = Math.round(clamp(s.ui, 0, 100))
        .toString()
        .padStart(2, "0");

      if (s.prog.textContent !== n) s.prog.textContent = n;
    }

    s.rafId = requestAnimationFrame(loop);
  }

  function onWheel(e) {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    s.tx -= clamp(e.deltaY * cfg.SPEED, -cfg.MAX_V, cfg.MAX_V);
  }

  function onPointerDown(e) {
    if (e.button !== 0) return;
    if (isInteractive(e.target)) return;

    s.drag = true;
    s.start = s.last = e.clientX;
    s.dragged = false;
    s.track.classList.add("dragging");
  }

  function onPointerMove(e) {
    if (!s.drag) return;

    s.tx += (e.clientX - s.last) * 2;
    s.last = e.clientX;
    s.dragged = Math.abs(e.clientX - s.start) > cfg.DRAG_T;
  }

  function endDrag() {
    if (!s.drag) return;

    s.drag = false;
    s.track.classList.remove("dragging");

    if (s.dragged) {
      s.clickUntil = now() + cfg.CLICK_MS;
    }

    s.dragged = false;
  }

  function onClickCapture(e) {
    if (now() < s.clickUntil) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
    }
  }

  function onDragStart(e) {
    e.preventDefault();
  }

  function onResize() {
    if (mq.matches) return;

    cancelAnimationFrame(s.resizeRaf);
    s.resizeRaf = requestAnimationFrame(() => {
      const old = seq();
      if (!old) return;

      const t = (s.x + old * 2) / old;
      s.pitch = measurePitch();

      const nseq = seq();
      s.x = s.tx = -(nseq * 2) + t * nseq;
      s.track.style.transform = `translate3d(${s.x}px,0,0)`;
    });
  }

  function onBreakpointChange() {
    window.location.reload();
  }

  function init() {
    if (s.built) return;
    if (!s.root || !s.track) return;

    s.originals = [...s.track.querySelectorAll(".slide")];
    s.total = s.originals.length;
    if (!s.total) return;

    s.track.style.willChange = "transform";

    const p = cssVarPercent(s.root, "--work-page--slider-parallax");
    if (!Number.isNaN(p)) s.parallax = p;

    const frag = document.createDocumentFragment();
    for (let i = 0; i < cfg.COPIES - 1; i++) {
      s.originals.forEach((el) => frag.appendChild(el.cloneNode(true)));
    }
    s.track.appendChild(frag);

    s.slides = [...s.track.querySelectorAll(".slide")];
    s.imgs = s.slides.map(
      (el) => el.querySelector(".slider-image") || el.querySelector(".slide-image img")
    );

    s.pitch = measurePitch();

    const start = -(seq() * 2);
    s.x = s.tx = start;
    s.track.style.transform = `translate3d(${start}px,0,0)`;

    s.prog =
      s.container?.querySelector("[data-slider-progress]") ||
      document.querySelector("[data-slider-progress]");

    s.ui = 0;
    s.built = true;
    s.root.setAttribute("data-slider-ran", "");

    addListener(s.root, "wheel", onWheel, { passive: false });
    addListener(s.root, "pointerdown", onPointerDown);
    addListener(s.root, "pointermove", onPointerMove);
    addListener(s.root, "pointerup", endDrag);
    addListener(s.root, "pointercancel", endDrag);
    addListener(s.root, "pointerleave", endDrag);
    addListener(s.root, "dragstart", onDragStart);

    // Capture phase so dragged clicks are cancelled before Barba sees them.
    addListener(s.root, "click", onClickCapture, true);

    addListener(window, "resize", onResize);

    if (mq.addEventListener) {
      mq.addEventListener("change", onBreakpointChange);
      s.listeners.push({
        el: mq,
        event: "change",
        handler: onBreakpointChange,
        isMQ: true
      });
    } else {
      mq.addListener(onBreakpointChange);
      s.listeners.push({
        el: mq,
        handler: onBreakpointChange,
        isMQ: true,
        legacyMQ: true
      });
    }

    loop();
  }

  function destroy() {
    cancelAnimationFrame(s.rafId);
    cancelAnimationFrame(s.resizeRaf);

    s.listeners.forEach(({ el, event, handler, options, isMQ, legacyMQ }) => {
      if (isMQ) {
        if (legacyMQ) {
          el.removeListener(handler);
        } else {
          el.removeEventListener(event, handler);
        }
        return;
      }

      el.removeEventListener(event, handler, options);
    });

    s.listeners.length = 0;

    s.track.classList.remove("dragging");
    s.track.style.transform = "";
    s.track.style.willChange = "";

    s.imgs.forEach(clear);

    if (s.originals.length) {
      const currentSlides = [...s.track.querySelectorAll(".slide")];
      currentSlides.slice(s.originals.length).forEach((el) => el.remove());
    }

    s.root.removeAttribute("data-slider-ran");
    s.built = false;
  }

  return { init, destroy };
}
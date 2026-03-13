// -----------------------------------------
// SLIDER (fixed for Barba FLIP transitions)
// -----------------------------------------

const sliderInstances = new Map();

function initSlider(container = nextPage || document) {
  if (!container) return;
  if (window.matchMedia("(max-width: 991px)").matches) return;

  const roots = container.querySelectorAll(".slider");
  if (!roots.length) return;

  roots.forEach((root) => {
    if (sliderInstances.has(root)) return;

    const track = root.querySelector(".slide-track");
    if (!track) return;

    const instance = createSliderInstance(root, track, container);
    instance.init();
    sliderInstances.set(root, instance);
  });
}

function destroySlider(container = document) {
  if (!container) return;

  [...sliderInstances.entries()].forEach(([root, instance]) => {
    if (!container.contains(root)) return;

    instance.destroy();
    sliderInstances.delete(root);
  });
}

function createSliderInstance(root, track, container) {
  const BP = 991;
  const mq = window.matchMedia(`(max-width:${BP}px)`);
  const cfg = {
    SPEED: 1.75,
    LERP: 0.05,
    MAX_V: 150,
    COPIES: 6,
    DRAG_T: 6,        // raised from 3 → 6 so micro-tremors during a normal click aren't treated as drags
    CLICK_GUARD: "sl-drag-click"  // CSS class used as a one-shot flag
  };

  const s = {
    root,
    track,
    ui: 0,
    parallax: 0.2,
    drag: false,
    dragged: false,
    wasDrag: false,       // one-shot flag consumed by the next click event
    start: 0,
    last: 0,
    x: 0,
    tx: 0,
    total: 0,
    pitch: 0,
    slides: [],
    imgs: [],
    prog: null,
    rafId: null,
    resizeRaf: null,
    originals: [],
    listeners: []
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
    const slides = s.track.querySelectorAll(".slide");

    if (slides.length > 1) {
      const a = slides[0].getBoundingClientRect();
      const b = slides[1].getBoundingClientRect();
      const p = b.left - a.left;
      if (p > 0) return p;
    }

    const first = slides[0];
    if (!first) return 0;

    const styles = getComputedStyle(first);
    return (
      first.getBoundingClientRect().width +
      parseFloat(styles.marginLeft) +
      parseFloat(styles.marginRight)
    );
  }

  function clearImageStyles(el) {
    if (!el) return;
    el.style.transform = "";
    el.style.objectPosition = "";
    el.style.opacity = "";
    el.style.transition = "";
    el.style.filter = "";
  }

  function loop() {
    s.x += (s.tx - s.x) * cfg.LERP;

    const len = seq();

    if (len > 0) {
      if (s.x > -len) {
        s.x -= len;
        s.tx -= len;
        s.imgs.forEach(clearImageStyles);
      } else if (s.x < -len * 4) {
        s.x += len;
        s.tx += len;
        s.imgs.forEach(clearImageStyles);
      }
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

  // -------------------------------------------------------
  // Pointer / click handling — reworked for Barba compat
  // -------------------------------------------------------

  function onPointerDown(e) {
    // Only prevent default for mouse AND only when the target is NOT inside
    // a navigable link. This keeps drag-to-scroll working while letting
    // Barba pick up genuine link clicks without interference.
    if (e.pointerType === "mouse" && !e.target.closest("a, [data-case-link]")) {
      e.preventDefault();
    }

    s.drag = true;
    s.start = s.last = e.clientX;
    s.dragged = false;
    s.track.classList.add("dragging");
  }

  function onPointerMove(e) {
    if (!s.drag) return;
    s.tx += (e.clientX - s.last) * 2;
    s.last = e.clientX;

    if (!s.dragged && Math.abs(e.clientX - s.start) > cfg.DRAG_T) {
      s.dragged = true;
    }
  }

  function onPointerUp() {
    if (!s.drag) return;
    s.drag = false;
    s.track.classList.remove("dragging");

    // If this pointer sequence was a drag, arm the one-shot flag
    // so the upcoming click event gets killed.
    if (s.dragged) {
      s.wasDrag = true;
    }

    s.dragged = false;
  }

  function onClick(e) {
    // If the previous pointer sequence was a drag, block this click
    // completely — preventDefault AND stopImmediatePropagation so
    // Barba never sees it (Barba skips clicks where defaultPrevented
    // is already true, but stopImmediate is the belt-and-suspenders
    // guarantee that no other listener on this element fires).
    if (s.wasDrag) {
      s.wasDrag = false;           // consume the flag
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }

    // Not a drag → genuine click. Do nothing — let the event bubble
    // up naturally so Barba can intercept it for page transitions.
  }

  function onDragStart(e) {
    e.preventDefault();
  }

  function onResize() {
    if (mq.matches) return;

    cancelAnimationFrame(s.resizeRaf);
    s.resizeRaf = requestAnimationFrame(() => {
      const oldSeq = seq();
      if (!oldSeq) return;

      const t = (s.x + oldSeq * 2) / oldSeq;
      s.pitch = measurePitch();

      const newSeq = seq();
      s.x = s.tx = -(newSeq * 2) + t * newSeq;
      s.track.style.transform = `translate3d(${s.x}px,0,0)`;
    });
  }

  function onBreakpointChange() {
    window.location.reload();
  }

  function init() {
    if (s.root.hasAttribute("data-slider-ran")) return;
    s.root.setAttribute("data-slider-ran", "");

    s.track.style.willChange = "transform";

    const p = cssVarPercent(s.root, "--work-page--slider-parallax");
    if (!Number.isNaN(p)) s.parallax = p;

    s.originals = [...s.track.querySelectorAll(".slide")];
    s.total = s.originals.length;

    if (!s.total) return;

    const frag = document.createDocumentFragment();
    for (let i = 0; i < cfg.COPIES - 1; i++) {
      s.originals.forEach((el) => frag.appendChild(el.cloneNode(true)));
    }
    s.track.appendChild(frag);

    s.slides = [...s.track.querySelectorAll(".slide")];
    s.imgs = s.slides.map((el) => el.querySelector(".slider-image") || el.querySelector(".slide-image img"));

    s.pitch = measurePitch();

    const start = -(seq() * 2);
    s.x = s.tx = start;
    s.track.style.transform = `translate3d(${start}px,0,0)`;

    s.prog = container.querySelector("[data-slider-progress]");
    s.ui = 0;

    addListener(s.root, "wheel", onWheel, { passive: false });
    addListener(s.root, "pointerdown", onPointerDown);
    addListener(s.root, "pointermove", onPointerMove);
    addListener(s.root, "pointerup", onPointerUp);
    addListener(s.root, "pointercancel", onPointerUp);
    addListener(s.root, "pointerleave", onPointerUp);
    addListener(s.root, "dragstart", onDragStart);

    // The click listener MUST use capture: true so it fires BEFORE Barba's
    // delegated click handler. When it's a drag-click we kill it here;
    // when it's a genuine click we let it through untouched.
    addListener(s.track, "click", onClick, true);

    addListener(window, "resize", onResize);

    if (mq.addEventListener) {
      mq.addEventListener("change", onBreakpointChange);
      s.listeners.push({ el: mq, event: "change", handler: onBreakpointChange, isMQ: true });
    } else {
      mq.addListener(onBreakpointChange);
      s.listeners.push({ el: mq, handler: onBreakpointChange, isMQ: true, legacyMQ: true });
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

    s.imgs.forEach(clearImageStyles);

    const originalCount = s.originals.length;
    const currentSlides = [...s.track.querySelectorAll(".slide")];
    currentSlides.slice(originalCount).forEach((el) => el.remove());

    s.root.removeAttribute("data-slider-ran");
  }

  return { init, destroy };
}
JKProject.register((s => {
  /* TUNE HERE — durations/delays in seconds unless labelled Ms; distances in rem or %. */
  const SETTINGS = {
    followDuration: parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--motion-cursor-duration")) || .35,
    ease: "expo.out",
    pointerSmoothing: 6,
    label: "View full width"
  };
  const {page: page, abort: abort, cleanups: cleanups} = s;
  if (!matchMedia("(pointer:fine)").matches || JKProject.reduced()) return;
  const cursor = document.createElement("div");
  cursor.className = "case-cursor";
  cursor.setAttribute("aria-hidden", "true");
  document.body.append(cursor);
  // These are runtime animation coordinates; the visual styles live in Designer.
    gsap.set(cursor, {
    position: "fixed",
    left: 0,
    top: 0,
    pointerEvents: "none"
  });
  const text = document.createElement("span");
  text.dataset.cursorMarqueeTextTarget = "";
  cursor.append(text);
  const x = gsap.quickTo(cursor, "x", {
    duration: SETTINGS.followDuration,
    ease: SETTINGS.ease
  }), y = gsap.quickTo(cursor, "y", {
    duration: SETTINGS.followDuration,
    ease: SETTINGS.ease
  });
  const first = null, media = [ ...s.rail.querySelectorAll(".case_media") ];
  let pointer = JKProject.pointer || {
    x: innerWidth / 2,
    y: innerHeight / 2,
    known: false
  }, offset = 0, smoothedX = JKProject.pointerX ?? pointer.x, oldTime = 0;
  const nativeCursors = new Map(media.map((el => [ el, el.style.cursor ])));
  const move = e => {
    if (JKProject.transitioning) return;
    pointer = JKProject.pointer = {
      x: e.clientX,
      y: e.clientY,
      known: true
    };
  };
  window.addEventListener("pointermove", move, {
    passive: true,
    signal: abort.signal
  });
  window.addEventListener("pointerout", (e => {
    if (!e.relatedTarget) pointer = JKProject.pointer = {
      ...pointer,
      known: false
    };
  }), {
    signal: abort.signal
  });
  function tick(time) {
    const dt = Math.min(.05, oldTime ? time - oldTime : .016);
    oldTime = time;
    smoothedX += (pointer.x - smoothedX) * (1 - Math.exp(-dt * SETTINGS.pointerSmoothing));
    JKProject.pointerX = smoothedX;
    pointer = JKProject.pointer || pointer;
    const hit = pointer.known ? document.elementFromPoint(pointer.x, pointer.y)?.closest(".case_media") : null;
    const show = !!hit && s.rail.contains(hit) && s.ready && !!s.toggleMedia && !JKProject.transitioning && !document.querySelector('[data-mini-showreel-status="active"][data-mini-showreel-player]') && !document.documentElement.hasAttribute("data-transitioning");
    text.textContent = s.cursorLabel?.() || SETTINGS.label;
    x(pointer.x + 18);
    y(pointer.y + 22);
    gsap.set(cursor, {
      autoAlpha: show ? 1 : 0
    });
    media.forEach((el => el.style.cursor = show && el === hit ? "pointer" : ""));
    s.updateFooterPointer?.(pointer);
  }
  tick(0);
  gsap.ticker.add(tick);
  cleanups.push((() => {
    gsap.ticker.remove(tick);
    cursor.remove();
    x.tween.kill();
    y.tween.kill();
    if (first) first.style.translate = "";
    nativeCursors.forEach(((v, e) => e.style.cursor = v));
  }));
}));

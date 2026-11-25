/* Pointer movement owns the easing; hit testing only runs after something changes. */
(() => {
  function boot() {
    if (window.JKCloseCursor || !window.gsap) return;
    window.JKCloseCursor = true;
    const root = document.documentElement;
    const label = document.createElement("div");
    label.className = "jk_close_cursor";
    label.setAttribute("aria-hidden", "true");
    document.body.append(label);
    const duration = parseFloat(getComputedStyle(root).getPropertyValue("--motion-cursor-duration")) || .35;
    const x = gsap.quickTo(label, "x", {duration, ease: "expo.out"});
    const y = gsap.quickTo(label, "y", {duration, ease: "expo.out"});
    const desktop = matchMedia("(min-width:62rem) and (hover:hover) and (pointer:fine)");
    const reduced = matchMedia("(prefers-reduced-motion:reduce)");
    let pointer = window.JKProject?.pointer || {x: 0, y: 0, known: false};
    let players = [], frame = 0, suspended = false, touchInput = false, over = null, nativeCursor = "";
    let lastX, lastY, lastReduced;

    function setPointer(value) {
      pointer = value;
      if (window.JKProject) window.JKProject.pointer = pointer;
    }
    function setData(name, value) {
      if (label.dataset[name] !== value) label.dataset[name] = value;
    }
    function opacity(value) {
      if (label.style.opacity !== value) label.style.opacity = value;
    }
    function restoreCursor() {
      if (over) over.style.cursor = nativeCursor;
      over = null;
    }
    function hide() {
      opacity("0");
      x.tween.pause();
      y.tween.pause();
      lastX = lastY = undefined;
      restoreCursor();
    }
    function forgetPointer() {
      setPointer({...pointer, known: false});
      setData("pointerKnown", "false");
      lastX = lastY = undefined;
      hide();
    }
    function activePlayer() {
      return players.find(entry => entry.root.isConnected && entry.root.dataset.miniShowreelStatus === "active");
    }
    function targetAt(entry = activePlayer()) {
      if (!desktop.matches || !pointer.known || !entry?.player || entry.root.dataset.lightboxPhase !== "open") return null;
      const r = entry.player.getBoundingClientRect(), v = entry.video;
      const aspect = v?.videoWidth && v.videoHeight ? v.videoWidth / v.videoHeight : 16 / 9;
      const w = Math.min(r.width, r.height * aspect), h = w / aspect;
      const left = r.left + (r.width - w) / 2, top = r.top + (r.height - h) / 2;
      return pointer.x < left || pointer.x > left + w || pointer.y < top || pointer.y > top + h ? entry.close : null;
    }
    function update() {
      frame = 0;
      if (suspended || document.hidden) return;
      pointer = window.JKProject?.pointer || pointer;
      const active = activePlayer();
      const moving = players.some(entry => entry.root.isConnected && ["opening", "closing"].includes(entry.root.dataset.lightboxPhase));
      const blocked = !desktop.matches || moving || root.hasAttribute("data-transitioning") || root.hasAttribute("data-loader-active");
      const close = !blocked ? targetAt(active) : null;
      const hit = !blocked && !active && pointer.known ? document.elementFromPoint(pointer.x, pointer.y) : null;
      const trigger = hit?.closest(".case_featured [data-mini-showreel-open]");
      const text = active ? "Back" : "View full screen";
      if (label.textContent !== text) label.textContent = text;
      setData("cursorKind", active ? "back" : "project");
      setData("pointerKnown", String(pointer.known));
      opacity(!blocked && (trigger || close) ? "1" : "0");

      if (over !== (active?.root || null)) {
        restoreCursor();
        over = active?.root || null;
        nativeCursor = over?.style.cursor || "";
      }
      if (over) {
        const cursor = !blocked && close ? "pointer" : nativeCursor;
        if (over.style.cursor !== cursor) over.style.cursor = cursor;
      }
      if (!blocked && pointer.known && (lastX !== pointer.x || lastY !== pointer.y || lastReduced !== reduced.matches)) {
        lastX = pointer.x; lastY = pointer.y; lastReduced = reduced.matches;
        if (reduced.matches) {
          x.tween.pause(); y.tween.pause();
          gsap.set(label, {x: pointer.x + 18, y: pointer.y + 22});
        } else {
          x(pointer.x + 18); y(pointer.y + 22);
        }
      }
    }
    function schedule() {
      if (!frame && !suspended && !document.hidden && desktop.matches) frame = requestAnimationFrame(update);
    }
    const stateObserver = new MutationObserver(schedule);
    const sizeObserver = new ResizeObserver(schedule);
    const shellObserver = new MutationObserver(schedule);
    function observeShell() {
      shellObserver.observe(root, {attributes: true, attributeFilter: ["data-transitioning", "data-loader-active"]});
    }
    function mount(page = document.querySelector('[data-barba="container"]') || document) {
      stateObserver.disconnect();
      sizeObserver.disconnect();
      players = [...page.querySelectorAll("[data-mini-showreel-player]")].map(playerRoot => {
        const player = playerRoot.querySelector("[data-bunny-player-init]");
        stateObserver.observe(playerRoot, {attributes: true, attributeFilter: ["data-mini-showreel-status", "data-lightbox-phase"]});
        sizeObserver.observe(playerRoot);
        if (player) sizeObserver.observe(player);
        return {root: playerRoot, player, video: player?.querySelector("video"), close: playerRoot.querySelector("[data-mini-showreel-close]")};
      });
      suspended = false;
      schedule();
    }
    function suspend() {
      suspended = true;
      cancelAnimationFrame(frame); frame = 0;
      stateObserver.disconnect(); sizeObserver.disconnect();
      players = [];
      hide();
    }
    document.addEventListener("pointermove", event => {
      touchInput = event.pointerType === "touch";
      if (touchInput) { forgetPointer(); return; }
      setPointer({x: event.clientX, y: event.clientY, known: true});
      schedule();
    }, {passive: true});
    document.addEventListener("pointerdown", event => {
      touchInput = event.pointerType === "touch";
      if (touchInput) forgetPointer();
    }, {passive: true});
    document.addEventListener("pointerout", event => {
      if (!event.relatedTarget) forgetPointer();
    }, {passive: true});
    document.addEventListener("keydown", forgetPointer, true);
    document.addEventListener("focusin", schedule);
    document.addEventListener("loadedmetadata", schedule, true);
    window.addEventListener("scroll", schedule, {passive: true, capture: true});
    window.addEventListener("resize", schedule, {passive: true});
    window.addEventListener("blur", forgetPointer);
    desktop.addEventListener("change", () => { if (!desktop.matches) forgetPointer(); schedule(); });
    reduced.addEventListener("change", schedule);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(frame); frame = 0;
        forgetPointer();
      } else schedule();
    });
    document.addEventListener("click", event => {
      if (event.isTrusted && event.detail > 0 && !touchInput && event.pointerType !== "touch") {
        setPointer({x: event.clientX, y: event.clientY, known: true});
      }
      const button = !suspended && !root.hasAttribute("data-transitioning") ? targetAt() : null;
      if (button && !event.target.closest("[data-mini-showreel-close],button,input,[data-player-control],.player_controls_bottom")) {
        event.preventDefault(); event.stopImmediatePropagation();
        hide(); button.click();
      }
      schedule();
    }, true);
    window.addEventListener("pagehide", () => { suspend(); shellObserver.disconnect(); });
    window.addEventListener("pageshow", () => { observeShell(); mount(); });
    if (window.ScrollTrigger) ScrollTrigger.addEventListener("refresh", schedule);
    if (window.barba) {
      barba.hooks.beforeLeave(suspend);
      barba.hooks.afterEnter(data => mount(data.next.container));
      barba.hooks.afterOnce(data => mount(data.next.container));
    }
    observeShell();
    mount();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once: true});
  else boot();
})();

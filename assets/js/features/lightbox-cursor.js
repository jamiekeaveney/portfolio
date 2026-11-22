(() => {
  function boot() {
    if (window.JKCloseCursor || !window.gsap || !matchMedia("(pointer:fine)").matches) return;
    window.JKCloseCursor = true;
    const label = document.createElement("div");
    label.className = "jk-close-cursor";
    label.setAttribute("aria-hidden", "true");
    document.body.append(label);
    const vars = getComputedStyle(document.documentElement), duration = parseFloat(vars.getPropertyValue("--motion-cursor-duration")) || .35;
    const x = gsap.quickTo(label, "x", {
      duration: duration,
      ease: "expo.out"
    }), y = gsap.quickTo(label, "y", {
      duration: duration,
      ease: "expo.out"
    });
    let close = null, over = null, pointer = window.JKProject?.pointer || {
      x: 0,
      y: 0,
      known: false
    };
    const desktop = matchMedia("(min-width:62rem) and (hover:hover) and (pointer:fine)");
    function targetAt() {
      if (!desktop.matches || document.querySelector(".lightbox-close")) return null;
      const active = document.querySelector('[data-mini-showreel-player][data-mini-showreel-status="active"]');
      const player = active?.querySelector("[data-bunny-player-init]");
      if (!player || !pointer.known || active.dataset.lightboxPhase !== "open") return null;
      const r = player.getBoundingClientRect(), v = player.querySelector("video");
      const aspect = v?.videoWidth && v.videoHeight ? v.videoWidth / v.videoHeight : 16 / 9, w = Math.min(r.width, r.height * aspect), h = w / aspect;
      r.left += (r.width - w) / 2;
      r.right = r.left + w;
      r.top += (r.height - h) / 2;
      r.bottom = r.top + h;
      return pointer.x < r.left || pointer.x > r.right || pointer.y < r.top || pointer.y > r.bottom ? active.querySelector("[data-mini-showreel-close]") : null;
    }
    function updateLabel() {
      pointer = window.JKProject?.pointer || pointer;
      const hit = pointer.known ? document.elementFromPoint(pointer.x, pointer.y) : null;
      const active = document.querySelector('[data-mini-showreel-status="active"][data-mini-showreel-player]');
      close = targetAt();
      const trigger = !active && hit?.closest(".case-featured [data-mini-showreel-open]");
      const blocked = !desktop.matches || document.documentElement.hasAttribute("data-transitioning");
      label.textContent = active ? "Back" : "View full screen";
      label.dataset.cursorKind = active ? "back" : "project";
      label.dataset.pointerKnown = String(pointer.known);
      label.style.opacity = !blocked && (trigger || close) ? "1" : "0";
      x(pointer.x + 18);
      y(pointer.y + 22);
      if (over && over !== active) over.style.cursor = "";
      over = active;
      if (active) active.style.cursor = close ? "pointer" : "";
    }
    document.addEventListener("pointermove", (e => {
      pointer = {
        x: e.clientX,
        y: e.clientY,
        known: true
      };
      if (window.JKProject) JKProject.pointer = pointer;
    }), {
      passive: true
    });
    document.addEventListener("pointerout", (e => {
      if (!e.relatedTarget) {
        pointer.known = false;
        if (window.JKProject) JKProject.pointer = pointer;
        label.style.opacity = "0";
      }
    }), {
      passive: true
    });
    gsap.ticker.add(updateLabel);
    document.addEventListener("click", (e => {
      if (e.isTrusted && e.detail > 0) {
        pointer = {
          x: e.clientX,
          y: e.clientY,
          known: true
        };
        if (window.JKProject) JKProject.pointer = pointer;
      }
      const button = targetAt();
      if (button && !e.target.closest("[data-mini-showreel-close],button,input,[data-player-control],.bunny-player__interface-bottom")) {
        e.preventDefault();
        e.stopImmediatePropagation();
        close = null;
        label.style.opacity = "0";
        button.click();
      }
    }), true);
    if (window.barba) barba.hooks.beforeLeave((() => {
      close = null;
      label.style.opacity = "0";
    }));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {
    once: true
  }); else boot();
  if (window.barba) barba.hooks.afterEnter(boot);
})();

/* CSS owns hover/reveal/swap animation; JS resolves media, entry direction and cursor position. */
(() => {
  "use strict";
  if (window.JKHoverAdditions) return;
  const states = new Map, fine = matchMedia("(hover:hover) and (pointer:fine)"), reduced = matchMedia("(prefers-reduced-motion:reduce)");
  const normalise = s => s.trim().replace(/\s+/g, " ").toLowerCase();
  const pointer = window.JKProject?.pointer || {
    x: 0,
    y: 0,
    known: false
  };
  let suspended = false;
  function mount(page) {
    if (!page || states.has(page)) return;
    const collection = page.querySelector("[data-follower-collection]");
    const rows = [ ...page.querySelectorAll("[data-directional-hover-item]") ];
    if (!collection && !rows.length) return;
    const abort = new AbortController, events = {
      signal: abort.signal
    }, timers = new Set;
    let raf = 0, row = null, focused = null, selected = null, current = null, previousIndex = -1, placed = false;
    const later = (fn, ms) => {
      const id = setTimeout((() => {
        timers.delete(id);
        fn();
      }), ms);
      timers.add(id);
      return id;
    };
    const cursor = collection?.querySelector("[data-follower-cursor]"), inner = cursor?.querySelector("[data-follower-cursor-inner]");
    const items = [ ...collection?.querySelectorAll("[data-follower-item]") || [] ], mapping = new Map, media = new Map;
    const vars = getComputedStyle(document.documentElement), duration = parseFloat(vars.getPropertyValue("--motion-cursor-duration")) || .35;
    const ox = parseFloat(vars.getPropertyValue("--motion-cursor-offset-x")) || 18, oy = parseFloat(vars.getPropertyValue("--motion-cursor-offset-y")) || 22;
    const xTo = cursor && window.gsap ? gsap.quickTo(cursor, "x", {
      duration: duration,
      ease: "expo.out"
    }) : null;
    const yTo = cursor && window.gsap ? gsap.quickTo(cursor, "y", {
      duration: duration,
      ease: "expo.out"
    }) : null;
    items.forEach(((item, index) => {
      const text = s => item.querySelector(s)?.textContent.trim() || "";
      const project = text("[data-client-project-slug]"), slug = text("[data-client-media-slug]");
      if (item.tagName === "A") item.href = project ? "/project/" + encodeURIComponent(project) : "/projects";
      const poster = item.querySelector("img[data-client-poster]")?.getAttribute("src") || "";
      const video = text("[data-client-video-url]") || (project && slug ? "https://jamie-keaveney-portfolio-videos.b-cdn.net/projects/" + encodeURIComponent(project) + "/" + encodeURIComponent(slug) + ".mp4" : "");
      const entry = poster || video ? {
        poster: poster,
        video: video,
        key: video || poster
      } : null;
      if (!entry) return;
      mapping.set(item, {
        ...entry,
        index: index
      });
      item.setAttribute("data-preview-ready", "");
      item.setAttribute("tabindex", "0");
    }));
    function pause(el) {
      el?.querySelectorAll("video").forEach((v => v.pause()));
    }
    function remove(el) {
      pause(el);
      el?.remove();
    }
    function hide() {
      selected = null;
      collection?.removeAttribute("data-preview-active");
      later((() => {
        if (!selected) {
          inner?.querySelectorAll(".client-preview__visual").forEach(remove);
          current = null;
          previousIndex = -1;
          placed = false;
        }
      }), 240);
    }
    function position(immediate = false) {
      if (!cursor) return;
      const r = focused?.getBoundingClientRect(), px = r ? r.left + r.width : pointer.x, py = r ? r.top : pointer.y;
      const w = cursor.offsetWidth, h = cursor.offsetHeight;
      const x = Math.max(12, Math.min(px + ox, innerWidth - w - 12)), y = Math.max(12, Math.min(py + oy, innerHeight - h - 12));
      if (window.gsap) {
        if (immediate || reduced.matches) {
          xTo?.tween.pause();
          yTo?.tween.pause();
          gsap.set(cursor, {
            x: x,
            y: y
          });
        } else {
          xTo(x);
          yTo(y);
        }
      } else cursor.style.transform = `translate(${x}px,${y}px)`;
    }
    function select(item) {
      if (item === selected) return;
      const entry = mapping.get(item);
      if (!entry || !inner) {
        if (selected) hide();
        return;
      }
      const wasVisible = !!selected;
      selected = item;
      position(!placed);
      placed = true;
      collection.setAttribute("data-preview-active", "");
      if (current?.dataset.mediaKey === entry.key) return;
      const direction = entry.index < previousIndex ? -1 : 1;
      previousIndex = entry.index;
      inner.querySelectorAll('[data-preview-position="outgoing"]').forEach(remove);
      const old = current, visual = document.createElement("div");
      visual.className = "client-preview__visual";
      visual.dataset.mediaKey = entry.key;
      visual.style.setProperty("--preview-direction", direction);
      visual.setAttribute("data-preview-position", wasVisible ? "incoming" : "current");
      if (entry.poster) {
        const img = new Image;
        img.alt = "";
        img.src = entry.poster;
        img.decoding = "async";
        visual.append(img);
      }
      if (entry.video) {
        const video = document.createElement("video");
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = "metadata";
        video.setAttribute("muted", "");
        video.setAttribute("playsinline", "");
        if (entry.poster) video.poster = entry.poster;
        video.src = entry.video;
        visual.append(video);
        video.addEventListener("playing", (() => {
          if (visual.isConnected) visual.setAttribute("data-video-ready", "");
        }), {
          once: true,
          signal: abort.signal
        });
        // Playback starts after this visual is attached; the follower opts out of the general video owner.
            }
      inner.append(visual);
      current = visual;
      const clip = visual.querySelector("video");
      if (clip && !reduced.matches) clip.play().catch((() => {}));
      void visual.offsetHeight;
      visual.setAttribute("data-preview-position", "current");
      if (old) {
        old.style.setProperty("--preview-direction", direction);
        old.setAttribute("data-preview-position", "outgoing");
        later((() => remove(old)), 850);
      }
    }
    function direction(target) {
      const r = target.getBoundingClientRect();
      return pointer.y < r.top + r.height / 2 ? -1 : 1;
    }
    function changeRow(next) {
      if (next === row) return;
      if (row) {
        row.removeAttribute("data-hover-preparing");
        const edge = direction(row);
        row.style.setProperty("--cv-hover-edge", edge);
        row.dataset.status = edge < 0 ? "leave-top" : "leave-bottom";
      }
      row = next;
      if (!row) return;
      const edge = direction(row);
      row.style.setProperty("--cv-hover-edge", edge);
      row.dataset.status = edge < 0 ? "enter-top" : "enter-bottom";
      row.setAttribute("data-hover-preparing", "");
      void row.offsetHeight;
      row.removeAttribute("data-hover-preparing");
    }
    function sample() {
      raf = 0;
      if (collection?.hasAttribute("data-return-preview")) return;
      if (suspended || document.documentElement.hasAttribute("data-transitioning") || !page.isConnected || !fine.matches) {
        if (selected) hide();
        changeRow(null);
        return;
      }
      const hit = pointer.known ? document.elementFromPoint(pointer.x, pointer.y) : null;
      const hoveredRow = hit?.closest("[data-directional-hover-item]");
      changeRow(hoveredRow && page.contains(hoveredRow) ? hoveredRow : null);
      if (!collection) return;
      const candidate = focused || hit?.closest("[data-follower-item]");
      if (candidate && collection.contains(candidate)) select(candidate); else if (selected) hide();
      if (selected) position();
    }
    function schedule() {
      if (!raf) raf = requestAnimationFrame(sample);
    }
    window.addEventListener("pointermove", (e => {
      if (e.pointerType === "touch") return;
      focused = null;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.known = true;
      schedule();
    }), {
      ...events,
      passive: true
    });
    window.addEventListener("scroll", schedule, {
      ...events,
      passive: true
    });
    window.addEventListener("resize", schedule, events);
    window.addEventListener("pageshow", schedule, events);
    document.addEventListener("pointerleave", (() => {
      pointer.known = false;
      focused = null;
      if (selected) hide();
      changeRow(null);
    }), events);
    document.addEventListener("visibilitychange", (() => {
      if (document.hidden) {
        if (selected) hide();
      } else schedule();
    }), events);
    collection?.addEventListener("focusin", (e => {
      focused = e.target.matches(":focus-visible") ? e.target.closest("[data-preview-ready]") : null;
      schedule();
    }), events);
    collection?.addEventListener("focusout", (e => {
      if (!collection.contains(e.relatedTarget)) {
        focused = null;
        if (selected) hide();
      } else focused = e.relatedTarget?.matches(":focus-visible") ? e.relatedTarget.closest("[data-preview-ready]") : null;
      schedule();
    }), events);
    const destroy = () => {
      abort.abort();
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      xTo?.tween.kill();
      yTo?.tween.kill();
      inner?.querySelectorAll(".client-preview__visual").forEach(remove);
      collection?.removeAttribute("data-preview-active");
      items.forEach((item => {
        if (mapping.has(item)) {
          item.removeAttribute("tabindex");
          item.removeAttribute("data-preview-ready");
        }
      }));
      states.delete(page);
    };
    states.set(page, {
      destroy: destroy,
      hide: hide,
      schedule: schedule,
      returnPreview(href, pose) {
        const item = items.find((el => new URL(el.href, location.href).pathname === href));
        if (!item) return null;
        focused = item;
        select(item);
        focused = null;
        collection.setAttribute("data-return-preview", "");
        cursor.style.display = "block";
        const r = item.getBoundingClientRect(), w = cursor.offsetWidth, h = cursor.offsetHeight;
        const x = Math.max(12, Math.min(pose ? pose.x * innerWidth : r.right + ox, innerWidth - w - 12));
        const y = Math.max(96, Math.min(pose ? pose.y * innerHeight : r.top + oy, innerHeight - h - 24));
        xTo?.tween.pause();
        yTo?.tween.pause();
        gsap.set(cursor, {
          x: x,
          y: y
        });
        return {
          media: current,
          release() {
            later((() => {
              collection.removeAttribute("data-return-preview");
              cursor.style.removeProperty("display");
              hide();
              schedule();
            }), 650);
          }
        };
      }
    });
    schedule();
  }
  function boot() {
    mount(document.querySelector('[data-barba="container"]') || document);
    if (window.barba) {
      barba.hooks.before((() => {
        suspended = true;
        states.forEach((s => s.hide()));
      }));
      barba.hooks.afterLeave((d => states.get(d.current.container)?.destroy()));
      barba.hooks.afterEnter((d => mount(d.next.container)));
      barba.hooks.after((() => {
        suspended = false;
        states.forEach((s => s.schedule()));
      }));
    }
  }
  window.JKHoverAdditions = {
    mount: mount,
    destroy: page => states.get(page)?.destroy(),
    prepareReturn(page, href, pose) {
      mount(page);
      return states.get(page)?.returnPreview(href, pose);
    }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {
    once: true
  }); else boot();
})();

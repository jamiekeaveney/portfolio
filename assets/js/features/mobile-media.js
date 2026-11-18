/* Touch media uses a conventional fitted player. Project cards remain navigation links. */
(() => {
  const mobile = matchMedia("(max-width:991px), (pointer:coarse)");
  let dispose = () => {}, close = () => {};
  function mount(page) {
    dispose();
    const abort = new AbortController, buttons = [];
    page.querySelectorAll("video").forEach((source => {
      if (source.closest("a,.mini-showreel,[data-project-lightbox],[data-follower-cursor],.about-portrait-flight")) return;
      const host = source.closest(".video-wrap") || source.parentElement;
      if (!host || host.querySelector("[data-mobile-play]")) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mobile-media-play";
      button.dataset.mobilePlay = "";
      button.setAttribute("aria-label", "Play video");
      host.append(button);
      buttons.push(button);
      button.addEventListener("click", (() => {
        if (!mobile.matches) return;
        close();
        const url = source.currentSrc || source.getAttribute("data-src") || source.src;
        if (!url) return;
        const dialog = document.createElement("dialog"), video = document.createElement("video"), exit = document.createElement("button");
        dialog.className = "mobile-media-dialog";
        dialog.setAttribute("aria-label", "Video player");
        exit.type = "button";
        exit.className = "lightbox-close";
        exit.textContent = "Close";
        const menu = document.querySelector(".sitenav__menu");
        if (menu) exit.style.top = menu.getBoundingClientRect().top + "px";
        video.controls = true;
        video.playsInline = true;
        video.poster = source.poster || "";
        video.preload = "metadata";
        dialog.append(video, exit);
        document.body.append(dialog);
        let hls;
        if (/\.m3u8(?:[?#]|$)/i.test(url) && !video.canPlayType("application/vnd.apple.mpegurl") && window.Hls?.isSupported()) {
          hls = new Hls({
            maxBufferLength: 10
          });
          hls.loadSource(url);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, (() => video.play().catch((() => {}))));
        } else {
          video.src = url;
          video.play().catch((() => {}));
        }
        close = () => {
          video.pause();
          hls?.destroy();
          dialog.remove();
          document.documentElement.classList.remove("is-lightbox-open");
          button.focus({
            preventScroll: true
          });
          close = () => {};
        };
        exit.addEventListener("click", close, {
          once: true
        });
        dialog.addEventListener("cancel", (event => {
          event.preventDefault();
          close();
        }));
        dialog.addEventListener("click", (event => {
          if (event.target === dialog) close();
        }));
        document.documentElement.classList.add("is-lightbox-open");
        dialog.showModal();
        exit.focus();
      }), {
        signal: abort.signal
      });
    }));
    dispose = () => {
      close();
      abort.abort();
      buttons.forEach((button => button.remove()));
    };
  }
  function boot() {
    mount(document.querySelector('[data-barba="container"]') || document);
    if (window.barba) {
      barba.hooks.afterEnter((d => mount(d.next.container)));
      barba.hooks.beforeLeave((() => close()));
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {
    once: true
  }); else boot();
})();

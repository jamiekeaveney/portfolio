/* Native related projects: hover playback, scroll progress and image handoff. */
JKProject.register((s => {
  /* TUNE HERE — durations/delays in seconds unless labelled Ms; distances in rem or %. */
  const SETTINGS = {
    messageDuration: 1,
    ease: "expo.out",
    inactiveCardOpacity: .25,
    idleDelayMs: 450,
    returnTopDuration: 1,
    previewFadeIn: .3,
    previewFadeOut: .3,
    visibleProjects: 3,
    navFadeDuration: .3,
    navHideStart: "top 85%"
  };
  const wrap = s.page.querySelector("[data-scroll-next-wrap]"), source = s.page.querySelector("[data-case-next-source]");
  if (!wrap || !source) return;
  const grid = source.querySelector(".case_index_grid");
  const items = [...(grid?.children || [])];
  const featured = s.related.slice(0, SETTINGS.visibleProjects);
  for (const { item } of featured) {
    const image = item.querySelector('img.case_index_image[loading="lazy"][sizes="100vw"]');
    if (image) image.sizes = 'auto, (max-width: 47.9375rem) 100vw, 33vw';
  }
  if (!s.next) {
    // Without a CMS neighbour, keep ordinary links and omit the automatic handoff.
    const status = wrap.querySelector(".case_index_status");
    const archive = document.createElement("a");
    archive.className = "case_index_archive_link";
    archive.href = "/projects";
    archive.textContent = "View all projects";
    status?.after(archive);
    const others = featured.filter(record => !record.link.matches('[aria-current="page"]'));
    grid?.replaceChildren(...others.map(record => record.item));
    s.page.setAttribute("data-case-archive", "");
    s.cleanups.push(() => {
      s.page.removeAttribute("data-case-archive");
      archive.remove();
      grid?.replaceChildren(...items);
    });
    return;
  }
  const cards = featured.map(record => record.link);
  const compact = !matchMedia("(min-width:62rem)").matches;
  grid.replaceChildren(...featured.map(record => record.item));
  const fill = wrap.querySelector(".case_index_fill"), hint = wrap.querySelector(".case_index_hint"), nav = s.page.querySelector("[data-case-nav]");
  let fired = false, forwardIntent = false, progress = 0, idleTimer, messageActive = false, messageTween;
  const hovered = new Set, cache = JKProject.previewCache || (JKProject.previewCache = new Map);
  const idle = wrap.querySelector(".case_index_meta");
  const status = idle.closest(".case_index_status"), statusParent = status.parentNode, statusSibling = status.nextSibling, idleText = idle.textContent;
  function label(el, prompt, value) {
    el.replaceChildren();
    const lead = document.createElement("span"), detail = document.createElement("span");
    lead.className = el === hint ? "case_index_prompt case_index_prompt_progress" : "case_index_prompt";
    lead.textContent = prompt;
    detail.className = "case_index_value";
    detail.textContent = value;
    el.append(lead, detail);
    return detail;
  }
  label(idle, "Up next", cards[0].querySelector(".case_index_title").textContent.trim());
  const percent = label(hint, "Scroll to next project", "(0%)");
  const suggestedTitle = cards[0].querySelector(".case_index_title");
  let compactLink;
  if (compact) {
    compactLink = document.createElement("a");
    compactLink.className = "case_index_next_link";
    compactLink.href = cards[0].href;
    compactLink.setAttribute("aria-label", "Next project: " + suggestedTitle.textContent.trim());
    compactLink.dataset.caseTransition = "continuation";
    status.before(compactLink);
    compactLink.append(status);
    compactLink.addEventListener("click", event => go(cards[0], event), {signal: s.abort.signal});
  } else {
    suggestedTitle.classList.add("case_index_title_suggested");
    status.classList.add("case_index_status_attached");
    cards[0].append(status);
  }
  gsap.set(hint, {
    yPercent: 100,
    autoAlpha: 1
  });
  gsap.set(idle, {
    yPercent: 0,
    autoAlpha: 1
  });
  function message(active) {
    if (messageActive === active) return;
    messageActive = active;
    messageTween?.kill();
    messageTween = gsap.timeline({
      defaults: {
        duration: JKProject.reduced() ? 0 : SETTINGS.messageDuration,
        ease: SETTINGS.ease,
        overwrite: "auto"
      }
    }).to(idle, {
      yPercent: active ? -100 : 0
    }, 0).to(hint, {
      yPercent: active ? 0 : 100
    }, 0);
    if (!compact && cards.length > 1) messageTween.to(cards.slice(1), {
      opacity: active ? SETTINGS.inactiveCardOpacity : 1,
      duration: SETTINGS.previewFadeIn
    }, 0);
  }
  function scrolling() {
    if (progress <= 0 || fired) return;
    message(true);
    clearTimeout(idleTimer);
    if (!compact) idleTimer = setTimeout((() => message(false)), SETTINGS.idleDelayMs);
  }
  const passive = {passive: true, signal: s.abort.signal};
  function noteDirection(forward) {
    forwardIntent = forward;
    if (forward && progress >= .999 && !JKProject.reduced()) go(cards[0]);
  }
  window.addEventListener("scroll", scrolling, passive);
  window.addEventListener("wheel", event => {
    if (event.deltaY) noteDirection(event.deltaY > 0);
  }, passive);
  let touchY = 0;
  window.addEventListener("touchstart", event => { touchY = event.touches[0].clientY; }, passive);
  window.addEventListener("touchmove", event => {
    const y = event.touches[0].clientY;
    if (y !== touchY) noteDirection(y < touchY);
    touchY = y;
  }, passive);
  window.addEventListener("keydown", event => {
    if (event.defaultPrevented || event.target.closest("input,textarea,select,[contenteditable=true]")) return;
    if (["ArrowDown", "PageDown", "End", " "].includes(event.key)) noteDirection(!event.shiftKey);
    else if (["ArrowUp", "PageUp", "Home"].includes(event.key)) noteDirection(false);
  }, {signal: s.abort.signal});
  function go(card, e) {
    if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button > 0)) return;
    e?.preventDefault();
    if (fired || document.documentElement.hasAttribute("data-transitioning")) return;
    if (new URL(card.href).pathname === location.pathname) {
      JKProject.lenis()?.scrollTo(0, {
        duration: SETTINGS.returnTopDuration
      });
      if (!JKProject.lenis()) window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
      return;
    }
    fired = true;
    s.handoffCard = card;
    barba.go(card.href, card, e);
  }
  function preview(card) {
    if (card.querySelector("video")) return Promise.resolve(card.querySelector("video"));
    if (!cache.has(card.href)) cache.set(card.href, fetch(card.href).then((r => {
      if (!r.ok) throw Error(r.status);
      return r.text();
    })).then((html => {
      const doc = (new DOMParser).parseFromString(html, "text/html"), v = doc.querySelector(".case_featured .media_preview video") || doc.querySelector(".case_featured video") || doc.querySelector(".case_media_wrap video");
      return v ? {
        src: portfolioPreviewSource(v),
        poster: portfolioPreviewPoster(v)
      } : null;
    })).catch((() => null)));
    return cache.get(card.href).then((data => {
      if (!data?.src || s.abort.signal.aborted) return null;
      let video = card.querySelector("video");
      if (video) return video;
      video = document.createElement("video");
      video.className = "case_index_video";
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = "none";
      video.src = data.src;
      if (data.poster) video.poster = data.poster;
      card.querySelector(".case_index_media").prepend(video);
      return video;
    }));
  }
  cards.forEach(((card, i) => {
    card.dataset.caseTransition = "continuation";
    if (!i) card.dataset.caseSuggested = "";
    card.querySelector(".case_index_media").dataset.nextMedia = "";
    card.addEventListener("click", (e => go(card, e)), {
      signal: s.abort.signal
    });
    const image = card.querySelector("img");
    const enter = async () => {
      hovered.add(card);
      if (JKProject.reduced()) return;
      const video = await preview(card);
      if (!video || !hovered.has(card)) return;
      try {
        await video.play();
        if (hovered.has(card) && !s.abort.signal.aborted) gsap.to(image, {
          opacity: 0,
          duration: SETTINGS.previewFadeIn,
          ease: SETTINGS.ease,
          overwrite: true
        });
      } catch {}
    };
    const leave = () => {
      hovered.delete(card);
      gsap.to(image, {
        opacity: 1,
        duration: SETTINGS.previewFadeOut,
        ease: SETTINGS.ease,
        overwrite: true,
        onComplete: () => {
          if (!hovered.has(card)) {
            const video = card.querySelector("video");
            video?.pause();
          }
        }
      });
    };
    card.addEventListener("pointerenter", (e => {
      if (e.pointerType !== "touch") enter();
    }), {
      signal: s.abort.signal
    });
    card.addEventListener("pointerleave", leave, {
      signal: s.abort.signal
    });
    card.addEventListener("focus", enter, {
      signal: s.abort.signal
    });
    card.addEventListener("blur", leave, {
      signal: s.abort.signal
    });
  }));
  const endOfSection = () => Math.max(1, Math.min(wrap.getBoundingClientRect().bottom + scrollY - innerHeight, ScrollTrigger.maxScroll(window)) - 2);
  const st = ScrollTrigger.create({
    trigger: wrap,
    start: compact ? () => Math.max(0, Math.min(endOfSection() - 1, status.getBoundingClientRect().bottom + scrollY - innerHeight + 16)) : "top top",
    end: endOfSection,
    onUpdate(self) {
      progress = self.progress;
      gsap.set(fill, {scaleX: progress, transformOrigin: "0 50%"});
      percent.textContent = "(" + Math.round(progress * 100) + "%)";
      if (progress === 0) message(false);
      else if (compact) message(true);
      if (progress >= .999 && forwardIntent && !JKProject.reduced()) go(cards[0]);
    }
  });
  // Entry easing ends well before the progress window reaches its final fifth.
    const sticky = source.closest(".case_next_sticky") || source;
  const entry = ScrollTrigger.create({
    trigger: wrap,
    start: "top bottom",
    end: () => "+=" + innerHeight * 1.45,
    onUpdate() {
      const lib = window.JKStickyLibrary;
      if (!lib || getComputedStyle(sticky).position !== "sticky") return;
      const engage = wrap.getBoundingClientRect().top + scrollY;
      const curve = lib.curve({
        travel: innerHeight * 100,
        span: innerHeight * .45,
        ease: "expo",
        lead: engage
      });
      sticky.style.translate = "0 " + curve.at(scrollY - engage) + "px";
    },
    onLeave() {
      sticky.style.translate = "0 0";
    },
    onLeaveBack() {
      sticky.style.translate = "";
    }
  });
  s.cleanups.push((() => {
    entry.kill();
    sticky.style.translate = "";
  }));
  const navST = nav && ScrollTrigger.create({
    trigger: wrap,
    start: SETTINGS.navHideStart,
    end: "bottom top",
    onToggle: self => {
      gsap.to(nav, {
        autoAlpha: self.isActive ? 0 : 1,
        duration: SETTINGS.navFadeDuration,
        ease: SETTINGS.ease,
        overwrite: true
      });
      nav.inert = self.isActive;
    }
  });
  document.addEventListener("visibilitychange", (() => {
    if (document.hidden) cards.forEach((card => card.querySelector("video")?.pause()));
  }), {
    signal: s.abort.signal
  });
  s.cleanups.push((() => {
    suggestedTitle.classList.remove("case_index_title_suggested");
    status.classList.remove("case_index_status_attached");
    statusParent.insertBefore(status, statusSibling?.parentNode === statusParent ? statusSibling : null);
    compactLink?.remove();
    idle.textContent = idleText;
    clearTimeout(idleTimer);
    messageTween?.kill();
    st.kill();
    navST?.kill();
    items.forEach((item => grid.append(item)));
    cards.forEach((card => {
      card.querySelector("video")?.remove();
      delete card.dataset.caseSuggested;
      gsap.set(card, {
        clearProps: "opacity"
      });
      gsap.set(card.querySelector("img"), {
        clearProps: "opacity"
      });
    }));
    if (nav) {
      nav.inert = false;
      gsap.set(nav, {
        clearProps: "opacity,visibility"
      });
    }
  }));
}));

/* Native related projects: hover playback, scroll progress and image handoff. */
JKProject.register((s => {
  /* TUNE HERE — durations/delays in seconds unless labelled Ms; distances in rem or %. */
  const SETTINGS = {
    messageDuration: 1,
    ease: "expo.out",
    inactiveCardOpacity: .25,
    returnTopDuration: 1,
    peerFadeDuration: .3,
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
    item.querySelectorAll('.project_card_visual img[loading="lazy"][sizes="100vw"]').forEach(image => {
      image.sizes = 'auto, (max-width: 47.9375rem) 100vw, 33vw';
    });
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
  let fired = false, messageActive = false, messageTween;
  const idle = wrap.querySelector(".case_index_meta");
  const status = idle.closest(".case_index_status"), statusParent = status.parentNode, statusSibling = status.nextSibling, idleText = idle.textContent;
  function label(el, prompt, value) {
    el.replaceChildren();
    const lead = document.createElement("span"), detail = document.createElement("span");
    lead.className = el === hint ? "case_index_prompt case_index_prompt_progress" : "case_index_prompt";
    lead.textContent = prompt + " ";
    detail.className = "case_index_value";
    detail.textContent = value;
    el.append(lead, detail);
    return detail;
  }
  label(idle, "Up next", cards[0].querySelector(".case_index_title").textContent.trim());
  const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
  const progressPrompt = () => motionPreference.matches ? "Open next project" : "Scroll to next project";
  const percent = label(hint, progressPrompt(), "(0%)");
  motionPreference.addEventListener("change", () => {
    hint.firstElementChild.textContent = progressPrompt() + " ";
  }, {signal: s.abort.signal});
  const suggestedTitle = cards[0].querySelector(".case_index_title");
  let compactLink;
  if (compact) {
    compactLink = document.createElement("a");
    compactLink.className = "case_index_next_link";
    compactLink.href = cards[0].href;
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
    if (!compact && !JKProject.reduced() && cards.length > 1) messageTween.to(cards.slice(1), {
      opacity: active ? SETTINGS.inactiveCardOpacity : 1,
      duration: SETTINGS.peerFadeDuration
    }, 0);
  }
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
    Promise.resolve(barba.go(card.href, card, e)).catch(() => location.assign(card.href));
  }
  cards.forEach(((card, i) => {
    card.dataset.caseTransition = "continuation";
    if (!i) card.dataset.caseSuggested = "";
    card.addEventListener("click", (e => go(card, e)), {
      signal: s.abort.signal
    });
  }));
  // Measure the real document end after Barba, the loader and CMS media have laid out.
  // A native scrollbar drag produces scroll events without any wheel, touch or key event.
  const scroller = document.scrollingElement;
  const passive = {passive: true, signal: s.abort.signal};
  let lastY = scroller.scrollTop, lastEnd = scroller.scrollHeight - scroller.clientHeight;
  let travellingForward = false, lastProgress = -1, frame = 0, scrolled = false, focusScrollUntil = 0;
  s.page.addEventListener("focusin", () => {
    travellingForward = false;
    focusScrollUntil = performance.now() + 350;
  }, {signal: s.abort.signal});
  function paintProgress() {
    frame = 0;
    const y = scroller.scrollTop;
    const end = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    const atEnd = end > 0 && end - y <= 2;
    const interactive = !document.documentElement.matches("[data-loader-active],[data-transitioning]") &&
      performance.now() >= focusScrollUntil;
    // Shorter CMS media can clamp scrollTop backwards at the new end while the
    // visitor is still travelling forwards. That layout change is not a reversal.
    if (!interactive) travellingForward = false;
    else if (scrolled && y !== lastY && !(atEnd && end < lastEnd && y < lastY)) {
      travellingForward = y > lastY;
    }
    scrolled = false;
    lastY = y;
    lastEnd = end;
    const position = compact
      ? status.getBoundingClientRect().bottom + y - scroller.clientHeight + 16
      : wrap.getBoundingClientRect().top + y;
    const start = Math.max(0, Math.min(position, end - 1));
    const progress = atEnd ? 1 : Math.max(0, Math.min(1, (y - start) / Math.max(1, end - start)));
    if (progress !== lastProgress) {
      gsap.set(fill, {scaleX: progress, transformOrigin: "0 50%"});
      percent.textContent = "(" + Math.round(progress * 100) + "%)";
      message(progress > 0);
      lastProgress = progress;
    }
    if (atEnd && travellingForward && !JKProject.reduced()) go(cards[0]);
  }
  function scheduleProgress() {
    if (!frame) frame = requestAnimationFrame(paintProgress);
  }
  window.addEventListener("scroll", () => {
    scrolled = true;
    scheduleProgress();
  }, passive);
  ScrollTrigger.addEventListener("refresh", scheduleProgress);
  scheduleProgress();
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
  s.cleanups.push((() => {
    suggestedTitle.classList.remove("case_index_title_suggested");
    status.classList.remove("case_index_status_attached");
    statusParent.insertBefore(status, statusSibling?.parentNode === statusParent ? statusSibling : null);
    compactLink?.remove();
    idle.textContent = idleText;
    messageTween?.kill();
    ScrollTrigger.removeEventListener("refresh", scheduleProgress);
    cancelAnimationFrame(frame);
    navST?.kill();
    items.forEach((item => grid.append(item)));
    cards.forEach((card => {
      delete card.dataset.caseSuggested;
      gsap.set(card, {
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

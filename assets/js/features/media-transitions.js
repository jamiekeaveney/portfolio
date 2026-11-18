/* Case-to-case Barba transition: Osmo's 0.9 / 1 / 0.9 timing and osmo ease. */
(() => {
  /* TUNE HERE — durations/delays in seconds unless labelled Ms; distances in rem or %. */
  const SETTINGS = {
    sideEase: "osmo",
    sideZoomDuration: .9,
    sideSlideDuration: 1,
    sideSlideAt: .25,
    sideZoomInAt: .85,
    sideTravelPercent: 175,
    sideDepth: "-100vw",
    screenRadiusRem: .75,
    radiusRampScale: .1,
    background: "var(--_theme---neutral--800, #222)",
    pageBackground: "var(--_theme---color--background, #000)",
    posterFadeDuration: .3,
    posterCleanupDuration: .3,
    posterEase: "expo.out",
    viewportPaddingRem: 2.5,
    minTopRem: 6,
    navGapRem: 1.5,
    resolveDuration: 1.05,
    resolveEase: "case-two-step",
    outgoingFadeDuration: .3,
    outgoingEase: "expo.out",
    expandDuration: .95,
    expandEase: "case-two-step",
    resolveAt: .8,
    pageVisibleAt: .5,
    headerRevealAt: 1.3
  };
  const origin = () => {
    try {
      return JSON.parse(sessionStorage.getItem("jk-project-origin"));
    } catch {
      return null;
    }
  };
  const frozen = new WeakMap;
  let pair = null, active = null, pending = null;
  function videoFrame(card) {
    const v = card?.querySelector(".mini-showreel__cover-image") || card?.querySelector("video"), poster = card?.querySelector(".project-preview__poster");
    if (!v || v.readyState < 2 || poster && parseFloat(getComputedStyle(poster).opacity) > .1) return null;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    try {
      canvas.getContext("2d").drawImage(v, 0, 0);
      return canvas;
    } catch {
      return null;
    }
  }
  function mediaRadius(el) {
    for (let node = el; node && node !== document.body; node = node.parentElement) {
      const r = getComputedStyle(node).borderTopLeftRadius;
      if (parseFloat(r) > 0) return r;
    }
    return getComputedStyle(document.documentElement).getPropertyValue("--radius--radius").trim() || ".75rem";
  }
  function capture(page, clicked) {
    const footer = clicked || pair?.mediaSource || JKProject.states.get(page)?.handoffCard || page.querySelector("[data-case-suggested]") || page.querySelector('.case-next__item[style*="block"] .case-next__link');
    frozen.set(page, {
      footer: footer ? {
        frame: videoFrame(footer),
        clone: footer.cloneNode(true),
        rect: footer.getBoundingClientRect(),
        mediaRect: footer.querySelector("[data-next-media]")?.getBoundingClientRect(),
        mediaRadius: mediaRadius(footer.querySelector("[data-next-media]")),
        times: [ ...footer.querySelectorAll("video") ].map((v => v.currentTime)),
        urls: [ ...footer.querySelectorAll("video") ].map((v => v.currentSrc || v.src))
      } : null,
      y: scrollY,
      nodes: [ ...page.querySelectorAll("*") ].filter((e => getComputedStyle(e).position === "sticky")).map((e => ({
        e: e,
        r: e.getBoundingClientRect()
      })))
    });
  }
  function peerOffsets(items, centre) {
    const left = items.filter((el => {
      const r = el.getBoundingClientRect();
      return r.left + r.width / 2 < centre;
    }));
    const right = items.filter((el => !left.includes(el)));
    const gap = parseFloat(getComputedStyle(document.documentElement).fontSize) * 1.5;
    const l = left.length ? -Math.max(...left.map((el => el.getBoundingClientRect().right))) - gap : 0;
    const r = right.length ? innerWidth - Math.min(...right.map((el => el.getBoundingClientRect().left))) + gap : 0;
    const distance = Math.max(Math.abs(l), Math.abs(r));
    return el => left.includes(el) ? -distance : distance;
  }
  function floatNavigation(current, next) {
    const layer = document.createElement("div");
    layer.className = "case-navigation-transition";
    document.body.append(layer);
    const records = [ current, next ].map((page => {
      const el = page.querySelector(".case-nav");
      if (!el) return null;
      const marker = document.createComment("case navigation");
      el.before(marker);
      el.dataset.navTransition = "";
      gsap.killTweensOf(el);
      layer.append(el);
      return {
        el: el,
        marker: marker
      };
    }));
    return {
      out: records[0]?.el,
      incoming: records[1]?.el,
      restore() {
        records.forEach((r => {
          if (r) {
            r.marker.replaceWith(r.el);
            delete r.el.dataset.navTransition;
          }
        }));
        layer.remove();
      }
    };
  }
  function swap(current, next, trigger) {
    if (active) return active;
    const saved = frozen.get(current) || {
      y: 0,
      nodes: []
    }, parent = next.parentNode, direction = trigger?.dataset?.caseDirection === "prev" ? -1 : 1;
    window.JKReveals?.showLoad(next);
    const nav = floatNavigation(current, next);
    const stage = document.createElement("div"), out = document.createElement("div"), incoming = document.createElement("div");
    stage.className = "case-transition";
    stage.dataset.transitionKind = "side";
    out.className = "case-transition__page";
    incoming.className = "case-transition__page";
    stage.append(out, incoming);
    document.body.append(stage);
    window.JKReveals?.showLoad(next);
    const radius = getComputedStyle(current).getPropertyValue("--radius--radius").trim() || ".75rem";
    const radiusPx = parseFloat(getComputedStyle(document.documentElement).fontSize) * SETTINGS.screenRadiusRem;
    const corners = () => [ out, incoming ].forEach((el => {
      const scale = Math.max(.01, el.getBoundingClientRect().width / el.offsetWidth), amount = Math.min(1, Math.max(0, (1 - scale) / SETTINGS.radiusRampScale));
      el.style.clipPath = "inset(0% round " + JKProject.rem(radiusPx * amount / scale) + ")";
    }));
    gsap.set(stage, {
      position: "fixed",
      inset: 0,
      height: "100dvh",
      zIndex: 20,
      perspective: "100vw",
      transformStyle: "preserve-3d",
      overflow: "clip",
      background: SETTINGS.background,
      pointerEvents: "none"
    });
    gsap.set([ out, incoming ], {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100dvh",
      overflow: "clip",
      background: SETTINGS.pageBackground,
      transformStyle: "preserve-3d",
      backfaceVisibility: "hidden"
    });
    out.append(current);
    incoming.append(next);
    gsap.set(out, {
      zIndex: 2,
      clipPath: "inset(0% round 0rem)"
    });
    gsap.set(current, {
      position: "absolute",
      top: -saved.y,
      left: 0,
      right: 0,
      width: "100%",
      y: 0,
      autoAlpha: 1
    });
    gsap.set(next, {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      width: "100%",
      y: 0,
      autoAlpha: 1
    });
    saved.nodes.forEach((({e: e, r: r}) => {
      e.style.position = "relative";
      e.style.top = "0";
      e.style.top = JKProject.rem(r.top - e.getBoundingClientRect().top);
    }));
    if (nav.incoming) gsap.set(nav.incoming, {
      autoAlpha: 0,
      y: 12
    });
    gsap.set(incoming, {
      xPercent: SETTINGS.sideTravelPercent * direction,
      z: SETTINGS.sideDepth,
      zIndex: 1,
      clipPath: "inset(0% round " + radius + ")"
    });
    let resolve;
    active = new Promise((r => resolve = r));
    gsap.timeline({
      defaults: {
        ease: SETTINGS.sideEase
      },
      onUpdate: corners,
      onComplete() {
        nav.restore();
        parent.append(next);
        current.remove();
        stage.remove();
        gsap.set(next, {
          clearProps: "position,top,left,right,width,transform,opacity,visibility"
        });
        const y = typeof isPopstate !== "undefined" && isPopstate && typeof getSavedScroll === "function" ? getSavedScroll(location.href) : 0;
        JKProject.lenis()?.scrollTo(y, {
          immediate: true,
          force: true
        });
        if (typeof resetPage === "function") resetPage(next, y);
        active = null;
        resolve();
      }
    }).to(nav.out || [], {
      autoAlpha: 0,
      duration: .3,
      ease: "power1.out"
    }, 0).to(nav.incoming || [], {
      autoAlpha: 1,
      y: 0,
      duration: .65,
      ease: "expo.out",
      clearProps: "opacity,visibility,transform"
    }, 1.1).to(out, {
      z: SETTINGS.sideDepth,
      duration: SETTINGS.sideZoomDuration
    }, 0).to(out, {
      xPercent: -SETTINGS.sideTravelPercent * direction,
      duration: SETTINGS.sideSlideDuration,
      overwrite: "auto"
    }, SETTINGS.sideSlideAt).to(incoming, {
      xPercent: 0,
      duration: SETTINGS.sideSlideDuration,
      overwrite: "auto"
    }, SETTINGS.sideSlideAt).to(incoming, {
      z: 0,
      duration: SETTINGS.sideZoomDuration,
      overwrite: "auto"
    }, SETTINGS.sideZoomInAt);
    return active;
  }
  async function continuation(current, next) {
    if (active) return active;
    window.JKLightbox?.mount(next);
    const saved = frozen.get(current), source = saved?.footer;
    saved?.nodes.forEach((({e: e, r: r}) => {
      e.style.position = "relative";
      e.style.top = "0";
      e.style.top = JKProject.rem(r.top - e.getBoundingClientRect().top);
    }));
    if (!source) return swap(current, next, null);
    JKProject.transitioning = true;
    window.JKReveals?.prepare(next, true);
    const parent = next.parentNode, stage = document.createElement("div"), cover = source.clone;
    stage.className = "case-transition";
    stage.dataset.transitionKind = "media";
    gsap.set(stage, {
      position: "fixed",
      inset: 0,
      zIndex: 20,
      overflow: "hidden",
      pointerEvents: "none"
    });
    gsap.set(cover, {
      position: "absolute",
      left: source.rect.left,
      top: source.rect.top,
      width: source.rect.width,
      height: source.rect.height,
      margin: 0,
      opacity: 1
    });
    stage.append(cover);
    document.body.append(stage);
    const oldMedia = cover.querySelector("[data-next-media]"), from = source.mediaRect || oldMedia.getBoundingClientRect();
    stage.append(oldMedia);
    cover.remove();
    oldMedia.style.transition = "none";
    oldMedia.style.transform = "none";
    oldMedia.style.filter = "none";
    oldMedia.style.clipPath = "none";
    gsap.set(oldMedia, {
      position: "absolute",
      left: from.left,
      top: from.top,
      width: from.width,
      height: from.height,
      borderRadius: source.mediaRadius || ".75rem",
      overflow: "hidden",
      margin: 0,
      x: 0,
      y: 0,
      xPercent: 0,
      yPercent: 0
    });
    const image = oldMedia.querySelector(".project-preview__poster") || oldMedia.querySelector("img");
    if (image) gsap.set(image, {
      scale: 1,
      opacity: 1
    });
    oldMedia.querySelectorAll("video").forEach((v => v.remove()));
    const heldFrame = source.frame;
    if (heldFrame) {
      Object.assign(heldFrame.style, {
        position: "absolute",
        inset: "0",
        width: "100%",
        height: "100%",
        objectFit: "cover",
        borderRadius: "inherit",
        zIndex: "3",
        pointerEvents: "none"
      });
      oldMedia.append(heldFrame);
      if (image) gsap.set(image, {
        opacity: 0
      });
    }
    gsap.set(next, {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      autoAlpha: 0
    });
    const media = next.querySelector(".case-featured .case-media"), hero = next.querySelector(".project-hero");
    if (!media) {
      stage.remove();
      gsap.set(next, {
        clearProps: "all"
      });
      JKProject.transitioning = false;
      return swap(current, next, null);
    }
    gsap.set(next.querySelector(".case-featured"), {
      clearProps: "transform,clipPath,opacity,visibility"
    });
    // Lower media is revealed only after the destination returns to document flow.
    // This avoids exposing its fixed-container layout during the mobile handoff.
    const deferredSections = innerWidth < 992 ? [...next.querySelectorAll('.case-section')] : [];
    if (deferredSections.length) gsap.set(deferredSections, {autoAlpha:0});
    const to = media.getBoundingClientRect(), actualVideo = media.querySelector(".mini-showreel__cover-image") || media.querySelector("video");
    let video, videoParent, videoSibling, videoStyle, videoClass, ready = false;
    if (actualVideo) {
      video = actualVideo;
      videoParent = video.parentNode;
      videoSibling = video.nextSibling;
      videoStyle = video.getAttribute("style");
      videoClass = video.className;
      oldMedia.prepend(video);
      video.className = "case-index__video";
      video.muted = true;
      video.playsInline = true;
      if (!video.getAttribute("src")) video.src = video.dataset.src || "";
      video.preload = "auto";
      const matchTime = () => {
        try {
          if (source.urls?.[0] === (video.currentSrc || video.src) && source.times[0] > 0) video.currentTime = source.times[0];
        } catch {}
      };
      if (video.readyState >= 1) matchTime(); else video.addEventListener("loadedmetadata", matchTime, {
        once: true
      });
      const showFrame = () => {
        ready = true;
        if ((heldFrame || image) && oldMedia.isConnected) gsap.to(heldFrame || image, {
          opacity: 0,
          duration: SETTINGS.posterFadeDuration,
          ease: SETTINGS.posterEase,
          overwrite: true
        });
      };
      video.play().then((() => {
        if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(showFrame); else if (video.readyState >= 2) requestAnimationFrame(showFrame); else video.addEventListener("loadeddata", showFrame, {
          once: true
        });
      })).catch((() => {}));
    }
    gsap.set(media, {
      autoAlpha: 0
    });
    gsap.set(hero, {
      autoAlpha: 0
    });
    gsap.set(next, {
      autoAlpha: 0
    });
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize), pad = SETTINGS.viewportPaddingRem * rem, nav = document.querySelector("nav"), top = Math.max(SETTINGS.minTopRem * rem, (nav?.getBoundingClientRect().bottom || 0) + SETTINGS.navGapRem * rem);
    const ratio = to.width / to.height || 16 / 9, w = innerWidth - pad * 2, h = Math.min((innerWidth - pad * 2) / ratio, innerHeight - top - pad), x = (innerWidth - w) / 2, y = top + (innerHeight - top - pad - h) / 2;
    let resolve;
    active = new Promise((r => resolve = r));
    window.JKHeader?.beginMediaTransition({
      duration: SETTINGS.expandDuration,
      ease: SETTINGS.expandEase
    });
    const tl = gsap.timeline({
      defaults: {
        duration: SETTINGS.resolveDuration,
        ease: SETTINGS.resolveEase
      },
      onComplete() {
        if (video) {
          videoParent.insertBefore(video, videoSibling?.parentNode === videoParent ? videoSibling : null);
          video.className = videoClass;
          if (videoStyle === null) video.removeAttribute("style"); else video.setAttribute("style", videoStyle);
          if (!ready && image) {
            const poster = image.cloneNode(true);
            poster.className = "case-index__image";
            media.append(poster);
            const removePoster = () => gsap.to(poster, {
              opacity: 0,
              duration: SETTINGS.posterCleanupDuration,
              onComplete: () => poster.remove()
            });
            if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(removePoster); else video.addEventListener("loadeddata", removePoster, {
              once: true
            });
          }
        }
        parent.append(next);
        current.remove();
        stage.remove();
        gsap.set([ media, hero ], {
          clearProps: "opacity,visibility"
        });
        gsap.set(next, {
          clearProps: "position,top,left,width,opacity,visibility"
        });
        JKProject.lenis()?.scrollTo(0, {
          immediate: true,
          force: true
        });
        window.scrollTo(0, 0);
        if (typeof resetPage === "function") resetPage(next, 0);
        if (deferredSections.length) gsap.to(deferredSections, {autoAlpha:1,duration:.25,clearProps:'opacity,visibility'});
        window.JKHeader?.endMediaTransition();
        JKProject.transitioning = false;
        active = null;
        resolve();
      }
    });
    const work = current.querySelector(".work");
    if (work) {
      const chosen = source.rect.left + source.rect.width / 2;
      const others = [ ...work.querySelectorAll("[data-work-item]") ].filter((el => {
        const r = el.getBoundingClientRect();
        return r.right > 0 && r.left < innerWidth && Math.abs(r.left + r.width / 2 - chosen) > 10;
      }));
      const offset = peerOffsets(others, chosen);
      const selected = [ ...work.querySelectorAll("[data-work-item]") ].filter((el => !others.includes(el)));
      tl.to([ ...selected, ...work.querySelectorAll(".work-list__center,.work-list__col") ], {
        autoAlpha: 0,
        duration: SETTINGS.expandDuration,
        ease: SETTINGS.expandEase
      }, 0);
      if (others.length) tl.to(others, {
        x: (i, el) => offset(el),
        autoAlpha: 0,
        duration: SETTINGS.expandDuration,
        ease: SETTINGS.expandEase
      }, 0);
      tl.to(work.querySelectorAll(".work__controls,.work-nav"), {
        autoAlpha: 0,
        duration: .3
      }, 0);
    }
    tl.to(current, {
      autoAlpha: 0,
      duration: SETTINGS.outgoingFadeDuration,
      ease: SETTINGS.outgoingEase
    }, work ? SETTINGS.expandDuration : 0).to(oldMedia, {
      left: x,
      top: y,
      width: w,
      height: h,
      duration: SETTINGS.expandDuration,
      ease: SETTINGS.expandEase
    }, 0);
    tl.to(oldMedia, {
      left: to.left,
      top: to.top,
      width: to.width,
      height: to.height,
      overwrite: "auto"
    }, SETTINGS.resolveAt).set(next, {
      autoAlpha: 1
    }, work ? SETTINGS.expandDuration + SETTINGS.outgoingFadeDuration : SETTINGS.pageVisibleAt).set(hero, {
      autoAlpha: 1
    }, SETTINGS.headerRevealAt).call((() => window.JKReveals?.play(next, true)), null, SETTINGS.headerRevealAt);
    return active;
  }
  function returnToWork(current, next, href) {
    if (active) return active;
    const work = next.querySelector(".work"), savedOrigin = origin();
    let returnY = work ? innerWidth >= 992 || savedOrigin?.path !== "/projects" ? 0 : savedOrigin?.y || 0 : savedOrigin?.y || 0;
    gsap.set(next, {
      position: "fixed",
      top: -returnY,
      left: 0,
      right: 0,
      width: "100%",
      autoAlpha: 0,
      zIndex: 0
    });
    gsap.set(current, {
      zIndex: 1
    });
    window.JKReveals?.showLoad(next);
    let target, contextPreview;
    if (work) {
      if (window.JKWork?.root !== work && typeof initWorkSlider === "function") initWorkSlider(next);
      target = window.JKWork?.restore(href);
      if (!target) target = work.querySelector("[data-work-item]:not([data-work-clone]) a[href]");
    } else if (next.querySelector(".cv-credits")) {
      contextPreview = window.JKHoverAdditions?.prepareReturn(next, savedOrigin?.href || href, savedOrigin?.previewPose);
      target = contextPreview?.media;
    } else if (!work && !contextPreview) {
      const path = savedOrigin?.href || href;
      target = [ ...next.querySelectorAll(".home-slide a[href]") ].find((a => new URL(a.href).pathname === path))?.closest(".home-slide");
    }
    const card = target?.closest(".work-card,.home-slide") || target?.closest("[data-work-list-center]") || target;
    const touch = matchMedia("(max-width:991px),(hover:none)").matches;
    const targetMedia = (touch ? target?.matches(".work-card__thumb,.home-slide-image") ? target : target?.querySelector(".work-card__thumb,.home-slide-image") : null) || target?.querySelector("[data-next-media]") || target?.querySelector(".work-card__poster,.slide-thumbnail") || target;
    const sources = [ ...current.querySelectorAll(".case-media,.case-index__media") ].filter((el => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
    }));
    const score = el => {
      const r = el.getBoundingClientRect(), visible = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)) * Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
      return visible / (1 + Math.abs((Math.max(0, r.top) + Math.min(innerHeight, r.bottom)) / 2 - innerHeight / 2) / innerHeight);
    };
    const source = sources.sort(((a, b) => score(b) - score(a)))[0] || current.querySelector(".case-media");
    if (!targetMedia || !source) {
      // If media is unavailable, retain the normal page transition; never a case-to-case slide to an index.
      gsap.set(next, {
        clearProps: "position,top,left,right,width,opacity,visibility,zIndex"
      });
      gsap.set(current, {
        clearProps: "zIndex"
      });
      return fallbackReturn(current, next, returnY);
    }
    // Land in the exact inner hover frame, then release to native CSS hover at completion.
        if (!touch && !contextPreview) card?.setAttribute("data-jk-return-hover", "");
    card?.setAttribute("data-jk-return-measure", "");
    if (work && touch) {
      const r = targetMedia.getBoundingClientRect(), navBottom = document.querySelector(".sitenav__bar")?.getBoundingClientRect().bottom || 80;
      if (r.top < navBottom || r.bottom > innerHeight) {
        returnY = Math.max(0, returnY + r.top - navBottom - 24);
        gsap.set(next, {
          top: -returnY
        });
      }
    }
    const from = source.getBoundingClientRect(), to = targetMedia.getBoundingClientRect();
    card?.removeAttribute("data-jk-return-measure");
    const v = source.querySelector(".mini-showreel__cover-image") || source.querySelector("video");
    const frame = videoFrame(source) || source.querySelector("img")?.cloneNode(true) || document.createElement("img");
    if (frame.tagName === "IMG" && !frame.getAttribute("src") && v?.poster) frame.src = v.poster;
    const stage = document.createElement("div");
    stage.className = "case-return-media";
    stage.append(frame);
    document.body.append(stage);
    gsap.set(stage, {
      position: "fixed",
      zIndex: 25,
      pointerEvents: "none",
      overflow: "hidden",
      borderRadius: mediaRadius(targetMedia),
      left: from.left,
      top: from.top,
      width: from.width,
      height: from.height
    });
    gsap.set(frame, {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover"
    });
    const destinationImage = targetMedia.querySelector(".project-preview__poster,img");
    const dissolve = destinationImage?.cloneNode(true);
    if (dissolve) {
      dissolve.removeAttribute("id");
      dissolve.removeAttribute("class");
      stage.append(dissolve);
      gsap.set(dissolve, {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        opacity: 0
      });
    }
    const others = work && work.dataset.workMode !== "list" ? [ ...work.querySelectorAll("[data-work-item]") ].filter((el => !el.contains(targetMedia) && el.getBoundingClientRect().right > 0 && el.getBoundingClientRect().left < innerWidth)) : !work ? [ ...next.querySelectorAll(".home-slide") ].filter((el => el !== card)) : [];
    const controls = work ? work.querySelectorAll(".work__controls,.work-nav,.work-list__col,.work-list__num-clip") : next.querySelectorAll(".home-slide-info");
    const offset = peerOffsets(others, to.left + to.width / 2);
    if (others.length) gsap.set(others, {
      ...work ? {
        x: (i, el) => offset(el)
      } : {},
      autoAlpha: 0
    });
    if (card) gsap.set(card, {
      autoAlpha: 0
    });
    if (controls.length) gsap.set(controls, {
      autoAlpha: 0
    });
    gsap.set(targetMedia, {
      autoAlpha: 0
    });
    gsap.set(source, {
      autoAlpha: 0
    });
    let resolve;
    active = new Promise((r => resolve = r));
    const tl = gsap.timeline({
      defaults: {
        ease: "expo.inOut"
      },
      onComplete() {
        gsap.set([ targetMedia, ...card ? [ card ] : [], ...others, ...controls ], {
          clearProps: "opacity,visibility"
        });
        if (others.length) gsap.set(others, {
          clearProps: "transform"
        });
        stage.remove();
        current.remove();
        card?.removeAttribute("data-jk-return-hover");
        contextPreview?.release();
        work?.removeAttribute("data-work-restoring");
        gsap.set(next, {
          clearProps: "position,top,left,right,width,opacity,visibility,zIndex"
        });
        if (typeof resetPage === "function") resetPage(next, returnY);
        active = null;
        resolve();
      }
    });
    tl.to(current, {
      autoAlpha: 0,
      duration: .35,
      ease: "power1.out"
    }, 0).set(next, {
      autoAlpha: 1
    }, .36).to(stage, {
      left: to.left,
      top: to.top,
      width: to.width,
      height: to.height,
      duration: 1.3
    }, 0);
    if (others.length) tl.to(others, {
      ...work ? {
        x: 0
      } : {},
      autoAlpha: 1,
      duration: .94
    }, .36);
    if (card) tl.to(card, {
      autoAlpha: 1,
      duration: .94
    }, .36);
    if (controls.length) tl.to(controls, {
      autoAlpha: 1,
      duration: .5,
      ease: "power1.out"
    }, .7);
    if (dissolve) tl.to(dissolve, {
      opacity: 1,
      duration: .35,
      ease: "power1.inOut"
    }, .95);
    return active;
  }
  let fallbackReturn;
  function boot() {
    if (!window.barba) return;
    if (document.querySelector("[data-case-page]") && performance.getEntriesByType("navigation")[0]?.type === "navigate") {
      try {
        sessionStorage.removeItem("jk-project-origin");
      } catch {}
    }
    if (window.CustomEase) {
      CustomEase.create("case-loader", "0.25, 0.1, 0.25, 1");
      CustomEase.create("case-two-step", "0.625, 0.05, 0, 1");
    }
    const freeze = window.freezeContainer, leave = window.runPageLeaveAnimation, enter = window.runPageEnterAnimation;
    fallbackReturn = (current, next, y) => Promise.all([ leave(current), enter(next, y) ]);
    if (freeze) window.freezeContainer = function(page) {
      if (!frozen.has(page) && (pair || page.matches("[data-case-page]"))) capture(page);
      return freeze(page);
    };
    if (leave && enter) {
      window.runPageLeaveAnimation = current => pair && !JKProject.reduced() ? pair.contextReturn ? active = fallbackReturn(current, pair.next, 0) : pair.returning ? returnToWork(current, pair.next, pair.href) : pair.continuation ? continuation(current, pair.next) : swap(current, pair.next, pair.trigger) : leave(current);
      window.runPageEnterAnimation = next => pair && !JKProject.reduced() ? active || Promise.resolve() : enter(next);
    }
    document.addEventListener("click", (e => {
      if (e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (e.isTrusted && e.detail > 0) JKProject.pointer = {
        x: e.clientX,
        y: e.clientY,
        known: true
      };
      const link = e.target.closest("a");
      if (!link) return;
      const preview = link.matches(".cv-credit") ? link.closest(".cv-credits")?.querySelector('.client-preview__visual[data-preview-position="current"]') : null;
      if (preview) preview.setAttribute("data-next-media", "");
      const source = (preview ? preview.parentElement : null) || link.closest(".home-slide") || (link.matches(".work-list__center") ? link.querySelector('[data-work-state="active"]') : link.matches(".work-card__link") ? link : null);
      const page = link.closest('[data-barba="container"]');
      if (link.closest(".case-nav") && page && !document.documentElement.hasAttribute("data-transitioning")) gsap.to(page.querySelector(".case-nav"), {
        autoAlpha: 0,
        duration: .3,
        ease: "power1.out",
        overwrite: true
      });
      if (source && page && source.querySelector("[data-next-media]")) {
        pending = {
          page: page,
          source: source,
          href: link.href
        };
        capture(page, source);
        const home = !!source.closest(".home-slide");
        if (!home && !preview && !window.JKWork?.capture(link)) {
          pending = null;
          return;
        }
        try {
          sessionStorage.setItem("jk-project-origin", JSON.stringify({
            path: preview ? location.pathname : home ? "/" : "/projects",
            y: scrollY,
            href: new URL(link.href).pathname,
            ...preview ? {
              previewPose: {
                x: preview.getBoundingClientRect().left / innerWidth,
                y: preview.getBoundingClientRect().top / innerHeight
              }
            } : {}
          }));
        } catch {}
      }
    }), true);
    barba.hooks.before((d => {
      const trigger = d.trigger instanceof Element ? d.trigger.closest("a") : null;
      const captured = pending?.page === d.current.container && pending.href === d.next.url.href ? pending : null;
      const mediaSource = captured?.source || (trigger?.matches(".home-slide-image,.slide-info,.work-card__link,.work-list__media") ? trigger.closest(".home-slide") || trigger : null);
      const nextCase = d.next.container?.matches("[data-case-page]");
      if (nextCase && !d.current.container?.matches("[data-case-page]")) {
        try {
          sessionStorage.setItem("jk-project-origin", JSON.stringify({
            ...origin() || {},
            path: d.current.url.path,
            y: captured ? frozen.get(d.current.container)?.y || 0 : typeof getSavedScroll === "function" ? getSavedScroll(d.current.url.href) : 0,
            href: d.next.url.path
          }));
        } catch {}
      }
      pair = nextCase && (d.current.container?.matches("[data-case-page]") || mediaSource) ? {
        next: d.next.container,
        trigger: trigger,
        mediaSource: mediaSource,
        continuation: !!mediaSource || trigger?.dataset.caseTransition === "continuation"
      } : null;
      if (d.current.container?.matches("[data-case-page]") && (d.next.container?.querySelector(".work") || d.next.url.path === "/" && origin()?.path === "/")) pair = {
        next: d.next.container,
        returning: true,
        href: d.current.url.path
      };
      if (d.current.container?.matches("[data-case-page]") && d.next.url.path === origin()?.path && !pair) pair = {
        next: d.next.container,
        contextReturn: true,
        href: d.current.url.path
      };
      if (pair?.continuation) d.next.container.dataset.mediaHandoff = "true";
      if (pair && !frozen.get(d.current.container)?.footer) capture(d.current.container, mediaSource);
    }));
    const workLeave = window.runWorkLeaveAnimation, workEnter = window.runCaseEnterAnimation;
    if (workLeave) window.runWorkLeaveAnimation = (current, next, trigger) => pair?.continuation && !JKProject.reduced() ? continuation(current, next) : workLeave(current, next, trigger);
    if (workEnter) window.runCaseEnterAnimation = next => pair?.continuation && !JKProject.reduced() ? active || Promise.resolve() : workEnter(next);
    barba.hooks.after((d => {
      frozen.delete(d.current.container);
      delete d.next.container.dataset.mediaHandoff;
      pair = null;
      pending = null;
      active = null;
    }));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {
    once: true
  }); else boot();
})();

/* Explicit Designer attributes: data-reveal="load|scroll", data-split="letters|words|lines",
   data-reveal-effect="fade|rise|height", data-reveal-order="0|1|2". */
(() => {
  /* TUNE HERE — durations/delays in seconds unless labelled Ms; distances in rem or %. */
  const SETTINGS = {
    ease: "expo.out",
    textDuration: 1.25,
    elementDuration: 1,
    dissolveDuration: .8,
    mediaRevealDuration: 1.5,
    riseDistance: "1.5rem",
    maskedTravelPercent: 115,
    letterStagger: .025,
    letterStaggerTotal: .16,
    wordStagger: .035,
    wordStaggerTotal: .18,
    lineStagger: .1,
    pageStartDelay: 0,
    sequenceOverlapStep: .25,
    scrollTriggerPercent: 80,
    alreadyVisibleDelay: .1,
    navDuration: .3,
    navStagger: .06,
    parallaxIntroDelay: .85,
    firstLoadLead: 1.05,
    radiusFallback: "var(--radius--radius, .75rem)"
  };
  const pages = new WeakMap;
  let navIntro = null;
  function clear(page) {
    const s = pages.get(page);
    if (!s) return;
    s.triggers.forEach((t => t.kill()));
    s.observers?.forEach(o=>o.disconnect());
    s.tweens.forEach((t => t.kill()));
    s.splits.forEach((t => t.revert()));
    pages.delete(page);
  }
  function prepare(page, handoff = false, responsive = false) {
    const motion = getComputedStyle(document.documentElement);
    SETTINGS.ease = motion.getPropertyValue("--motion-ease").trim() || "expo.out";
    SETTINGS.mediaRevealDuration = parseFloat(motion.getPropertyValue("--motion-media-duration")) || 1.5;
    SETTINGS.navDuration = parseFloat(motion.getPropertyValue("--motion-nav-duration")) || .3;
    SETTINGS.navStagger = parseFloat(motion.getPropertyValue("--motion-nav-stagger")) || .06;
    SETTINGS.textDuration = parseFloat(motion.getPropertyValue("--motion-text-duration")) || 1.25;
    SETTINGS.dissolveDuration = parseFloat(motion.getPropertyValue("--motion-fade-duration")) || .8;
    SETTINGS.lineStagger = parseFloat(motion.getPropertyValue("--motion-line-stagger")) || .1;
    if (!page || pages.has(page) && !responsive || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    window.JKLightbox?.mount(page);
    const restoring = page.dataset.restoreScroll === "true";
    const s = pages.get(page) || {
      entries: [],
      splits: [],
      tweens: [],
      triggers: [],
      observers: [],
      started: false
    };
    pages.set(page, s);
    if (innerWidth < 992) page.querySelectorAll(".work-slide__track > .work-card:not([data-work-clone])").forEach(((el, i) => {
      el.dataset.reveal = i < 2 ? "load" : "scroll";
      el.dataset.revealEffect = "rise";
      el.dataset.revealDelay = String(i % 2 * .1);
    }));
    page.querySelectorAll('[data-reveal="load"],[data-reveal="scroll"]').forEach((el => {
      if (s.entries.some((e => e.el === el)) || responsive && !el.matches("[data-home-scroll],[data-home-intro-exit]")) return;
      if (el.closest('[data-reveal="none"],.work-list,.case-index__card') || el.closest(".work-card") && !(innerWidth < 992 && el.matches(".work-card")) || !el.getClientRects().length) return;
      if ((handoff || page.dataset.mediaHandoff === "true") && el.matches(".case-featured,.case-featured *")) return;
      const entry = {
        el: el,
        played: responsive || restoring && el.dataset.reveal === "load",
        started: responsive || restoring && el.dataset.reveal === "load",
        completed: responsive || restoring && el.dataset.reveal === "load",
        tween: null
      };
      s.entries.push(entry);
      const mode = el.dataset.split, effect = el.dataset.revealEffect || "fade";
      if (mode && window.SplitText) {
        s.splits.push(SplitText.create(el, {
          type: mode === "letters" ? "lines,words,chars" : mode === "words" ? "lines,words" : "lines",
          mask: "lines",
          linesClass: "reveal-line",
          autoSplit: true,
          onSplit(split) {
            if (el.hasAttribute("data-home-scroll")) split.chars.forEach((ch => {
              const wrap = document.createElement("span");
              wrap.className = "hero-scroll-char";
              ch.before(wrap);
              wrap.append(ch);
            }));
            split.lines.forEach((l => {
              l.parentElement.classList.add("reveal-line-mask");
              if (el.hasAttribute("data-home-intro-exit")) {
                const wrap = document.createElement("span");
                wrap.className = "hero-scroll-line";
                wrap.style.display = "block";
                l.before(wrap);
                wrap.append(l);
              }
            }));
            gsap.set(el, {
              autoAlpha: 1
            });
            const targets = mode === "letters" ? split.chars : mode === "words" ? split.words : split.lines;
            const stagger = mode === "letters" ? Math.min(SETTINGS.letterStagger, SETTINGS.letterStaggerTotal / Math.max(1, targets.length - 1)) : mode === "words" ? Math.min(SETTINGS.wordStagger, SETTINGS.wordStaggerTotal / Math.max(1, targets.length - 1)) : SETTINGS.lineStagger;
            const elapsed = entry.tween?.totalTime() || 0;
            const t = gsap.fromTo(targets, {
              yPercent: SETTINGS.maskedTravelPercent
            }, {
              yPercent: 0,
              duration: SETTINGS.textDuration,
              stagger: stagger,
              ease: "power3.out",
              paused: true,
              onComplete: () => entry.completed = true
            });
            entry.tween = t;
            s.tweens.push(t);
            if (entry.completed) t.progress(1); else if (entry.started) t.totalTime(elapsed).play();
            if (entry.completed && (el.hasAttribute("data-home-scroll") || el.hasAttribute("data-home-intro-exit"))) requestAnimationFrame((() => window.JKHeader?.refreshHero()));
            return t;
          }
        }));
      } else if (effect === "inline-media") {
        const bounds = el.getBoundingClientRect(), w = bounds.width;
        const slot=document.createElement('span');
        slot.className='editorial-media-slot';
        slot.style.height=(bounds.height + (parseFloat(getComputedStyle(el).marginBottom)||0))+'px';
        el.before(slot);slot.append(el);
        el.dataset.inlineWidth = String(w);
        el.style.setProperty("--inline-media-width", w + "px");
        const t = gsap.fromTo(el, {
          width: 0,
          height: 0,
          autoAlpha: 0
        }, {
          width: w,
          height: bounds.height,
          autoAlpha: 1,
          duration: 1,
          ease: SETTINGS.ease,
          paused: true,
          onComplete: completeInline
        });
        function completeInline() {
          entry.completed = true;
          gsap.set(el, {
            clearProps: "width,height,clipPath,opacity,visibility"
          });
          if(!entry.resizeObserver){
            // Reserve the final block height during entry, then follow real breakpoint sizes.
            entry.resizeObserver=new ResizeObserver(()=>{
              if(!entry.completed||!el.isConnected)return;
              const css=getComputedStyle(el);
              slot.style.height=(el.offsetHeight+(parseFloat(css.marginBottom)||0))+'px';
            });
            entry.resizeObserver.observe(el);s.observers.push(entry.resizeObserver);
          }
          el.dispatchEvent(new CustomEvent("jk:inline-ready", {
            bubbles: true
          }));
        }
        entry.tween = t;
        s.tweens.push(t);
      } else {
        const radius = effect === "height" ? getComputedStyle(el).borderTopLeftRadius !== "0px" ? getComputedStyle(el).borderTopLeftRadius : getComputedStyle(el.querySelector(".case-media,.mini-showreel__card") || el).borderTopLeftRadius : "0px";
        const round = radius === "0px" ? SETTINGS.radiusFallback : radius;
        const from = effect === "height" ? {
          clipPath: "inset(0% 0% 100% 0% round " + round + ")"
        } : effect === "rise" ? {
          autoAlpha: 0,
          y: SETTINGS.riseDistance
        } : {
          autoAlpha: 0
        };
        const to = effect === "height" ? {
          clipPath: "inset(0% 0% 0% 0% round " + round + ")"
        } : effect === "rise" ? {
          autoAlpha: 1,
          y: 0
        } : {
          autoAlpha: 1
        };
        const followers = effect === "height" && el.matches(".mini-showreel__media") ? [ ...el.parentElement.querySelectorAll(".mini-showreel__info") ] : [];
        if (followers.length) gsap.set(followers, {
          y: -el.offsetHeight
        });
        const t = gsap.fromTo(el, from, {
          ...to,
          duration: effect === "height" ? SETTINGS.mediaRevealDuration : effect === "fade" ? SETTINGS.dissolveDuration : SETTINGS.elementDuration,
          ease: SETTINGS.ease,
          paused: true,
          onUpdate: function() {
            if (followers.length) gsap.set(followers, {
              y: -el.offsetHeight * (1 - this.ratio)
            });
            if (el.matches("[data-case-nav]") && el.inert) gsap.set(el, {
              autoAlpha: 0
            });
          },
          onComplete: () => {
            entry.completed = true;
            if (followers.length) gsap.set(followers, {
              clearProps: "transform"
            });
            if (!el.inert) gsap.set(el, {
              clearProps: effect === "height" ? "clipPath" : effect === "rise" ? "opacity,visibility,transform" : "opacity,visibility"
            });
          }
        });
        if (effect === "rise") {
          t.kill();
          gsap.set(el, {
            autoAlpha: 0,
            y: SETTINGS.riseDistance
          });
          const rise = gsap.timeline({
            paused: true,
            onUpdate: () => {
              if (el.matches("[data-case-nav]") && el.inert) gsap.set(el, {
                autoAlpha: 0
              });
            },
            onComplete: () => {
              entry.completed = true;
              if (!el.inert) gsap.set(el, {
                clearProps: "opacity,visibility,transform"
              });
            }
          }).to(el, {
            autoAlpha: 1,
            duration: SETTINGS.dissolveDuration,
            ease: SETTINGS.ease
          }, 0).to(el, {
            y: 0,
            duration: SETTINGS.elementDuration,
            ease: SETTINGS.ease
          }, 0);
          entry.tween = rise;
          s.tweens.push(rise);
        } else {
          entry.tween = t;
          s.tweens.push(t);
        }
      }
    }));
  }
  function play(page, early = false) {
    prepare(page);
    const s = pages.get(page);
    if (!s || s.started) return;
    if (navIntro) {
      navIntro.delay(document.documentElement.hasAttribute('data-loader-active')?.55:0).play();
      navIntro = null;
    }
    page.dataset.pageIntroStarted = "true";
    page.dispatchEvent(new CustomEvent("jk:page-intro", {
      bubbles: true
    }));
    if (!early) s.started = true;
    const launch = (entry, delay = 0) => {
      if (entry.played) return;
      entry.played = true;
      s.tweens.push(gsap.delayedCall(delay, (() => {
        entry.started = true;
        entry.tween?.play();
      })));
    };
    s.entries.forEach((e => {
      if (e.el.dataset.reveal === "load") {
        const order = Number(e.el.dataset.revealOrder) || 0;
        const delay = e.el.dataset.revealEffect === "inline-media" ? Number(e.el.dataset.revealDelay ?? .1) : Number(e.el.dataset.revealDelay ?? order * SETTINGS.sequenceOverlapStep);
        launch(e, SETTINGS.pageStartDelay + delay);
      } else if (early) return; else if ((e.el.closest("[data-reveal-group]") || e.el).getBoundingClientRect().top < innerHeight * SETTINGS.scrollTriggerPercent / 100) launch(e, SETTINGS.alreadyVisibleDelay + Number(e.el.dataset.revealDelay || 0)); else s.triggers.push(ScrollTrigger.create({
        trigger: e.el.closest("[data-reveal-group]") || e.el,
        start: "clamp(top " + SETTINGS.scrollTriggerPercent + "%)",
        once: true,
        onEnter: () => launch(e, Number(e.el.dataset.revealDelay || 0))
      }));
    }));
    if (!early) ScrollTrigger.refresh();
  }
  function showLoad(page) {
    prepare(page);
    const s = pages.get(page);
    if (!s) return;
    s.entries.forEach((e => {
      if (e.el.dataset.reveal === "load" && !e.el.hasAttribute("data-nav-transition")) {
        e.played = true;
        e.started = true;
        e.completed = true;
        e.tween?.delay(0).progress(1);
      }
    }));
  }
  function restore(page,y){
    prepare(page);
    const s=pages.get(page);if(!s)return;
    s.entries.forEach(e=>{
      const top=e.el.getBoundingClientRect().top+window.scrollY;
      if(e.el.dataset.reveal==='load'||top<y+innerHeight){e.played=e.started=e.completed=true;e.tween?.delay(0).progress(1);}
    });
  }
  window.JKReveals = {
    restore:restore,
    prepare: prepare,
    play: play,
    showLoad: showLoad
  };
  function boot() {
    if (!window.barba || !window.gsap || !document.querySelector('[data-barba="wrapper"]')) return;
    gsap.registerPlugin(SplitText, ScrollTrigger);
    const page = document.querySelector('[data-barba="container"]');
    prepare(page);
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const nav = [ ...document.querySelectorAll(".sitenav") ].filter((el => el.getClientRects().length));
      navIntro = gsap.from(nav, {
        autoAlpha: 0,
        duration: SETTINGS.navDuration,
        stagger: 0,
        ease: SETTINGS.ease,
        paused: true,
        clearProps: "opacity,visibility"
      });
    }
    barba.hooks.beforeEnter((d => {
      const historyVisit = ["popstate", "back", "forward"].includes(d.trigger);
      d.next.container.dataset.restoreScroll = String(historyVisit && getSavedScroll(d.next.url.href) > 0);
      prepare(d.next.container, d.next.container.dataset.mediaHandoff === "true" || d.trigger?.dataset?.caseTransition === "continuation");
      if (d.next.container.dataset.restoreScroll === "true") showLoad(d.next.container);
    }));
    barba.hooks.enter((d => {
      if (d.next.container.dataset.mediaHandoff === "true" || d.next.container.dataset.restoreScroll === "true") return;
      const casePair = d.current.container?.matches("[data-case-page]") && d.next.container?.matches("[data-case-page]");
      if (casePair) {
        if (d.trigger?.dataset?.caseTransition !== "continuation") showLoad(d.next.container);
        return;
      }
      const s = pages.get(d.next.container);
      if (s) s.tweens.push(gsap.delayedCall(SETTINGS.parallaxIntroDelay, (() => play(d.next.container, true))));
    }));
    const once = window.runPageOnceAnimation;
    if (once) window.runPageOnceAnimation = function(page) {
      const tl = once(page);
      if (tl?.call) tl.call((() => play(page, true)), null, tl.labels?.revealPage!==undefined?tl.labels.revealPage+.42:Math.max(0,tl.duration()-SETTINGS.firstLoadLead));
      return tl;
    };
    barba.hooks.afterOnce((d => play(d.next.container)));
    barba.hooks.afterEnter((d => play(d.next.container)));
    barba.hooks.after((d => clear(d.current.container)));
    const recover = () => {
      if (document.hidden || document.documentElement.hasAttribute("data-transitioning")) return;
      const loader = document.querySelector('[data-loader="wrap"]');
      if (loader && getComputedStyle(loader).display !== "none" && parseFloat(getComputedStyle(loader).opacity) > .01) return;
      const current = document.querySelector('[data-barba="container"]'), state = pages.get(current);
      if (!state) return;
      if (!state.started) {
        play(current);
        return;
      }
      state.entries.filter((e => e.el.dataset.reveal === "load")).forEach((e => {
        if (e.started && !e.completed && e.tween && !e.tween.isActive() && e.el.getBoundingClientRect().bottom > 0 && e.el.getBoundingClientRect().top < innerHeight) e.tween.play();
      }));
    };
    let resizeTimer;
    window.addEventListener("resize", (() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout((() => {
        const page = document.querySelector('[data-barba="container"]');
        prepare(page, false, true);
        window.JKHeader?.refreshHero();
      }), 160);
    }), {
      passive: true
    });
    window.addEventListener("pageshow", (() => requestAnimationFrame(recover)));
    window.addEventListener("scroll", recover, {
      passive: true
    });
    document.addEventListener("visibilitychange", recover);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {
    once: true
  }); else boot();
})();

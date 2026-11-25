(() => {
  if (window.JKEditorial) return;
  window.JKEditorial = true;
  const states = new Map;
  function initStepByStepTimeline(root) {
    if (!root) return;
    const line = root.querySelector("[data-step-timeline-line]");
    const fill = root.querySelector("[data-step-timeline-fill]");
    const items = Array.from(root.querySelectorAll("[data-step-timeline-item]"));
    if (!line || !fill || !items.length) return;
    const anchors = items.map((item => item.querySelector("[data-step-timeline-marker]") || item));
    const activationInput = parseFloat(root.dataset.stepTimelineActivation);
    const activation = Number.isNaN(activationInput) ? .5 : Math.min(Math.max(activationInput, 0), 1);
    const activationPercent = activation * 100;
    const lastIndex = items.length - 1;
    let anchorFractions = [ 0 ];
    function measureLine() {
      if (items.length < 2) {
        line.style.height = "0px";
        anchorFractions = [ 0 ];
        return;
      }
      const base = line.parentElement.getBoundingClientRect().top;
      const centers = anchors.map((anchor => {
        const box = anchor.getBoundingClientRect();
        return box.top + box.height / 2 - base;
      }));
      const firstCenter = centers[0];
      const span = centers[lastIndex] - firstCenter;
      line.style.top = firstCenter + "px";
      line.style.height = span + "px";
      anchorFractions = centers.map((center => span > 0 ? (center - firstCenter) / span : 0));
    }
    let currentIndex = -2;
    function setCurrentIndex(index) {
      if (index === currentIndex) return;
      currentIndex = index;
      items.forEach(((item, i) => {
        const status = index >= 0 && i <= index ? "active" : "inactive";
        if (item.getAttribute("data-status") !== status) {
          item.setAttribute("data-status", status);
        }
        item.toggleAttribute("data-current", i === index);
        item.toggleAttribute("data-previous", i === index - 1);
        item.toggleAttribute("data-next", i === index + 1);
      }));
    }
    function indexForProgress(reached, progress) {
      if (!reached) return -1;
      let index = 0;
      for (let i = 0; i < anchorFractions.length; i++) {
        if (progress + 1e-4 >= anchorFractions[i]) index = i;
      }
      return index;
    }
    function updateFromScroll(self) {
      const reached = self.isActive || self.progress >= 1;
      setCurrentIndex(indexForProgress(reached, self.progress));
    }
    setCurrentIndex(-1);
    gsap.set(fill, {
      transformOrigin: "top",
      scaleY: 0
    });
    if (root._stepTimelineMedia) root._stepTimelineMedia.revert();
    const mediaQueries = gsap.matchMedia();
    root._stepTimelineMedia = mediaQueries;
    mediaQueries.add("(prefers-reduced-motion: no-preference)", (() => {
      measureLine();
      ScrollTrigger.addEventListener("refreshInit", measureLine);
      if (items.length > 1) {
        gsap.fromTo(fill, {
          scaleY: 0
        }, {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: line,
            start: "top " + activationPercent + "%",
            end: "bottom " + activationPercent + "%",
            scrub: true,
            onUpdate: updateFromScroll,
            onToggle: updateFromScroll,
            onRefresh: updateFromScroll
          }
        });
      } else {
        setCurrentIndex(0);
      }
      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener("load", refresh);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
      ScrollTrigger.refresh();
      return () => {
        window.removeEventListener("load", refresh);
        ScrollTrigger.removeEventListener("refreshInit", measureLine);
      };
    }));
    mediaQueries.add("(prefers-reduced-motion: reduce)", (() => {
      measureLine();
      gsap.set(fill, {
        scaleY: 1
      });
      setCurrentIndex(lastIndex);
    }));
  }
  function initNumberOdometer(root) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const entries = [];
    root.querySelectorAll("[data-odometer-element]").forEach((el => {
      const original = el.textContent.trim(), match = original.match(/^(\D*)(\d+)(\D*)$/);
      if (!match) return;
      const target = Number(match[2]);
      if (target > 1e3) return;
      el.setAttribute("aria-label", original);
      el.innerHTML = "";
      const add = text => {
        if (text) {
          const s = document.createElement("span");
          s.dataset.odometerPart = "static";
          s.setAttribute("aria-hidden", "true");
          s.textContent = text;
          el.append(s);
        }
      };
      add(match[1]);
      const mask = document.createElement("span"), roller = document.createElement("span");
      mask.dataset.odometerPart = "mask";
      mask.setAttribute("aria-hidden", "true");
      roller.dataset.odometerPart = "roller";
      for (let n = 0; n <= target; n++) {
        const cell = document.createElement("span");
        cell.dataset.odometerPart = "cell";
        cell.textContent = n;
        roller.append(cell);
      }
      mask.append(roller);
      el.append(mask);
      add(match[3]);
      entries.push({
        el: el,
        roller: roller,
        target: target,
        trigger: el.parentElement
      });
    }));
    const page = root.closest('[data-barba="container"]');
    let ready = page?.dataset.pageIntroStarted === "true";
    const checks = [];
    const arm = () => {
      ready = true;
      requestAnimationFrame((() => checks.forEach((check => check()))));
    };
    page?.addEventListener("jk:page-intro", arm, {
      once: true
    });
    entries.forEach(((entry, index) => {
      const {el: el, roller: roller, target: target, trigger: trigger} = entry;
      const previous = entries[index - 1], sameRow = previous && Math.abs(previous.el.getBoundingClientRect().top - el.getBoundingClientRect().top) < 20;
      const tween = gsap.to(roller, {
        y: () => -target * roller.firstElementChild.getBoundingClientRect().height,
        duration: Math.min(2.4, 1.1 + target * .08),
        delay: sameRow ? .18 : 0,
        ease: "power3.inOut",
        paused: true
      });
      let played = false;
      const play = () => {
        if (ready && !played) {
          played = true;
          tween.invalidate().play(0);
        }
      };
      const check = () => {
        const r = trigger.getBoundingClientRect();
        if (r.bottom > 0 && r.top < innerHeight * .8) play();
      };
      checks.push(check);
      ScrollTrigger.create({
        trigger: trigger,
        start: "top 80%",
        onEnter: play,
        onRefresh: check
      });
    }));
    if (ready) requestAnimationFrame(arm);
    return () => page?.removeEventListener("jk:page-intro", arm);
  }
  function initScalingMediaScroll(root) {
    const section = root.querySelector("[data-scaling-media-scroll-init]");
    if (!section) return () => {};
    const sticky = section.querySelector("[data-scaling-media-scroll-sticky]"), items = [ ...section.querySelectorAll("[data-scaling-media-scroll-item]") ].slice(0, 3);
    if (!sticky || !items.length) return () => {};
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", (() => {
      const angles = [ -2.5, .5, 2.1 ], timeline = gsap.timeline({
        defaults: {
          ease: "none"
        },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => "+=" + Math.max(1,section.offsetHeight-sticky.offsetHeight),
          scrub: true,
          invalidateOnRefresh: true
        }
      });
      gsap.set(items,{autoAlpha:0,filter:'blur(.75em)'});
      items.forEach(((item, i) => {
        const dx = Math.cos(angles[i]), dy = Math.sin(angles[i]), at = .08 + i * .22;
        timeline.fromTo(item, {
          xPercent: -50,
          yPercent: -50,
          x: () => dx * section.clientWidth * .25,
          y: () => dy * sticky.offsetHeight * .26,
          scale: .4
        }, {
          x: () => dx * section.clientWidth * .35,
          y: () => dy * sticky.offsetHeight * .35,
          scale: 1.5,
          duration: 1
        }, at).fromTo(item, {
          autoAlpha: 0,
          filter: "blur(.75em)"
        }, {
          autoAlpha: 1,
          filter: "blur(0em)",
          duration: .2
        }, at).fromTo(item, {
          autoAlpha: 1,
          filter: "blur(0em)"
        }, {
          autoAlpha: 0,
          filter: "blur(0.75em)",
          duration: .2,
          immediateRender: false
        }, at + .8);
      }));
    }));
    mm.add("(prefers-reduced-motion: reduce)", (() => {
      gsap.set(items, {
        autoAlpha: 0
      });
    }));
    return () => mm.revert();
  }
  function initBottomStack(wrap) {
    const list = wrap.querySelector(".cv_list");
    if (!list) return () => {};
    const cards = [ ...list.children ], layers = [];
    cards.forEach(((card, i) => {
      const layer = document.createElement("div");
      layer.className = "cv-stack-layer";
      card.before(layer);
      layer.append(card);
      layer.style.zIndex = cards.length - i;
      layers.push(layer);
    }));
    const measure = () => {
      let total = 0;
      cards.forEach(((card, i) => {
        const height = card.getBoundingClientRect().height;
        total += height - (i ? 1 : 0);
        layers[i].style.height = total + "px";
        card.style.top = "calc(100svh - var(--grid--padding) - " + height + "px)";
      }));
      list.style.height = total + "px";
    };
    list.setAttribute("data-stack-ready", "");
    measure();
    const ro = new ResizeObserver(measure);
    cards.forEach((card => ro.observe(card)));
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      list.removeAttribute("data-stack-ready");
      list.style.height = "";
      cards.forEach(((card, i) => {
        layers[i].before(card);
        card.style.top = "";
        layers[i].remove();
      }));
    };
  }
  function init(page) {
    page.querySelectorAll("[data-editorial-page]").forEach((root => {
      if (states.has(root) || !window.gsap || !window.ScrollTrigger) return;
      const abort = new AbortController, mm = gsap.matchMedia(), splits = [];
      const numberTexts = [ ...root.querySelectorAll("[data-odometer-element]") ].map((el => [ el, el.textContent ]));
      let numberCleanup;
      const odometerContext = gsap.context((() => {
        numberCleanup = initNumberOdometer(root);
      }), root);
      const scalingCleanup = initScalingMediaScroll(root);
      const container = root.closest('[data-barba="container"]');
      container?.querySelectorAll('[data-anchor-target="#showreel"]').forEach((a => {
        a.dataset.anchorTarget = "#" + root.querySelector("section[id]").id;
        a.dataset.anchorAlign = "start";
        a.setAttribute("aria-label", "Explore the page");
      }));
      root.querySelectorAll("[data-accordion-toggle]").forEach((button => {
        button.addEventListener("keydown", (e => {
          if (e.key === " ") {
            e.preventDefault();
            button.click();
          }
        }), {
          signal: abort.signal
        });
        button.addEventListener("click", (e => {
          e.preventDefault();
          const item = button.closest("[data-accordion-status]"), group = item.closest("[data-accordion-css-init]"), open = item.dataset.accordionStatus !== "active";
          if (group.dataset.accordionCloseSiblings === "true") group.querySelectorAll("[data-accordion-status]").forEach((s => {
            s.dataset.accordionStatus = "not-active";
            s.querySelector("[data-accordion-toggle]").setAttribute("aria-expanded", "false");
          }));
          item.dataset.accordionStatus = open ? "active" : "not-active";
          button.setAttribute("aria-expanded", String(open));
        }), {
          signal: abort.signal
        });
      }));
      root.querySelectorAll("[data-step-timeline-init]").forEach(initStepByStepTimeline);
      mm.add("(prefers-reduced-motion: no-preference)", (() => {
        const ctx = gsap.context((() => {
          if (window.SplitText) root.querySelectorAll("[data-highlight-text]").forEach((h => {
            const split = new SplitText(h, {
              type: "words,chars",
              autoSplit: true,
              onSplit(self) {
                gsap.set(self.chars, {
                  autoAlpha: Number(h.dataset.highlightFade || .2)
                });
                return gsap.to(self.chars, {
                  autoAlpha: 1,
                  stagger: Number(h.dataset.highlightStagger || .1),
                  ease: "none",
                  scrollTrigger: {
                    trigger: h,
                    start: h.dataset.highlightScrollStart || "top 90%",
                    end: h.dataset.highlightScrollEnd || "center 40%",
                    scrub: true,
                    invalidateOnRefresh: true
                  }
                });
              }
            });
            splits.push(split);
          }));
        }), root);
        return () => {
          splits.splice(0).forEach((s => s.revert()));
          ctx.revert();
        };
      }));
      mm.add("(min-width: 62rem) and (prefers-reduced-motion: no-preference)", (() => {
        let trailCleanup;
        const stackCleanups = [];
        const ctx = gsap.context((() => {
          root.querySelectorAll("[data-cv-stack]").forEach((wrap => stackCleanups.push(initBottomStack(wrap))));
          root.querySelectorAll("[data-horizontal-section]").forEach((section => {
            const track = section.querySelector("[data-horizontal-track]"), inner = section.querySelector("[data-horizontal-inner]"), shade = section.querySelector("[data-horizontal-overlay]"), next = section.nextElementSibling;
            const travel = () => Math.max(0, track.scrollWidth - section.clientWidth), exit = () => section.clientHeight;
            gsap.set(next, {
              marginTop: () => -exit()
            });
            const timeline = gsap.timeline({
              scrollTrigger: {
                id: "editorial-horizontal",
                trigger: section,
                start: "top top",
                end: () => "+=" + (travel() + exit()),
                pin: true,
                scrub: true,
                invalidateOnRefresh: true,
                onRefreshInit: () => gsap.set(next, {
                  marginTop: -exit()
                })
              }
            });
            const total = travel() + exit(), ratio = travel() / total;
            timeline.to(track, {
              x: () => -travel(),
              duration: ratio,
              ease: "none"
            }, 0).to(inner, {
              yPercent: -25,
              duration: 1 - ratio,
              ease: "none"
            }, ratio).to(shade, {
              opacity: .5,
              duration: 1 - ratio,
              ease: "none"
            }, ratio);
          }));
        }), root);
        return () => {
          trailCleanup?.();
          stackCleanups.forEach((fn => fn()));
          ctx.revert();
        };
      }));
      states.set(root, {
        dispose() {
          abort.abort();
          mm.revert();
          scalingCleanup();
          numberCleanup?.();
          odometerContext.revert();
          numberTexts.forEach((([el, text]) => el.textContent = text));
          root.querySelectorAll("[data-odometer-initialized]").forEach((el => el.removeAttribute("data-odometer-initialized")));
          root.querySelectorAll("[data-step-timeline-init]").forEach((t => t._stepTimelineMedia?.revert()));
        }
      });
      document.fonts.ready.then((() => {
        if (states.has(root)) ScrollTrigger.refresh();
      }));
      root.querySelectorAll("img").forEach((img => {
        if (!img.complete) img.addEventListener("load", (() => ScrollTrigger.refresh()), {
          once: true,
          signal: abort.signal
        });
      }));
    }));
  }
  function cleanup(page) {
    states.forEach(((s, r) => {
      if (page.contains(r)) {
        s.dispose();
        states.delete(r);
      }
    }));
  }
  function boot() {
    if (window.freezeContainer && !window.freezeContainer._preservesPins) {
      const freeze = window.freezeContainer;
      const wrapped = function(page) {
        const pins = [];
        ScrollTrigger.getAll().forEach((t => {
          if (page.contains(t.trigger)) {
            if (t.pin && getComputedStyle(t.pin).position === "fixed") pins.push({
              el: t.pin,
              rect: t.pin.getBoundingClientRect()
            });
            t.disable(false);
            t.animation?.pause();
          }
        }));
        freeze(page);
        pins.forEach((({el: el, rect: rect}) => {
          const parent = el.parentElement.getBoundingClientRect();
          gsap.set(el, {
            position: "absolute",
            top: rect.top - parent.top,
            left: rect.left - parent.left,
            width: rect.width,
            height: rect.height,
            margin: 0
          });
        }));
      };
      wrapped._preservesPins = true;
      window.freezeContainer = wrapped;
    }
    init(document);
    if (window.barba) {
      barba.hooks.beforeLeave((d => {
        ScrollTrigger.getAll().forEach((t => {
          if (d.current.container.contains(t.trigger)) {
            t.disable(false);
            t.animation?.pause();
          }
        }));
      }));
      barba.hooks.after((d => cleanup(d.current.container)));
      barba.hooks.afterEnter((d => init(d.next.container)));
      barba.hooks.afterOnce((d => init(d.next.container)));
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {
    once: true
  }); else boot();
})();

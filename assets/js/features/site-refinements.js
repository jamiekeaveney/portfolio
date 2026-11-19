/* R9: native sticky easing, section navigation and one portrait handoff. */
(() => {
  "use strict";
  let stickies = null, portrait = null, sectionLabels = null, resizeTimer;
  const desktop = matchMedia("(min-width:992px) and (hover:hover) and (pointer:fine)");
  const reduced = matchMedia("(prefers-reduced-motion:reduce)");
  function disposePortrait() {
    portrait?.destroy();
    portrait = null;
  }
  function mountPortrait(page) {
    disposePortrait();
    const source = page.querySelector("[data-portrait-source]"), target = page.querySelector("[data-portrait-destination]");
    if (!source || !target || !desktop.matches || reduced.matches) return;
    const sourceImage = source.querySelector("img"), targetImage = target.querySelector("img");
    if (!sourceImage || !targetImage) return;
    const clone = document.createElement("div"), face = sourceImage.cloneNode(true);
    face.removeAttribute("id");face.alt="";face.className="about-portrait-flight__image";clone.append(face);
    clone.removeAttribute("id");
    
    clone.className = "about-portrait-flight";
    clone.setAttribute("aria-hidden", "true");
    page.append(clone);
    const originalStyle = source.getAttribute("style");
    let from, to, disposed = false;
    const reset = () => {
      source.style.width = "";
      source.style.marginRight = "";
      source.style.height = "";
    };
    function measure() {
      reset();
      const a = source.getBoundingClientRect(), b = target.getBoundingClientRect(), p = page.getBoundingClientRect();
      from = {
        x: a.left - p.left,
        y: a.top - p.top,
        w: a.width,
        h: a.height
      };
      to = {
        x: b.left - p.left,
        y: b.top - p.top,
        w: b.width,
        h: b.height
      };
      gsap.set(clone, {
        position: "absolute",
        left: from.x,
        top: from.y,
        width: from.w,
        height: from.h,
        transformOrigin: "50% 50%",
        zIndex: 8,
        pointerEvents: "none",
        borderRadius: getComputedStyle(target).borderRadius,
        objectFit: "cover"
      });
    }
    function paint(p) {
      if (disposed || !from?.w) return;
      sourceImage.style.visibility = p > 0 ? "hidden" : "";
      targetImage.style.visibility = p < 1 ? "hidden" : "";
      const collapse = Math.min(1, p / .65);
      source.style.width = from.w * (1 - collapse) + "px";
      source.style.height = from.h + "px";
      source.style.marginRight = (1 - collapse) * .12 + "em";
      gsap.set(clone, {
        visibility: p > 0 && p < 1 ? "visible" : "hidden",
        x: (to.x - from.x + (to.w-from.w)/2) * p,
        y: (to.y - from.y + (to.h-from.h)/2) * p + (tween?.scrollTrigger ?
          Math.max(tween.scrollTrigger.start, Math.min(tween.scrollTrigger.end, scrollY)) -
          (tween.scrollTrigger.start + (tween.scrollTrigger.end-tween.scrollTrigger.start)*p) : 0),
        scaleX: 1 + (to.w / from.w - 1) * p,
        scaleY: 1 + (to.h / from.h - 1) * p,
        rotation: 0
      });
    }
    const playhead = {
      value: 0
    };
    measure();
    let tween, swing=0, direction=1;
    const swingTick=(time,dt=16.667)=>{
      const p=playhead.value,velocity=tween?.scrollTrigger?.getVelocity()||0;
      const nextDirection=velocity<0?-1:1;
      // Return to neutral before changing hinges; changing origin under tilt would jump.
      let target=gsap.utils.clamp(0,26,Math.abs(velocity)*.012)*Math.min(1,p/.12,(1-p)/.12);
      if(nextDirection!==direction){target=0;if(swing<.15)direction=nextDirection;}
      swing+=(target-swing)*(1-Math.exp(-10*Math.min(dt,50)/1000));
      face.style.transformOrigin=direction>0?'0% 0%':'100% 100%';
      face.style.transform='perspective(700px) rotateX('+(-direction*swing*.6).toFixed(3)+'deg) rotateY('+(direction*swing).toFixed(3)+'deg)';
    };
    gsap.ticker.add(swingTick);
    tween = gsap.to(playhead, {
      value: 1,
      ease: "none",
      onUpdate: () => paint(playhead.value),
      scrollTrigger: {
        trigger: source,
        start: "center center",
        endTrigger: target,
        end: "center center",
        scrub: .18,
        onUpdate: () => paint(playhead.value),
        invalidateOnRefresh: true,
        onRefresh() {
          measure();
          paint(playhead.value);
        }
      }
    });
    paint(tween.scrollTrigger.progress);
    portrait = {
      destroy() {
        disposed = true;
        gsap.ticker.remove(swingTick);
        tween.scrollTrigger?.kill();
        tween.kill();
        clone.remove();
        reset();
        sourceImage.style.visibility = "";
        targetImage.style.visibility = "";
      }
    };
  }
  function mountSectionLabels(page) {
    sectionLabels?.destroy();sectionLabels=null;
    if(!desktop.matches)return;
    const labels=[...page.querySelectorAll('.section-header .grey-label,.cv-clients-label,.cv-selected-caption')].map(el=>{
      const section=el.closest('.section')||el.closest('.edit-grid');
      const end=el.matches('.cv-clients-label')?section?.querySelector('.cv-selected-caption'):el.closest('#about')?section?.querySelector('.home-intro-button'):null;
      return {el,section,end,offset:0,translate:el.style.translate};
    }).filter(s=>s.section&&!s.section.querySelector('.marquee-advanced__logo')&&!s.el.closest('#services'));
    const serviceLabel=page.querySelector('#services .section-header .grey-label');
    const serviceMedia=page.querySelector('#services .services-video-sticky');
    let serviceNatural=0,serviceLabelStyle=serviceLabel?.style.translate||'';
    const measureService=()=>{if(serviceMedia){const box=serviceMedia.closest('.services-sticky-video');serviceNatural=(box||serviceMedia).getBoundingClientRect().top+scrollY;}};
    measureService();ScrollTrigger.addEventListener('refresh',measureService);
    let frozen=false;
    const tick=()=>{
      if(frozen)return;
      const top=12*parseFloat(getComputedStyle(document.documentElement).fontSize);
      const positions=labels.map(s=>{
        const r=s.el.getBoundingClientRect(),natural=r.top-s.offset;
        const boundary=labels.find(label=>label.el===s.end);
        const end=s.end?s.end.getBoundingClientRect().top-(boundary?.offset||0):s.section.getBoundingClientRect().bottom;
        const travel=Math.max(0,end-natural-r.height-40);
        if(reduced.matches||!window.JKStickyLibrary)return Math.max(0,Math.min(top-natural,travel));
        if(!s.curve||Math.abs(s.travel-travel)>.5||s.viewport!==innerHeight){
          s.travel=travel;s.viewport=innerHeight;
          s.curve=window.JKStickyLibrary.curve({travel,span:innerHeight*.45,ease:'expo'});
        }
        return s.curve.clamp(top-natural);
      });
      labels.forEach((s,i)=>{s.offset=positions[i];s.el.style.translate='0 '+s.offset+'px';});
      if(serviceLabel&&serviceMedia){const displacement=serviceMedia.getBoundingClientRect().top+scrollY-serviceNatural;serviceLabel.style.translate='0 '+Math.max(0,displacement)+'px';}

    };
    gsap.ticker.add(tick);tick();
    sectionLabels={freeze(){frozen=true;},destroy(){gsap.ticker.remove(tick);ScrollTrigger.removeEventListener('refresh',measureService);if(serviceLabel)serviceLabel.style.translate=serviceLabelStyle;labels.forEach(s=>{s.el.style.translate=s.translate;});}};
  }
  function mount(page) {
    sectionLabels?.destroy();sectionLabels=null;
    stickies?.destroy();
    const library = window.JKStickyLibrary;
    if (library) {
      const found = library.findSticky();
      found.forEach((el => {
        if (!page.contains(el) || el.closest(".pin-spacer,[data-footer-parallax],[data-scroll-next-wrap],[data-horizontal-section],.footer-wrap,.sticky-footer") || el.hasAttribute("data-home-scroll")) return;
        if (getComputedStyle(el).position === "sticky") el.setAttribute("data-site-eased-sticky", "");
      }));
      stickies = library.sticky.all("[data-site-eased-sticky]", {
        ease: "expo",
        distance: .45,
        engine: "main",
        media: "(min-width:992px) and (hover:hover) and (pointer:fine)",
        ticker: fn => {
          gsap.ticker.add(fn);
          return () => gsap.ticker.remove(fn);
        }
      });
    }
    mountSectionLabels(page);
    const source = page.querySelector("[data-portrait-source]");
    if (source && parseFloat(source.style.width) === 0) page.addEventListener("jk:inline-ready", (() => mountPortrait(page)), {
      once: true
    }); else if (source && source.style.width) page.addEventListener("jk:inline-ready", (() => mountPortrait(page)), {
      once: true
    }); else mountPortrait(page);
  }
  document.addEventListener("click", (event => {
    const arrow = event.target.closest(".scroll-arrow__mask");
    if (!arrow || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const page = arrow.closest('[data-barba="container"]');
    if (!page) return;
    let selector = arrow.getAttribute("data-anchor-target") || arrow.getAttribute("href"), target;
    if (innerWidth < 992 && selector === "#showreel") selector = "#about";
    try {
      target = selector?.startsWith("#") ? page.querySelector(selector) : null;
    } catch {}
    if (!target || target.getBoundingClientRect().height < 1) {
      const section = arrow.closest("section,.hero,.editorial-hero");
      target = section?.nextElementSibling;
    }
    if (!target) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const nav = document.querySelector(".sitenav__bar"), offset = innerWidth < 992 ? -(nav?.getBoundingClientRect().bottom || 80) - 24 : 0;
    const smooth = window.JKProject?.lenis();
    if (smooth) smooth.scrollTo(target, {
      offset: offset,
      duration: reduced.matches ? 0 : 1.2,
      easing: t => 1 - Math.pow(2, -10 * t),
      force: true
    }); else window.scrollTo({
      top: Math.max(0, target.getBoundingClientRect().top + scrollY + offset),
      behavior: reduced.matches ? "instant" : "smooth"
    });
  }), true);
  function boot() {
    if (!window.gsap || !window.ScrollTrigger) return;
    const freeze = window.freezeContainer;
    if (freeze) window.freezeContainer = function(page) {
      stickies?.freeze();sectionLabels?.freeze();
      return freeze(page);
    };
    if (window.barba) {
      barba.hooks.beforeLeave((() => {stickies?.freeze();sectionLabels?.freeze();}));
      barba.hooks.afterLeave((() => {
        stickies?.destroy();
        stickies = null;
        disposePortrait();sectionLabels?.destroy();sectionLabels=null;
      }));
      barba.hooks.afterEnter((d => mount(d.next.container)));
      document.addEventListener('jk:loader-prepare',e=>{mount(e.detail.page);e.detail.page.dataset.refinementsPrepared='true';});
      barba.hooks.afterOnce((d => {if(!d.next.container.dataset.refinementsPrepared)mount(d.next.container);}));
    } else mount(document);
    let lastWidth = innerWidth;
    window.addEventListener("resize", (() => {
      if (lastWidth === innerWidth) return;
      lastWidth = innerWidth;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout((() => {
        if (!document.documentElement.hasAttribute("data-transitioning")) mount(document.querySelector('[data-barba="container"]') || document);
      }), 220);
    }), {
      passive: true
    });
    ScrollTrigger.addEventListener("refresh", (() => stickies?.refresh()));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {
    once: true
  }); else boot();
})();

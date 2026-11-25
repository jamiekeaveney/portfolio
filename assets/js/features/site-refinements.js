(() => {
  "use strict";
  let stickies = null, sectionLabels = null, resizeTimer;
  const desktop = matchMedia("(min-width:62rem) and (hover:hover) and (pointer:fine)");
  const reduced = matchMedia("(prefers-reduced-motion:reduce)");
  const bottomLabels = '.edit-label--bottom,.section_label_bottom,.clients_eyebrow,.services_eyebrow';
  function mountSectionLabels(page) {
    sectionLabels?.destroy();sectionLabels=null;
    if(!desktop.matches)return;
    const labels=[...page.querySelectorAll('.section_header .u-text-muted-label,.edit_grid > .clients_eyebrow,.edit_overlap .edit-label--bottom')].map(el=>{
      const section=el.closest('.edit_grid')||el.closest('.section_wrap');
      const end=el.matches('.clients_eyebrow')?section?.querySelector('.clients_list'):el.closest('#about')?section?.querySelector('.section_action'):null;
      return {el,section,end,offset:0,translate:el.style.translate};
    }).filter(s=>s.section&&(!s.el.closest(bottomLabels)||s.el.matches(".edit_grid > .clients_eyebrow,.edit_overlap .edit-label--bottom"))&&!s.section.querySelector('.marquee_advanced_logo')&&!s.el.closest('#services'));
    const serviceCandidate=page.querySelector('#services .section_header .u-text-muted-label');
    const serviceLabel=serviceCandidate?.closest(bottomLabels)?null:serviceCandidate;
    const serviceMedia=page.querySelector('#services .services_sticky_media');
    if(!labels.length&&!serviceLabel)return;
    let serviceNatural=0,serviceLabelStyle=serviceLabel?.style.translate||'';
    const measureService=()=>{if(serviceMedia){const box=serviceMedia.closest('.services__media-container');serviceNatural=(box||serviceMedia).getBoundingClientRect().top+scrollY;}};
    measureService();ScrollTrigger.addEventListener('refresh',measureService);
    let frozen=false;
    const tick=()=>{
      if(frozen)return;
      const top=8*parseFloat(getComputedStyle(document.documentElement).fontSize);
      const positions=labels.map(s=>{
        const r=s.el.getBoundingClientRect(),natural=r.top-s.offset;
        const boundary=labels.find(label=>label.el===s.end);
        const endBox=s.end?.getBoundingClientRect();
        const clients=s.el.matches('.clients_eyebrow');
        const end=endBox?(clients?endBox.bottom:endBox.top-(boundary?.offset||0)):s.section.getBoundingClientRect().bottom;
        const travel=Math.max(0,end-natural-r.height-(clients?0:40));
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
        // Later section labels share their heading's baseline; their native
        // placement must not gain an independent scroll displacement.
        if (el.closest(bottomLabels)) {el.removeAttribute("data-site-eased-sticky");return;}
        if (!page.contains(el) || el.closest(".pin-spacer,[data-footer-parallax],[data-scroll-next-wrap],[data-horizontal-section],.footer_wrap,.footer_sticky") || el.hasAttribute("data-home-scroll")) return;
        if (getComputedStyle(el).position === "sticky") el.setAttribute("data-site-eased-sticky", "");
      }));
      stickies = library.sticky.all("[data-site-eased-sticky]", {
        ease: "expo",
        distance: .45,
        engine: "main",
        media: "(min-width:62rem) and (hover:hover) and (pointer:fine)",
        ticker: fn => {
          gsap.ticker.add(fn);
          return () => gsap.ticker.remove(fn);
        }
      });
    }
    mountSectionLabels(page);
  }
  document.addEventListener("click", (event => {
    const arrow = event.target.closest(".scroll_arrow_mask");
    if (!arrow || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const page = arrow.closest('[data-barba="container"]');
    if (!page) return;
    let selector = arrow.getAttribute("data-anchor-target") || arrow.getAttribute("href"), target;
    if (!matchMedia("(min-width:62rem)").matches && selector === "#showreel") selector = "#about";
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
    const nav = document.querySelector(".sitenav_bar"), offset = !matchMedia("(min-width:62rem)").matches ? -(nav?.getBoundingClientRect().bottom || 80) - 24 : 0;
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
        sectionLabels?.destroy();sectionLabels=null;
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

gsap.registerPlugin(CustomEase), CustomEase.create("osmo", "0.625, 0.05, 0, 1"), 
CustomEase.create("parallax", "0.7, 0.05, 0.13, 1"), gsap.defaults({
  ease: "osmo",
  duration: .6
}), history.scrollRestoration = "manual";

const hasLenis = void 0 !== window.Lenis, hasScrollTrigger = void 0 !== window.ScrollTrigger, rmMQ = window.matchMedia("(prefers-reduced-motion: reduce)");

let reducedMotion = rmMQ.matches;

const syncMotionPreference = event => {
  reducedMotion = event.matches;
  initLenis();
  if (hasScrollTrigger) ScrollTrigger.refresh();
};
if (rmMQ.addEventListener) rmMQ.addEventListener("change", syncMotionPreference);
else rmMQ.addListener(syncMotionPreference);

const navEntry = performance.getEntriesByType("navigation")[0], navType = navEntry ? navEntry.type : "navigate";

let lenis = null, isPopstate = false;

const SCROLL_STORAGE_KEY = "osmo_scroll_positions";

function getScrollPositions() {
  try {
    return JSON.parse(sessionStorage.getItem(SCROLL_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveScrollPosition(t, e) {
  const n = getScrollPositions();
  n[t] = e;
  try {
    sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(n));
  } catch {}
}

function getSavedScroll(t) {
  return getScrollPositions()[t] || 0;
}

function getCurrentScroll() {
  return lenis ? Math.round(lenis.scroll) : window.scrollY;
}

function initScrollSaver() {
  let t;
  const e = () => {
    clearTimeout(t), t = setTimeout((() => {
      saveScrollPosition(window.location.href, getCurrentScroll());
    }), 150);
  };
  window.addEventListener("scroll", e, {
    passive: !0
  }), window.addEventListener("beforeunload", (() => {
    saveScrollPosition(window.location.href, getCurrentScroll());
  }));
}

const desktopScroll = matchMedia("(min-width:62rem) and (hover:hover) and (pointer:fine)");

const lenisTick = time => lenis?.raf(time * 1e3);

function initLenis() {
  if (!desktopScroll.matches || reducedMotion) {
    if (lenis) {
      lenis.destroy();
      lenis = null;
      gsap.ticker.remove(lenisTick);
    }
    return;
  }
  if (!lenis && hasLenis) {
    lenis = new Lenis({
      lerp: .165,
      wheelMultiplier: 1.25,
      syncTouch: false
    });
    if (hasScrollTrigger) lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(lenisTick);
    gsap.ticker.lagSmoothing(0);
    if (document.documentElement.hasAttribute("data-transitioning") ||
        document.documentElement.hasAttribute("data-loader-active") ||
        document.querySelector('[data-mini-showreel-player][data-mini-showreel-status="active"]')) lenis.stop();
  }
}

desktopScroll.addEventListener("change", initLenis);

if (hasScrollTrigger) ScrollTrigger.config({
  ignoreMobileResize: true
});

function closeMenuIfOpen() {
  const t = document.querySelector("#nav-toggle");
  return !!t?.checked && (t.checked = !1, t.dispatchEvent(new Event("change", {
    bubbles: !0
  })), !0);
}

function freezeContainer(t) {
  window.JKFooter?.freeze(t);
  const e = getCurrentScroll();
  lenis && lenis.stop(), gsap.set(t, {
    position: "fixed",
    top: -e,
    left: 0,
    right: 0
  }), window.scrollTo(0, 0);
}

function resetPage(t, e) {
  e = e ?? 0, gsap.set(t, {
    clearProps: "position,top,left,right"
  }), window.scrollTo(0, e), lenis && (lenis.scrollTo(e, {
    immediate: !0
  }), lenis.resize(), lenis.start()), hasScrollTrigger && ScrollTrigger.refresh();
}

function debounceOnWidthChange(t, e) {
  let n, r = innerWidth;
  return function(...o) {
    clearTimeout(n), n = setTimeout((() => {
      innerWidth !== r && (r = innerWidth, t.apply(this, o));
    }), e);
  };
}

const themeConfig = {
  light: {
    nav: "dark",
    transition: "light"
  },
  dark: {
    nav: "light",
    transition: "dark"
  }
};

function applyThemeFrom(t) {
  const e = t?.dataset?.pageTheme || "light", n = themeConfig[e] || themeConfig.light;
  document.body.dataset.pageTheme = e;
  const r = document.querySelector("[data-theme-transition]");
  r && (r.dataset.themeTransition = n.transition);
  const o = document.querySelector("[data-theme-nav]");
  o && (o.dataset.themeNav = n.nav);
}

function syncNavState(path = location.pathname) {
  for (const link of document.querySelectorAll('a[data-barba-update][href^="/"]')) {
    const target = new URL(link.href, location.href);
    const current = target.origin === location.origin && target.pathname === path;
    link.classList.toggle("w--current", current);
    if (current) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
}

function initOnceFunctions() {
  initLenis();
  initScrollSaver();
}

function initBeforeEnterFunctions(t) {
  t?.querySelectorAll('.case_details_row').forEach(row=>{
    const value=row.querySelector('.case_meta_value');
    row.style.display=value && !value.textContent.trim() ? 'none' : '';
  });
  const page = t || document;
  if (page.querySelector(".projects_wrap")) initWorkSlider(page);
}

function initAfterEnterFunctions(t) {
  initServices(t || document);
  lenis?.resize();
  if (hasScrollTrigger) ScrollTrigger.refresh();
}

// Shared with the page stack: one parallax curve, duration and grey wash.
const PARALLAX_MOTION={duration:1.2,ease:'parallax',overlay:.8};
function finishLoaderCover(){
  document.documentElement.removeAttribute('data-loader-pending');
  document.documentElement.removeAttribute('data-loader-active');
  document.dispatchEvent(new CustomEvent('jk:loader-finished'));
}
function runPageOnceAnimation(page) {
  const y=navType==='reload'?getSavedScroll(location.href):0;
  page.dataset.restoreScroll=String(y>0);
  const wrap=document.querySelector('[data-load-wrap]');
  if(!wrap || reducedMotion || navType==='back_forward') {
    if(wrap)gsap.set(wrap,{display:'none'});
    finishLoaderCover();return gsap.timeline().call(()=>resetPage(page,y));
  }
  const bar=wrap.querySelector('[data-load-progress]'),content=wrap.querySelector('[data-load-container]'),bg=wrap.querySelector('[data-load-bg]')||wrap.querySelector('.loader_panel');
  if(!bar||!content||!bg){finishLoaderCover();return gsap.timeline().set(wrap,{display:'none'}).call(()=>resetPage(page,y));}
  CustomEase.create('loader','0.65, 0.01, 0.05, 0.99');
  content.replaceChildren();bar.replaceChildren();
  const logoWrap=document.createElement('div');logoWrap.className='loader_logo';
  const base=document.createElement('div'),fill=document.createElement('div');
  base.className='nav_wordmark loader_logo_wordmark loader_logo_base';fill.className='nav_wordmark loader_logo_wordmark loader_logo_fill';fill.dataset.loadLogo='';
  base.textContent=fill.textContent='Jamie Keaveney';logoWrap.append(base,fill);
  const texts=document.createElement('div');texts.className='loader_messages';
  ['Hold tight','Hi there!'].forEach(label=>{const text=document.createElement('span');text.textContent=label;text.className='loader_messages_message';text.dataset.loadText='';text.dataset.loadReset='';texts.append(text);});
  content.append(logoWrap,texts);
  const overlay=document.createElement('div');overlay.className='loader_reveal_overlay';
  overlay.setAttribute('aria-hidden','true');wrap.prepend(overlay);wrap.append(bar);
  const splits=[...texts.children].map(el=>new SplitText(el,{type:'lines',mask:'lines'}));
  for (const text of texts.children) text.firstElementChild?.classList.add('loader_messages_mask');
  let finished=false;
  const preparePage=async()=>{
    await (document.fonts?.ready||Promise.resolve());
    if(finished)return;
    gsap.set(page,{clearProps:'position,top,left,right'});
    document.dispatchEvent(new CustomEvent('jk:loader-prepare',{detail:{page}}));
    initAfterEnterFunctions(page);
    if(y>0)window.JKReveals?.restore(page,y);
    window.scrollTo(0,y);lenis?.resize();lenis?.scrollTo(y,{immediate:true,force:true});
    ScrollTrigger.refresh();ScrollTrigger.update();
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    if(finished)return;
    // Footer font metrics and pin spacers settle while the opaque curtain is up.
    window.JKFooter?.refresh(page);lenis?.resize();
    window.scrollTo(0,y);lenis?.scrollTo(y,{immediate:true,force:true});ScrollTrigger.update();
    window.JKFooter?.refresh(page);
    window.JKHeader?.syncPosition();
  };
  const finish=()=>{
    if(finished)return;finished=true;
    gsap.set(page,{clearProps:'transform'});page.removeAttribute('data-loader-revealing');
    window.JKFooter?.refresh(page);overlay.remove();splits.forEach(s=>s.revert());
    gsap.set(wrap,{display:'none'});document.documentElement.style.overflow='';document.body.style.overflow='';
    lenis?.resize();lenis?.start();finishLoaderCover();
  };
  gsap.set(wrap,{display:'block',autoAlpha:1,background:'transparent'});
  gsap.set(bg,{yPercent:0,autoAlpha:1,clipPath:'inset(0% 0% 0% 0%)',backgroundColor:'var(--loader-surface)'});
  const sweepHeight=8;
  gsap.set(bar,{scaleX:0,scaleY:1,height:sweepHeight,y:0,yPercent:0,clipPath:'none',backgroundColor:getComputedStyle(wrap).getPropertyValue('--loader-ink').trim() || '#fff',transformOrigin:'left bottom'});
  gsap.set(content,{autoAlpha:1,y:0});gsap.set(fill,{clipPath:'inset(0% 100% 0% 0%)'});
  gsap.set(splits.flatMap(s=>s.lines),{yPercent:125});gsap.set(texts.children,{autoAlpha:1});
  document.documentElement.setAttribute('data-loader-active','');
  document.documentElement.removeAttribute('data-loader-pending');
  lenis?.stop();document.documentElement.style.overflow='hidden';document.body.style.overflow='hidden';
  page.setAttribute('data-loader-revealing','');
  const prepared=preparePage();
  const border=Math.max(1,parseFloat(getComputedStyle(wrap).getPropertyValue('--loader-border-width'))||1);
  const tl=gsap.timeline({defaults:{ease:'loader',duration:3},onComplete:finish,onInterrupt:finish})
    .to(bar,{scaleX:1}).to(fill,{clipPath:'inset(0% 0% 0% 0%)'},'<')
    .add('collapse').addPause('collapse',()=>prepared.then(()=>{if(!finished)tl.resume();}))
    .to(bar,{scaleY:border/sweepHeight,duration:.8,ease:'expo.out'},'collapse')
    .to(bar,{backgroundColor:getComputedStyle(bar).getPropertyValue('--_theme---neutral--600').trim(),duration:.8,ease:'none'},'collapse')
    .add('revealPage')
    .to(content,{y:'-25vh',autoAlpha:0,duration:PARALLAX_MOTION.duration,ease:PARALLAX_MOTION.ease},'revealPage')
    .to(bg,{clipPath:'inset(0% 0% 100% 0%)',duration:PARALLAX_MOTION.duration,ease:PARALLAX_MOTION.ease},'revealPage')
    .to(bar,{y:()=>-innerHeight+border,duration:PARALLAX_MOTION.duration,ease:PARALLAX_MOTION.ease},'revealPage')
    .to(bar,{scaleY:0,opacity:0,duration:.4,ease:'sine.inOut'},'revealPage+='+PARALLAX_MOTION.duration)
    .fromTo(page,{y:'12vh'},{y:0,duration:PARALLAX_MOTION.duration,ease:PARALLAX_MOTION.ease,immediateRender:false},'revealPage')
    .fromTo(overlay,{opacity:PARALLAX_MOTION.overlay},{opacity:0,duration:PARALLAX_MOTION.duration,ease:PARALLAX_MOTION.ease},'revealPage');
  tl.call(()=>document.dispatchEvent(new Event('jk:nav-reveal')),null,'revealPage+=.85');
  tl.to(splits[0].lines,{yPercent:0,duration:1,ease:'expo.out'},0)
    .to(splits[0].lines,{yPercent:-125,duration:1,ease:'expo.out'},1.45)
    .to(splits[1].lines,{yPercent:0,duration:1,ease:'expo.out'},1.6)
    .to(splits[1].lines,{yPercent:-125,duration:1,ease:'expo.out'},'revealPage-=.2');
  return tl;
}

function runPageLeaveAnimation(t) {
  const e = document.querySelector("[data-transition-wrap]"), n = e.querySelector("[data-transition-dark]"), r = gsap.timeline({
    onComplete: () => t.remove()
  });
  return closeMenuIfOpen(), reducedMotion ? r.set(t, {
    autoAlpha: 0
  }) : (r.set(e, {
    zIndex: 2
  }), r.fromTo(n, {
    autoAlpha: 0
  }, {
    autoAlpha: PARALLAX_MOTION.overlay,
    duration: PARALLAX_MOTION.duration,
    ease: PARALLAX_MOTION.ease
  }, 0), r.fromTo(t, {
    y: "0vh"
  }, {
    y: "-25vh",
    duration: 1.2,
    ease: "parallax"
  }, 0), r.set(n, {
    autoAlpha: 0
  }), r);
}

function runPageEnterAnimation(t, restoreY) {
  const e = gsap.timeline(), n = restoreY ?? 0;
  if (restoreY != null || isPopstate) gsap.set(t, {
    top: -n
  });
  return reducedMotion ? (e.set(t, {
    autoAlpha: 1
  }), e.add("pageReady"), e.call(resetPage, [ t, n ], "pageReady"), new Promise((t => e.call(t, null, "pageReady")))) : (e.set(t, {
    zIndex: 3
  }), e.fromTo(t, {
    y: "100vh"
  }, {
    y: "0vh",
    duration: 1.2,
    clearProps: "transform,opacity,visibility,zIndex",
    ease: "parallax"
  }, 0), e.add("pageReady"), e.call(resetPage, [ t, n ], "pageReady"), new Promise((t => e.call(t, null, "pageReady"))));
}

// Barba updates the document title. Carry the other page-specific head fields
// through client navigation without executing scripts from the incoming page.
function syncPageMetadata(html) {
  if (!html) return;
  const head = html.match(/<head(?:\s[^>]*)?>([\s\S]*?)<\/head>/i);
  if (!head) return;
  const incoming = new DOMParser().parseFromString(head[0], 'text/html').head;
  const fields = 'meta[name="description" i],meta[name="robots" i],meta[property^="og:" i],meta[name^="twitter:" i],meta[property^="twitter:" i],link[rel~="canonical" i]';
  document.head.querySelectorAll(fields).forEach(node => node.remove());
  incoming.querySelectorAll(fields).forEach(node => document.head.append(document.importNode(node, true)));
}

barba.hooks.before((t => {
  closeMenuIfOpen();
  isPopstate = ["popstate", "back", "forward"].includes(t.trigger), saveScrollPosition(t.current.url.href, getCurrentScroll()), 
  freezeContainer(t.current.container), document.documentElement.setAttribute("data-transitioning", "");
  document.documentElement.classList.add("page_shell_transitioning");
})), barba.hooks.beforeEnter((t => {
  syncPageMetadata(t.next.html);
  gsap.set(t.next.container, {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0
  }), initBeforeEnterFunctions(t.next.container), applyThemeFrom(t.next.container);
})), barba.hooks.afterLeave((() => {
  hasScrollTrigger && ScrollTrigger.getAll().forEach((t => t.kill()));
})), barba.hooks.enter(t => syncNavState(t.next.url.path)), barba.hooks.afterEnter((t => {
  initAfterEnterFunctions(t.next.container), lenis && (lenis.resize(), lenis.start()), 
  hasScrollTrigger && ScrollTrigger.refresh();
})), barba.hooks.after((() => {
  isPopstate = false;
  document.documentElement.removeAttribute("data-transitioning");
  document.documentElement.classList.remove("page_shell_transitioning");
}));

function startPortfolio() {
  syncNavState();
  // Utility pages such as the Style Guide are outside the transition shell.
  if (!document.querySelector('[data-barba="wrapper"]')) {finishLoaderCover();return;}
  barba.init({
    debug: !1,
    timeout: 7e3,
    preventRunning: !0,
    transitions: [ {
      name: "default",
      sync: !0,
      once: async t => (initOnceFunctions(), runPageOnceAnimation(t.next.container)),
      leave: async t => runPageLeaveAnimation(t.current.container),
      enter: async t => runPageEnterAnimation(t.next.container)
    } ]
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startPortfolio, {
  once: true
}); else startPortfolio();

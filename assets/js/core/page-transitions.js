gsap.registerPlugin(CustomEase), CustomEase.create("osmo", "0.625, 0.05, 0, 1"), 
CustomEase.create("parallax", "0.7, 0.05, 0.13, 1"), gsap.defaults({
  ease: "osmo",
  duration: .6
}), history.scrollRestoration = "manual";

const hasLenis = void 0 !== window.Lenis, hasScrollTrigger = void 0 !== window.ScrollTrigger, rmMQ = window.matchMedia("(prefers-reduced-motion: reduce)");

let reducedMotion = rmMQ.matches;

rmMQ.addEventListener?.("change", (t => reducedMotion = t.matches)), rmMQ.addListener?.((t => reducedMotion = t.matches));

const navEntry = performance.getEntriesByType("navigation")[0], navType = navEntry ? navEntry.type : "navigate";

let lenis = null, nextPage = document, onceFunctionsInitialized = !1, flipState = null, flippedThumbnail = null, skipPageTransition = !1, isPopstate = !1, staggerDefault = .05, durationDefault = .6;

const has = t => !!nextPage.querySelector(t), SCROLL_STORAGE_KEY = "osmo_scroll_positions";

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

const desktopScroll = matchMedia("(min-width:992px) and (hover:hover) and (pointer:fine)");

const lenisTick = time => lenis?.raf(time * 1e3);

function initLenis() {
  if (!desktopScroll.matches) {
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

function syncNavState(t) {
  const e = document.createElement("template");
  e.innerHTML = t.next.html.trim();
  const n = e.content.querySelectorAll("[data-barba-update]");
  document.querySelectorAll("nav [data-barba-update]").forEach(((t, e) => {
    const r = n[e];
    if (!r) return;
    const o = r.getAttribute("aria-current");
    null !== o ? t.setAttribute("aria-current", o) : t.removeAttribute("aria-current"), 
    t.setAttribute("class", r.getAttribute("class") || "");
  }));
}

function initOnceFunctions() {
  initLenis(), initScrollSaver(), onceFunctionsInitialized || (onceFunctionsInitialized = !0);
}

function initBeforeEnterFunctions(t) {
  t?.querySelectorAll('.project-hero__meta-cell,.case-details__row').forEach(row=>{
    const value=row.querySelector('.case-meta-value');
    row.style.display=value && !value.textContent.trim() ? 'none' : '';
  });
  nextPage = t || document, has(".work") && initWorkSlider(nextPage);
}

function initAfterEnterFunctions(t) {
  nextPage = t || document, has(".scroll-1_component") && initScroll1(nextPage), lenis && lenis.resize(), 
  hasScrollTrigger && ScrollTrigger.refresh();
}

function runPageOnceAnimation(page) {
  const y=navType!=='navigate'?getSavedScroll(location.href):0;
  const wrap=document.querySelector('[data-load-wrap]');
  if(!wrap || reducedMotion || navType==='back_forward') {
    if(wrap)gsap.set(wrap,{display:'none'});
    return gsap.timeline().call(()=>resetPage(page,y));
  }
  const bar=wrap.querySelector('[data-load-progress]'),content=wrap.querySelector('[data-load-container]'),bg=wrap.querySelector('[data-load-bg]')||wrap.querySelector('.loader-panel');
  if(!bar||!content||!bg)return gsap.timeline().set(wrap,{display:'none'}).call(()=>resetPage(page,y));
  CustomEase.create('loader','0.65, 0.01, 0.05, 0.99');
  content.replaceChildren();bar.replaceChildren();
  const logoWrap=document.createElement('div');logoWrap.className='loader-logo';
  const base=document.createElement('div'),fill=document.createElement('div');
  base.className='sitenav__wordmark loader-logo__base';fill.className='sitenav__wordmark loader-logo__fill';fill.dataset.loadLogo='';
  base.textContent=fill.textContent='Jamie Keaveney';logoWrap.append(base,fill);
  const texts=document.createElement('div');texts.className='loader-messages';
  ['Hold tight','Hi there!'].forEach(label=>{const text=document.createElement('span');text.textContent=label;text.dataset.loadText='';text.dataset.loadReset='';texts.append(text);});
  content.append(logoWrap,texts);
  const welcome=document.createElement('div');welcome.className='loader-welcome';
  const welcomeText=document.createElement('span');welcomeText.className='sitenav__wordmark';welcomeText.textContent='Welcome';welcome.append(welcomeText);bar.append(welcome);
  const splits=[...texts.children].map(el=>new SplitText(el,{type:'lines,chars',mask:'lines'}));
  const finish=()=>{gsap.set(wrap,{display:'none'});gsap.set(page,{clearProps:'transform'});document.documentElement.style.overflow='';document.body.style.overflow='';resetPage(page,y);};
  gsap.set(wrap,{display:'block',autoAlpha:1,background:'transparent'});
  gsap.set(bg,{yPercent:0,autoAlpha:1,backgroundColor:'#000'});gsap.set(bar,{scaleX:0,height:8,yPercent:0,transformOrigin:'left center'});gsap.set(welcomeText,{autoAlpha:0,y:18});
  gsap.set(content,{autoAlpha:1});gsap.set(fill,{clipPath:'inset(0% 100% 0% 0%)'});
  gsap.set(splits.flatMap(s=>s.chars),{autoAlpha:0,yPercent:125});gsap.set(texts.children,{autoAlpha:1});
  lenis?.stop();document.documentElement.style.overflow='hidden';document.body.style.overflow='hidden';
  const tl=gsap.timeline({defaults:{ease:'loader',duration:3},onComplete:finish,onInterrupt:finish})
    .to(bar,{scaleX:1})
    .to(fill,{clipPath:'inset(0% 0% 0% 0%)'},'<')
    .add('hideContent')
    .to(content,{y:'-20vh',autoAlpha:0,duration:1.05},'hideContent')
    .to(bar,{height:'100dvh',duration:1.05},'hideContent')
    .to(welcomeText,{autoAlpha:1,y:0,duration:.65},'hideContent+=.45')
    .set(bg,bg.contains(bar)?{backgroundColor:'transparent'}:{autoAlpha:0},'hideContent+=1.05')
    .add('revealPage','hideContent+=1.45')
    .to(bar,{yPercent:-101,duration:1.2},'revealPage')
    .to(welcomeText,{y:'-12vh',duration:1.2},'revealPage')
    .fromTo(page,{y:'12vh'},{y:0,duration:1.2,clearProps:'transform'},'revealPage');
  tl.to(splits[0].chars,{autoAlpha:1,yPercent:0,duration:.6,stagger:{each:.02}},0)
    .to(splits[0].chars,{autoAlpha:0,yPercent:-125,duration:.4,stagger:{each:.02}},'>+=0.4')
    .to(splits[1].chars,{autoAlpha:1,yPercent:0,duration:.6,stagger:{each:.02}},'<')
    .to(splits[1].chars,{autoAlpha:0,yPercent:-125,duration:.4,stagger:{each:.02}},'hideContent-=0.5');
  return tl;
}

function runPageLeaveAnimation(t) {
  const e = document.querySelector("[data-transition-wrap]"), n = e.querySelector("[data-transition-dark]"), r = gsap.timeline({
    onComplete: () => t.remove()
  });
  return closeMenuIfOpen(), reducedMotion || skipPageTransition ? r.set(t, {
    autoAlpha: 0
  }) : (r.set(e, {
    zIndex: 2
  }), r.fromTo(n, {
    autoAlpha: 0
  }, {
    autoAlpha: .8,
    duration: 1.2,
    ease: "parallax"
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
  const e = gsap.timeline(), n = restoreY ?? (isPopstate ? getSavedScroll(window.location.href) : 0);
  if (restoreY != null || isPopstate) gsap.set(t, {
    top: -n
  });
  return reducedMotion || skipPageTransition ? (skipPageTransition = !1, e.set(t, {
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

function runWorkLeaveAnimation(t, e, n) {
  const r = n.closest("[data-case-link]").querySelector("[data-case-thumbnail]"), o = e.querySelector(".section");
  flipState = Flip.getState(r), flippedThumbnail = r;
  const a = gsap.timeline({
    onComplete: () => t.remove()
  });
  return closeMenuIfOpen(), reducedMotion ? a.set(t, {
    autoAlpha: 0
  }) : (a.to(t, {
    autoAlpha: 0,
    duration: .6
  }, 0), a.set(o, {
    backgroundColor: "transparent"
  }, 0), a);
}

function runCaseEnterAnimation(t) {
  const e = t.querySelector(".section"), n = e.querySelectorAll("[data-case-reveal]"), r = isPopstate ? getSavedScroll(window.location.href) : 0, o = gsap.timeline();
  if (reducedMotion) return flippedThumbnail = null, flipState = null, o.set(t, {
    autoAlpha: 1
  }), o.add("pageReady"), o.call(resetPage, [ t, r ], "pageReady"), new Promise((t => o.call(t, null, "pageReady")));
  const a = t.querySelector("[data-case-thumbnail]");
  return a.parentNode.insertBefore(flippedThumbnail, a), a.remove(), o.add(Flip.from(flipState, {
    duration: .8
  }), 0), o.add("startEnter", .6), o.fromTo(e, {
    backgroundColor: "transparent"
  }, {
    backgroundColor: "#FFF",
    duration: .5
  }, "startEnter"), o.fromTo(n, {
    autoAlpha: 0,
    yPercent: 25
  }, {
    autoAlpha: 1,
    yPercent: 0,
    stagger: .1
  }, "startEnter+=0.1"), o.add("pageReady"), o.call(resetPage, [ t, r ], "pageReady"), 
  o.call((() => {
    flippedThumbnail = null, flipState = null;
  })), new Promise((t => o.call(t, null, "pageReady")));
}

barba.hooks.before((t => {
  closeMenuIfOpen();
  isPopstate = ["popstate", "back", "forward"].includes(t.trigger), saveScrollPosition(t.current.url.href, getCurrentScroll()), 
  freezeContainer(t.current.container), document.documentElement.setAttribute("data-transitioning", "");
})), barba.hooks.beforeEnter((t => {
  gsap.set(t.next.container, {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0
  }), initBeforeEnterFunctions(t.next.container), applyThemeFrom(t.next.container);
})), barba.hooks.afterLeave((() => {
  hasScrollTrigger && ScrollTrigger.getAll().forEach((t => t.kill()));
})), barba.hooks.enter((t => syncNavState(t))), barba.hooks.afterEnter((t => {
  initAfterEnterFunctions(t.next.container), lenis && (lenis.resize(), lenis.start()), 
  hasScrollTrigger && ScrollTrigger.refresh();
})), barba.hooks.after((() => {
  isPopstate = !1, skipPageTransition = !1, document.documentElement.removeAttribute("data-transitioning");
}));

function startPortfolio() {
  barba.init({
    debug: !1,
    timeout: 7e3,
    preventRunning: !0,
    transitions: [ {
      name: "work-to-case",
      sync: !0,
      from: {
        namespace: [ "work" ]
      },
      to: {
        namespace: [ "case" ]
      },
      custom: ({trigger: t}) => "string" != typeof t && t.hasAttribute("data-case-link"),
      leave: async t => runWorkLeaveAnimation(t.current.container, t.next.container, t.trigger),
      enter: async t => runCaseEnterAnimation(t.next.container)
    }, {
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

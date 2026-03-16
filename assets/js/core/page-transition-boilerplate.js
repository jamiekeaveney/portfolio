// -----------------------------------------
// OSMO PAGE TRANSITION BOILERPLATE
// -----------------------------------------

gsap.registerPlugin(CustomEase);
CustomEase.create("osmo", "0.625, 0.05, 0, 1");
CustomEase.create("parallax", "0.7, 0.05, 0.13, 1");
gsap.defaults({ ease: "osmo", duration: 0.6 });

history.scrollRestoration = "manual";



// -----------------------------------------
// ENVIRONMENT
// -----------------------------------------

const hasLenis = typeof window.Lenis !== "undefined";
const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";

const rmMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = rmMQ.matches;
rmMQ.addEventListener?.("change", e => (reducedMotion = e.matches));
rmMQ.addListener?.(e => (reducedMotion = e.matches));

const navEntry = performance.getEntriesByType("navigation")[0];
const navType = navEntry ? navEntry.type : "navigate";
// "navigate" = first visit | "reload" = refresh | "back_forward" = browser arrows caused full reload



// -----------------------------------------
// STATE
// -----------------------------------------

let lenis = null;
let nextPage = document;
let onceFunctionsInitialized = false;

let flipState = null;
let flippedThumbnail = null;

let skipPageTransition = false;
let isPopstate = false;

let staggerDefault = 0.05;
let durationDefault = 0.6;

const has = (s) => !!nextPage.querySelector(s);



// -----------------------------------------
// SCROLL PERSISTENCE
// -----------------------------------------

const SCROLL_STORAGE_KEY = "osmo_scroll_positions";

function getScrollPositions() {
  try { return JSON.parse(sessionStorage.getItem(SCROLL_STORAGE_KEY)) || {}; }
  catch { return {}; }
}

function saveScrollPosition(url, y) {
  const map = getScrollPositions();
  map[url] = y;
  try { sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(map)); }
  catch { /* storage full */ }
}

function getSavedScroll(url) {
  return getScrollPositions()[url] || 0;
}

function getCurrentScroll() {
  return lenis ? Math.round(lenis.scroll) : window.scrollY;
}

function initScrollSaver() {
  let timer;
  const save = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      saveScrollPosition(window.location.href, getCurrentScroll());
    }, 150);
  };

  if (lenis) lenis.on("scroll", save);
  else window.addEventListener("scroll", save, { passive: true });

  // Capture exact position on refresh / tab close
  window.addEventListener("beforeunload", () => {
    saveScrollPosition(window.location.href, getCurrentScroll());
  });
}



// -----------------------------------------
// LENIS
// -----------------------------------------

function initLenis() {
  if (lenis || !hasLenis) return;

  lenis = new Lenis({ lerp: 0.165, wheelMultiplier: 1.25 });

  if (hasScrollTrigger) lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}



// -----------------------------------------
// HELPERS
// -----------------------------------------

function closeMenuIfOpen() {
  const toggle = document.querySelector("#nav-toggle");
  if (toggle?.checked) { toggle.checked = false; return true; }
  return false;
}

/**
 * Pin the outgoing container at its current scroll offset
 * so native scroll can be zeroed without a visual jump.
 */
function freezeContainer(el) {
  const scroll = getCurrentScroll();
  if (lenis) lenis.stop();

  gsap.set(el, {
    position: "fixed",
    top: -scroll,
    left: 0,
    right: 0,
  });

  window.scrollTo(0, 0);
}

/**
 * Settle a page after transition completes.
 */
function resetPage(container, targetScroll) {
  targetScroll = targetScroll ?? 0;

  gsap.set(container, { clearProps: "position,top,left,right" });
  window.scrollTo(0, targetScroll);

  if (lenis) {
    lenis.scrollTo(targetScroll, { immediate: true });
    lenis.resize();
    lenis.start();
  }

  if (hasScrollTrigger) ScrollTrigger.refresh();
}

function debounceOnWidthChange(fn, ms) {
  let last = innerWidth, timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (innerWidth !== last) { last = innerWidth; fn.apply(this, args); }
    }, ms);
  };
}



// -----------------------------------------
// THEME
// -----------------------------------------

const themeConfig = {
  light: { nav: "dark",  transition: "light" },
  dark:  { nav: "light", transition: "dark"  }
};

function applyThemeFrom(container) {
  const theme = container?.dataset?.pageTheme || "light";
  const cfg = themeConfig[theme] || themeConfig.light;

  document.body.dataset.pageTheme = theme;

  const t = document.querySelector("[data-theme-transition]");
  if (t) t.dataset.themeTransition = cfg.transition;

  const n = document.querySelector("[data-theme-nav]");
  if (n) n.dataset.themeNav = cfg.nav;
}



// -----------------------------------------
// NAV UPDATE (Barba)
// -----------------------------------------

function syncNavState(data) {
  const tpl = document.createElement("template");
  tpl.innerHTML = data.next.html.trim();
  const nextNodes = tpl.content.querySelectorAll("[data-barba-update]");
  const currNodes = document.querySelectorAll("nav [data-barba-update]");

  currNodes.forEach((curr, i) => {
    const next = nextNodes[i];
    if (!next) return;

    const aria = next.getAttribute("aria-current");
    if (aria !== null) curr.setAttribute("aria-current", aria);
    else curr.removeAttribute("aria-current");

    curr.setAttribute("class", next.getAttribute("class") || "");
  });
}



// -----------------------------------------
// FUNCTION REGISTRY
// -----------------------------------------

function initOnceFunctions() {
  initLenis();
  initScrollSaver();

  if (onceFunctionsInitialized) return;
  onceFunctionsInitialized = true;

  // Runs once on first load
  // if (has('[data-something]')) initSomething();
}

function initBeforeEnterFunctions(next) {
  nextPage = next || document;

  // Runs before the enter animation
  if (has(".slider")) initSlider(nextPage);
}

function initAfterEnterFunctions(next) {
  nextPage = next || document;

  // Runs after enter animation completes
  if (has(".scroll-1_component")) initScroll1(nextPage);

  if (lenis) lenis.resize();
  if (hasScrollTrigger) ScrollTrigger.refresh();
}



// -----------------------------------------
// PAGE ONCE (First load / Refresh / Full-reload back-forward)
// -----------------------------------------

function runPageOnceAnimation(next) {
  const tl = gsap.timeline();

  // Determine where to scroll after the loader:
  //   - Refresh: restore saved position
  //   - Back/forward full reload: restore saved position, skip loader
  //   - First visit: top of page
  const restoreScroll = navType !== "navigate";
  const onceScroll = restoreScroll ? getSavedScroll(window.location.href) : 0;

  // Back/forward that caused a full page reload — skip the loader,
  // just settle the page at its saved position
  if (navType === "back_forward") {
    tl.call(() => {
      const wrap = document.querySelector('[data-loader="wrap"]');
      if (wrap) gsap.set(wrap, { display: "none", autoAlpha: 0, pointerEvents: "none" });
      resetPage(next, onceScroll);
    }, null, 0);
    return tl;
  }

  // Reduced motion or missing loader elements — settle immediately
  if (reducedMotion) {
    tl.call(() => resetPage(next, onceScroll), null, 0);
    return tl;
  }

  const wrap = document.querySelector('[data-loader="wrap"]');
  if (!wrap) {
    tl.call(() => resetPage(next, onceScroll), null, 0);
    return tl;
  }

  const panel = wrap.querySelector(".loader-panel");
  const bar   = wrap.querySelector("[data-loader-bar]");
  const block = wrap.querySelector("[data-loader-block]");
  const top   = wrap.querySelector("[data-loader-top]");
  const bot   = wrap.querySelector("[data-loader-bot]");

  if (!panel || !bar || !block || !top || !bot) {
    tl.call(() => resetPage(next, onceScroll), null, 0);
    return tl;
  }

  // --- Loader constants ---
  const FLIP_DUR     = 0.68;
  const FLIP_STAGGER = 0.07;
  const FLIP_PAD     = 0.02;
  const HOLD_DUR     = 0.25;
  const STEP_GAP     = 0.02;
  const FADE_DUR     = 0.5;

  const step1 = gsap.utils.random(25, 35, 1);
  const step2 = gsap.utils.random(65, 75, 1);

  // --- Loader helpers ---
  const makeDigits = (v) =>
    String(v).split("").map((c, i) =>
      `<span class="loader-digit" style="--d:${i}">${c}</span>`
    ).join("");

  const getFlipWait = (v) =>
    FLIP_DUR + (String(v).length - 1) * FLIP_STAGGER + FLIP_PAD;

  const getTravel = () => {
    const s = getComputedStyle(panel);
    const pt = parseFloat(s.paddingTop) || 0;
    const pb = parseFloat(s.paddingBottom) || 0;
    return Math.max(0, panel.clientHeight - pt - pb - block.getBoundingClientRect().height);
  };

  const setBlockY = (travel, pct) => {
    block.style.transform = `translate3d(0, ${-(travel * pct) / 100}px, 0)`;
  };

  const setStep = (v, travel) => {
    bot.innerHTML = makeDigits(v);
    block.classList.add("is-flipping");
    bar.style.width = v + "%";
    setBlockY(travel, v);
  };

  const commitStep = (v) => {
    top.innerHTML = makeDigits(v);
    bot.innerHTML = "";
    block.classList.remove("is-flipping");
  };

  const addFlipStep = (v, travel, gap) => {
    if (gap) tl.to({}, { duration: STEP_GAP });
    tl.call(() => setStep(v, travel));
    tl.to({}, { duration: getFlipWait(v) });
    tl.call(() => commitStep(v));
  };

  // --- Step 1: Lock page, set scroll behind loader, show loader ---
  tl.call(() => {
    if (lenis) lenis.stop();

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    gsap.set(next, { clearProps: "position,top,left,right" });
    window.scrollTo(0, onceScroll);
    if (lenis) {
      lenis.scrollTo(onceScroll, { immediate: true });
      lenis.resize();
    }

    gsap.set(wrap, { display: "block", autoAlpha: 1, pointerEvents: "auto" });

    top.innerHTML = makeDigits(0);
    bot.innerHTML = "";
    bar.style.width = "0%";
    block.classList.remove("is-flipping");
    setBlockY(getTravel(), 0);
  });

  // --- Step 2: Animate the counter ---
  tl.to({}, { duration: HOLD_DUR });

  const travel = getTravel();
  addFlipStep(step1, travel, false);
  addFlipStep(step2, travel, true);
  addFlipStep(100, travel, true);

  tl.to({}, { duration: HOLD_DUR });

  // --- Step 3: Fade out loader, unlock page ---
  tl.to(wrap, { autoAlpha: 0, duration: FADE_DUR, ease: "power2.out" });

  tl.call(() => {
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";

    gsap.set(wrap, { display: "none", autoAlpha: 0, pointerEvents: "none" });

    block.classList.remove("is-flipping");
    block.style.transform = "";
    bar.style.width = "0%";
    top.innerHTML = makeDigits(0);
    bot.innerHTML = "";

    if (lenis) lenis.start();
    if (hasScrollTrigger) ScrollTrigger.refresh();
  });

  return tl;
}



// -----------------------------------------
// DEFAULT PAGE TRANSITIONS
// -----------------------------------------

function runPageLeaveAnimation(current) {
  const transitionWrap = document.querySelector("[data-transition-wrap]");
  const transitionDark = transitionWrap.querySelector("[data-transition-dark]");

  const tl = gsap.timeline({ onComplete: () => current.remove() });

  if (closeMenuIfOpen()) skipPageTransition = true;

  if (reducedMotion || skipPageTransition) {
    return tl.set(current, { autoAlpha: 0 });
  }

  tl.set(transitionWrap, { zIndex: 2 });

  tl.fromTo(transitionDark,
    { autoAlpha: 0 },
    { autoAlpha: 0.8, duration: 1.2, ease: "parallax" }, 0);

  tl.fromTo(current,
    { y: "0vh" },
    { y: "-25vh", duration: 1.2, ease: "parallax" }, 0);

  tl.set(transitionDark, { autoAlpha: 0 });

  return tl;
}

function runPageEnterAnimation(next) {
  const tl = gsap.timeline();
  const targetScroll = isPopstate ? getSavedScroll(window.location.href) : 0;

  if (reducedMotion || skipPageTransition) {
    skipPageTransition = false;
    tl.set(next, { autoAlpha: 1 });
    tl.add("pageReady");
    tl.call(resetPage, [next, targetScroll], "pageReady");
    return new Promise(resolve => tl.call(resolve, null, "pageReady"));
  }

  tl.set(next, { zIndex: 3 });

  tl.fromTo(next,
    { y: "100vh" },
    { y: "0vh", duration: 1.2, clearProps: "all", ease: "parallax" }, 0);

  tl.add("pageReady");
  tl.call(resetPage, [next, targetScroll], "pageReady");

  return new Promise(resolve => tl.call(resolve, null, "pageReady"));
}



// -----------------------------------------
// WORK ↔ CASE TRANSITIONS
// -----------------------------------------

function runWorkLeaveAnimation(current, next, trigger) {
  const clicked    = trigger.closest("[data-case-link]");
  const thumbnail  = clicked.querySelector("[data-case-thumbnail]");
  const nextHero   = next.querySelector(".section");

  flipState = Flip.getState(thumbnail);
  flippedThumbnail = thumbnail;

  const tl = gsap.timeline({ onComplete: () => current.remove() });

  closeMenuIfOpen();

  if (reducedMotion) return tl.set(current, { autoAlpha: 0 });

  tl.to(current, { autoAlpha: 0, duration: 0.6 }, 0);
  tl.set(nextHero, { backgroundColor: "transparent" }, 0);

  return tl;
}

function runCaseEnterAnimation(next) {
  const nextHero      = next.querySelector(".section");
  const revealTargets = nextHero.querySelectorAll("[data-case-reveal]");
  const targetScroll  = isPopstate ? getSavedScroll(window.location.href) : 0;

  const tl = gsap.timeline();

  if (reducedMotion) {
    flippedThumbnail = null;
    flipState = null;
    tl.set(next, { autoAlpha: 1 });
    tl.add("pageReady");
    tl.call(resetPage, [next, targetScroll], "pageReady");
    return new Promise(resolve => tl.call(resolve, null, "pageReady"));
  }

  const placeholder = next.querySelector("[data-case-thumbnail]");
  placeholder.parentNode.insertBefore(flippedThumbnail, placeholder);
  placeholder.remove();

  tl.add(Flip.from(flipState, { duration: 0.8 }), 0);

  tl.add("startEnter", 0.6);

  tl.fromTo(nextHero,
    { backgroundColor: "transparent" },
    { backgroundColor: "#FFF", duration: 0.5 }, "startEnter");

  tl.fromTo(revealTargets,
    { autoAlpha: 0, yPercent: 25 },
    { autoAlpha: 1, yPercent: 0, stagger: 0.1 }, "startEnter+=0.1");

  tl.add("pageReady");
  tl.call(resetPage, [next, targetScroll], "pageReady");
  tl.call(() => { flippedThumbnail = null; flipState = null; });

  return new Promise(resolve => tl.call(resolve, null, "pageReady"));
}



// -----------------------------------------
// BARBA HOOKS + INIT
// -----------------------------------------

barba.hooks.before(data => {
  isPopstate = data.trigger === "popstate";
  saveScrollPosition(data.current.url.href, getCurrentScroll());
  freezeContainer(data.current.container);
});

barba.hooks.beforeEnter(data => {
  gsap.set(data.next.container, {
    position: "fixed", top: 0, left: 0, right: 0,
  });
  initBeforeEnterFunctions(data.next.container);
  applyThemeFrom(data.next.container);
});

barba.hooks.afterLeave(() => {
  if (hasScrollTrigger) ScrollTrigger.getAll().forEach(t => t.kill());
});

barba.hooks.enter(data => syncNavState(data));

barba.hooks.afterEnter(data => {
  initAfterEnterFunctions(data.next.container);
  if (lenis) { lenis.resize(); lenis.start(); }
  if (hasScrollTrigger) ScrollTrigger.refresh();
});

barba.hooks.after(() => {
  isPopstate = false;
  skipPageTransition = false;
});

barba.init({
  debug: false,
  timeout: 7000,
  preventRunning: true,
  transitions: [
    {
      name: "work-to-case",
      sync: true,
      from: { namespace: ["work"] },
      to:   { namespace: ["case"] },
      custom: ({ trigger }) =>
        typeof trigger !== "string" && trigger.hasAttribute("data-case-link"),
      async leave(data) {
        return runWorkLeaveAnimation(data.current.container, data.next.container, data.trigger);
      },
      async enter(data) {
        return runCaseEnterAnimation(data.next.container);
      }
    },
    {
      name: "default",
      sync: true,
      async once(data) {
        initOnceFunctions();
        return runPageOnceAnimation(data.next.container);
      },
      async leave(data) {
        return runPageLeaveAnimation(data.current.container);
      },
      async enter(data) {
        return runPageEnterAnimation(data.next.container);
      }
    }
  ],
});



// -----------------------------------------
// YOUR FUNCTIONS GO BELOW HERE
// -----------------------------------------
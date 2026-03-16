// -----------------------------------------
// OSMO PAGE TRANSITION BOILERPLATE
// -----------------------------------------

gsap.registerPlugin(CustomEase);

history.scrollRestoration = "manual";

let lenis = null;
let nextPage = document;
let onceFunctionsInitialized = false;

let flipState = null;
let flippedThumbnail = null;

const hasLenis = typeof window.Lenis !== "undefined";
const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";

const rmMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = rmMQ.matches;
rmMQ.addEventListener?.("change", e => (reducedMotion = e.matches));
rmMQ.addListener?.(e => (reducedMotion = e.matches));

const has = (s) => !!nextPage.querySelector(s);

let staggerDefault = 0.05;
let durationDefault = 0.6;

CustomEase.create("osmo", "0.625, 0.05, 0, 1");
gsap.defaults({ ease: "osmo", duration: durationDefault });

// -----------------------------------------
// TRANSITION STATE
// -----------------------------------------

let skipPageTransition = false;
let isPopstate = false;

// Detect if this page load was a refresh or browser back/forward
// (as opposed to a fresh first visit)
const navEntry = performance.getEntriesByType("navigation")[0];
const isReloadOrBackForward = navEntry && (navEntry.type === "reload" || navEntry.type === "back_forward");

// Persist scroll positions in sessionStorage so they survive refresh
const SCROLL_STORAGE_KEY = "osmo_scroll_positions";

function getScrollPositions() {
  try {
    return JSON.parse(sessionStorage.getItem(SCROLL_STORAGE_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function saveScrollPosition(url, scrollY) {
  const positions = getScrollPositions();
  positions[url] = scrollY;
  try {
    sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(positions));
  } catch (e) {
    // Storage full or unavailable
  }
}

function getSavedScroll(url) {
  return getScrollPositions()[url] || 0;
}

function getCurrentScroll() {
  if (lenis) return Math.round(lenis.scroll);
  return window.scrollY;
}

// Continuously save scroll position so refresh always has the latest value
function initScrollSaver() {
  let saveTimer;
  const save = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveScrollPosition(window.location.href, getCurrentScroll());
    }, 150);
  };

  // Hook into Lenis if available, otherwise native scroll
  if (lenis) {
    lenis.on("scroll", save);
  } else {
    window.addEventListener("scroll", save, { passive: true });
  }
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

  if (hasLenis) {
    lenis.resize();
  }

  if (hasScrollTrigger) {
    ScrollTrigger.refresh();
  }
}



// -----------------------------------------
// PAGE TRANSITIONS
// -----------------------------------------

function runPageOnceAnimation(next) {
  const tl = gsap.timeline();

  // On refresh or back/forward that caused a full reload, restore scroll.
  // On a genuine first visit, start at top. Either way the loader plays.
  const onceScroll = isReloadOrBackForward
    ? getSavedScroll(window.location.href)
    : 0;

  tl.call(() => {
    resetPage(next, onceScroll);
  }, null, 0);

  if (reducedMotion) return tl;

  const wrap = document.querySelector('[data-loader="wrap"]');
  if (!wrap) return tl;

  const panel = wrap.querySelector(".loader-panel");
  const bar = wrap.querySelector("[data-loader-bar]");
  const block = wrap.querySelector("[data-loader-block]");
  const top = wrap.querySelector("[data-loader-top]");
  const bot = wrap.querySelector("[data-loader-bot]");

  if (!panel || !bar || !block || !top || !bot) return tl;

  const FLIP_DUR = 0.68;
  const FLIP_STAGGER = 0.07;
  const FLIP_PAD = 0.02;
  const HOLD_DUR = 0.25;
  const STEP_GAP = 0.02;
  const FADE_DUR = 0.5;

  const step1 = gsap.utils.random(25, 35, 1);
  const step2 = gsap.utils.random(65, 75, 1);

  function makeDigits(value) {
    return String(value)
      .split("")
      .map((char, i) => {
        return `<span class="loader-digit" style="--d:${i}">${char}</span>`;
      })
      .join("");
  }

  function getFlipWait(value) {
    const digitCount = String(value).length;
    return FLIP_DUR + (digitCount - 1) * FLIP_STAGGER + FLIP_PAD;
  }

  function getTravel() {
    const styles = getComputedStyle(panel);
    const paddingTop = parseFloat(styles.paddingTop) || 0;
    const paddingBottom = parseFloat(styles.paddingBottom) || 0;
    const blockHeight = block.getBoundingClientRect().height;

    return Math.max(
      0,
      panel.clientHeight - paddingTop - paddingBottom - blockHeight
    );
  }

  function setBlockY(travel, pct) {
    block.style.transform = `translate3d(0, ${-(travel * pct) / 100}px, 0)`;
  }

  function setStep(value, travel) {
    bot.innerHTML = makeDigits(value);
    block.classList.add("is-flipping");
    bar.style.width = value + "%";
    setBlockY(travel, value);
  }

  function commitStep(value) {
    top.innerHTML = makeDigits(value);
    bot.innerHTML = "";
    block.classList.remove("is-flipping");
  }

  function addFlipStep(value, travel, addGap) {
    if (addGap) {
      tl.to({}, { duration: STEP_GAP });
    }

    tl.call(() => {
      setStep(value, travel);
    });

    tl.to({}, { duration: getFlipWait(value) });

    tl.call(() => {
      commitStep(value);
    });
  }

  tl.call(() => {
    if (lenis) lenis.stop();

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    gsap.set(wrap, {
      display: "block",
      autoAlpha: 1,
      pointerEvents: "auto"
    });

    top.innerHTML = makeDigits(0);
    bot.innerHTML = "";
    bar.style.width = "0%";
    block.classList.remove("is-flipping");
    setBlockY(getTravel(), 0);
  });

  tl.to({}, { duration: HOLD_DUR });

  const travel = getTravel();

  addFlipStep(step1, travel, false);
  addFlipStep(step2, travel, true);
  addFlipStep(100, travel, true);

  tl.to({}, { duration: HOLD_DUR });

  tl.to(wrap, {
    autoAlpha: 0,
    duration: FADE_DUR,
    ease: "power2.out"
  });

  tl.call(() => {
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";

    if (lenis) lenis.start();

    gsap.set(wrap, {
      display: "none",
      autoAlpha: 0,
      pointerEvents: "none"
    });

    block.classList.remove("is-flipping");
    block.style.transform = "";
    bar.style.width = "0%";
    top.innerHTML = makeDigits(0);
    bot.innerHTML = "";
  });

  return tl;
}

function closeMenuIfOpen() {
  const navToggle = document.querySelector("#nav-toggle");
  if (navToggle && navToggle.checked) {
    navToggle.checked = false;
    return true;
  }
  return false;
}

/**
 * Freeze the current container in place so scroll changes
 * don't cause visible jumps during sync transitions.
 */
function freezeCurrentContainer(container) {
  const scroll = getCurrentScroll();

  if (lenis) lenis.stop();

  gsap.set(container, {
    position: "fixed",
    top: -scroll,
    left: 0,
    right: 0,
  });

  window.scrollTo(0, 0);
}

function runPageLeaveAnimation(current, next) {
  const transitionWrap = document.querySelector("[data-transition-wrap]");
  const transitionDark = transitionWrap.querySelector("[data-transition-dark]");

  const tl = gsap.timeline({
    onComplete: () => {
      current.remove();
    }
  });

  if (closeMenuIfOpen()) {
    skipPageTransition = true;
  }

  CustomEase.create("parallax", "0.7, 0.05, 0.13, 1");

  if (reducedMotion || skipPageTransition) {
    return tl.set(current, { autoAlpha: 0 });
  }

  tl.set(transitionWrap, {
    zIndex: 2
  });

  tl.fromTo(transitionDark, {
    autoAlpha: 0
  }, {
    autoAlpha: 0.8,
    duration: 1.2,
    ease: "parallax"
  }, 0);

  tl.fromTo(current, {
    y: "0vh"
  }, {
    y: "-25vh",
    duration: 1.2,
    ease: "parallax",
  }, 0);

  tl.set(transitionDark, {
    autoAlpha: 0,
  });

  return tl;
}

function runPageEnterAnimation(next) {
  const tl = gsap.timeline();

  if (reducedMotion || skipPageTransition) {
    skipPageTransition = false;
    tl.set(next, { autoAlpha: 1 });
    tl.add("pageReady");
    tl.call(resetPage, [next, 0], "pageReady");
    return new Promise(resolve => tl.call(resolve, null, "pageReady"));
  }

  tl.add("startEnter", 0);

  tl.set(next, {
    zIndex: 3
  });

  tl.fromTo(next, {
    y: "100vh"
  }, {
    y: "0vh",
    duration: 1.2,
    clearProps: "all",
    ease: "parallax"
  }, "startEnter");

  tl.add("pageReady");

  // On popstate, restore saved scroll; on normal nav, go to top
  const targetScroll = isPopstate ? getSavedScroll(window.location.href) : 0;
  tl.call(resetPage, [next, targetScroll], "pageReady");

  return new Promise(resolve => {
    tl.call(resolve, null, "pageReady");
  });
}

function runWorkLeaveAnimation(current, next, trigger) {
  const clicked = trigger.closest("[data-case-link]");
  const thumbnail = clicked.querySelector("[data-case-thumbnail]");
  const nextHero = next.querySelector(".section");

  flipState = Flip.getState(thumbnail);
  flippedThumbnail = thumbnail;

  const tl = gsap.timeline({
    onComplete: () => current.remove()
  });

  closeMenuIfOpen();

  if (reducedMotion) {
    return tl.set(current, { autoAlpha: 0 });
  }

  tl.to(current, {
    autoAlpha: 0,
    duration: 0.6
  }, 0);

  tl.set(nextHero, { backgroundColor: "transparent" }, 0);

  return tl;
}

function runCaseEnterAnimation(next) {
  const nextHero = next.querySelector(".section");
  const revealTargets = nextHero.querySelectorAll("[data-case-reveal]");

  const tl = gsap.timeline();

  if (reducedMotion) {
    flippedThumbnail = null;
    flipState = null;
    tl.set(next, { autoAlpha: 1 });
    tl.add("pageReady");
    tl.call(resetPage, [next, 0], "pageReady");
    return new Promise(resolve => tl.call(resolve, null, "pageReady"));
  }

  const placeholder = next.querySelector("[data-case-thumbnail]");

  placeholder.parentNode.insertBefore(flippedThumbnail, placeholder);
  placeholder.remove();

  tl.add("startEnter", 0.6);

  tl.add(
    Flip.from(flipState, {
      duration: 0.8,
    }), 0);

  tl.fromTo(nextHero, {
    backgroundColor: "transparent"
  }, {
    backgroundColor: "#FFF",
    duration: 0.5
  }, "startEnter");

  tl.fromTo(revealTargets, {
    autoAlpha: 0,
    yPercent: 25
  }, {
    autoAlpha: 1,
    yPercent: 0,
    stagger: 0.1
  }, "startEnter+=0.1");

  tl.add("pageReady");

  const targetScroll = isPopstate ? getSavedScroll(window.location.href) : 0;
  tl.call(resetPage, [next, targetScroll], "pageReady");

  tl.call(() => {
    flippedThumbnail = null;
    flipState = null;
  });

  return new Promise(resolve => {
    tl.call(resolve, null, "pageReady");
  });
}


// -----------------------------------------
// BARBA HOOKS + INIT
// -----------------------------------------

barba.hooks.before(data => {
  isPopstate = data.trigger === "popstate";

  // Save scroll position of the page we're leaving
  saveScrollPosition(data.current.url.href, getCurrentScroll());

  // Freeze the outgoing page before any scroll manipulation
  freezeCurrentContainer(data.current.container);
});

barba.hooks.beforeEnter(data => {
  gsap.set(data.next.container, {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
  });

  initBeforeEnterFunctions(data.next.container);
  applyThemeFrom(data.next.container);
});

barba.hooks.afterLeave(() => {
  if (hasScrollTrigger) {
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  }
});

barba.hooks.enter(data => {
  initBarbaNavUpdate(data);
});

barba.hooks.afterEnter(data => {
  initAfterEnterFunctions(data.next.container);

  if (hasLenis) {
    lenis.resize();
    lenis.start();
  }

  if (hasScrollTrigger) {
    ScrollTrigger.refresh();
  }
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
      to: { namespace: ["case"] },
      custom: ({ trigger }) => {
        if (typeof trigger === "string") return false;
        return trigger.hasAttribute("data-case-link");
      },
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
        return runPageLeaveAnimation(data.current.container, data.next.container);
      },

      async enter(data) {
        return runPageEnterAnimation(data.next.container);
      }
    }
  ],
});



// -----------------------------------------
// GENERIC + HELPERS
// -----------------------------------------

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

function applyThemeFrom(container) {
  const pageTheme = container?.dataset?.pageTheme || "light";
  const config = themeConfig[pageTheme] || themeConfig.light;

  document.body.dataset.pageTheme = pageTheme;
  const transitionEl = document.querySelector('[data-theme-transition]');
  if (transitionEl) {
    transitionEl.dataset.themeTransition = config.transition;
  }

  const nav = document.querySelector('[data-theme-nav]');
  if (nav) {
    nav.dataset.themeNav = config.nav;
  }
}

function initLenis() {
  if (lenis) return;
  if (!hasLenis) return;

  lenis = new Lenis({
    lerp: 0.165,
    wheelMultiplier: 1.25,
  });

  if (hasScrollTrigger) {
    lenis.on("scroll", ScrollTrigger.update);
  }

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

/**
 * Settle the page after a transition completes.
 * @param {Element} container - The new page container
 * @param {number}  targetScroll - Scroll position to restore
 */
function resetPage(container, targetScroll) {
  // Default to 0 if not provided (safety net)
  if (targetScroll == null) targetScroll = 0;

  gsap.set(container, { clearProps: "position,top,left,right" });

  window.scrollTo(0, targetScroll);

  if (lenis) {
    lenis.scrollTo(targetScroll, { immediate: true });
    lenis.resize();
    lenis.start();
  }

  if (hasScrollTrigger) {
    ScrollTrigger.refresh();
  }
}

function debounceOnWidthChange(fn, ms) {
  let last = innerWidth,
    timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (innerWidth !== last) {
        last = innerWidth;
        fn.apply(this, args);
      }
    }, ms);
  };
}

function initBarbaNavUpdate(data) {
  var tpl = document.createElement('template');
  tpl.innerHTML = data.next.html.trim();
  var nextNodes = tpl.content.querySelectorAll('[data-barba-update]');
  var currentNodes = document.querySelectorAll('nav [data-barba-update]');

  currentNodes.forEach(function (curr, index) {
    var next = nextNodes[index];
    if (!next) return;

    var newStatus = next.getAttribute('aria-current');
    if (newStatus !== null) {
      curr.setAttribute('aria-current', newStatus);
    } else {
      curr.removeAttribute('aria-current');
    }

    var newClassList = next.getAttribute('class') || '';
    curr.setAttribute('class', newClassList);
  });
}



// -----------------------------------------
// YOUR FUNCTIONS GO BELOW HERE
// -----------------------------------------
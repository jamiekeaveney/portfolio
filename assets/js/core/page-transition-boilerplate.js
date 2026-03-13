// -----------------------------------------
// OSMO PAGE TRANSITION BOILERPLATE
// -----------------------------------------

gsap.registerPlugin(CustomEase);

history.scrollRestoration = "manual";

let lenis = null;
let nextPage = document;
let onceFunctionsInitialized = false;
let mobileMenuNavigation = false;

const hasLenis = typeof window.Lenis !== "undefined";
const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";

const rmMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = rmMQ.matches;
rmMQ.addEventListener?.("change", (e) => (reducedMotion = e.matches));
rmMQ.addListener?.((e) => (reducedMotion = e.matches));

const mobileTransitionMQ = window.matchMedia("(max-width: 991px)");

const has = (selector) => !!nextPage.querySelector(selector);

let staggerDefault = 0.05;
let durationDefault = 0.6;

CustomEase.create("osmo", "0.625, 0.05, 0, 1");
CustomEase.create("parallax", "0.7, 0.05, 0.13, 1");

gsap.defaults({ ease: "osmo", duration: durationDefault });



// -----------------------------------------
// FUNCTION REGISTRY
// -----------------------------------------

function initOnceFunctions() {
  initLenis();
  if (onceFunctionsInitialized) return;
  onceFunctionsInitialized = true;

  // Runs once on first load
  // if (has('[data-something]')) initSomething();
}

function initBeforeEnterFunctions(next) {
  nextPage = next || document;

  // Runs before the enter animation
  // Use for features that need to exist while the new page animates in
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

// -----------------------------------------
// PAGE TRANSITIONS
// -----------------------------------------

function runPageOnceAnimation(next) {
  const tl = gsap.timeline();

  tl.call(() => {
    resetPage(next);
  }, null, 0);

  if (reducedMotion || shouldUseInstantMobileTransition()) return tl;

  const wrap = document.querySelector('[data-loader="wrap"]');
  if (!wrap) return tl;

  const panel = wrap.querySelector(".loader-panel");
  const bar = wrap.querySelector("[data-loader-bar]");
  const block = wrap.querySelector("[data-loader-block]");

  const colH = wrap.querySelector('[data-loader-col="h"]');
  const colT = wrap.querySelector('[data-loader-col="t"]');
  const colO = wrap.querySelector('[data-loader-col="o"]');

  const trackH = wrap.querySelector('[data-loader-track="h"]');
  const trackT = wrap.querySelector('[data-loader-track="t"]');
  const trackO = wrap.querySelector('[data-loader-track="o"]');

  if (!panel || !bar || !block || !colH || !colT || !colO || !trackH || !trackT || !trackO) {
    return tl;
  }

  const EASE = "power2.out";
  const MOVE_EASE = "power2.out";
  const FLIP_DUR = 0.68;
  const REVEAL_DUR = 0.18;
  const BAR_DUR = 0.9;
  const BLOCK_DUR = 0.9;
  const HOLD_DUR = 0.25;
  const STEP_GAP = 0.02;
  const STAGGER = 0.07;
  const FADE_DUR = 0.5;
  const COL_W = "0.62em";

  const step1 = gsap.utils.random(25, 35, 1);
  const step2 = gsap.utils.random(65, 75, 1);

  function getParts(value) {
    if (value === 100) {
      return { h: 1, t: 0, o: 0, digits: 3 };
    }

    if (value >= 10) {
      return {
        h: 0,
        t: Math.floor(value / 10),
        o: value % 10,
        digits: 2
      };
    }

    return { h: 0, t: 0, o: value, digits: 1 };
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

  function getTrackYPercent(trackType, digit) {
    if (trackType === "h") {
      return digit === 1 ? -50 : 0;
    }
    return digit * -10;
  }

  function setColumnState(col, visible) {
    gsap.set(col, {
      width: visible ? COL_W : 0,
      autoAlpha: visible ? 1 : 0
    });

    col.classList.toggle("is-visible", visible);
    col.classList.toggle("is-hidden", !visible);
  }

  function setImmediate(value, travel) {
    const parts = getParts(value);

    setColumnState(colH, parts.digits === 3);
    setColumnState(colT, parts.digits >= 2);
    setColumnState(colO, true);

    gsap.set(trackH, { yPercent: getTrackYPercent("h", parts.h) });
    gsap.set(trackT, { yPercent: getTrackYPercent("t", parts.t) });
    gsap.set(trackO, { yPercent: getTrackYPercent("o", parts.o) });

    gsap.set(bar, { width: value + "%" });
    gsap.set(block, { y: -(travel * value) / 100 });
  }

  function animateValue(value, travel, addGap) {
    const parts = getParts(value);

    if (addGap) {
      tl.to({}, { duration: STEP_GAP });
    }

    tl.to(
      bar,
      {
        width: value + "%",
        duration: BAR_DUR,
        ease: MOVE_EASE
      },
      "<"
    );

    tl.to(
      block,
      {
        y: -(travel * value) / 100,
        duration: BLOCK_DUR,
        ease: MOVE_EASE
      },
      "<"
    );

    tl.to(
      colH,
      {
        width: parts.digits === 3 ? COL_W : 0,
        autoAlpha: parts.digits === 3 ? 1 : 0,
        duration: REVEAL_DUR,
        ease: EASE
      },
      "<"
    );

    tl.to(
      colT,
      {
        width: parts.digits >= 2 ? COL_W : 0,
        autoAlpha: parts.digits >= 2 ? 1 : 0,
        duration: REVEAL_DUR,
        ease: EASE
      },
      "<"
    );

    tl.to(
      trackH,
      {
        yPercent: getTrackYPercent("h", parts.h),
        duration: FLIP_DUR,
        ease: "expo.inOut"
      },
      "<"
    );

    tl.to(
      trackT,
      {
        yPercent: getTrackYPercent("t", parts.t),
        duration: FLIP_DUR,
        ease: "expo.inOut"
      },
      "<+" + STAGGER
    );

    tl.to(
      trackO,
      {
        yPercent: getTrackYPercent("o", parts.o),
        duration: FLIP_DUR,
        ease: "expo.inOut"
      },
      "<+" + STAGGER
    );
  }

  tl.call(() => {
    if (typeof stopLenis === "function") stopLenis();

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    gsap.set(wrap, {
      display: "block",
      autoAlpha: 1,
      pointerEvents: "auto"
    });

    const travel = getTravel();
    setImmediate(0, travel);
  });

  tl.to({}, { duration: HOLD_DUR });

  const travel = getTravel();

  animateValue(step1, travel, false);
  animateValue(step2, travel, true);
  animateValue(100, travel, true);

  tl.to({}, { duration: HOLD_DUR });

  tl.to(wrap, {
    autoAlpha: 0,
    duration: FADE_DUR,
    ease: "power2.out"
  });

  tl.call(() => {
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";

    if (typeof startLenis === "function") startLenis();

    gsap.set(wrap, {
      display: "none",
      autoAlpha: 0,
      pointerEvents: "none"
    });

    setImmediate(0, getTravel());
    gsap.set(block, { clearProps: "transform" });
    gsap.set(bar, { width: "0%" });
  });

  return tl;
}

function runPageLeaveAnimation(current, next) {
  const transitionWrap = document.querySelector("[data-transition-wrap]");
  const transitionDark = transitionWrap?.querySelector("[data-transition-dark]");

  const tl = gsap.timeline({
    onComplete: () => {
      current.remove();
    }
  });

  if (reducedMotion) {
    return tl.set(current, { autoAlpha: 0 });
  }

  if (shouldUseInstantMobileTransition()) {
    tl.set(current, { zIndex: 2 });
    tl.set(current, { autoAlpha: 0 }, 0);
    return tl;
  }

  if (transitionWrap) {
    tl.set(transitionWrap, { zIndex: 2 });
  }

  if (transitionDark) {
    tl.fromTo(
      transitionDark,
      { autoAlpha: 0 },
      {
        autoAlpha: 0.8,
        duration: 1.2,
        ease: "parallax"
      },
      0
    );
  }

  tl.fromTo(
    current,
    { y: "0vh" },
    {
      y: "-25vh",
      duration: 1.2,
      ease: "parallax"
    },
    0
  );

  if (transitionDark) {
    tl.set(transitionDark, { autoAlpha: 0 });
  }

  return tl;
}

function runPageEnterAnimation(next) {
  const tl = gsap.timeline();

  if (reducedMotion) {
    tl.set(next, { autoAlpha: 1 });
    tl.add("pageReady");
    tl.call(resetPage, [next], "pageReady");
    return new Promise((resolve) => tl.call(resolve, null, "pageReady"));
  }

  if (shouldUseInstantMobileTransition()) {
    tl.set(next, {
      autoAlpha: 1,
      zIndex: 3
    });

    tl.add("pageReady");
    tl.call(resetPage, [next], "pageReady");

    return new Promise((resolve) => {
      tl.call(resolve, null, "pageReady");
    });
  }

  tl.add("startEnter", 0);

  tl.set(next, {
    zIndex: 3
  });

  tl.fromTo(
    next,
    {
      y: "100vh"
    },
    {
      y: "0vh",
      duration: 1.2,
      clearProps: "transform",
      ease: "parallax"
    },
    "startEnter"
  );

  tl.add("pageReady");
  tl.call(resetPage, [next], "pageReady");

  return new Promise((resolve) => {
    tl.call(resolve, null, "pageReady");
  });
}


// -----------------------------------------
// BARBA HOOKS + INIT
// -----------------------------------------

barba.hooks.before((data) => {
  document.documentElement.classList.add("is-transitioning");

  mobileMenuNavigation = false;

  const trigger = data?.trigger;
  if (!trigger) return;

  if (isMobileTransition() && trigger.closest(".nav__mobile-panel")) {
    mobileMenuNavigation = true;
    closeMobileNav();
  }
});

barba.hooks.beforeEnter((data) => {
  // Position new container on top
  gsap.set(data.next.container, {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0
  });

  if (lenis && typeof lenis.stop === "function") {
    lenis.stop();
  }

  initBeforeEnterFunctions(data.next.container);
  applyThemeFrom(data.next.container);
});

barba.hooks.afterLeave((data) => {
  if (hasScrollTrigger) {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  }

  if (typeof destroySlider === "function") {
    destroySlider(data.current.container);
  }
});

barba.hooks.enter((data) => {
  initBarbaNavUpdate(data);
});

barba.hooks.afterEnter((data) => {
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
  document.documentElement.classList.remove("is-transitioning");
  mobileMenuNavigation = false;
});

barba.init({
  debug: true, // Set to false in production
  timeout: 7000,
  preventRunning: true,
  transitions: [
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
  ]
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

  const transitionEl = document.querySelector("[data-theme-transition]");
  if (transitionEl) {
    transitionEl.dataset.themeTransition = config.transition;
  }

  const nav = document.querySelector("[data-theme-nav]");
  if (nav) {
    nav.dataset.themeNav = config.nav;
  }
}

function initLenis() {
  if (lenis) return;
  if (!hasLenis) return;

  lenis = new Lenis({
    lerp: 0.165,
    wheelMultiplier: 1.25
  });

  if (hasScrollTrigger) {
    lenis.on("scroll", ScrollTrigger.update);
  }

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

function resetPage(container) {
  window.scrollTo(0, 0);
  gsap.set(container, {
    clearProps: "position,top,left,right,zIndex,borderTopLeftRadius,borderTopRightRadius"
  });

  if (hasLenis) {
    lenis.resize();
    lenis.start();
  }
}

function debounceOnWidthChange(fn, ms) {
  let last = innerWidth;
  let timer;

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
  const tpl = document.createElement("template");
  tpl.innerHTML = data.next.html.trim();

  const nextNodes = tpl.content.querySelectorAll("[data-barba-update]");
  const currentNodes = document.querySelectorAll("nav [data-barba-update]");

  currentNodes.forEach((curr, index) => {
    const next = nextNodes[index];
    if (!next) return;

    const newStatus = next.getAttribute("aria-current");
    if (newStatus !== null) {
      curr.setAttribute("aria-current", newStatus);
    } else {
      curr.removeAttribute("aria-current");
    }

    const newClassList = next.getAttribute("class") || "";
    curr.setAttribute("class", newClassList);
  });
}

function isMobileTransition() {
  return mobileTransitionMQ.matches;
}

function shouldUseInstantMobileTransition() {
  return isMobileTransition() && mobileMenuNavigation;
}

function getMobileNavCheckbox() {
  return document.querySelector(".nav_checkbox, #nav-toggle");
}

function closeMobileNav() {
  const navCheckbox = getMobileNavCheckbox();
  if (navCheckbox?.checked) {
    navCheckbox.checked = false;
  }
}



// -----------------------------------------
// YOUR FUNCTIONS GO BELOW HERE
// -----------------------------------------
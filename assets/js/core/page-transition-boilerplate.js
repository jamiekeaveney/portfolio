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

function runPageOnceAnimation(next) {
  const tl = gsap.timeline();

  tl.call(() => {
    resetPage(next);
  }, null, 0);

  if (reducedMotion || shouldUseInstantMobileTransition()) {
    return tl;
  }

  const loader = document.querySelector(".loader");
  if (!loader) {
    return tl;
  }

  const panel = loader.querySelector(".loader__panel");
  const bar = loader.querySelector(".loader__bar");
  const block = loader.querySelector(".loader__block");
  const hundreds = loader.querySelector(".loader__digit-wrap--hundreds");
  const tens = loader.querySelector(".loader__digit-wrap--tens");
  const ones = loader.querySelector(".loader__digit-wrap--ones");
  const percent = loader.querySelector(".loader__percent");

  if (!panel || !bar || !block || !hundreds || !tens || !ones || !percent) {
    return tl;
  }

  const randomTens1 = gsap.utils.random([2, 3, 4]);
  const randomTens2 = gsap.utils.random([5, 6]);
  const randomOnes1 = gsap.utils.random([1, 5]);
  const randomOnes2 = gsap.utils.random([7, 8, 9]);

  const value1 = parseInt("" + randomTens1 + randomOnes1, 10);
  const value2 = parseInt("" + randomTens2 + randomOnes2, 10);

  function getTravel(value) {
    const panelStyle = window.getComputedStyle(panel);
    const padTop = parseFloat(panelStyle.paddingTop) || 0;
    const padBottom = parseFloat(panelStyle.paddingBottom) || 0;
    const blockHeight = block.getBoundingClientRect().height;
    const travel = Math.max(0, window.innerHeight - padTop - padBottom - blockHeight);
    return -(travel * value / 100);
  }

  function getState(value) {
    if (value === 100) {
      return {
        hundreds: -100,
        tens: -1000,
        ones: -1000,
        blockY: getTravel(100),
        barWidth: "100%"
      };
    }

    return {
      hundreds: 0,
      tens: Math.floor(value / 10) * -100,
      ones: (value % 10) * -100,
      blockY: getTravel(value),
      barWidth: value + "%"
    };
  }

  const state1 = getState(value1);
  const state2 = getState(value2);
  const state3 = getState(100);

  tl.set(loader, {
    display: "block",
    autoAlpha: 1,
    pointerEvents: "auto"
  });

  tl.set(bar, {
    width: "0%"
  });

  tl.set(block, {
    y: 0
  });

  tl.set(hundreds, {
    yPercent: 0
  });

  tl.set(tens, {
    yPercent: 0
  });

  tl.set(ones, {
    yPercent: 0
  });

  tl.set(percent, {
    yPercent: 100
  });

  tl.to(percent, {
    yPercent: 0,
    duration: 0.9,
    ease: "expo.inOut"
  });

  tl.to(bar, {
    width: state1.barWidth,
    duration: 1.2,
    ease: "expo.inOut"
  }, "<");

  tl.to(block, {
    y: state1.blockY,
    duration: 1.2,
    ease: "expo.inOut"
  }, "<");

  tl.to(hundreds, {
    yPercent: state1.hundreds,
    duration: 1.2,
    ease: "expo.inOut"
  }, "<");

  tl.to(tens, {
    yPercent: state1.tens,
    duration: 1.2,
    ease: "expo.inOut"
  }, "<");

  tl.to(ones, {
    yPercent: state1.ones,
    duration: 1.2,
    ease: "expo.inOut"
  }, "<");

  tl.to(bar, {
    width: state2.barWidth,
    duration: 1.2,
    ease: "expo.inOut"
  });

  tl.to(block, {
    y: state2.blockY,
    duration: 1.2,
    ease: "expo.inOut"
  }, "<");

  tl.to(hundreds, {
    yPercent: state2.hundreds,
    duration: 1.2,
    ease: "expo.inOut"
  }, "<");

  tl.to(tens, {
    yPercent: state2.tens,
    duration: 1.2,
    ease: "expo.inOut"
  }, "<");

  tl.to(ones, {
    yPercent: state2.ones,
    duration: 1.2,
    ease: "expo.inOut"
  }, "<");

  tl.to(bar, {
    width: state3.barWidth,
    duration: 1.2,
    ease: "expo.inOut"
  });

  tl.to(block, {
    y: state3.blockY,
    duration: 1.2,
    ease: "expo.inOut"
  }, "<");

  tl.to(hundreds, {
    yPercent: state3.hundreds,
    duration: 1.2,
    ease: "expo.inOut"
  }, "<");

  tl.to(tens, {
    yPercent: state3.tens,
    duration: 1.2,
    ease: "expo.inOut"
  }, "<");

  tl.to(ones, {
    yPercent: state3.ones,
    duration: 1.2,
    ease: "expo.inOut"
  }, "<");

  tl.to(loader, {
    autoAlpha: 0,
    duration: 0.25,
    ease: "power2.out"
  });

  tl.set(loader, {
    display: "none",
    pointerEvents: "none"
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
    zIndex: 3,
    borderTopLeftRadius: "0.75rem",
    borderTopRightRadius: "0.75rem"
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

  tl.to(
    next,
    {
      borderTopLeftRadius: "0rem",
      borderTopRightRadius: "0rem",
      duration: 0.25,
      ease: "none",
      clearProps: "borderTopLeftRadius,borderTopRightRadius"
    },
    0.95
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
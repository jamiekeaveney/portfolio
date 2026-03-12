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
  const tl = gsap.timeline({
    defaults: {
      ease: "expo.inOut",
      duration: 1.2
    }
  });

  tl.call(() => {
    resetPage(next);
  }, null, 0);

  if (reducedMotion || shouldUseInstantMobileTransition()) {
    return tl;
  }

  const wrap = document.querySelector('[data-loader="wrap"]');
  if (!wrap) return tl;

  const panel = wrap.querySelector(".loader-panel");
  const bar = wrap.querySelector("[data-loader-bar]");
  const block = wrap.querySelector("[data-loader-block]");
  const firstWrap = wrap.querySelector(".loader-number-wrap--first");
  const secondWrap = wrap.querySelector(".loader-number-wrap--second");
  const thirdWrap = wrap.querySelector(".loader-number-wrap--third");

  if (!panel || !bar || !block || !firstWrap || !secondWrap || !thirdWrap) {
    return tl;
  }

  const randomNumbers1 = gsap.utils.random([2, 3, 4]);
  const randomNumbers2 = gsap.utils.random([5, 6]);
  const randomNumbers3 = gsap.utils.random([1, 5]);
  const randomNumbers4 = gsap.utils.random([7, 8, 9]);

  const value1 = parseInt("" + randomNumbers1 + randomNumbers3, 10);
  const value2 = parseInt("" + randomNumbers2 + randomNumbers4, 10);

  function getBlockY(value) {
    if (window.innerWidth < 992) return 0;

    const styles = getComputedStyle(panel);
    const padTop = parseFloat(styles.paddingTop) || 0;
    const padBottom = parseFloat(styles.paddingBottom) || 0;
    const panelHeight = panel.getBoundingClientRect().height;
    const blockHeight = block.getBoundingClientRect().height;
    const travel = Math.max(0, panelHeight - padTop - padBottom - blockHeight);

    return -(travel * value / 100);
  }

  function setCharIndices() {
    const chars = wrap.querySelectorAll(".loader-number");
    chars.forEach((char, index) => {
      char.style.setProperty("--i", index);
    });
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

    gsap.set(bar, {
      width: "0%"
    });

    gsap.set(block, {
      y: 0
    });

    gsap.set(firstWrap, {
      yPercent: 100
    });

    gsap.set(secondWrap, {
      yPercent: 10
    });

    gsap.set(thirdWrap, {
      yPercent: 10
    });

    block.classList.remove("is-entering", "is-exiting");
    setCharIndices();
  });

  tl.call(() => {
    block.classList.add("is-entering");
  });

  tl.to({}, { duration: 0.72 });

  tl.call(() => {
    block.classList.remove("is-entering");
  });

  tl.to(bar, {
    width: value1 + "%"
  });

  tl.to(secondWrap, {
    yPercent: (randomNumbers1 - 1) * -10
  }, "<");

  tl.to(thirdWrap, {
    yPercent: (randomNumbers3 - 1) * -10
  }, "<");

  tl.to(block, {
    y: getBlockY(value1)
  }, "<");

  tl.to({}, { duration: 0.02 });

  tl.to(bar, {
    width: value2 + "%"
  });

  tl.to(secondWrap, {
    yPercent: (randomNumbers2 - 1) * -10
  }, "<");

  tl.to(thirdWrap, {
    yPercent: (randomNumbers4 - 1) * -10
  }, "<");

  tl.to(block, {
    y: getBlockY(value2)
  }, "<");

  tl.to({}, { duration: 0.02 });

  tl.to(bar, {
    width: "100%"
  });

  tl.to(secondWrap, {
    yPercent: -90
  }, "<");

  tl.to(thirdWrap, {
    yPercent: -90
  }, "<");

  tl.to(firstWrap, {
    yPercent: 0
  }, "<");

  tl.to(block, {
    y: getBlockY(100)
  }, "<");

  tl.call(() => {
    setCharIndices();
    block.classList.add("is-exiting");
  });

  tl.to({}, { duration: 0.72 });

  tl.call(() => {
    block.classList.remove("is-exiting");
  });

  tl.to(wrap, {
    autoAlpha: 0,
    duration: 0.25,
    ease: "power2.out"
  });

  tl.call(() => {
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    if (typeof startLenis === "function") startLenis();
  });

  tl.set(wrap, {
    display: "none",
    pointerEvents: "none",
    clearProps: "opacity,visibility"
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
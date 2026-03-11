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
rmMQ.addEventListener?.("change", e => (reducedMotion = e.matches));
rmMQ.addListener?.(e => (reducedMotion = e.matches));

const mobileTransitionMQ = window.matchMedia("(max-width: 991px)");

const has = (s) => !!nextPage.querySelector(s);

let staggerDefault = 0.05;
let durationDefault = 0.6;

CustomEase.create("osmo", "0.625, 0.05, 0, 1");
gsap.defaults({ ease: "osmo", duration: durationDefault });



// -----------------------------------------
// FUNCTION REGISTRY
// -----------------------------------------

function initOnceFunctions() {
  initLenis();

  if (onceFunctionsInitialized) return;
  onceFunctionsInitialized = true;

  // Runs once on first load
  resetWCurrent();
  // if (has('[data-something]')) initSomething();
}

function initBeforeEnterFunctions(next) {
  nextPage = next || document;

  destroySlider();

  // Runs before the enter animation
  // if (has('[data-something]')) initSomething();
}

function initAfterEnterFunctions(next) {
  nextPage = next || document;

  // Runs after enter animation completes
  if (has(".scroll-1_component")) initScroll1();
  if (has(".slider")) initSlider();
  // if (has('[data-something]')) initSomething();

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

  return tl;
}

function runPageLeaveAnimation(current, next) {
  const transitionWrap = document.querySelector("[data-transition-wrap]");
  const transitionDark = transitionWrap.querySelector("[data-transition-dark]");

  const tl = gsap.timeline({
    onComplete: () => {
      current.remove();
    }
  });

  CustomEase.create("parallax", "0.7, 0.05, 0.13, 1");

  if (reducedMotion) {
    // Immediate swap behavior if user prefers reduced motion
    return tl.set(current, { autoAlpha: 0 });
  }

  if (shouldUseInstantMobileTransition()) {
    tl.set(current, {
      zIndex: 2
    });

    // Hide current page immediately on mobile menu navigation
    tl.set(current, {
      autoAlpha: 0
    }, 0);

    return tl;
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

  if (reducedMotion) {
    // Immediate swap behavior if user prefers reduced motion
    tl.set(next, { autoAlpha: 1 });
    tl.add("pageReady");
    tl.call(resetPage, [next], "pageReady");
    return new Promise(resolve => tl.call(resolve, null, "pageReady"));
  }

  if (shouldUseInstantMobileTransition()) {
    tl.set(next, {
      autoAlpha: 1,
      zIndex: 3
    });

    tl.add("pageReady");
    tl.call(resetPage, [next], "pageReady");

    return new Promise(resolve => {
      tl.call(resolve, null, "pageReady");
    });
  }

  tl.add("startEnter", 0);

  tl.set(next, {
    zIndex: 3,
    borderTopLeftRadius: "0.75rem",
    borderTopRightRadius: "0.75rem"
  });

  tl.fromTo(next, {
    y: "100vh"
  }, {
    y: "0vh",
    duration: 1.2,
    clearProps: "transform",
    ease: "parallax"
  }, "startEnter");

  tl.to(next, {
    borderTopLeftRadius: "0rem",
    borderTopRightRadius: "0rem",
    duration: 0.25,
    ease: "none",
    clearProps: "borderTopLeftRadius,borderTopRightRadius"
  }, 0.95);

  tl.add("pageReady");
  tl.call(resetPage, [next], "pageReady");

  return new Promise(resolve => {
    tl.call(resolve, null, "pageReady");
  });
}


// -----------------------------------------
// BARBA HOOKS + INIT
// -----------------------------------------

barba.hooks.before(data => {
  document.documentElement.classList.add("is-transitioning");

  mobileMenuNavigation = false;

  const trigger = data && data.trigger;
  if (!trigger) return;

  if (isMobileTransition() && trigger.closest(".nav__mobile-panel")) {
    mobileMenuNavigation = true;
    closeMobileNav();
  }
});

barba.hooks.beforeEnter(data => {
  // Position new container on top
  gsap.set(data.next.container, {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
  });

  if (lenis && typeof lenis.stop === "function") {
    lenis.stop();
  }

  syncWebflowPageIdFromNextHtml(data.next.html);
  destroyAndInitIX2();

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
  // Run page functions
  initAfterEnterFunctions(data.next.container);

  // Finish Webflow reinit after page logic / layout settles
  readyWebflow();
  resetWCurrent(data.next.url && data.next.url.path ? data.next.url.path : window.location.pathname);
  rerunBarbaScripts(data.next.html);

  // Settle
  if (hasLenis) {
    lenis.start();
  }
});

barba.hooks.after(() => {
  document.documentElement.classList.remove("is-transitioning");
  mobileMenuNavigation = false;
});

barba.init({
  debug: true, // Set to 'false' in production
  timeout: 7000,
  preventRunning: true,
  transitions: [
    {
      name: "default",
      sync: true,

      // First load
      async once(data) {
        initOnceFunctions();
        return runPageOnceAnimation(data.next.container);
      },

      // Current page leaves
      async leave(data) {
        return runPageLeaveAnimation(data.current.container, data.next.container);
      },

      // New page enters
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
  if (lenis) return; // already created
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

function resetPage(container) {
  window.scrollTo(0, 0);
  gsap.set(container, { clearProps: "position,top,left,right,zIndex" });

  if (hasLenis) {
    lenis.resize();
    lenis.start();
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

    // Aria-current sync
    var newStatus = next.getAttribute('aria-current');
    if (newStatus !== null) {
      curr.setAttribute('aria-current', newStatus);
    } else {
      curr.removeAttribute('aria-current');
    }

    // Class list sync
    var newClassList = next.getAttribute('class') || '';
    curr.setAttribute('class', newClassList);
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
  if (navCheckbox && navCheckbox.checked) {
    navCheckbox.checked = false;
  }
}



// -----------------------------------------
// WEBFLOW HELPERS
// -----------------------------------------

function syncWebflowPageIdFromNextHtml(nextHtml) {
  if (!nextHtml) return;

  try {
    const parsed = new DOMParser().parseFromString(nextHtml, "text/html");
    const nextPageId = parsed.documentElement.getAttribute("data-wf-page");

    if (nextPageId) {
      document.documentElement.setAttribute("data-wf-page", nextPageId);
    }
  } catch (_) {}
}

function resetWCurrent(overridePath) {
  document.querySelectorAll(".w--current").forEach((el) => {
    el.classList.remove("w--current");
  });

  const path = (overridePath || window.location.pathname).replace(/\/$/, "");

  document.querySelectorAll("a[href]").forEach((a) => {
    try {
      const url = new URL(a.getAttribute("href"), window.location.origin);
      const hrefPath = url.pathname.replace(/\/$/, "");

      if (hrefPath === path) {
        a.classList.add("w--current");
      }
    } catch (_) {}
  });
}

function destroyAndInitIX2() {
  if (!window.Webflow) return;

  try {
    window.Webflow.destroy();
  } catch (_) {}

  try {
    window.Webflow.require("ix2")?.init?.();
  } catch (_) {}

  try {
    document.dispatchEvent(new Event("readystatechange"));
  } catch (_) {}
}

function readyWebflow() {
  if (!window.Webflow) return;

  try {
    window.Webflow.ready();
  } catch (_) {}
}

function rerunBarbaScripts(nextHtml) {
  if (!nextHtml) return;

  try {
    const parsed = new DOMParser().parseFromString(nextHtml, "text/html");
    const scripts = parsed.querySelectorAll("[data-barba-script]");

    scripts.forEach((scriptEl) => {
      let codeString = scriptEl.textContent || "";

      if (codeString.includes("DOMContentLoaded")) {
        codeString = codeString.replace(
          /window\.addEventListener\("DOMContentLoaded",\s*\(\s*event\s*\)\s*=>\s*{\s*/,
          ""
        );
        codeString = codeString.replace(/\s*}\s*\);\s*$/, "");
      }

      const script = document.createElement("script");
      script.type = "text/javascript";

      const src = scriptEl.getAttribute("src");
      if (src) script.src = src;

      if (codeString.trim()) {
        script.text = codeString;
      }

      document.body.appendChild(script);
      script.remove();
    });
  } catch (_) {}
}



// -----------------------------------------
// YOUR FUNCTIONS GO BELOW HERE
// -----------------------------------------
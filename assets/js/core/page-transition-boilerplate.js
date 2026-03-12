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

// Stores the scroll offset captured in beforeEnter so the
// leave animation can start from the correct visual position.
let _leaveScrollY = 0;

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
  // if (document.querySelector('[data-something]')) initSomething(document);
}

function initBeforeEnterFunctions(next) {
  nextPage = next || document;

  // Runs before the enter animation.
  // Use this for anything that needs to be ready before
  // the incoming page is visible (e.g. cloning slide elements,
  // setting initial layout values).
  if (has(".slider")) initSlider(nextPage);
  // if (has('[data-something]')) initSomething(nextPage);
}

function initAfterEnterFunctions(next) {
  nextPage = next || document;

  // Runs after enter animation completes.
  // Use this for scroll-driven features, resize observers,
  // or anything that depends on the page being settled in the DOM.
  if (has(".scroll-1_component")) initScroll1(nextPage);
  // if (has('[data-something]')) initSomething(nextPage);

  if (hasLenis) {
    lenis.resize();
  }

  if (hasScrollTrigger) {
    ScrollTrigger.refresh();
  }
}

function destroyPageFunctions(container) {
  // Tear down anything initialised on the leaving page.
  // Called in afterLeave so features stay visually intact
  // through the entire leave animation.
  destroySlider(container);
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
    return tl.set(current, { autoAlpha: 0 });
  }

  if (shouldUseInstantMobileTransition()) {
    tl.set(current, { zIndex: 2 });
    tl.set(current, { autoAlpha: 0 }, 0);
    return tl;
  }

  // The current container was locked in place at y: -_leaveScrollY
  // inside beforeEnter.  Start from that position and animate
  // upward by 25 vh so the parallax motion is seamless.
  const startY = -_leaveScrollY;
  const endY = startY - window.innerHeight * 0.25;

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
    y: startY
  }, {
    y: endY,
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
  // ---- 1. Capture scroll position --------------------------
  _leaveScrollY = window.scrollY || window.pageYOffset || 0;

  // ---- 2. Lock the leaving page in place -------------------
  // Fix it at its current visual position so the scroll-to-zero
  // below doesn't cause a visible jump.
  gsap.set(data.current.container, {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    y: -_leaveScrollY,
  });

  // ---- 3. Position the incoming page off-screen ------------
  gsap.set(data.next.container, {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
  });

  // ---- 4. Reset scroll to zero BEFORE IX2 reinit -----------
  // With scroll at 0, IX2 scroll-triggered animations will
  // initialise in their starting state (elements hidden /
  // default size) rather than replaying their entrance.
  window.scrollTo(0, 0);

  if (lenis && typeof lenis.stop === "function") {
    lenis.stop();
    try { lenis.scrollTo(0, { immediate: true, force: true }); } catch (_) {}
  }

  // ---- 5. Reinitialise IX2 for the new page ----------------
  syncWebflowPageIdFromNextHtml(data.next.html);
  destroyAndInitIX2();

  // ---- 6. Page-specific setup ------------------------------
  initBeforeEnterFunctions(data.next.container);
  applyThemeFrom(data.next.container);
});

barba.hooks.afterLeave(data => {
  // The leave animation has completed and the old container
  // has been removed from the DOM.  Clean up per-page features
  // (slider RAF loops, listeners, etc.) and kill ScrollTriggers.
  destroyPageFunctions(data.current.container);

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
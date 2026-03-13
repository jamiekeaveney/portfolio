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
  var tl = gsap.timeline();
  tl.call(function() { resetPage(next); }, null, 0);
  if (reducedMotion || shouldUseInstantMobileTransition()) return tl;

  var wrap  = document.querySelector('[data-loader="wrap"]');
  if (!wrap) return tl;
  var panel = wrap.querySelector(".loader-panel");
  var bar   = wrap.querySelector("[data-loader-bar]");
  var block = wrap.querySelector("[data-loader-block]");
  var top   = wrap.querySelector("[data-loader-top]");
  var bot   = wrap.querySelector("[data-loader-bot]");
  if (!panel || !bar || !block || !top || !bot) return tl;

  /* Steps: 00 → ~30 → ~70 → 100 */
  var step1 = gsap.utils.random(25, 35, 1);
  var step2 = gsap.utils.random(65, 75, 1);

  /* Flip wait = duration + max stagger + pad */
  var flipWait2 = 0.68 + 0.07 + 0.02;
  var flipWait3 = 0.68 + 0.14 + 0.02;

  var makeDigits = function(n) {
    return (n < 10 ? "0" + n : "" + n)
      .split("")
      .map(function(c, i) { return '<span class="loader-digit" style="--d:' + i + '">' + c + "</span>"; })
      .join("");
  };

  var setY = function(pct) {
    var s = getComputedStyle(panel);
    var travel = Math.max(0, panel.clientHeight - (parseFloat(s.paddingTop) || 0) - (parseFloat(s.paddingBottom) || 0) - block.getBoundingClientRect().height);
    block.style.transform = "translate3d(0," + -(travel * pct / 100) + "px,0)";
  };

  /* setStep: clean up previous flip, set new bot, start new flip.
     The reflow force between remove/add ensures the animation restarts. */
  var setStep = function(v) {
    block.classList.remove("is-flipping");
    void block.offsetHeight;
    bot.innerHTML = makeDigits(v);
    block.classList.add("is-flipping");
    bar.style.width = v + "%";
    setY(v);
  };

  /* commitStep: copy landed value into top so it persists.
     Do NOT clear bot or remove is-flipping — the bot digits stay
     visible via fill-mode:both until the next setStep cleans up.
     This eliminates the repaint gap that caused the flicker. */
  var commitStep = function(v) {
    top.innerHTML = makeDigits(v);
  };

  /* Setup — 00 visible immediately */
  tl.call(function() {
    if (typeof stopLenis === "function") stopLenis();
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    gsap.set(wrap, { display: "block", autoAlpha: 1, pointerEvents: "auto" });
    top.innerHTML = makeDigits(0);
    bot.innerHTML = "";
    bar.style.width = "0%";
    block.classList.remove("is-flipping");
    block.style.transition = "none";
    bar.style.transition = "none";
    setY(0);
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        block.style.transition = "";
        bar.style.transition = "";
      });
    });
  });

  /* Step 1 → ~30 */
  tl.to({}, { duration: 0.08 });
  tl.call(function() { setStep(step1); });
  tl.to({}, { duration: flipWait2 });
  tl.call(function() { commitStep(step1); });

  /* Step 2 → ~70 */
  tl.to({}, { duration: 0.02 });
  tl.call(function() { setStep(step2); });
  tl.to({}, { duration: flipWait2 });
  tl.call(function() { commitStep(step2); });

  /* Step 3 → 100 */
  tl.to({}, { duration: 0.02 });
  tl.call(function() { setStep(100); });
  tl.to({}, { duration: flipWait3 });
  tl.call(function() { commitStep(100); });

  /* Fade out 250ms after 100 lands */
  tl.to(wrap, { autoAlpha: 0, duration: 0.25, ease: "power2.out" });

  /* Teardown */
  tl.call(function() {
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    if (typeof startLenis === "function") startLenis();
    gsap.set(wrap, { display: "none", autoAlpha: 0, pointerEvents: "none" });
    block.classList.remove("is-flipping");
    block.style.transform = "";
    bar.style.width = "0%";
    top.innerHTML = makeDigits(0);
    bot.innerHTML = "";
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
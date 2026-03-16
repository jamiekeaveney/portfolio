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
  // if (has('[data-something]')) initSomething();
}

function initAfterEnterFunctions(next) {
  nextPage = next || document;
  
  // Runs after enter animation completes
  // if (has('[data-something]')) initSomething();
  
  
  if(hasLenis){
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

  if (reducedMotion || shouldUseInstantMobileTransition()) return tl;

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
    if (typeof stopLenis === "function") stopLenis();

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

    if (typeof startLenis === "function") startLenis();

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

function runPageLeaveAnimation(current, next) {
  const transitionWrap = document.querySelector("[data-transition-wrap]");
  const transitionDark = transitionWrap.querySelector("[data-transition-dark]");

  const tl = gsap.timeline({
    onComplete: () => {
      current.remove(); 
    }
  })
  
  CustomEase.create("parallax", "0.7, 0.05, 0.13, 1");
  
  if (reducedMotion) {
    // Immediate swap behavior if user prefers reduced motion
    return tl.set(current, { autoAlpha: 0 });
  }
  
  tl.set(transitionWrap, {
    zIndex: 2
  });
  
  tl.fromTo(transitionDark, {
    autoAlpha: 0
  },{
    autoAlpha: 0.8,
    duration: 1.2,
    ease: "parallax"
  }, 0);
  
  tl.fromTo(current,{
    y: "0vh"
  },{
    y: "-25vh",
    duration: 1.2,
    ease: "parallax",
  }, 0);
  
  tl.set(transitionDark, {
    autoAlpha: 0,
  });

  return tl;
}

function runPageEnterAnimation(next){
  const tl = gsap.timeline();
  
  if (reducedMotion) {
    // Immediate swap behavior if user prefers reduced motion
    tl.set(next, { autoAlpha: 1 });
    tl.add("pageReady")
    tl.call(resetPage, [next], "pageReady");
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
  tl.call(resetPage, [next], "pageReady");

  return new Promise(resolve => {
    tl.call(resolve, null, "pageReady");
  });
}

function runWorkLeaveAnimation(current, next, trigger) {
  const clicked = trigger.closest("[data-case-link]");
  const thumbnail = clicked.querySelector("[data-case-thumbnail]");
  const nextHero = next.querySelector(".section")

  flipState = Flip.getState(thumbnail);
  flippedThumbnail = thumbnail;
  
  const tl = gsap.timeline({
    onComplete: () => current.remove()
  });
  
  if (reducedMotion) {
    return tl.set(current, { autoAlpha: 0 });
  }
  
  tl.to(current,{
    autoAlpha: 0,
    duration: 0.6
  }, 0)
  
  tl.set(nextHero,{backgroundColor: "transparent"}, 0)
  
  return tl;
}

function runCaseEnterAnimation(next) {
  const nextHero = next.querySelector(".section")
  const revealTargets = nextHero.querySelectorAll("[data-case-reveal]") 
  
  const tl = gsap.timeline();
  
  if (reducedMotion) {
    flippedThumbnail = null;
    flipState = null;
    tl.set(next, { autoAlpha: 1 });
    tl.add("pageReady");
    tl.call(resetPage, [next], "pageReady");
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
    
  tl.fromTo(nextHero,{
    backgroundColor: "transparent"
  },{
    backgroundColor: "#FFF",
    duration: 0.5
  }, "startEnter")

  tl.fromTo(revealTargets,{
    autoAlpha:0,
    yPercent: 25
  },{
    autoAlpha:1,
    yPercent: 0,
    stagger: 0.1
  }, "startEnter+=0.1")
  
  tl.add("pageReady");
  tl.call(resetPage, [next], "pageReady");
  
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
  
  initBeforeEnterFunctions(data.next.container);
  applyThemeFrom(data.next.container);
});

barba.hooks.afterLeave(() => {
  if(hasScrollTrigger){
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  }
});

barba.hooks.enter(data => {
  initBarbaNavUpdate(data);
})

barba.hooks.afterEnter(data => {
  // Run page functions
  initAfterEnterFunctions(data.next.container);
  
  // Settle
  if(hasLenis){
    lenis.resize();
    lenis.start();    
  }
  
  if(hasScrollTrigger){
    ScrollTrigger.refresh(); 
  }
});

barba.init({
  debug: false, // Set to 'false' in production
  timeout: 7000,
  preventRunning: true,
  transitions: [
    {
      name: "work-to-case",
      sync: true,
      from: { namespace: ["work"] },
      to: { namespace: ["case"] },
      custom: ({ trigger }) => trigger.hasAttribute("data-case-link"),
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

function resetPage(container){
  window.scrollTo(0, 0);
  gsap.set(container, { clearProps: "position,top,left,right" });
  
  if(hasLenis){
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



// -----------------------------------------
// YOUR FUNCTIONS GO BELOW HERE
// -----------------------------------------
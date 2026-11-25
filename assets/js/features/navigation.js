(() => {
  const SETTINGS = {
    compactAfter: 64,
    expandBefore: 24,
    desktopWidth: 992,
    heroExitViewportFraction: .4,
    layoutDuration: .95,
    layoutEase: "case-two-step",
    layoutCurve: "0.625, 0.05, 0, 1",
    fadeDuration: .3,
    storageKey: "jk-theme",
    defaultTheme: "dark"
  };
  const root = document.documentElement;
  function applyTheme(theme) {
    root.dataset.themeStatus = theme;
    document.querySelectorAll("[data-theme-toggle]").forEach((b => {
      b.setAttribute("aria-checked", String(theme === "light"));
      b.setAttribute("aria-label", theme === "light" ? "Switch to dark theme" : "Switch to light theme");
    }));
    document.querySelectorAll("[data-theme-label]").forEach((el => el.textContent = theme === "light" ? "Light theme" : "Dark theme"));
  }
  let theme = SETTINGS.defaultTheme;
  try {
    theme = localStorage.getItem(SETTINGS.storageKey) || theme;
  } catch {}
  applyTheme(theme === "light" ? "light" : "dark");
  function init() {
    if (window.JKHeader) return;
    const nav = document.querySelector(".nav_wrap");
    if (!nav) return;
    const toggle = nav.querySelector("#nav-toggle");
    document.addEventListener("click", event => {
      if (!toggle?.checked || event.target.closest('.nav_mobile_wrap,label[for="nav-toggle"],#nav-toggle')) return;
      toggle.checked = false;
      toggle.dispatchEvent(new Event("change", { bubbles: true }));
    }, true);
    nav.querySelectorAll(".nav_project_count").forEach(count => {
      const button = count.closest(".nav_item")?.querySelector(".button_wrap");
      if (button) button.append(count);
    });

    const scrolledVariant = "w-variant-e72fbfa9-7432-caad-d8b8-f691e4b91418";
    const mobileVariant = "w-variant-0f7d95bf-3fe7-c346-459f-79ff0521e166";
    const layoutNodes = [ nav, ...nav.querySelectorAll("*") ];
    nav.querySelectorAll(".nav_project_count").forEach(el => el.removeAttribute("data-nav-fade"));
    const fading = [ ...nav.querySelectorAll("[data-nav-fade]") ];
    const moving = [ ...nav.querySelectorAll("[data-nav-flip]") ];
    const wordmark = nav.querySelector(".nav_wordmark");
    if (wordmark) {
      const label = wordmark.textContent;
      wordmark.setAttribute("aria-label", label);
      wordmark.textContent = "";
      Array.from(label).forEach(((letter, i) => {
        const mask = document.createElement("span");
        mask.className = "nav_logo_char";
        mask.setAttribute("aria-hidden", "true");
        mask.style.setProperty("--char-i", i);
        for (let n = 0; n < 2; n++) {
          const glyph = document.createElement("span");
          glyph.className = n === 0 ? "nav_logo_glyph" : "nav_logo_glyph nav_logo_glyph_repeat";
          glyph.textContent = letter === " " ? " " : letter;
          mask.append(glyph);
        }
        wordmark.append(mask);
      }));
    }
    let heroTween, arrowTween;
    let heroPage = document.querySelector('[data-barba="container"]');
    function seekHeroText(y) {
      if (!heroTween) return;
      const flip = window.ScrollTrigger?.getById("jk-home-showreel");
      const start = flip?.start ?? 0;
      const distance = Math.max(1, innerHeight * SETTINGS.heroExitViewportFraction);
      heroTween.progress(Math.max(0, Math.min(1, (y - start) / distance)));
    }
    function refreshHeroText() {
      heroTween?.revert();
      heroTween = null;
      if (!heroPage || !window.gsap || innerWidth < SETTINGS.desktopWidth ||
          matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const chars = heroPage.querySelectorAll("[data-home-scroll] .hero_scroll_char");
      const lines = heroPage.querySelectorAll("[data-home-intro-exit] .hero_scroll_line");
      if (!chars.length && !lines.length) return;
      heroTween = gsap.timeline({paused:true, defaults:{duration:SETTINGS.layoutDuration, ease:"none"}});
      if (chars.length) heroTween.fromTo(chars, {yPercent:0}, {yPercent:-120, stagger:.025}, 0);
      if (lines.length) {
        const stagger = parseFloat(lines[0].closest("[data-home-intro-exit]").dataset.linesStagger) ||
          parseFloat(getComputedStyle(root).getPropertyValue("--motion-line-stagger")) || .1;
        heroTween.fromTo(lines, {yPercent:0}, {yPercent:-120, stagger}, 0);
      }
      seekHeroText(routeY ?? scrollY);
    }
    function moveHeroArrow(hidden, immediate = false) {
      const arrows = heroPage?.querySelectorAll("[data-home-arrow-exit],.section_wrap.is-home-hero .scroll_arrow_mask");
      if (!arrows?.length || !window.gsap) return;
      if (innerWidth < SETTINGS.desktopWidth) { hidden = false; immediate = true; }
      arrowTween?.kill();
      if (window.CustomEase) CustomEase.create(SETTINGS.layoutEase, SETTINGS.layoutCurve);
      arrowTween = gsap.to(arrows, {y:hidden ? "-1.5rem" : 0, autoAlpha:hidden ? 0 : 1,
        duration:immediate ? 0 : .3, ease:SETTINGS.layoutEase, overwrite:true});
    }
    function moveHero(hidden, immediate) {
      refreshHeroText();
      moveHeroArrow(hidden, immediate);
    }
    let routeY = null;
    let compact = scrollY > SETTINGS.compactAfter, desktop = innerWidth >= SETTINGS.desktopWidth, tween, fade, locked = false;
    function applyLayout(preserveFading = false) {
      const brand = nav.querySelector(".nav_brand");
      if (brand) brand.setAttribute("aria-label", "Jamie Keaveney — home");
      const id = desktop ? compact ? scrolledVariant : null : mobileVariant;
      layoutNodes.forEach((el => {
        if (preserveFading && el.closest("[data-nav-fade]")) return;
        el.classList.remove(scrolledVariant, mobileVariant);
        if (id) el.classList.add(id);
      }));
      nav.dataset.navCompact = String(compact);
      nav.setAttribute("data-wf--navigation--variant", desktop ? compact ? "scrolled" : "top-of-page" : "mobile");
      fading.forEach((el => el.inert = compact || !desktop));
    }
    function finish() {
      tween?.progress(1);
      tween?.kill();
      fade?.progress(1);
      fade?.kill();
    }
    function change(next, immediate = false, options = {}) {
      if (next === compact) return;
      finish();
      const animate = !immediate && window.gsap && window.Flip && !matchMedia("(prefers-reduced-motion: reduce)").matches;
      const state = animate ? Flip.getState(moving) : null;
      document.dispatchEvent(new CustomEvent('jk:nav-layout',{detail:{compact:next,fadeDuration:SETTINGS.fadeDuration,duration:animate?(options.duration??SETTINGS.layoutDuration):0,ease:options.ease??SETTINGS.layoutEase}}));
      compact = next;
      moveHeroArrow(next, immediate);
      applyLayout(animate && next);
      if (!animate) {
        applyLayout();
        return;
      }
      if (window.CustomEase) CustomEase.create(SETTINGS.layoutEase, SETTINGS.layoutCurve);
      const duration = options.duration ?? SETTINGS.layoutDuration, ease = options.ease ?? SETTINGS.layoutEase;
      tween = Flip.from(state, {
        duration: duration,
        ease: ease,
        absolute: false,
        scale: false,
        prune: true
      });
      const clear = () => {
        gsap.set(fading, {
          clearProps: "opacity,visibility"
        });
        applyLayout();
      };
      fade = compact ? gsap.to(fading, {
        autoAlpha: 0,
        duration: SETTINGS.fadeDuration,
        onComplete: clear
      }) : gsap.fromTo(fading, {
        autoAlpha: 0
      }, {
        autoAlpha: 1,
        duration: SETTINGS.fadeDuration,
        onComplete: clear
      });
    }
    function syncPosition() {
      routeY = null;
      locked = false;
      update(true);
      moveHero(compact, true);
    }
    function update(immediate = false) {
      const y = routeY ?? scrollY;
      seekHeroText(y);
      const nextDesktop = innerWidth >= SETTINGS.desktopWidth;
      if (nextDesktop !== desktop) {
        finish();
        desktop = nextDesktop;
        if (desktop) {
          const toggle = nav.querySelector("#nav-toggle");
          if (toggle?.checked) {
            toggle.checked = false;
            toggle.dispatchEvent(new Event("change", {
              bubbles: true
            }));
          }
        }
        compact = y > SETTINGS.compactAfter;
        applyLayout();
        moveHero(compact, true);
        return;
      }
      if (!desktop) return;
      change(compact ? y > SETTINGS.expandBefore : y > SETTINGS.compactAfter, immediate);
    }
    window.JKHeader = {
      beginMediaTransition() {
        update();
      },
      endMediaTransition() {
        locked = false;
        requestAnimationFrame(syncPosition);
      },
      update: update,
      syncPosition: syncPosition,
      refreshHero() {
        moveHero(compact, true);
      }
    };
    applyLayout();
    async function updateProjectCount() {
      try {
        const response = await fetch("/projects", {
          credentials: "same-origin"
        });
        if (!response.ok) return;
        const doc = (new DOMParser).parseFromString(await response.text(), "text/html");
        const group = doc.querySelector('[data-count-group="projects"]');
        if (!group) return;
        const count = group.querySelectorAll("[data-count-item]").length;
        nav.querySelectorAll('[data-count-display="projects"]').forEach((el => el.textContent = count));
      } catch {}
    }
    updateProjectCount();
    nav.querySelectorAll("[data-theme-toggle]").forEach((button => button.addEventListener("click", (event => {
      event.preventDefault();
      const value = root.dataset.themeStatus === "dark" ? "light" : "dark";
      root.setAttribute("data-theme-changing", "");
      clearTimeout(window.JKThemeTimer);
      applyTheme(value);
      window.JKThemeTimer = setTimeout((() => root.removeAttribute("data-theme-changing")), 350);
      try {
        localStorage.setItem(SETTINGS.storageKey, value);
      } catch {}
    }))));
    nav.querySelectorAll("[data-theme-toggle]").forEach((button => button.addEventListener("keydown", (event => {
      if (event.key === " " && button.tagName !== "BUTTON") {
        event.preventDefault();
        button.click();
      }
    }))));
    window.addEventListener("scroll", (() => update()), {
      passive: true
    });
    window.addEventListener("resize", (() => update(true)), {
      passive: true
    });
    window.addEventListener("pageshow", (() => {
      applyTheme(root.dataset.themeStatus);
      update(true);
    }));
    document.addEventListener("jk:page-intro", (() => {
      if (window.CustomEase) CustomEase.create(SETTINGS.layoutEase, SETTINGS.layoutCurve);
      moveHero(compact, true);
    }));
    // Fixed transition containers reset the physical window scroll. Preserve the
    // logical page position until the destination's saved position has been restored.
        const freeze = window.freezeContainer;
    if (freeze) window.freezeContainer = function(page) {
      routeY = typeof getCurrentScroll === "function" ? getCurrentScroll() : scrollY;
      heroTween?.kill();
      heroTween = null;
      arrowTween?.pause();
      heroPage = null;
      return freeze(page);
    };
    if (window.barba) {
      barba.hooks.beforeEnter((d => {
        heroPage = d.next.container;
        let saved;
        try {
          saved = JSON.parse(sessionStorage.getItem("jk-project-origin"));
        } catch {}
        routeY = d.current.container?.matches("[data-case-page]") && d.next.url.path === saved?.path ? saved.path === "/about" ? 0 : saved.y : 0;
        update(false);
        moveHero(compact, true);
      }));
      barba.hooks.afterEnter((() => {
        applyTheme(root.dataset.themeStatus);
      }));
      barba.hooks.after((() => requestAnimationFrame(syncPosition)));
      barba.hooks.afterOnce((() => requestAnimationFrame(syncPosition)));
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {
    once: true
  }); else init();
})();

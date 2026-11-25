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
  delete root.dataset.fontPreview;
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
    function syncMenu() {
      nav.classList.toggle("sitenav--menu-open", Boolean(toggle?.checked));
    }
    toggle?.addEventListener("change", syncMenu);
    syncMenu();
    document.addEventListener("click", event => {
      if (!toggle?.checked || event.target.closest('.sitenav_mobile_wrap,label[for="nav-toggle"],#nav-toggle')) return;
      toggle.checked = false;
      toggle.dispatchEvent(new Event("change", { bubbles: true }));
    }, true);
    nav.querySelector(".transition.mobile")?.classList.add("sitenav__overlay");
    nav.querySelector(".transition_dark.mobile")?.classList.add("sitenav__overlay-shade");
    nav.querySelectorAll(".sitenav_project_count").forEach(count => {
      const button = count.closest(".sitenav_item")?.querySelector(".btn");
      if (button) {
        button.classList.add("sitenav__link--counted");
        button.append(count);
      }
    });

    const contact = nav.querySelector(".sitenav_contact .btn");
    contact?.classList.add("sitenav__contact-link", "sitenav__link-surface");
    contact?.querySelectorAll(".btn_main, .btn_text_mask, .btn_text").forEach(part => {
      part.classList.add("sitenav__contact-content");
    });
    nav.querySelectorAll(".sitenav .btn_main").forEach(part => part.classList.add("sitenav__button-body"));
    nav.querySelectorAll(".sitenav .btn_text_mask").forEach(part => part.classList.add("sitenav__button-mask"));

    const groups = Array.from(nav.querySelectorAll(".sitenav_links, .sitenav_socials"), group => {
      const links = Array.from(group.querySelectorAll('[data-wf--super-button--variant="navigation-desktop"]'));
      for (const link of links) {
        link.classList.add("sitenav__link", "sitenav__link-surface");
        link.addEventListener("pointerenter", () => group.classList.add("sitenav__group--pointed"));
        link.addEventListener("pointerleave", () => group.classList.remove("sitenav__group--pointed"));
      }
      return { group, links, primary: group.classList.contains("sitenav_links") };
    });
    const variants = ["77974df0-b189-fee1-a56a-288237d327e5", "e72fbfa9-7432-caad-d8b8-f691e4b91418", "0f7d95bf-3fe7-c346-459f-79ff0521e166"];
    const layoutNodes = [ nav, ...nav.querySelectorAll("*") ];
    nav.querySelectorAll(".sitenav_project_count").forEach(el => el.removeAttribute("data-nav-fade"));
    const fading = [ ...nav.querySelectorAll("[data-nav-fade]") ];
    const moving = [ ...nav.querySelectorAll("[data-nav-flip]") ];
    const wordmark = nav.querySelector(".sitenav_wordmark");
    if (wordmark) {
      const label = wordmark.textContent;
      wordmark.setAttribute("aria-label", label);
      wordmark.textContent = "";
      Array.from(label).forEach(((letter, i) => {
        const mask = document.createElement("span");
        mask.className = "nav-logo__char";
        mask.setAttribute("aria-hidden", "true");
        mask.style.setProperty("--char-i", i);
        for (let n = 0; n < 2; n++) {
          const glyph = document.createElement("span");
          glyph.className = n === 0 ? "nav-logo__glyph" : "nav-logo__glyph nav-logo__glyph--repeat";
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
      const chars = heroPage.querySelectorAll("[data-home-scroll] .hero-scroll-char");
      const lines = heroPage.querySelectorAll("[data-home-intro-exit] .hero-scroll-line");
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
      const arrows = heroPage?.querySelectorAll("[data-home-arrow-exit],.hero .scroll_arrow_mask");
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
      delete nav.dataset.innerPage;
      const brand = nav.querySelector(".sitenav_brand");
      if (brand) brand.setAttribute("aria-label", "Jamie Keaveney — home");
      const id = desktop ? compact ? variants[1] : null : variants[2];
      layoutNodes.forEach((el => {
        if (preserveFading && el.closest("[data-nav-fade]")) return;
        variants.forEach((v => el.classList.remove("w-variant-" + v)));
        if (id) el.classList.add("w-variant-" + id);
      }));
      nav.dataset.navCompact = String(compact);
      nav.setAttribute("data-wf--nav--variant", desktop ? compact ? "scrolled" : "top-of-page" : "mobile");
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
    function nameButtons(scope) {
      scope.querySelectorAll("a.btn:not([aria-label])").forEach((button => {
        const text = button.querySelector(".btn_text")?.textContent.trim();
        if (text) button.setAttribute("aria-label", text);
      }));
    }
    function syncGroups(path = location.pathname) {
      for (const { group, links, primary } of groups) {
        let hasCurrent = false;
        for (const link of links) {
          const current = primary && new URL(link.href, location.href).pathname === path;
          link.classList.toggle("w--current", current);
          link.classList.toggle("sitenav__link--current", current);
          if (current) link.setAttribute("aria-current", "page");
          else link.removeAttribute("aria-current");
          hasCurrent ||= current;
        }
        group.classList.toggle("sitenav__group--current", hasCurrent);
      }
    }
    syncGroups();
    nameButtons(document);
    if (window.barba) barba.hooks.afterEnter((d => nameButtons(d.next.container)));
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
    document.querySelectorAll(".cta-section a.secondary-link,[data-footer-link]").forEach((a => {
      const current = a.getAttribute("href")?.startsWith("/") && new URL(a.href, location.href).pathname === location.pathname;
      a.classList.toggle("w--current", current);
      if (current) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    }));
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
      syncMenu();
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
    if (window.syncNavState) window.syncNavState = function(data) {
      const path = new URL(data.next.url.href).pathname;
      syncGroups(path);
      document.querySelectorAll("a[data-barba-update],.cta-section a.secondary-link,[data-footer-link]").forEach((a => {
        const current = a.getAttribute("href")?.startsWith("/") && new URL(a.href, location.href).pathname === path;
        a.classList.toggle("w--current", current);
        if (current) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
      }));
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

(() => {
  /* TUNE HERE — pixels and seconds. Match the project media expansion settings. */
  const SETTINGS = {
    compactAfter: 64,
    expandBefore: 24,
    desktopWidth: 992,
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
    const nav = document.querySelector(".nav-root");
    if (!nav) return;
    document.addEventListener("click", (event => {
      const toggle = nav.querySelector("#nav-toggle");
      if (!toggle?.checked) return;
      if (event.target.closest('.sitenav__mobile-wrap,label[for="nav-toggle"],#nav-toggle')) return;
      toggle.checked = false;
      toggle.dispatchEvent(new Event("change", {
        bubbles: true
      }));
    }), true);
    const variants = [ "77974df0-b189-fee1-a56a-288237d327e5", "e72fbfa9-7432-caad-d8b8-f691e4b91418", "0f7d95bf-3fe7-c346-459f-79ff0521e166" ];
    // Apply only Nav variant classes; existing Super Button variant classes remain intact.
    // Include every descendant so new Designer elements and overrides inherit the chosen layout.
        nav.querySelectorAll(".nav-project-count").forEach((count => {
      const button = count.closest(".sitenav__item")?.querySelector("a.btn");
      if (button) button.append(count);
    }));
    const layoutNodes = [ nav, ...nav.querySelectorAll("*") ];
    nav.querySelectorAll(".nav-project-count").forEach((el => el.setAttribute("data-nav-fade", "")));
    const fading = [ ...nav.querySelectorAll("[data-nav-fade]") ];
    const moving = [ ...nav.querySelectorAll("[data-nav-flip]") ];
    const wordmark = nav.querySelector(".sitenav__wordmark");
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
          glyph.className = "nav-logo__glyph";
          glyph.textContent = letter === " " ? " " : letter;
          mask.append(glyph);
        }
        wordmark.append(mask);
      }));
    }
    let heroTween;
    function moveHero(hidden, immediate = false) {
      if (innerWidth < SETTINGS.desktopWidth) {
        hidden = false;
        immediate = true;
      }
      const chars = [ ...document.querySelectorAll("[data-home-scroll] .hero-scroll-char") ];
      const lines = [ ...document.querySelectorAll("[data-home-intro-exit] .hero-scroll-line") ], arrows = [ ...document.querySelectorAll("[data-home-arrow-exit],.hero .scroll-arrow__mask") ];
      if (!window.gsap || !chars.length && !lines.length && !arrows.length) return;
      heroTween?.kill();
      if (window.CustomEase) CustomEase.create(SETTINGS.layoutEase, SETTINGS.layoutCurve);
      const duration = immediate ? 0 : SETTINGS.layoutDuration;
      heroTween = gsap.timeline().to(chars, {
        yPercent: hidden ? -120 : 0,
        duration: duration,
        stagger: immediate ? 0 : .025,
        ease: SETTINGS.layoutEase,
        overwrite: true
      }, 0).to(lines, {
        yPercent: hidden ? -120 : 0,
        duration: duration,
        stagger: immediate ? 0 : parseFloat(lines[0]?.closest("[data-home-intro-exit]")?.dataset.linesStagger) || parseFloat(getComputedStyle(root).getPropertyValue("--motion-line-stagger")) || .1,
        ease: SETTINGS.layoutEase,
        overwrite: true
      }, 0).to(arrows, {
        y: hidden ? "-1.5rem" : 0,
        autoAlpha: hidden ? 0 : 1,
        duration: immediate ? 0 : .3,
        ease: SETTINGS.layoutEase,
        overwrite: true
      }, 0);
    }
    let routeY = null;
    let compact = scrollY > SETTINGS.compactAfter, desktop = innerWidth >= SETTINGS.desktopWidth, tween, fade, locked = false;
    function applyLayout(preserveFading = false) {
      delete nav.dataset.innerPage;
      const brand = nav.querySelector(".sitenav__brand");
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
      compact = next;
      moveHero(next, immediate);
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
      nav.querySelectorAll('[data-wf--super-button--variant="navigation-desktop"]').forEach(a => {
        const href = a.getAttribute('href') || '';
        const group = a.closest('ul') || a.parentElement.parentElement;
        const primary = href.startsWith('/');
        group.dataset.navGroup = primary ? 'primary' : 'social';
        const current = primary && new URL(a.href, location.href).pathname === path;
        a.classList.toggle('w--current', current);
        if (current) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
      });
      nav.querySelectorAll('[data-nav-group="primary"]').forEach(g => g.dataset.hasCurrent = String(!!g.querySelector('[aria-current="page"]')));
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

/* Project lifecycle and CMS navigation. */
(() => {
  /* TUNE HERE — durations/delays in seconds unless labelled Ms; distances in rem or %. */
  const SETTINGS = {
    resizeDebounceMs: 220
  };
  if (window.JKProject) return;
  const modules = [], states = new WeakMap;
  const api = window.JKProject = {
    modules: modules,
    states: states,
    reduced: () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    rem: n => n / parseFloat(getComputedStyle(document.documentElement).fontSize) + "rem",
    lenis: () => {
      try {
        return typeof lenis !== "undefined" ? lenis : null;
      } catch {
        return null;
      }
    },
    register: fn => modules.push(fn)
  };
  function dispose(page) {
    const s = states.get(page);
    if (!s) return;
    s.abort.abort();
    s.observer?.disconnect();
    s.context?.revert();
    s.cleanups.reverse().forEach((f => f()));
    states.delete(page);
  }
  function init(page) {
    if (!page?.matches("[data-case-page]")) return;
    dispose(page);
    const s = {
      page: page,
      abort: new AbortController,
      cleanups: [],
      expanded: false,
      ready: false
    };
    states.set(page, s);
    page.querySelectorAll(".project-hero__meta-cell,.case-details__row").forEach((row => {
      const v = row.querySelector(".case-meta-value");
      row.style.display = v && !v.textContent.trim() ? "none" : "";
    }));
    const source = page.querySelector("[data-case-next-source]");
    const records = [ ...source?.querySelectorAll(".case-next__item") || [] ].map((item => ({
      item: item,
      link: item.querySelector("[data-scroll-next-link]")
    }))).filter((r => r.link));
    const title = page.querySelector("h1")?.textContent.trim();
    const index = records.findIndex((r => r.link.querySelector(".case-index__title,.case-next__title,[data-next-title]")?.textContent.trim() === title));
    s.next = records.length > 1 ? records[(index + 1 + records.length) % records.length] : null;
    s.prev = records.length > 1 ? records[(index - 1 + records.length) % records.length] : null;
    records.forEach((r => r.item.style.display = ""));
    page.querySelectorAll("[data-case-native-nav]").forEach((a => {
      const dest = a.dataset.caseDirection === "prev" ? s.prev : s.next;
      if (dest) {
        a.href = dest.link.href;
        a.setAttribute("aria-label", (a.dataset.caseDirection === "prev" ? "Previous project: " : "Next project: ") + dest.link.querySelector(".case-index__title").textContent.trim());
      }
    }));
    s.context = gsap.context((() => modules.forEach((fn => fn(s)))), page);
    api.lenis()?.resize();
    ScrollTrigger.refresh();
  }
  api.init = init;
  api.dispose = dispose;
  function boot() {
    if (!window.gsap || !window.ScrollTrigger || !window.barba) return;
    gsap.registerPlugin(ScrollTrigger, Flip);
    init(document.querySelector("[data-case-page]"));
    barba.hooks.afterOnce((d => {if(!states.has(d.next.container))init(d.next.container);}));
    barba.hooks.afterEnter((d => init(d.next.container)));
    barba.hooks.after((d => dispose(d.current.container)));
    let width = innerWidth, timer;
    window.addEventListener("resize", (() => {
      clearTimeout(timer);
      timer = setTimeout((() => {
        if (width !== innerWidth && !document.documentElement.hasAttribute("data-transitioning")) {
          width = innerWidth;
          init(document.querySelector("[data-case-page]"));
        }
      }), SETTINGS.resizeDebounceMs);
    }));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {
    once: true
  }); else setTimeout(boot, 0);
})();

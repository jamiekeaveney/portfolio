(function() {
  const chevron = direction => '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="' + (direction === "prev" ? "M10 3 5 8l5 5" : "m6 3 5 5-5 5") + '" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
  let projectOrder;
  function order() {
    return projectOrder || (projectOrder = fetch("/projects").then((r => r.text())).then((html => {
      const d = (new DOMParser).parseFromString(html, "text/html");
      return [ ...new Set([ ...d.querySelectorAll("[data-work-item] a[href]") ].map((a => a.getAttribute("href")))) ];
    })).catch((() => [])));
  }
  function mount(page = document.querySelector('[data-barba="container"]')) {
    if (!page) return;
    const nav = page.querySelector("[data-case-nav]");
    if (nav && !nav.hasAttribute("data-jk-nav")) {
      nav.dataset.jkNav = "";
      const row = nav.querySelector(".case-nav__row"), prev = row.querySelector('[data-case-direction="prev"]'), next = row.querySelector('[data-case-direction="next"]');
      const context = document.createElement("div");
      context.className = "case-nav__context";
      const back = document.createElement("a");
      let origin;
      try {
        origin = JSON.parse(sessionStorage.getItem("jk-project-origin"));
      } catch (_) {}
      const labels = {
        "/": "Home",
        "/about": "About",
        "/approach": "Approach",
        "/projects": "All projects"
      };
      const path = Object.hasOwn(labels, origin?.path) ? origin.path : "/projects";
      back.href = path;
      back.className = "case-nav__back";
      back.innerHTML = chevron("prev") + "<span>" + labels[path] + "</span>";
      const slash = document.createElement("span");
      slash.textContent = "/";
      slash.className = "case-nav__separator";
      const title = document.createElement("span");
      title.className = "case-nav__current";
      title.textContent = page.querySelector("h1")?.textContent || "";
      context.append(back, slash, title);
      const controls = document.createElement("div");
      controls.className = "case-nav__controls";
      const count = document.createElement("span");
      count.className = "case-nav__count";
      prev.innerHTML = chevron("prev");
      next.innerHTML = chevron("next");
      controls.append(count, prev, next);
      row.append(context, controls);
      order().then((paths => {
        const idx = paths.indexOf(location.pathname);
        if (idx >= 0) count.textContent = String(idx + 1).padStart(2, "0") + " / " + String(paths.length).padStart(2, "0");
      }));
    }
  }
  function boot() {
    mount();
    if (window.barba) {
      barba.hooks.beforeEnter((d => mount(d.next.container)));
      barba.hooks.afterEnter((d => mount(d.next.container)));
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {
    once: true
  }); else boot();
})();

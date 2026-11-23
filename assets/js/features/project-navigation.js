(function() {
  const chevron = direction => '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="' + (direction === "prev" ? "M10 3 5 8l5 5" : "m6 3 5 5-5 5") + '" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
  let projectOrder;
  function order() {
    return projectOrder || (projectOrder = fetch("/projects").then((r => r.text())).then((html => {
      const d = (new DOMParser).parseFromString(html, "text/html");
      return [ ...new Set([ ...d.querySelectorAll("[data-work-item] a[href]") ].map((a => a.getAttribute("href")))) ];
    })).catch((() => [])));
  }
  const flights=new WeakMap();
  function bindTitle(page, title, slash) {
    const hero = page.querySelector('.project-hero__title');
    if (!hero) return;
    const desktop = matchMedia('(min-width:62rem)');
    const nav = title.closest('[data-case-nav]');
    let compact = document.querySelector('.nav-root')?.dataset.navCompact === 'true';
    let motion, pieces = [];

    function syncVisibility() {
      if (!nav || !pieces.length) return;
      // The travelling words are outside the navigation's DOM. Follow its live
      // fade independently of their movement, including a fade begun mid-flight.
      const style = getComputedStyle(nav);
      const opacity = style.visibility === 'hidden' || style.display === 'none' ? '0' : style.opacity;
      pieces.forEach(piece => { piece.node.style.opacity = opacity; });
    }
    function settle() {
      hero.style.opacity = desktop.matches && compact ? '0' : '';
      title.style.opacity = desktop.matches && !compact ? '0' : '';
    }
    function stop() {
      motion?.kill();
      gsap.ticker.remove(syncVisibility);
      pieces.forEach(piece => piece.node.remove());
      pieces = [];
    }
    function ranges(element) {
      const words = [];
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        for (const match of walker.currentNode.data.matchAll(/\S+/g)) {
          const range = document.createRange();
          range.setStart(walker.currentNode, match.index);
          range.setEnd(walker.currentNode, match.index + match[0].length);
          words.push(range);
        }
      }
      return words;
    }
    function change({detail}) {
      const previous = pieces.map(piece => ({rect:piece.ink.getBoundingClientRect(), size:piece.size, spacing:piece.spacing}));
      stop();
      compact = detail.compact;
      const animate = desktop.matches && detail.duration && !document.documentElement.hasAttribute('data-transitioning') && !title.closest('[inert]');
      gsap.to(slash, {opacity:compact || !desktop.matches ? .4 : 0, duration:animate ? detail.fadeDuration : 0, overwrite:true});
      if (!animate) { settle(); return; }

      const large = ranges(hero), small = ranges(title);
      if (!large.length || large.length !== small.length || large.some((r,i) => r.toString() !== small[i].toString())) { settle(); return; }
      const source = compact ? large : small, target = compact ? small : large;
      const from = getComputedStyle(compact ? hero : title), to = getComputedStyle(compact ? title : hero);
      const destinationSize = parseFloat(to.fontSize), destinationSpacing = parseFloat(to.letterSpacing) || 0;
      pieces = source.map((range,i) => {
        const node = document.createElement('span');
        node.textContent = range.toString();
        node.setAttribute('aria-hidden','true');
        Object.assign(node.style,{position:'fixed',left:'0',top:'0',zIndex:'99',pointerEvents:'none',whiteSpace:'pre',color:'white',mixBlendMode:'difference',fontFamily:from.fontFamily,fontWeight:from.fontWeight,lineHeight:'1',transformOrigin:'0 0'});
        document.body.append(node);
        const ink = document.createRange();
        ink.selectNodeContents(node);
        return {node, ink, start:previous[i]?.rect || range.getBoundingClientRect(), target:target[i],
          startSize:previous[i]?.size ?? parseFloat(from.fontSize), startSpacing:previous[i]?.spacing ?? (parseFloat(from.letterSpacing)||0)};
      });
      hero.style.opacity = title.style.opacity = '0';
      const playhead = {p:0};
      function render() {
        const p = playhead.p;
        const frames = pieces.map(piece => {
          const end = piece.target.getBoundingClientRect();
          return {x:piece.start.left+(end.left-piece.start.left)*p,y:piece.start.top+(end.top-piece.start.top)*p};
        });
        pieces.forEach(piece => {
          piece.size = piece.startSize+(destinationSize-piece.startSize)*p;
          piece.spacing = piece.startSpacing+(destinationSpacing-piece.startSpacing)*p;
          Object.assign(piece.node.style,{transform:'none',fontSize:piece.size+'px',letterSpacing:piece.spacing+'px'});
        });
        const offsets = pieces.map(piece => piece.ink.getBoundingClientRect());
        pieces.forEach((piece,i) => {
          piece.node.style.transform = 'translate('+ (frames[i].x-offsets[i].left)+'px,'+(frames[i].y-offsets[i].top)+'px)';
        });
      }
      render();
      syncVisibility();
      gsap.ticker.add(syncVisibility);
      motion = gsap.to(playhead,{p:1,duration:detail.duration,ease:detail.ease,onUpdate:render,onComplete(){stop();settle();}});
    }
    function resize() {
      stop(); settle();
      gsap.set(slash,{opacity:compact || !desktop.matches ? .4 : 0});
    }
    resize();
    window.addEventListener('resize',resize);
    document.addEventListener('jk:nav-layout',change);
    flights.set(page,() => {
      stop(); settle(); gsap.killTweensOf(slash);
      window.removeEventListener('resize',resize);
      document.removeEventListener('jk:nav-layout',change);
    });
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
      bindTitle(page,title,slash);
      order().then((paths => {
        const idx = paths.indexOf(location.pathname);
        if (idx >= 0) {
          const current = document.createElement("span"), divider = document.createElement("span"), total = document.createElement("span");
          current.className = total.className = "case-nav__number";
          divider.className = "case-nav__count-divider";
          current.textContent = String(idx + 1).padStart(2, "0");
          divider.textContent = "/";
          total.textContent = String(paths.length).padStart(2, "0");
          count.replaceChildren(current, divider, total);
        }
      }));
    }
  }
  function boot() {
    mount();
    if (window.barba) {
      barba.hooks.beforeLeave(d=>flights.get(d.current.container)?.());
      barba.hooks.beforeEnter((d => mount(d.next.container)));
      barba.hooks.afterEnter((d => mount(d.next.container)));
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {
    once: true
  }); else boot();
})();

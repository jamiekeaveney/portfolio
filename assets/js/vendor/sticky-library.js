(() => {
  
  
  /* expo, scaled to reach 1 exactly: the usual 1 − 2^(−10t) stops 2^(−10) short and
   jumps the rest at t = 1, which here would be a step at the end of a landing */
  const EXPO = 1 - 2 ** -10
  /** Landing curves, as ease-outs on [0, 1]. The take-off plays the same curve mirrored. */;
  const eases = {
    power1: t => 1 - (1 - t) ** 2,
    power2: t => 1 - (1 - t) ** 3,
    power3: t => 1 - (1 - t) ** 4,
    expo: t => (1 - 2 ** (-10 * t)) / EXPO
  }
  /* the named curves' slopes at 0, exactly */;
  const SLOPES = {
    power1: 2,
    power2: 3,
    power3: 4,
    expo: 10 * Math.LN2 / EXPO
  }
  /*
 * E′(0) for an ease known only as a function. A plain forward difference reads
 * a concave curve as leaving slower than it does, which leaves the correction a
 * hair below zero at the start of the window; a second, half-width difference
 * cancels that first-order error (Richardson).
 */;
  const slope = E => {
    const d = h => (E(h) - E(0)) / h;
    return 2 * d(5e-5) - d(1e-4);
  }
  /*
 * The correction for one sticky range, as a function of x: scroll past the
 * point where sticky engages. Pure, so it can be tested without a page, and so
 * a virtual scroll, which has no sticky to correct, can use `clamp` in its
 * place.
 */;
  const curve = ({travel: travel, span: span, ease: ease = "power2", lead: lead = Infinity}) => {
    const E = typeof ease === "function" ? ease : eases[ease];
    const m = typeof ease === "function" ? slope(ease) : SLOPES[ease];
    const rounds = m > 1;
    let land = rounds ? Math.min(span / m, Math.max(0, lead)) : 0;
    let lift = rounds ? span / m : 0
    /* how far past sticky's corner a window runs, per unit of ground covered.
	   Nothing for an ease that rounds no corner, so one that is not a curve at
	   all (a slope that comes back NaN) leaves empty windows and not NaN ones. */;
    const past = rounds ? m - 1 : 0;
    const need = past * (land + lift);
    if (need > travel) {
      land *= travel / need;
      lift *= travel / need;
    }
    const into = [ -land, past * land ];
    const outof = [ travel - past * lift, travel + lift ];
    const bump = t => Math.min(m * t, 1) - E(t);
    const at = x => {
      if (x > into[0] && x < into[1]) return land * bump((x - into[0]) / (into[1] - into[0]));
      if (x > outof[0] && x < outof[1]) return -lift * bump((outof[1] - x) / (outof[1] - outof[0]));
      return 0;
    };
    return {
      travel: travel,
      into: into,
      outof: outof,
      at: at,
      clamp: x => Math.min(Math.max(x, 0), travel) + at(x)
    };
  }
  /* not in TypeScript's DOM lib yet */;
  const ViewTimeline = typeof window === "undefined" ? undefined : window.ViewTimeline
  /** Scroll-driven animations, and the WAAPI half of them this uses. */;
  const supported = !!ViewTimeline && CSS.supports("(animation-timeline: view()) and (animation-range: entry)")
  /* touch scrolls on the compositor, where a correction a frame late shows as a
   wobble and plain sticky does not; seen with both engines on a phone */;
  const POINTER = "(hover: hover) and (pointer: fine)"
  /* keyframes per window; the corners and the windows' ends are added exactly */;
  const SAMPLES = 48
  /*
 * The correction as keyframes over [into[0], outof[1]], offsets 0 to 1. Six of
 * them are exact. Sticky's two corners, because the correction's kink there
 * is what cancels sticky's. And all four ends of the two windows, where it is
 * zero: without the inner two, the last sample of the landing and the first
 * of the take-off are joined straight across the hold, and the element spends
 * all of it a fraction of a pixel off its line and drifting.
 */;
  const keyframes = ({into: into, outof: outof, travel: travel, at: at}) => {
    const [a, b] = [ into[0], outof[1] ];
    const xs = new Set([ a, 0, into[1], outof[0], travel, b ]);
    for (const [from, to] of [ into, outof ]) {
      for (let i = 1; i < SAMPLES; i++) xs.add(from + (to - from) * i / SAMPLES);
    }
    return [ ...xs ].filter((x => x >= a && x <= b)).sort(((u, v) => u - v)).map((x => ({
      offset: (x - a) / (b - a),
      translate: `0 ${at(x)}px`
    })));
  };
  const raf = fn => {
    let id = requestAnimationFrame((function loop() {
      id = requestAnimationFrame(loop);
      fn();
    }));
    return () => cancelAnimationFrame(id)
    /*
 * A scroll container between the element and the page. Sticky pins against
 * the nearest one, and everything here is measured against the root's. Any
 * overflow but `visible` and `clip` makes one; body's is the viewport's own
 * unless the root has an overflow of its own to keep it.
 */;
  };
  const scrolls = from => {
    const root = document.documentElement;
    for (let a = from; a && a !== root; a = a.parentElement) {
      if (a === document.body && getComputedStyle(root).overflowY === "visible") continue;
      const overflow = getComputedStyle(a).overflowY;
      if (overflow !== "visible" && overflow !== "clip") return true;
    }
    return false;
  }
  /*
 * Round off an element's sticky corners. It keeps its own position: sticky and
 * `top`; the correction goes on `translate`.
 */;
  const one = (el, {distance: distance = .4, ease: ease = "power2", media: media = POINTER, engine: engine = "auto", ticker: ticker = raf} = {}) => {
    const parent = el.parentElement;
    if (!parent) throw new Error("sticky: the element has no parent to stick within");
    const gate = matchMedia(media);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const timeline = engine !== "main" && supported && ViewTimeline ? new ViewTimeline({
      subject: parent,
      axis: "block"
    }) : null;
    let c = null;
    let engage = 0;
    let anim = null;
    let untick = null;
    let frozen = false
    /* what the engine that is running was built from: the engage point and
	   the curve's travel, span and lead */;
    let built = null;
    const stop = () => {
      anim?.cancel();
      anim = null;
      untick?.();
      untick = null;
      built = null;
      el.style.translate = "";
    }
    /* The correction where it stands, which a rect read now would take for
	   layout. Zero everywhere but inside the two windows. */;
    const offset = () => parseFloat(getComputedStyle(el).translate.split(" ")[1] ?? "") || 0
    /*
	 * Reads the box where the flow put it, with sticky out of the way: null
	 * when there is no sticky to round off (a breakpoint that turns it off, a
	 * `top` left at auto, a scroll container of its own to pin against).
	 * Positions are kept in scroll past the parent's top meeting the
	 * viewport's, the parent timeline's own terms.
	 */;
    const measure = shift => {
      const s = getComputedStyle(el);
      const top = parseFloat(s.top);
      if (s.position !== "sticky" || !Number.isFinite(top) || scrolls(parent)) return null;
      const position = el.style.position;
      el.style.position = "static";
      const r = el.getBoundingClientRect();
      const p = parent.getBoundingClientRect();
      el.style.position = position;
      const ps = getComputedStyle(parent);
      const floor = p.bottom - parseFloat(ps.borderBottomWidth) - parseFloat(ps.paddingBottom)
      /* the rect has the correction in it where the engine is running; the
		   flow position is the rect with that taken back out */;
      const flow = {
        top: r.top - shift,
        bottom: r.bottom - shift
      };
      const engage = flow.top - p.top - top;
      const travel = Math.max(0, floor - flow.bottom - parseFloat(s.marginBottom))
      /* the small viewport: it holds still while a phone's toolbar comes and goes */;
      const span = distance * document.documentElement.clientHeight;
      const lead = scrollY + flow.top - top;
      return {
        engage: engage,
        span: span,
        curve: curve({
          travel: travel,
          span: span,
          ease: ease,
          lead: lead
        }),
        from: [ engage, travel, span, lead ]
      };
    }
    /*
	 * Measures, and builds an engine only when the numbers moved. Most calls
	 * find them where they were: the observer's first delivery straight after
	 * the first measure, a window resize and the observer both reporting one
	 * frame, a resize that changed neither box. Those cost the read and no
	 * more, where each used to cancel the animation and make it again.
	 */;
    const refresh = () => {
      if (frozen) return;
      const running = !!(anim || untick);
      const runs = gate.matches && !reduced.matches
      /* with no engine running, this clears a pose an earlier stick froze
		   onto the element */;
      if (!runs || !running) stop()
      /* A running engine is left on for the read, and its offset is taken
		   out of the numbers. Taking the engine off instead meant a rebuild
		   for every call that found the element inside a window, and a phone
		   makes those calls in the middle of a scroll: its toolbar sliding
		   away is a resize. The animation dropped and rebuilt under the
		   finger showed as a jump. */;
      const next = runs ? measure(running ? offset() : 0) : null;
      if (next && built && next.from.every(((v, i) => Math.abs(v - (built?.[i] ?? NaN)) < .01))) return;
      stop();
      c = next?.curve ?? null;
      if (!next) return;
      engage = next.engage;
      const {into: into, outof: outof} = next.curve;
      const at = x => el.closest("[data-scroll-next-wrap]") && x >= next.curve.into[1] ? 0 : next.curve.at(x);
      if (into[1] - into[0] + (outof[1] - outof[0]) <= 0) return;
      built = next.from;
      if (timeline) {
        const options = {
          timeline: timeline,
          /* as strings: the object form wants a CSSUnitValue, and Firefox has
				   scroll-driven animations without the Typed OM to make one */
          rangeStart: `exit-crossing ${engage + into[0]}px`,
          rangeEnd: `exit-crossing ${engage + outof[1]}px`,
          fill: "none"
        };
        anim = el.animate(keyframes(next.curve), options);
        return;
      }
      let last = 0;
      const tick = () => {
        const y = at(-parent.getBoundingClientRect().top - engage);
        if (y === last) return;
        last = y;
        el.style.translate = y ? `0 ${y}px` : "";
      }
      /*
		 * On the ticker only while the parent is near the viewport. Both windows
		 * lie inside the stretch where it is, give or take a landing, and
		 * outside it the element is off screen too; a page of these otherwise
		 * reads layout once each, every frame, for as long as it is open. It
		 * starts subscribed, and written once, so a rebuild in the middle of a
		 * window does not leave the element at plain sticky for the frame or
		 * two the observer takes to report.
		 */;
      let off = ticker(tick);
      const near = new IntersectionObserver((entries => {
        if (entries[entries.length - 1]?.isIntersecting) off ??= ticker(tick); else {
          off?.();
          off = null;
        }
      }), {
        rootMargin: `${Math.ceil(next.span)}px 0px`
      });
      near.observe(parent);
      tick();
      untick = () => {
        near.disconnect();
        off?.();
        off = null;
      };
    };
    const freeze = () => {
      if (frozen) return;
      frozen = true
      /* committed inline, then the animation dropped: the element holds this
		   pose whatever the scroll does next. commitStyles throws on an element
		   that is not rendered, which has no pose to hold anyway. */;
      if (anim) {
        try {
          anim.commitStyles();
        } catch {}
        anim.cancel();
        anim = null;
      }
      untick?.();
      untick = null;
    }
    /* a resize of either box is measured before the frame paints; a viewport
	   resize catches a `top` or a distance in viewport units */;
    const ro = new ResizeObserver((() => refresh()));
    ro.observe(el);
    ro.observe(parent);
    addEventListener("resize", refresh);
    gate.addEventListener("change", refresh);
    reduced.addEventListener("change", refresh)
    /* made before its stylesheet applied, the element is not sticky yet and
	   there is nothing to measure: once more when the page has loaded */;
    if (document.readyState !== "complete") addEventListener("load", refresh, {
      once: true
    });
    refresh();
    return {
      get curve() {
        return c;
      },
      get engine() {
        return anim ? "compositor" : untick ? "main" : null;
      },
      refresh: refresh,
      freeze: freeze,
      destroy() {
        ro.disconnect();
        removeEventListener("load", refresh);
        removeEventListener("resize", refresh);
        gate.removeEventListener("change", refresh);
        reduced.removeEventListener("change", refresh)
        /* a frozen element keeps its pose: its page is still on screen */;
        if (frozen) return;
        stop();
      }
    };
  }
  /*
 * The selectors of every rule that declares `position: sticky`, at any depth:
 * inside a media query, a layer, a container query, an import. A rule nested
 * in another gives its own selector without its parent's, which matches more
 * than the rule does; the extra elements are not sticky, and one that is not
 * sticky is left alone. `unread` counts the sheets that would not open: one
 * from another origin, served without CORS, throws on `cssRules`.
 */;
  const stickySelectors = sheets => {
    const selectors = [];
    let unread = 0;
    const walk = rules => {
      for (const rule of rules) {
        if (rule.selectorText && rule.style?.position === "sticky") selectors.push(rule.selectorText);
        if (rule.cssRules) walk(rule.cssRules);
        if (rule.styleSheet) open(rule.styleSheet);
      }
    };
    const open = sheet => {
      try {
        walk(sheet.cssRules);
      } catch {
        unread++;
      }
    };
    for (const sheet of sheets) open(sheet);
    return {
      selectors: selectors,
      unread: unread
    };
  }
  /**
 * The elements a page's own CSS makes sticky, at this width or any other:
 * what its stylesheets' sticky rules match, and anything made sticky inline.
 */;
  const findSticky = (root = document) => {
    const {selectors: selectors, unread: unread} = stickySelectors([ ...root.styleSheets, ...root.adoptedStyleSheets ]);
    const found = new Set
    /* one at a time: a selector this cannot query (a pseudo-element) would
	   otherwise take the rest of the list down with it */;
    for (const selector of [ ...selectors, '[style*="sticky"]' ]) {
      try {
        for (const el of root.querySelectorAll(selector)) found.add(el);
      } catch {}
    }
    /* a sheet that would not open may hold sticky rules of its own: fall back
	   to asking every element, which finds what is sticky right now */    if (unread) {
      for (const el of root.querySelectorAll("*")) {
        if (getComputedStyle(el).position === "sticky") found.add(el);
      }
    }
    return [ ...found ];
  }
  /* `data-sticky-ease="off"` leaves an element out; an ease's name there, and
   `data-sticky-distance`, are that one element's own */;
  const own = (el, options) => {
    const {stickyEase: ease, stickyDistance: stickyDistance} = el.dataset;
    if (ease === "off") return null;
    const distance = Number(stickyDistance);
    return {
      ...options,
      ...ease && Object.hasOwn(eases, ease) ? {
        ease: ease
      } : null,
      ...stickyDistance && Number.isFinite(distance) ? {
        distance: distance
      } : null
    };
  }
  /*
 * Every sticky on the page, or every match of a selector, each with a stick
 * of its own and one handle for the lot.
 */;
  function all(first, second = {}) {
    const selector = typeof first === "string" ? first : null;
    const options = (typeof first === "string" ? second : first) ?? {};
    const sticks = new Map;
    let frozen = false;
    const scan = () => {
      if (frozen) return;
      for (const [el, stick] of sticks) {
        if (el.isConnected) continue;
        stick.destroy();
        sticks.delete(el);
      }
      const found = selector ? document.querySelectorAll(selector) : findSticky();
      for (const el of found) {
        if (sticks.has(el) || !el.parentElement) continue;
        const mine = own(el, options);
        if (mine) sticks.set(el, one(el, mine));
      }
    };
    scan()
    /*
	 * Called before the page's stylesheets are in, the search has no rules to
	 * read and finds nothing. That is not a rare order: a module script can
	 * run ahead of a stylesheet that is still loading, and WebKit was seen to
	 * do it. So it looks once more when the page has loaded.
	 */;
    const loaded = () => scan();
    if (document.readyState !== "complete") addEventListener("load", loaded, {
      once: true
    });
    return {
      sticks: sticks,
      scan: scan,
      refresh: () => sticks.forEach((stick => stick.refresh())),
      freeze() {
        frozen = true;
        sticks.forEach((stick => stick.freeze()));
      },
      destroy() {
        removeEventListener("load", loaded);
        sticks.forEach((stick => stick.destroy()));
        sticks.clear();
      }
    };
  }
  /**
 * Round off an element's sticky corners. It keeps its own position: sticky and
 * `top`; the correction goes on `translate`. `sticky.all()` does it for
 * every sticky on the page.
 */  const sticky = Object.assign(one, {
    all: all
  });
  window.JKStickyLibrary = {
    sticky: sticky,
    eases: eases,
    findSticky: findSticky,
    curve: curve
  };
})();

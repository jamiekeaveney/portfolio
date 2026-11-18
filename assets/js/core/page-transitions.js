gsap.registerPlugin(CustomEase), CustomEase.create("osmo", "0.625, 0.05, 0, 1"), 
CustomEase.create("parallax", "0.7, 0.05, 0.13, 1"), gsap.defaults({
    ease: "osmo",
    duration: .6
}), history.scrollRestoration = "manual";

const hasLenis = void 0 !== window.Lenis, hasScrollTrigger = void 0 !== window.ScrollTrigger, rmMQ = window.matchMedia("(prefers-reduced-motion: reduce)");

let reducedMotion = rmMQ.matches;

rmMQ.addEventListener?.("change", (t => reducedMotion = t.matches)), rmMQ.addListener?.((t => reducedMotion = t.matches));

const navEntry = performance.getEntriesByType("navigation")[0], navType = navEntry ? navEntry.type : "navigate";

let lenis = null, nextPage = document, onceFunctionsInitialized = !1, flipState = null, flippedThumbnail = null, skipPageTransition = !1, isPopstate = !1, staggerDefault = .05, durationDefault = .6;

const has = t => !!nextPage.querySelector(t), SCROLL_STORAGE_KEY = "osmo_scroll_positions";

function getScrollPositions() {
    try {
        return JSON.parse(sessionStorage.getItem(SCROLL_STORAGE_KEY)) || {};
    } catch {
        return {};
    }
}

function saveScrollPosition(t, e) {
    const n = getScrollPositions();
    n[t] = e;
    try {
        sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(n));
    } catch {}
}

function getSavedScroll(t) {
    return getScrollPositions()[t] || 0;
}

function getCurrentScroll() {
    return lenis ? Math.round(lenis.scroll) : window.scrollY;
}

function initScrollSaver() {
    let t;
    const e = () => {
        clearTimeout(t), t = setTimeout((() => {
            saveScrollPosition(window.location.href, getCurrentScroll());
        }), 150);
    };
    lenis ? lenis.on("scroll", e) : window.addEventListener("scroll", e, {
        passive: !0
    }), window.addEventListener("beforeunload", (() => {
        saveScrollPosition(window.location.href, getCurrentScroll());
    }));
}

function initLenis() {
    !lenis && hasLenis && (lenis = new Lenis({
        lerp: .165,
        wheelMultiplier: 1.25,
        syncTouch: false
    }), hasScrollTrigger && lenis.on("scroll", ScrollTrigger.update), gsap.ticker.add((t => lenis.raf(1e3 * t))), 
    gsap.ticker.lagSmoothing(0));
}

function closeMenuIfOpen() {
    const t = document.querySelector("#nav-toggle");
    return !!t?.checked && (t.checked = !1, t.dispatchEvent(new Event("change", {
        bubbles: !0
    })), !0);
}

function freezeContainer(t) {
    const e = getCurrentScroll();
    lenis && lenis.stop(), gsap.set(t, {
        position: "fixed",
        top: -e,
        left: 0,
        right: 0
    }), window.scrollTo(0, 0);
}

function resetPage(t, e) {
    e = e ?? 0, gsap.set(t, {
        clearProps: "position,top,left,right"
    }), window.scrollTo(0, e), lenis && (lenis.scrollTo(e, {
        immediate: !0
    }), lenis.resize(), lenis.start()), hasScrollTrigger && ScrollTrigger.refresh();
}

function debounceOnWidthChange(t, e) {
    let n, r = innerWidth;
    return function(...o) {
        clearTimeout(n), n = setTimeout((() => {
            innerWidth !== r && (r = innerWidth, t.apply(this, o));
        }), e);
    };
}

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

function applyThemeFrom(t) {
    const e = t?.dataset?.pageTheme || "light", n = themeConfig[e] || themeConfig.light;
    document.body.dataset.pageTheme = e;
    const r = document.querySelector("[data-theme-transition]");
    r && (r.dataset.themeTransition = n.transition);
    const o = document.querySelector("[data-theme-nav]");
    o && (o.dataset.themeNav = n.nav);
}

function syncNavState(t) {
    const e = document.createElement("template");
    e.innerHTML = t.next.html.trim();
    const n = e.content.querySelectorAll("[data-barba-update]");
    document.querySelectorAll("nav [data-barba-update]").forEach(((t, e) => {
        const r = n[e];
        if (!r) return;
        const o = r.getAttribute("aria-current");
        null !== o ? t.setAttribute("aria-current", o) : t.removeAttribute("aria-current"), 
        t.setAttribute("class", r.getAttribute("class") || "");
    }));
}

function initOnceFunctions() {
    initLenis(), initScrollSaver(), onceFunctionsInitialized || (onceFunctionsInitialized = !0);
}

function initBeforeEnterFunctions(t) {
    nextPage = t || document, has(".work") && initWorkSlider(nextPage);
}

function initAfterEnterFunctions(t) {
    nextPage = t || document, has(".scroll-1_component") && initScroll1(nextPage), lenis && lenis.resize(), 
    hasScrollTrigger && ScrollTrigger.refresh();
}

function runPageOnceAnimation(t) {
    const e = gsap.timeline(), n = "navigate" !== navType ? getSavedScroll(window.location.href) : 0;
    if ("back_forward" === navType) return e.call((() => {
        const e = document.querySelector('[data-loader="wrap"]');
        e && gsap.set(e, {
            display: "none",
            autoAlpha: 0,
            pointerEvents: "none"
        }), resetPage(t, n);
    }), null, 0), e;
    if (reducedMotion) return e.call((() => resetPage(t, n)), null, 0), e;
    const r = document.querySelector('[data-loader="wrap"]');
    if (!r) return e.call((() => resetPage(t, n)), null, 0), e;
    const o = r.querySelector(".loader-panel"), a = r.querySelector("[data-loader-bar]"), i = r.querySelector("[data-loader-block]"), l = r.querySelector("[data-loader-top]"), s = r.querySelector("[data-loader-bot]");
    if (!(o && a && i && l && s)) return e.call((() => resetPage(t, n)), null, 0), e;
    const c = gsap.utils.random(25, 35, 1), u = gsap.utils.random(65, 75, 1), d = t => String(t).split("").map(((t, e) => `<span class="loader-digit" style="--d:${e}">${t}</span>`)).join(""), p = t => .68 + .07 * (String(t).length - 1) + .02, f = () => {
        const t = getComputedStyle(o), e = parseFloat(t.paddingTop) || 0, n = parseFloat(t.paddingBottom) || 0;
        return Math.max(0, o.clientHeight - e - n - i.getBoundingClientRect().height);
    }, g = (t, e) => {
        i.style.transform = `translate3d(0, ${-t * e / 100}px, 0)`;
    }, m = (t, n, r) => {
        r && e.to({}, {
            duration: .02
        }), e.call((() => ((t, e) => {
            s.innerHTML = d(t), i.classList.add("is-flipping"), a.style.width = t + "%", g(e, t);
        })(t, n))), e.to({}, {
            duration: p(t)
        }), e.call((() => (t => {
            l.innerHTML = d(t), s.innerHTML = "", i.classList.remove("is-flipping");
        })(t)));
    };
    e.call((() => {
        lenis && lenis.stop(), document.documentElement.style.overflow = "hidden", document.body.style.overflow = "hidden", 
        gsap.set(t, {
            clearProps: "position,top,left,right"
        }), window.scrollTo(0, n), lenis && (lenis.scrollTo(n, {
            immediate: !0
        }), lenis.resize()), gsap.set(r, {
            display: "block",
            autoAlpha: 1,
            pointerEvents: "auto"
        }), l.innerHTML = d(0), s.innerHTML = "", a.style.width = "0%", i.classList.remove("is-flipping"), 
        g(f(), 0);
    })), e.to({}, {
        duration: .25
    });
    const h = f();
    return m(c, h, !1), m(u, h, !0), m(100, h, !0), e.to({}, {
        duration: .25
    }), e.to(r, {
        autoAlpha: 0,
        duration: .5,
        ease: "power2.out"
    }), e.call((() => {
        document.documentElement.style.overflow = "", document.body.style.overflow = "", 
        gsap.set(r, {
            display: "none",
            autoAlpha: 0,
            pointerEvents: "none"
        }), i.classList.remove("is-flipping"), i.style.transform = "", a.style.width = "0%", 
        l.innerHTML = d(0), s.innerHTML = "", lenis && lenis.start(), hasScrollTrigger && ScrollTrigger.refresh();
    })), e;
}

function runPageLeaveAnimation(t) {
    const e = document.querySelector("[data-transition-wrap]"), n = e.querySelector("[data-transition-dark]"), r = gsap.timeline({
        onComplete: () => t.remove()
    });
    return closeMenuIfOpen(), reducedMotion || skipPageTransition ? r.set(t, {
        autoAlpha: 0
    }) : (r.set(e, {
        zIndex: 2
    }), r.fromTo(n, {
        autoAlpha: 0
    }, {
        autoAlpha: .8,
        duration: 1.2,
        ease: "parallax"
    }, 0), r.fromTo(t, {
        y: "0vh"
    }, {
        y: "-25vh",
        duration: 1.2,
        ease: "parallax"
    }, 0), r.set(n, {
        autoAlpha: 0
    }), r);
}

function runPageEnterAnimation(t, restoreY) {
    const e = gsap.timeline(), n = restoreY ?? (isPopstate ? getSavedScroll(window.location.href) : 0);
    if (restoreY != null) gsap.set(t, {
        top: -n
    });
    return reducedMotion || skipPageTransition ? (skipPageTransition = !1, e.set(t, {
        autoAlpha: 1
    }), e.add("pageReady"), e.call(resetPage, [ t, n ], "pageReady"), new Promise((t => e.call(t, null, "pageReady")))) : (e.set(t, {
        zIndex: 3
    }), e.fromTo(t, {
        y: "100vh"
    }, {
        y: "0vh",
        duration: 1.2,
        clearProps: "transform,opacity,visibility,zIndex",
        ease: "parallax"
    }, 0), e.add("pageReady"), e.call(resetPage, [ t, n ], "pageReady"), new Promise((t => e.call(t, null, "pageReady"))));
}

function runWorkLeaveAnimation(t, e, n) {
    const r = n.closest("[data-case-link]").querySelector("[data-case-thumbnail]"), o = e.querySelector(".section");
    flipState = Flip.getState(r), flippedThumbnail = r;
    const a = gsap.timeline({
        onComplete: () => t.remove()
    });
    return closeMenuIfOpen(), reducedMotion ? a.set(t, {
        autoAlpha: 0
    }) : (a.to(t, {
        autoAlpha: 0,
        duration: .6
    }, 0), a.set(o, {
        backgroundColor: "transparent"
    }, 0), a);
}

function runCaseEnterAnimation(t) {
    const e = t.querySelector(".section"), n = e.querySelectorAll("[data-case-reveal]"), r = isPopstate ? getSavedScroll(window.location.href) : 0, o = gsap.timeline();
    if (reducedMotion) return flippedThumbnail = null, flipState = null, o.set(t, {
        autoAlpha: 1
    }), o.add("pageReady"), o.call(resetPage, [ t, r ], "pageReady"), new Promise((t => o.call(t, null, "pageReady")));
    const a = t.querySelector("[data-case-thumbnail]");
    return a.parentNode.insertBefore(flippedThumbnail, a), a.remove(), o.add(Flip.from(flipState, {
        duration: .8
    }), 0), o.add("startEnter", .6), o.fromTo(e, {
        backgroundColor: "transparent"
    }, {
        backgroundColor: "#FFF",
        duration: .5
    }, "startEnter"), o.fromTo(n, {
        autoAlpha: 0,
        yPercent: 25
    }, {
        autoAlpha: 1,
        yPercent: 0,
        stagger: .1
    }, "startEnter+=0.1"), o.add("pageReady"), o.call(resetPage, [ t, r ], "pageReady"), 
    o.call((() => {
        flippedThumbnail = null, flipState = null;
    })), new Promise((t => o.call(t, null, "pageReady")));
}

barba.hooks.before((t => {
    isPopstate = "popstate" === t.trigger, saveScrollPosition(t.current.url.href, getCurrentScroll()), 
    freezeContainer(t.current.container), document.documentElement.setAttribute("data-transitioning", "");
})), barba.hooks.beforeEnter((t => {
    gsap.set(t.next.container, {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0
    }), initBeforeEnterFunctions(t.next.container), applyThemeFrom(t.next.container);
})), barba.hooks.afterLeave((() => {
    hasScrollTrigger && ScrollTrigger.getAll().forEach((t => t.kill()));
})), barba.hooks.enter((t => syncNavState(t))), barba.hooks.afterEnter((t => {
    initAfterEnterFunctions(t.next.container), lenis && (lenis.resize(), lenis.start()), 
    hasScrollTrigger && ScrollTrigger.refresh();
})), barba.hooks.after((() => {
    isPopstate = !1, skipPageTransition = !1, document.documentElement.removeAttribute("data-transitioning");
}));

function startPortfolio() {
    barba.init({
        debug: !1,
        timeout: 7e3,
        preventRunning: !0,
        transitions: [ {
            name: "work-to-case",
            sync: !0,
            from: {
                namespace: [ "work" ]
            },
            to: {
                namespace: [ "case" ]
            },
            custom: ({trigger: t}) => "string" != typeof t && t.hasAttribute("data-case-link"),
            leave: async t => runWorkLeaveAnimation(t.current.container, t.next.container, t.trigger),
            enter: async t => runCaseEnterAnimation(t.next.container)
        }, {
            name: "default",
            sync: !0,
            once: async t => (initOnceFunctions(), runPageOnceAnimation(t.next.container)),
            leave: async t => runPageLeaveAnimation(t.current.container),
            enter: async t => runPageEnterAnimation(t.next.container)
        } ]
    });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startPortfolio, {
    once: true
}); else startPortfolio();

const initWorkSlider = (() => {
    /* Matches the 61.9375rem breakpoint used in the CSS. */
    const mq = window.matchMedia("(max-width: 61.9375rem)");
    let instance = null;
    function destroy() {
        if (instance) instance.teardown();
    }
    /* ------------------------------------------------------------
	   TRANSITION LOCK — driven by Barba itself.
	   `before` fires the instant any transition starts; with
	   sync:true the leave AND enter animations both run inside
	   that window. `afterEnter`/`after` fire once the new page
	   has settled at "pageReady". No DOM heuristics, no shared
	   variables — barba is a global from its own CDN script, and
	   hooks can be registered before barba.init runs, so this
	   works regardless of file order in the bundle.
	   ------------------------------------------------------------ */    let transitioning = false;
    function onTransitionStart() {
        transitioning = true;
        if (instance) instance.freeze();
    }
    function onTransitionEnd() {
        transitioning = false;
        instance?.resume();
    }
    let hooksReady = false;
    function connectHooks() {
        if (hooksReady || !window.barba) return;
        hooksReady = true;
        barba.hooks.before(onTransitionStart);
        barba.hooks.afterEnter(onTransitionEnd);
        barba.hooks.afterOnce(onTransitionEnd);
        barba.hooks.after(onTransitionEnd);
        barba.hooks.afterLeave((d => {
            if (instance?.page === d.current.container) destroy();
        }));
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", connectHooks, {
        once: true
    }); else connectHooks();
    function create(container) {
        var scope = container || document;
        var root = scope.querySelector(".work");
        if (!root || !window.gsap) return;
        if (instance?.root === root) return window.JKWork;
        destroy();
        connectHooks();
        root.dataset.workRuntime = "2026-11-17.9";
        let frozen = transitioning || document.documentElement.hasAttribute("data-transitioning");
        let modeTween = null, modeGhost = null, modeContentTween = null, modeTarget = null;
        const visualLayers = el => el ? [ ...el.children ].filter((n => !n.matches(".work-card__meta"))) : [];
        var abort = new AbortController;
        var sig = {
            signal: abort.signal
        };
        var EASE = "expo.out";
        var DUR = 1;
        var COPIES = 4;
 /* clone sets on each side of the originals */        var DRAG_THRESHOLD = 5;
 /* px before a pointerdown counts as a drag */        var SNAP_DEBOUNCE = 80;
        var FADE_MS = 400;
        var STORAGE_KEY = "work-view-mode";
        var $ = function(s, c) {
            return (c || root).querySelector(s);
        };
        var $$ = function(s, c) {
            return [].slice.call((c || root).querySelectorAll(s));
        };
        var clamp = gsap.utils.clamp;
        var pad = function(n) {
            return (n < 10 ? "0" : "") + n;
        };
        var setStatus = function(s) {
            root.setAttribute("data-work-status", s);
        };
        var isMobile = function() {
            return mq.matches;
        };
        /* Inert while Barba is mid-transition (module flag set by
		   Barba's own hooks above) or while the first-load loader
		   has the document locked (inline overflow the boilerplate
		   sets from the loader's first step until it fades). */        var locked = function() {
            return frozen || transitioning || document.documentElement.hasAttribute("data-transitioning") || document.documentElement.style.overflow === "hidden";
        };
        var track = $("[data-work-track]");
        var counterEl = $("[data-work-counter]");
        var listEl = $("[data-work-list]");
        var listLeft = $('[data-work-list-track="left"]');
        var listRight = $('[data-work-list-track="right"]');
        var listCenter = $("[data-work-list-center]");
        var numLeft = $('[data-work-list-num="left"]');
        var numRight = $('[data-work-list-num="right"]');
        var viewBtns = $$("[data-work-view]");
        if (!track || !listEl || !listLeft || !listRight || !listCenter) return;
        // Hidden pager tracks are optional; the bottom counter is the primary UI.
                numLeft ||= document.createElement("div");
        numRight ||= document.createElement("div");
        var originals = $$("[data-work-item]:not([data-work-clone])", track);
        var N = originals.length;
        if (!N) return;
        originals.forEach((function(item, i) {
            item.setAttribute("data-work-index", i);
        }));
        /* Block native image/link ghost-drag in both modes. */        root.addEventListener("dragstart", (function(event) {
            event.preventDefault();
        }), sig);
        function readStored() {
            try {
                return localStorage.getItem(STORAGE_KEY);
            } catch (_) {
                return null;
            }
        }
        function writeStored(value) {
            try {
                localStorage.setItem(STORAGE_KEY, value);
            } catch (_) {}
        }
        var userMode = readStored() === "list" ? "list" : "slide";
        var mode = userMode;
        var activeIdx = 0;
        root.addEventListener("click", (function(event) {
            var link = event.target.closest("a[href]");
            if (!event.defaultPrevented && !locked() && link && /\/project\//.test(link.getAttribute("href") || "")) {
                try {
                    sessionStorage.setItem("work-return-project", link.getAttribute("href"));
                    api.capture(link);
                } catch (_) {}
            }
        }), sig);
        var fading = false;
        function killSnap(ref) {
            if (ref.t) {
                ref.t.kill();
                ref.t = null;
            }
        }
        function snapTween(setCurrent, target, ref) {
            killSnap(ref);
            var state = {
                c: ref.from()
            };
            ref.t = gsap.to(state, {
                c: target,
                duration: DUR,
                ease: EASE,
                onUpdate: function() {
                    setCurrent(state.c);
                },
                onComplete: function() {
                    setCurrent(target);
                    ref.t = null;
                }
            });
        }
        /* ------------------------------------------------------------
		   TEARDOWN — idempotent; removes everything that could
		   outlive the Barba container.
		   ------------------------------------------------------------ */        const api = window.JKWork = {
            root: root,
            freeze: freeze,
            resume: resume,
            destroy: teardown,
            capture(link) {
                if (sMoved) return null;
                freeze();
                const href = new URL(link.href, location.href).pathname;
                const thumb = link.querySelector(".work-card__thumb") || link.querySelector('[data-work-state="active"]') || link;
                const saved = {
                    href: href,
                    mode: mode,
                    phase: S.pitch ? S.cur / S.pitch : 0,
                    listPhase: L.rowH ? L.cur / L.rowH : 0,
                    left: thumb.getBoundingClientRect().left / innerWidth
                };
                try {
                    sessionStorage.setItem("work-return-project", href);
                    sessionStorage.setItem("work-return-state", JSON.stringify(saved));
                } catch (_) {}
                return saved;
            },
            restore(href) {
                let saved;
                try {
                    saved = JSON.parse(sessionStorage.getItem("work-return-state"));
                } catch (_) {}
                const index = originals.findIndex((item => new URL(item.querySelector("a[href]").href, location.href).pathname === href));
                if (index < 0) return null;
                root.removeAttribute("data-work-restoring");
                activeIdx = index;
                if (isMobile()) return originals[index].querySelector("a[href]");
                if (saved?.href === href && saved.mode !== mode) applyMode(saved.mode);
                if (mode === "list") {
                    setupList();
                    if (saved?.href === href && saved.mode === "list" && Number.isFinite(saved.listPhase)) L.cur = L.tgt = saved.listPhase * L.rowH;
                    applyList(L.cur);
                    return $('[data-work-state="active"]', listCenter);
                }
                setupSlide();
                if (saved?.href === href && saved.mode === "slide" && Number.isFinite(saved.phase)) S.cur = S.tgt = saved.phase * S.pitch;
                renderSlide();
                const desired = saved?.href === href ? saved.left * innerWidth : parseFloat(getComputedStyle(track).paddingLeft) || 0;
                return $$(".work-card__link", track).filter((a => new URL(a.href).pathname === href)).sort(((a, b) => Math.abs(a.getBoundingClientRect().left - desired) - Math.abs(b.getBoundingClientRect().left - desired)))[0];
            }
        };
        var dead = false;
        function teardown() {
            if (dead) return;
            dead = true;
            cancelModeFlip();
            if (window.JKWork === api) delete window.JKWork;
            killSlide();
            killList();
            clearTimeout(wheelIdle);
            cancelAnimationFrame(resizeRaf);
            abort.abort();
            if (instance && instance.teardown === teardown) instance = null;
        }
        /* ------------------------------------------------------------
		   SLIDE
		   ------------------------------------------------------------ */        var S = {
            cur: 0,
            tgt: 0,
            pitch: 0,
            wrap: null,
            snap: {
                t: null,
                from: function() {
                    return S.cur;
                }
            }
        };
        var sDrag = false;
        var sMoved = false;
        var sStartX = 0;
        var sLastX = 0;
        var sPid = null;
        var markedSlideIdx = -1;
        function markCurrentSlide(index) {
            if (index === markedSlideIdx) return;
            markedSlideIdx = index;
            $$(".work-card[data-work-current]", track).forEach((function(card) {
                card.removeAttribute("data-work-current");
            }));
            const edge = parseFloat(getComputedStyle(track).paddingLeft) || 0;
            const focused = $$('.work-card[data-work-index="' + index + '"]', track).sort(((a, b) => Math.abs(a.getBoundingClientRect().left - edge) - Math.abs(b.getBoundingClientRect().left - edge)))[0];
            focused?.setAttribute("data-work-current", "true");
            if (counterEl) {
                counterEl.querySelector("[data-work-counter-current]").textContent = pad(index + 1);
                counterEl.querySelector("[data-work-counter-total]").textContent = pad(N);
            }
        }
        function cloneItem(el) {
            var clone = el.cloneNode(true);
            clone.setAttribute("data-work-clone", "");
            [ clone, ...clone.querySelectorAll("[id]") ].forEach((node => node.removeAttribute("id")));
            clone.querySelectorAll("[data-flip-id]").forEach((node => node.removeAttribute("data-flip-id")));
            return clone;
        }
        function buildSlide() {
            track.innerHTML = "";
            var frag = document.createDocumentFragment();
            var i, j;
            for (i = 0; i < COPIES; i++) {
                for (j = 0; j < N; j++) frag.appendChild(cloneItem(originals[j]));
            }
            for (j = 0; j < N; j++) frag.appendChild(originals[j]);
            for (i = 0; i < COPIES; i++) {
                for (j = 0; j < N; j++) frag.appendChild(cloneItem(originals[j]));
            }
            track.appendChild(frag);
            markedSlideIdx = -1;
        }
        function setupSlide() {
            killSlide();
            if (dead || isMobile()) return;
            var cards = $$(".work-card", track);
            if (cards.length < 2) return;
            S.pitch = cards[1].getBoundingClientRect().left - cards[0].getBoundingClientRect().left;
            if (!S.pitch) return;
            var span = S.pitch * N;
            S.wrap = gsap.utils.wrap(-span * (COPIES + 1), -span * COPIES);
            S.cur = S.tgt = -span * COPIES - activeIdx * S.pitch;
            if (!frozen && !fading) gsap.ticker.add(slideTick);
        }
        function slideTick(time, deltaTime = 16.667) {
            if (!root.isConnected) {
                teardown();
                return;
            }
            if (frozen || fading) return;
            if (!S.snap.t) {
                S.cur += (S.tgt - S.cur) * (1 - Math.pow(1 - .1, Math.min(deltaTime, 50) / 16.667));
                if (Math.abs(S.tgt - S.cur) < .5) S.cur = S.tgt;
            }
            renderSlide();
        }
        function renderSlide() {
            if (!S.wrap) return;
            track.style.transform = "translate3d(" + S.wrap(S.cur) + "px,0,0)";
            var span = S.pitch * N;
            var offset = (-S.cur % span + span) % span;
            activeIdx = Math.round(offset / span * N) % N;
            markCurrentSlide(activeIdx);
        }
        function snapSlideStep(direction) {
            if (!S.pitch) return;
            var aligned = Math.round(S.tgt / S.pitch) * S.pitch;
            snapTween((function(v) {
                S.cur = S.tgt = v;
            }), aligned + direction * S.pitch, S.snap);
        }
        function killSlide() {
            killSnap(S.snap);
            gsap.ticker.remove(slideTick);
        }
        track.addEventListener("pointerdown", (function(event) {
            if (mode !== "slide" || isMobile() || locked()) return;
            sDrag = true;
            sMoved = false;
            sStartX = sLastX = event.clientX;
            sPid = event.pointerId;
            killSnap(S.snap);
            setStatus("dragging");
        }), sig);
        track.addEventListener("pointermove", (function(event) {
            if (!sDrag || mode !== "slide" || isMobile()) return;
            var deltaX = event.clientX - sLastX;
            sLastX = event.clientX;
            if (!sMoved && Math.abs(event.clientX - sStartX) > DRAG_THRESHOLD) {
                sMoved = true;
                try {
                    track.setPointerCapture(sPid);
                } catch (_) {}
            }
            if (sMoved) S.tgt += deltaX;
        }), sig);
        function endSlideDrag() {
            if (!sDrag) return;
            sDrag = false;
            setStatus("idle");
            try {
                track.releasePointerCapture(sPid);
            } catch (_) {}
            sPid = null;
        }
        [ "pointerup", "pointercancel" ].forEach((function(type) {
            track.addEventListener(type, endSlideDrag, sig);
        }));
        window.addEventListener("pointerup", endSlideDrag, sig);
        window.addEventListener("pointercancel", endSlideDrag, sig);
        track.addEventListener("click", (function(event) {
            if (mode === "slide" && !isMobile() && sMoved) {
                event.preventDefault();
                event.stopPropagation();
            }
        }), {
            capture: true,
            signal: abort.signal
        });
        $$("[data-work-arrow]").forEach((function(button) {
            button.addEventListener("click", (function(event) {
                event.preventDefault();
                if (locked()) return;
                if (mode === "list") {
                    if (L.rowH) listSnapTo((Math.round(L.tgt / L.rowH) + (button.getAttribute("data-work-arrow") === "prev" ? -1 : 1)) * L.rowH);
                    return;
                }
                snapSlideStep(button.getAttribute("data-work-arrow") === "prev" ? 1 : -1);
            }), sig);
        }));
        /* ------------------------------------------------------------
		   LIST
		   ------------------------------------------------------------ */        var L = {
            cur: 0,
            tgt: 0,
            snapTimer: null,
            rowH: 0,
            span: 0,
            off0: 0,
            align: 0,
            prevIdx: -1,
            snap: {
                t: null,
                from: function() {
                    return L.cur;
                }
            }
        };
        var lDrag = false;
        var lLastY = 0;
        var leftRows = null;
        var rightRows = null;
        var prevLeftLabel = null;
        var prevRightLabel = null;
        function escapeText(value) {
            const text = document.createElement("span");
            text.textContent = value;
            return text.innerHTML;
        }
        function row(side, index, label) {
            return '<div class="work-list__row work-list__row--' + side + '" data-work-row-' + side + '="' + index + '">' + '<span class="work-list__label">' + escapeText(label) + "</span>" + "</div>";
        }
        function repeat(string, amount) {
            var out = "";
            while (amount--) out += string;
            return out;
        }
        function pauseListVideos() {
            $$("video", listCenter).forEach((function(video) {
                video.pause();
            }));
        }
        function buildList() {
            [ listLeft, listRight, numLeft, numRight, listCenter ].forEach((function(el) {
                el.innerHTML = "";
            }));
            var mediaFrag = document.createDocumentFragment();
            originals.forEach((function(item, index) {
                var sourceThumb = $(".work-card__thumb", item);
                if (!sourceThumb) return;
                var thumb = sourceThumb.cloneNode(true);
                thumb.querySelectorAll(".work-card__meta").forEach((el => el.remove()));
                thumb.classList.add("work-list__media");
                thumb.setAttribute("data-work-list-media", index);
                var video = thumb.querySelector("video[data-src]");
                if (video) video.removeAttribute("src");
                mediaFrag.appendChild(thumb);
            }));
            listCenter.appendChild(mediaFrag);
            var leftMarkup = "";
            var rightMarkup = "";
            var numberMarkup = "";
            originals.forEach((function(item, index) {
                leftMarkup += row("left", index, $("[data-work-name]", item).textContent);
                numberMarkup += '<div class="work-list__num-item">' + pad(index + 1) + "</div>";
            }));
            // Opposing tracks meet on the same project/client at the centre.
                        for (var index = N - 1; index >= 0; index--) {
                rightMarkup += row("right", index, $("[data-work-client]", originals[index]).textContent);
            }
            var repetitions = 2 * COPIES + 1;
            listLeft.innerHTML = repeat(leftMarkup, repetitions);
            listRight.innerHTML = repeat(rightMarkup, repetitions);
            numLeft.innerHTML = repeat(numberMarkup, repetitions);
            numRight.innerHTML = repeat(numberMarkup, repetitions);
            leftRows = $$(".work-list__row", listLeft);
            rightRows = $$(".work-list__row", listRight);
        }
        function setupList() {
            killList();
            if (dead || isMobile() || !leftRows || !leftRows.length) return;
            L.rowH = leftRows[0].offsetHeight;
            if (!L.rowH) return;
            leftRows.concat(rightRows, $$(".work-list__num-item"), $$(".work-list__num-clip")).forEach((function(el) {
                el.style.height = L.rowH + "px";
            }));
            L.span = L.rowH * N;
            L.off0 = COPIES * L.span;
            /* Centre one row vertically; computed once per setup, not per frame. */            L.align = listEl.clientHeight / 2 - L.rowH / 2;
            L.cur = L.tgt = L.off0 + activeIdx * L.rowH;
            L.prevIdx = -1;
            listEl.querySelectorAll(".work-list__label[data-work-active]").forEach((el => el.removeAttribute("data-work-active")));
            prevLeftLabel = null;
            prevRightLabel = null;
            if (!frozen && !fading) gsap.ticker.add(listTick);
        }
        function listTick(time, deltaTime = 16.667) {
            if (!root.isConnected) {
                teardown();
                return;
            }
            if (frozen || fading) return;
            if (!L.snap.t) {
                L.cur += (L.tgt - L.cur) * (1 - Math.exp(-9.05 * Math.min(deltaTime, 50) / 1e3));
                if (Math.abs(L.tgt - L.cur) < .5) L.cur = L.tgt;
            }
            while (L.cur > L.off0 + L.span) {
                L.cur -= L.span;
                L.tgt -= L.span;
            }
            while (L.cur < L.off0 - L.span) {
                L.cur += L.span;
                L.tgt += L.span;
            }
            applyList(L.cur);
        }
        function applyList(value) {
            var leftY = -value + L.align;
            var rightY = value - 2 * L.off0 - (N - 1) * L.rowH + L.align;
            listLeft.style.transform = "translate3d(0," + leftY + "px,0)";
            listRight.style.transform = "translate3d(0," + rightY + "px,0)";
            numLeft.style.transform = "translate3d(0," + -value + "px,0)";
            numRight.style.transform = "translate3d(0," + -value + "px,0)";
            var leftAt = clamp(0, leftRows.length - 1, Math.round(value / L.rowH));
            var rightAt = clamp(0, rightRows.length - 1, Math.round((2 * L.off0 + (N - 1) * L.rowH - value) / L.rowH));
            var index = parseInt(leftRows[leftAt].getAttribute("data-work-row-left"), 10);
            var nextLeftLabel = $(".work-list__label", leftRows[leftAt]);
            var nextRightLabel = $(".work-list__label", rightRows[rightAt]);
            /* Visible repeated labels update independently of the logical
			   project index so infinite wrapping remains seamless. */            if (nextLeftLabel !== prevLeftLabel) {
                if (prevLeftLabel) prevLeftLabel.removeAttribute("data-work-active");
                prevLeftLabel = nextLeftLabel;
                prevLeftLabel.setAttribute("data-work-active", "true");
            }
            if (nextRightLabel !== prevRightLabel) {
                if (prevRightLabel) prevRightLabel.removeAttribute("data-work-active");
                prevRightLabel = nextRightLabel;
                prevRightLabel.setAttribute("data-work-active", "true");
            }
            if (index === L.prevIdx) return;
            L.prevIdx = index;
            activeIdx = index;
            markCurrentSlide(index);
            var currentMedia = $('[data-work-list-media][data-work-state="active"]', listCenter);
            if (currentMedia) currentMedia.removeAttribute("data-work-state");
            var nextMedia = $('[data-work-list-media="' + index + '"]', listCenter);
            if (nextMedia) nextMedia.setAttribute("data-work-state", "active");
            var link = originals[index] && originals[index].querySelector("a[href]");
            if (link) listCenter.setAttribute("href", link.getAttribute("href") || "#");
        }
        function listSnapTo(target) {
            snapTween((function(v) {
                L.cur = L.tgt = v;
            }), target, L.snap);
        }
        function scheduleListSnap() {
            clearTimeout(L.snapTimer);
            L.snapTimer = setTimeout((function() {
                if (!L.rowH) return;
                listSnapTo(Math.round(L.tgt / L.rowH) * L.rowH);
            }), SNAP_DEBOUNCE);
        }
        function killList() {
            clearTimeout(L.snapTimer);
            L.snapTimer = null;
            killSnap(L.snap);
            gsap.ticker.remove(listTick);
            pauseListVideos();
        }
        listEl.addEventListener("pointerdown", (function(event) {
            if (mode !== "list" || isMobile() || locked()) return;
            if (event.target.closest(".work-list__arrow, .work-list__center")) return;
            event.preventDefault();
            try {
                listEl.setPointerCapture(event.pointerId);
            } catch (_) {}
            killSnap(L.snap);
            clearTimeout(L.snapTimer);
            lDrag = true;
            lLastY = event.clientY;
            setStatus("dragging");
        }), sig);
        listEl.addEventListener("pointermove", (function(event) {
            if (!lDrag || mode !== "list") return;
            var deltaY = event.clientY - lLastY;
            lLastY = event.clientY;
            L.tgt -= deltaY;
            L.cur -= deltaY * .5;
        }), sig);
        function endListDrag() {
            if (!lDrag) return;
            lDrag = false;
            setStatus("idle");
            L.tgt = L.cur;
            scheduleListSnap();
        }
        [ "pointerup", "pointercancel" ].forEach((function(type) {
            listEl.addEventListener(type, endListDrag, sig);
        }));
        $$("[data-work-list-arrow]").forEach((function(button) {
            button.addEventListener("click", (function(event) {
                event.preventDefault();
                if (mode !== "list" || !L.rowH || locked()) return;
                var direction = button.getAttribute("data-work-list-arrow") === "up" ? -1 : 1;
                listSnapTo((Math.round(L.tgt / L.rowH) + direction) * L.rowH);
            }), sig);
        }));
        /* ------------------------------------------------------------
		   WHEEL — on document so scrolling anywhere drives the
		   slider. Self-neutralising via the isConnected check, and
		   inert while the boilerplate has the site scroll-locked.
		   ------------------------------------------------------------ */        var wheelIdle = null;
        function onWheel(event) {
            if (!root.isConnected) {
                teardown();
                return;
            }
            if (isMobile() || fading || locked()) return;
            const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
            var delta = (Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY) * unit;
            if (mode === "slide") delta *= 1.25; else delta = clamp(-120, 120, delta);
            if (mode === "slide") {
                event.preventDefault();
                killSnap(S.snap);
                S.tgt -= delta;
            } else if (mode === "list") {
                event.preventDefault();
                killSnap(L.snap);
                L.tgt += delta;
                scheduleListSnap();
            }
            setStatus("scrolling");
            clearTimeout(wheelIdle);
            wheelIdle = setTimeout((function() {
                setStatus("idle");
            }), 200);
        }
        document.addEventListener("wheel", onWheel, {
            passive: false,
            signal: abort.signal
        });
        /* ------------------------------------------------------------
		   MODE
		   ------------------------------------------------------------ */        function rebuild() {
            if (mode === "slide") {
                buildSlide();
                setupSlide();
                renderSlide();
            } else {
                buildList();
                setupList();
                applyList(L.cur);
                alignListFrame();
            }
        }
        function applyMode(next) {
            mode = next;
            root.setAttribute("data-work-mode", next);
            root.setAttribute("data-work-initialized", "");
            viewBtns.forEach((function(button) {
                button.setAttribute("data-work-active", button.getAttribute("data-work-view") === next ? "true" : "false");
            }));
            killSlide();
            killList();
            if (isMobile()) {
                /* Restore the clean static layout: remove clones
				   and any inline transforms the scroller applied. */
                track.innerHTML = "";
                originals.forEach((function(el) {
                    el.style.transform = "";
                    track.appendChild(el);
                }));
                track.style.transform = "";
                return;
            }
            rebuild();
        }
        function alignListFrame() {
            // Both views share the same native frame dimensions and vertical centre.
            listCenter.style.removeProperty("height");
            listCenter.style.removeProperty("top");
            listCenter.style.removeProperty("transform");
        }
        function currentMedia(index = activeIdx) {
            if (mode === "list") return $('[data-work-state="active"]', listCenter);
            return $$(".work-card", track).filter((el => +el.dataset.workIndex === index)).sort(((a, b) => Math.abs(a.getBoundingClientRect().left - parseFloat(getComputedStyle(track).paddingLeft)) - Math.abs(b.getBoundingClientRect().left - parseFloat(getComputedStyle(track).paddingLeft))))[0]?.querySelector(".work-card__thumb");
        }
        function modeVisual(source) {
            const r = source.getBoundingClientRect(), poster = source.querySelector(".work-card__poster"), pr = poster?.getBoundingClientRect() || r;
            const box = document.createElement("div"), back = source.querySelector(".work-card__image")?.cloneNode(true), front = document.createElement("div");
            const video = source.querySelector("video"), image = source.querySelector(".project-preview__poster");
            let visual;
            if (video?.readyState >= 2 && (!image || parseFloat(getComputedStyle(image).opacity) < .1)) {
                visual = document.createElement("canvas");
                visual.width = video.videoWidth;
                visual.height = video.videoHeight;
                try {
                    visual.getContext("2d").drawImage(video, 0, 0);
                } catch (_) {
                    visual = null;
                }
            }
            if (!visual) visual = image?.cloneNode(true) || back?.cloneNode(true) || document.createElement("img");
            [ back, visual ].filter(Boolean).forEach((el => {
                el.removeAttribute("class");
                el.removeAttribute("id");
                el.removeAttribute("style");
                Object.assign(el.style, {
                    position: "absolute",
                    inset: "0",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center",
                    opacity: "1"
                });
            }));
            if (back) {
                back.style.opacity = getComputedStyle(root).getPropertyValue("--project-peer-opacity").trim() || ".25";
                back.style.filter = "blur(1rem)";
                back.style.transform = "scale(1.08)";
                box.append(back);
            }
            Object.assign(front.style, {
                position: "absolute",
                overflow: "hidden",
                borderRadius: poster ? getComputedStyle(poster).borderRadius : "inherit"
            });
            front.append(visual);
            box.append(front);
            const pose = {
                left: 100 * (pr.left - r.left) / r.width,
                top: 100 * (pr.top - r.top) / r.height,
                width: 100 * pr.width / r.width,
                height: 100 * pr.height / r.height
            };
            gsap.set(front, {
                left: pose.left + "%",
                top: pose.top + "%",
                width: pose.width + "%",
                height: pose.height + "%"
            });
            return {
                box: box,
                front: front
            };
        }
        function cancelModeFlip() {
            modeTween?.kill();
            modeContentTween?.kill();
            modeGhost?.remove();
            if (modeTarget) gsap.set(visualLayers(modeTarget), {
                clearProps: "visibility"
            });
            modeTween = modeContentTween = modeGhost = modeTarget = null;
            root.removeAttribute("data-work-switching");
            fading = false;
        }
        function freeze() {
            if (fading) {
                modeTween?.progress(1);
                modeContentTween?.progress(1);
            }
            frozen = true;
            killSlide();
            killList();
            clearTimeout(L.snapTimer);
            S.tgt = S.cur;
            L.tgt = L.cur;
            sDrag = false;
            lDrag = false;
        }
        function resume() {
            if (dead || !root.isConnected || transitioning) return;
            frozen = false;
            root.removeAttribute("data-work-restoring");
            if (!isMobile() && !fading) gsap.ticker.add(mode === "list" ? listTick : slideTick);
        }
        function switchMode(next) {
            if (fading || next === mode) return;
            if (!window.Flip || matchMedia("(prefers-reduced-motion: reduce)").matches) {
                applyMode(next);
                return;
            }
            const selected = activeIdx, source = currentMedia(selected);
            if (!source) {
                applyMode(next);
                return;
            }
            const rect = source.getBoundingClientRect(), visual = modeVisual(source);
            fading = true;
            killSlide();
            killList();
            root.setAttribute("data-work-switching", "");
            const ghost = modeGhost = visual.box;
            ghost.className = "work-mode-flip";
            document.body.append(ghost);
            gsap.set(ghost, {
                position: "fixed",
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
                zIndex: 30,
                overflow: "hidden",
                borderRadius: getComputedStyle(source).borderRadius,
                pointerEvents: "none"
            });
            const outgoing = mode === "list" ? [ listLeft, listRight, numLeft, numRight ] : $$(".work-card", track);
            gsap.set(visualLayers(source), {
                visibility: "hidden"
            });
            modeTarget = source;
            modeTween = gsap.timeline().to(outgoing, {
                autoAlpha: 0,
                duration: .3,
                ease: "power1.out"
            }).call((() => {
                gsap.set([ ...visualLayers(source), ...outgoing ], {
                    clearProps: "opacity,visibility"
                });
                applyMode(next);
                killSlide();
                killList();
                const target = currentMedia(selected);
                modeTarget = target;
                if (!target) {
                    cancelModeFlip();
                    resume();
                    return;
                }
                const to = target.getBoundingClientRect(), poster = target.querySelector(".work-card__poster"), pr = poster?.getBoundingClientRect() || to;
                gsap.set(visualLayers(target), {
                    visibility: "hidden"
                });
                const content = mode === "list" ? [ listLeft, listRight, numLeft, numRight ] : [ ...$$(".work-card", track).filter((el => !el.contains(target))), ...$$(".work-card__meta", target.closest(".work-card")) ];
                gsap.set(content, {
                    autoAlpha: 0
                });
                // Animate the frame's dimensions. Natural media remains object-fit:cover,
                // so no non-uniform image scale or stretched canvas dissolve is needed.
                                modeContentTween = gsap.timeline({
                    onComplete() {
                        gsap.set(content, {
                            clearProps: "opacity,visibility"
                        });
                        cancelModeFlip();
                        resume();
                    }
                }).to(ghost, {
                    left: to.left,
                    top: to.top,
                    width: to.width,
                    height: to.height,
                    duration: 1,
                    ease: "expo.inOut"
                }, 0).to(visual.front, {
                    left: 100 * (pr.left - to.left) / to.width + "%",
                    top: 100 * (pr.top - to.top) / to.height + "%",
                    width: 100 * pr.width / to.width + "%",
                    height: 100 * pr.height / to.height + "%",
                    duration: 1,
                    ease: "expo.inOut"
                }, 0).to(content, {
                    autoAlpha: 1,
                    duration: .65,
                    ease: "expo.out"
                }, .3);
            }));
        }
        viewBtns.forEach((function(button) {
            button.addEventListener("click", (function(event) {
                event.preventDefault();
                if (isMobile() || fading || locked()) return;
                var next = button.getAttribute("data-work-view");
                if (next === mode) return;
                userMode = next;
                writeStored(next);
                switchMode(next);
            }), sig);
        }));
        /* ------------------------------------------------------------
		   RESIZE — breakpoint crossing is handled at module level;
		   same-breakpoint desktop resizes re-measure, because card
		   pitch and row heights are viewport-relative.
		   ------------------------------------------------------------ */        var resizeRaf = null;
        function onResize() {
            cancelAnimationFrame(resizeRaf);
            resizeRaf = requestAnimationFrame((function() {
                if (dead || frozen) return;
                cancelModeFlip();
                if (!isMobile()) rebuild();
            }));
        }
        window.addEventListener("resize", onResize, sig);
        applyMode(isMobile() ? "slide" : userMode);
        instance = {
            root: root,
            page: root.closest('[data-barba="container"]'),
            teardown: teardown,
            freeze: freeze,
            resume: resume,
            onBreakpoint: function(matches) {
                cancelModeFlip();
                applyMode(matches ? "slide" : userMode);
            },
            isConnected: function() {
                return root.isConnected;
            }
        };
    }
    /* Breakpoint cross — module level, so it lives for the life of
	   the site and always acts on whichever instance is current. */    function handleBreakpoint(event) {
        if (!instance) return;
        if (!instance.isConnected()) {
            destroy();
            return;
        }
        instance.onBreakpoint(event.matches);
    }
    if (mq.addEventListener) mq.addEventListener("change", handleBreakpoint); else mq.addListener(handleBreakpoint);
    create.destroy = destroy;
    create.version = "2026-11-17.9";
    return create;
})();

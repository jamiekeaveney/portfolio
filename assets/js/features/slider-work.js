// -----------------------------------------
// WORK PAGE — slide + list infinite scrollers
// -----------------------------------------
// Call: initWorkSlider(container) from initBeforeEnterFunctions.
// Self-managing lifecycle (no destroy hook needed):
//   1. create() tears down any previous instance
//   2. all listeners bind through one AbortController
//   3. the document wheel handler and ticker callbacks
//      self-destruct when the Barba container leaves the DOM
// Input locks while lenis.isStopped — the exact window the
// boilerplate freezes every page transition and the loader.

const initWorkSlider = (() => {
	/* Matches the 47.9375rem breakpoint used in the CSS. */
	const mq = window.matchMedia('(max-width: 47.9375rem)');

	let instance = null;

	function destroy() {
		if (instance) instance.teardown();
	}

	function create(container) {
		destroy();

		var scope = container || document;
		var root = scope.querySelector('.work');

		if (!root || !window.gsap) return;

		var abort = new AbortController();
		var sig = { signal: abort.signal };

		var EASE = 'expo.out';
		var DUR = 1;
		var COPIES = 4;          /* clone sets on each side of the originals */
		var DRAG_THRESHOLD = 5;  /* px before a pointerdown counts as a drag */
		var SNAP_DEBOUNCE = 80;
		var FADE_MS = 400;
		var STORAGE_KEY = 'work-view-mode';

		var $  = function (s, c) { return (c || root).querySelector(s); };
		var $$ = function (s, c) { return [].slice.call((c || root).querySelectorAll(s)); };

		var clamp = gsap.utils.clamp;
		var pad = function (n) { return (n < 10 ? '0' : '') + n; };
		var setStatus = function (s) { root.setAttribute('data-work-status', s); };
		var isMobile = function () { return mq.matches; };

		/* True during page transitions and the first-load loader.
		   The boilerplate pins Barba containers position:fixed for
		   the whole transition (freezeContainer on leave, the
		   beforeEnter hook on enter) and clears it at "pageReady";
		   the loader locks documentElement overflow until it fades.
		   Both are inline styles the boilerplate writes itself, so
		   this reads live DOM state — no shared variables, immune
		   to bundling and minification. */
		var barbaContainer = root.closest('[data-barba="container"]') || root;

		var locked = function () {
			return barbaContainer.style.position === 'fixed' ||
				document.documentElement.style.overflow === 'hidden';
		};

		var track      = $('[data-work-track]');
		var counterEl  = $('[data-work-counter]');
		var listEl     = $('[data-work-list]');
		var listLeft   = $('[data-work-list-track="left"]');
		var listRight  = $('[data-work-list-track="right"]');
		var listCenter = $('[data-work-list-center]');
		var numLeft    = $('[data-work-list-num="left"]');
		var numRight   = $('[data-work-list-num="right"]');
		var viewBtns   = $$('[data-work-view]');
		var originals  = $$('[data-work-item]', track);
		var N = originals.length;
		if (!N) return;

		originals.forEach(function (item, i) {
			item.setAttribute('data-work-index', i);
		});

		/* Block native image/link ghost-drag in both modes. */
		root.addEventListener('dragstart', function (event) {
			event.preventDefault();
		}, sig);

		function readStored() {
			try { return localStorage.getItem(STORAGE_KEY); } catch (_) { return null; }
		}

		function writeStored(value) {
			try { localStorage.setItem(STORAGE_KEY, value); } catch (_) {}
		}

		var userMode = readStored() === 'list' ? 'list' : 'slide';
		var mode = userMode;
		var activeIdx = 0;
		var fading = false;

		function killSnap(ref) {
			if (ref.t) { ref.t.kill(); ref.t = null; }
		}

		function snapTween(setCurrent, target, ref) {
			killSnap(ref);

			var state = { c: ref.from() };

			ref.t = gsap.to(state, {
				c: target,
				duration: DUR,
				ease: EASE,
				onUpdate: function () { setCurrent(state.c); },
				onComplete: function () {
					setCurrent(target);
					ref.t = null;
				}
			});
		}

		/* ------------------------------------------------------------
		   TEARDOWN — idempotent; removes everything that could
		   outlive the Barba container.
		   ------------------------------------------------------------ */
		var dead = false;

		function teardown() {
			if (dead) return;
			dead = true;

			killSlide();
			killList();

			clearTimeout(wheelIdle);
			cancelAnimationFrame(resizeRaf);

			abort.abort();

			if (instance && instance.teardown === teardown) instance = null;
		}

		/* ------------------------------------------------------------
		   SLIDE
		   ------------------------------------------------------------ */
		var S = {
			cur: 0,
			tgt: 0,
			pitch: 0,
			wrap: null,
			snap: { t: null, from: function () { return S.cur; } }
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

			$$('.work-card[data-work-current]', track).forEach(function (card) {
				card.removeAttribute('data-work-current');
			});

			$$('.work-card[data-work-index="' + index + '"]', track).forEach(function (card) {
				card.setAttribute('data-work-current', 'true');
			});

			if (counterEl) {
				counterEl.textContent = pad(index + 1) + ' / ' + pad(N);
			}
		}

		function cloneItem(el) {
			var clone = el.cloneNode(true);
			clone.setAttribute('data-work-clone', '');
			return clone;
		}

		function buildSlide() {
			track.innerHTML = '';

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

			var cards = $$('.work-card', track);
			if (cards.length < 2) return;

			S.pitch =
				cards[1].getBoundingClientRect().left -
				cards[0].getBoundingClientRect().left;

			if (!S.pitch) return;

			var span = S.pitch * N;

			S.wrap = gsap.utils.wrap(-span * (COPIES + 1), -span * COPIES);
			S.cur = S.tgt = -span * COPIES - activeIdx * S.pitch;

			gsap.ticker.add(slideTick);
		}

		function slideTick() {
			if (!root.isConnected) { teardown(); return; }

			if (!S.snap.t) {
				S.cur += (S.tgt - S.cur) * 0.085;
				if (Math.abs(S.tgt - S.cur) < 0.5) S.cur = S.tgt;
			}

			track.style.transform = 'translate3d(' + S.wrap(S.cur) + 'px,0,0)';

			var span = S.pitch * N;
			var offset = ((-S.cur) % span + span) % span;

			activeIdx = Math.round(offset / span * N) % N;
			markCurrentSlide(activeIdx);
		}

		function snapSlideStep(direction) {
			if (!S.pitch) return;

			var aligned = Math.round(S.tgt / S.pitch) * S.pitch;

			snapTween(
				function (v) { S.cur = S.tgt = v; },
				aligned + direction * S.pitch,
				S.snap
			);
		}

		function killSlide() {
			killSnap(S.snap);
			gsap.ticker.remove(slideTick);
		}

		track.addEventListener('pointerdown', function (event) {
			if (mode !== 'slide' || isMobile() || locked()) return;

			sDrag = true;
			sMoved = false;
			sStartX = sLastX = event.clientX;
			sPid = event.pointerId;

			killSnap(S.snap);
			setStatus('dragging');
		}, sig);

		track.addEventListener('pointermove', function (event) {
			if (!sDrag || mode !== 'slide' || isMobile()) return;

			var deltaX = event.clientX - sLastX;
			sLastX = event.clientX;

			if (!sMoved && Math.abs(event.clientX - sStartX) > DRAG_THRESHOLD) {
				sMoved = true;
				try { track.setPointerCapture(sPid); } catch (_) {}
			}

			if (sMoved) S.tgt += deltaX;
		}, sig);

		function endSlideDrag() {
			if (!sDrag) return;

			sDrag = false;
			setStatus('idle');

			try { track.releasePointerCapture(sPid); } catch (_) {}
			sPid = null;
		}

		['pointerup', 'pointercancel'].forEach(function (type) {
			track.addEventListener(type, endSlideDrag, sig);
		});

		track.addEventListener('click', function (event) {
			if (mode === 'slide' && !isMobile() && sMoved) {
				event.preventDefault();
				event.stopPropagation();
			}
		}, { capture: true, signal: abort.signal });

		$$('[data-work-arrow]').forEach(function (button) {
			button.addEventListener('click', function (event) {
				event.preventDefault();
				if (mode !== 'slide' || locked()) return;

				snapSlideStep(
					button.getAttribute('data-work-arrow') === 'prev' ? 1 : -1
				);
			}, sig);
		});

		/* ------------------------------------------------------------
		   LIST
		   ------------------------------------------------------------ */
		var L = {
			cur: 0,
			tgt: 0,
			snapTimer: null,
			rowH: 0,
			span: 0,
			off0: 0,
			align: 0,
			prevIdx: -1,
			snap: { t: null, from: function () { return L.cur; } }
		};

		var lDrag = false;
		var lLastY = 0;
		var leftRows = null;
		var rightRows = null;
		var prevLeftLabel = null;
		var prevRightLabel = null;

		function row(side, index, label) {
			return (
				'<div class="work-list__row work-list__row--' + side +
				'" data-work-row-' + side + '="' + index + '">' +
				'<span class="work-list__label">' + label + '</span>' +
				'</div>'
			);
		}

		function repeat(string, amount) {
			var out = '';
			while (amount--) out += string;
			return out;
		}

		function pauseListVideos() {
			$$('video', listCenter).forEach(function (video) {
				video.pause();
			});
		}

		function buildList() {
			[listLeft, listRight, numLeft, numRight, listCenter].forEach(function (el) {
				el.innerHTML = '';
			});

			var mediaFrag = document.createDocumentFragment();

			originals.forEach(function (item, index) {
				var sourceThumb = $('.work-card__thumb', item);
				if (!sourceThumb) return;

				var thumb = sourceThumb.cloneNode(true);
				thumb.classList.add('work-list__media');
				thumb.setAttribute('data-work-list-media', index);

				var video = thumb.querySelector('video[data-src]');
				if (video) video.removeAttribute('src');

				mediaFrag.appendChild(thumb);
			});

			listCenter.appendChild(mediaFrag);

			var leftMarkup = '';
			var rightMarkup = '';
			var numberMarkup = '';

			originals.forEach(function (item, index) {
				leftMarkup += row('left', index, $('[data-work-name]', item).textContent);
				numberMarkup += '<div class="work-list__num-item">' + pad(index + 1) + '</div>';
			});

			for (var index = N - 1; index >= 0; index--) {
				rightMarkup += row('right', index, $('[data-work-client]', originals[index]).textContent);
			}

			var repetitions = 2 * COPIES + 1;

			listLeft.innerHTML = repeat(leftMarkup, repetitions);
			listRight.innerHTML = repeat(rightMarkup, repetitions);
			numLeft.innerHTML = repeat(numberMarkup, repetitions);
			numRight.innerHTML = repeat(numberMarkup, repetitions);

			leftRows = $$('.work-list__row', listLeft);
			rightRows = $$('.work-list__row', listRight);
		}

		function setupList() {
			killList();
			if (dead || isMobile() || !leftRows || !leftRows.length) return;

			L.rowH = leftRows[0].offsetHeight;
			if (!L.rowH) return;

			leftRows
				.concat(rightRows, $$('.work-list__num-item'), $$('.work-list__num-clip'))
				.forEach(function (el) {
					el.style.height = L.rowH + 'px';
				});

			L.span = L.rowH * N;
			L.off0 = COPIES * L.span;

			/* Centre one row vertically; computed once per setup, not per frame. */
			L.align = listEl.clientHeight / 2 - L.rowH / 2;

			L.cur = L.tgt = L.off0 + activeIdx * L.rowH;
			L.prevIdx = -1;
			prevLeftLabel = null;
			prevRightLabel = null;

			gsap.ticker.add(listTick);
		}

		function listTick() {
			if (!root.isConnected) { teardown(); return; }

			if (!L.snap.t) {
				L.cur += (L.tgt - L.cur) * 0.14;
				if (Math.abs(L.tgt - L.cur) < 0.5) L.cur = L.tgt;
			}

			while (L.cur > L.off0 + L.span) { L.cur -= L.span; L.tgt -= L.span; }
			while (L.cur < L.off0 - L.span) { L.cur += L.span; L.tgt += L.span; }

			applyList(L.cur);
		}

		function applyList(value) {
			var leftY = -value + L.align;
			var rightY = value - 2 * L.off0 - (N - 1) * L.rowH + L.align;

			listLeft.style.transform = 'translate3d(0,' + leftY + 'px,0)';
			listRight.style.transform = 'translate3d(0,' + rightY + 'px,0)';
			numLeft.style.transform = 'translate3d(0,' + (-value) + 'px,0)';
			numRight.style.transform = 'translate3d(0,' + (-value) + 'px,0)';

			var leftAt = clamp(0, leftRows.length - 1, Math.round(value / L.rowH));
			var rightAt = clamp(
				0,
				rightRows.length - 1,
				Math.round((2 * L.off0 + (N - 1) * L.rowH - value) / L.rowH)
			);

			var index = parseInt(leftRows[leftAt].getAttribute('data-work-row-left'), 10);
			var nextLeftLabel = $('.work-list__label', leftRows[leftAt]);
			var nextRightLabel = $('.work-list__label', rightRows[rightAt]);

			/* Visible repeated labels update independently of the logical
			   project index so infinite wrapping remains seamless. */
			if (nextLeftLabel !== prevLeftLabel) {
				if (prevLeftLabel) prevLeftLabel.removeAttribute('data-work-active');
				prevLeftLabel = nextLeftLabel;
				prevLeftLabel.setAttribute('data-work-active', 'true');
			}

			if (nextRightLabel !== prevRightLabel) {
				if (prevRightLabel) prevRightLabel.removeAttribute('data-work-active');
				prevRightLabel = nextRightLabel;
				prevRightLabel.setAttribute('data-work-active', 'true');
			}

			if (index === L.prevIdx) return;

			L.prevIdx = index;
			activeIdx = index;

			var currentMedia = $('[data-work-list-media][data-work-state="active"]', listCenter);
			if (currentMedia) currentMedia.removeAttribute('data-work-state');

			var nextMedia = $('[data-work-list-media="' + index + '"]', listCenter);
			if (nextMedia) nextMedia.setAttribute('data-work-state', 'active');

			var link = originals[index] && originals[index].querySelector('a[href]');
			if (link) listCenter.setAttribute('href', link.getAttribute('href') || '#');
		}

		function listSnapTo(target) {
			snapTween(function (v) { L.cur = L.tgt = v; }, target, L.snap);
		}

		function scheduleListSnap() {
			clearTimeout(L.snapTimer);

			L.snapTimer = setTimeout(function () {
				if (!L.rowH) return;
				listSnapTo(Math.round(L.tgt / L.rowH) * L.rowH);
			}, SNAP_DEBOUNCE);
		}

		function killList() {
			clearTimeout(L.snapTimer);
			L.snapTimer = null;

			killSnap(L.snap);
			gsap.ticker.remove(listTick);

			pauseListVideos();
		}

		listEl.addEventListener('pointerdown', function (event) {
			if (mode !== 'list' || isMobile() || locked()) return;
			if (event.target.closest('.work-list__arrow, .work-list__center')) return;

			event.preventDefault();

			try { listEl.setPointerCapture(event.pointerId); } catch (_) {}

			killSnap(L.snap);
			clearTimeout(L.snapTimer);

			lDrag = true;
			lLastY = event.clientY;
			setStatus('dragging');
		}, sig);

		listEl.addEventListener('pointermove', function (event) {
			if (!lDrag || mode !== 'list') return;

			var deltaY = event.clientY - lLastY;
			lLastY = event.clientY;

			L.tgt -= deltaY;
			L.cur -= deltaY * 0.5;
		}, sig);

		function endListDrag() {
			if (!lDrag) return;

			lDrag = false;
			setStatus('idle');

			L.tgt = L.cur;
			scheduleListSnap();
		}

		['pointerup', 'pointercancel'].forEach(function (type) {
			listEl.addEventListener(type, endListDrag, sig);
		});

		$$('[data-work-list-arrow]').forEach(function (button) {
			button.addEventListener('click', function (event) {
				event.preventDefault();
				if (mode !== 'list' || !L.rowH || locked()) return;

				var direction =
					button.getAttribute('data-work-list-arrow') === 'up' ? -1 : 1;

				listSnapTo((Math.round(L.tgt / L.rowH) + direction) * L.rowH);
			}, sig);
		});

		/* ------------------------------------------------------------
		   WHEEL — on document so scrolling anywhere drives the
		   slider. Self-neutralising via the isConnected check, and
		   inert while the boilerplate has the site scroll-locked.
		   ------------------------------------------------------------ */
		var wheelIdle = null;

		function onWheel(event) {
			if (!root.isConnected) { teardown(); return; }
			if (isMobile() || fading || locked()) return;

			var delta = clamp(
				-120,
				120,
				Math.abs(event.deltaX) > Math.abs(event.deltaY)
					? event.deltaX
					: event.deltaY
			);

			if (mode === 'slide') {
				event.preventDefault();
				killSnap(S.snap);
				S.tgt -= delta;
			} else if (mode === 'list') {
				event.preventDefault();
				killSnap(L.snap);
				L.tgt += delta;
				scheduleListSnap();
			}

			setStatus('scrolling');
			clearTimeout(wheelIdle);
			wheelIdle = setTimeout(function () { setStatus('idle'); }, 200);
		}

		document.addEventListener('wheel', onWheel, { passive: false, signal: abort.signal });

		/* ------------------------------------------------------------
		   MODE
		   ------------------------------------------------------------ */
		function rebuild() {
			if (mode === 'slide') {
				buildSlide();
				requestAnimationFrame(setupSlide);
			} else {
				buildList();
				requestAnimationFrame(setupList);
			}
		}

		function applyMode(next) {
			mode = next;
			root.setAttribute('data-work-mode', next);

			viewBtns.forEach(function (button) {
				button.setAttribute(
					'data-work-active',
					button.getAttribute('data-work-view') === next ? 'true' : 'false'
				);
			});

			killSlide();
			killList();

			if (isMobile()) {
				/* Restore the clean static layout: remove clones
				   and any inline transforms the scroller applied. */
				track.innerHTML = '';

				originals.forEach(function (el) {
					el.style.transform = '';
					track.appendChild(el);
				});

				track.style.transform = '';
				return;
			}

			rebuild();
		}

		function switchMode(next) {
			if (fading) return;

			fading = true;
			root.setAttribute('data-work-fading', '');

			setTimeout(function () {
				if (dead) return;

				applyMode(next);

				requestAnimationFrame(function () {
					requestAnimationFrame(function () {
						root.removeAttribute('data-work-fading');
						fading = false;
					});
				});
			}, FADE_MS);
		}

		viewBtns.forEach(function (button) {
			button.addEventListener('click', function (event) {
				event.preventDefault();
				if (isMobile() || fading || locked()) return;

				var next = button.getAttribute('data-work-view');
				if (next === mode) return;

				userMode = next;
				writeStored(next);
				switchMode(next);
			}, sig);
		});

		/* ------------------------------------------------------------
		   RESIZE — breakpoint crossing is handled at module level;
		   same-breakpoint desktop resizes re-measure, because card
		   pitch and row heights are viewport-relative.
		   ------------------------------------------------------------ */
		var resizeRaf = null;

		function onResize() {
			cancelAnimationFrame(resizeRaf);

			resizeRaf = requestAnimationFrame(function () {
				if (dead) return;
				if (!isMobile()) rebuild();
			});
		}

		window.addEventListener('resize', onResize, sig);

		applyMode(isMobile() ? 'slide' : userMode);

		instance = {
			teardown: teardown,
			onBreakpoint: function (matches) {
				applyMode(matches ? 'slide' : userMode);
			},
			isConnected: function () {
				return root.isConnected;
			}
		};
	}

	/* Breakpoint cross — module level, so it lives for the life of
	   the site and always acts on whichever instance is current. */
	function handleBreakpoint(event) {
		if (!instance) return;
		if (!instance.isConnected()) { destroy(); return; }
		instance.onBreakpoint(event.matches);
	}

	if (mq.addEventListener) mq.addEventListener('change', handleBreakpoint);
	else mq.addListener(handleBreakpoint);

	return create;
})();
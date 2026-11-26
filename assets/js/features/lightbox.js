(function(nativeWindow){
if(nativeWindow.JKLightbox)return;
const mounted=new Map();
function mountOne(root){
if(!root||mounted.has(root))return;
const abort=new AbortController();
const page=root.closest('[data-barba="container"]')||nativeWindow.document;
const owner=root.closest('[data-project-lightbox]');
const home=root.closest('.hero_reel_media');
if(home){
  const media=root.querySelector('.showreel_media');
  if(media){media.dataset.reveal='load';media.dataset.revealEffect='height';media.dataset.revealOrder='0';media.dataset.revealDelay='.1';}
  root.setAttribute('data-flip-element','target');
  const info=home.querySelector(':scope > .showreel_info');
  if(info)root.querySelector('.showreel_card').appendChild(info);
}
const preview=root.querySelector('.showreel_poster');
const hero=root.closest('.case_media_wrap');
if(hero){
 const source=hero.querySelector(':scope > .case_media_inner video');
 const url=source&&(source.getAttribute('data-src')||source.getAttribute('src')||source.querySelector('source')?.getAttribute('src'));
 if(url){
  root.querySelector('[data-bunny-player-init]').setAttribute('data-player-src',url);
  const poster=source.getAttribute('poster')||'';
  if(preview){
   if(poster)preview.setAttribute('poster',poster);else preview.removeAttribute('poster');
   preview.removeAttribute('data-src');
   preview.muted=true;preview.loop=true;preview.playsInline=true;
   preview.dataset.previewSource=url;
  }
  source.setAttribute('data-video-ignore','');source.pause();source.closest('.case_media_inner').style.visibility='hidden';
 }
}
const oldName=root.getAttribute('data-mini-showreel-player');
const lb=(owner||page).querySelector('[data-mini-showreel-lightbox="'+oldName+'"]')||(owner&&owner.querySelector('[data-mini-showreel-lightbox]'));
if(!lb)return;
const name='project-lightbox-'+(++mountOne.serial);
root.setAttribute('data-mini-showreel-player',name);lb.setAttribute('data-mini-showreel-lightbox',name);
root.querySelectorAll('[data-mini-showreel-open]').forEach(el=>{el.setAttribute('data-mini-showreel-open',name);el.setAttribute('aria-label',hero?'View full screen':'Play video');});
root.querySelectorAll('[data-mini-showreel-close]').forEach(el=>{el.setAttribute('aria-label','Back');});
root.querySelectorAll('[data-mini-showreel-open]').forEach(el=>{
 if(!el.matches('a,button')){el.setAttribute('role','button');el.tabIndex=0;}
 el.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!el.matches('a,button')){e.preventDefault();el.click();}},{signal:abort.signal});
});
const queryAll=sel=>[...new Set([root,...root.querySelectorAll(sel),lb,...lb.querySelectorAll(sel)].filter(el=>el.matches(sel)))];
function eventProxy(target){return new Proxy(target,{get(t,k){if(t===nativeWindow.document&&k==='querySelector')return sel=>queryAll(sel)[0]||null;if(t===nativeWindow.document&&k==='querySelectorAll')return queryAll;if(k==='addEventListener')return(type,fn,options)=>t.addEventListener(type,fn,{...(typeof options==='boolean'?{capture:options}:options),signal:abort.signal});const value=Reflect.get(t,k,t);return typeof value==='function'&&(t===nativeWindow.document||k==='removeEventListener')?value.bind(t):value;}});}
const window=eventProxy(nativeWindow),document=eventProxy(nativeWindow.document);


function keyboardButton(el, label) {
  el.setAttribute('aria-label', label);
  if (el.matches('button,a[href]')) return;
  el.setAttribute('role', 'button');
  el.tabIndex = 0;
  el.addEventListener('keydown', event => {
    if (event.target !== el || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    if (!event.repeat) el.click();
  }, {signal:abort.signal});
}

function initBunnyPlayer() {
  document.querySelectorAll('[data-bunny-player-init]').forEach(function(player) {
    var src = player.getAttribute('data-player-src');
    if (!src) return;

    var video = player.querySelector('video');
    if (!video) return;

    var controls = [...player.querySelectorAll('[data-player-control]')];
    var transport = player.querySelector('.player_play_toggle') || controls.find(el => el.dataset.playerControl === 'playpause');
    var mute = controls.find(el => el.dataset.playerControl === 'mute');
    var fs = controls.find(el => el.dataset.playerControl === 'fullscreen');
    const controlLabels = {play:'Play', pause:'Pause', playpause:'Play', mute:'Mute', fullscreen:'Enter fullscreen'};
    controls.forEach(el => {
      if (el.dataset.playerControl === 'playpause' && el !== transport) {
        el.setAttribute('aria-hidden','true');
      } else if (controlLabels[el.dataset.playerControl]) keyboardButton(el, controlLabels[el.dataset.playerControl]);
    });
    try { video.pause(); } catch(_) {}
    try { video.removeAttribute('src'); video.load(); } catch(_) {}
    function setStatus(s) {
      if (player.getAttribute('data-player-status') !== s) {
        player.setAttribute('data-player-status', s);
        transport?.setAttribute('aria-label', s === 'playing' || s === 'loading' ? 'Pause' : 'Play');
      }
    }
    function setMutedState(v) {
      video.muted = !!v;
      mute?.setAttribute('aria-label', video.muted ? 'Unmute' : 'Mute');
      player.setAttribute('data-player-muted', video.muted ? 'true' : 'false');
    }
    function setFsAttr(v) { fs?.setAttribute('aria-label', v ? 'Exit fullscreen' : 'Enter fullscreen'); player.setAttribute('data-player-fullscreen', v ? 'true' : 'false'); }
    function setActivated(v) { player.setAttribute('data-player-activated', v ? 'true' : 'false'); }
    if (!player.hasAttribute('data-player-activated')) setActivated(false);
    var timeline = player.querySelector('[data-player-timeline]');
    var progressBar = player.querySelector('[data-player-progress]');
    var bufferedBar = player.querySelector('[data-player-buffered]');
    var handle = player.querySelector('[data-player-timeline-handle]');
    var timeDurationEls = player.querySelectorAll('[data-player-time-duration]');
    var timeProgressEls = player.querySelectorAll('[data-player-time-progress]');
    var updateSize = player.getAttribute('data-player-update-size'); // "true" | "cover" | null
    var autoplay = player.getAttribute('data-player-autoplay') === 'true';
    var initialMuted = player.getAttribute('data-player-muted') === 'true';
    var pendingPlay = false;
    var playback = createPortfolioPlayback(video, src, abort.signal);
    setMutedState(autoplay || initialMuted);
    video.playsInline = true;
    if (autoplay) { video.loop = true; video.autoplay = false; }
    if ('disableRemotePlayback' in video) video.disableRemotePlayback = true;
    // The compact preview owns initial playback. The full stream starts on demand.
    video.preload = 'none';
    if (player.getAttribute('data-player-lazy') === 'meta' &&
        (!/\.m3u8(?:[?#]|$)/i.test(src) || video.canPlayType('application/vnd.apple.mpegurl'))) {
      video.preload = 'metadata';
      video.src = src;
    }
    function onPlaybackError() {
      if (abort.signal.aborted) return;
      pendingPlay = false;
      setStatus('paused');
    }
    video.addEventListener('error', onPlaybackError);
    function startPlaying() {
      pendingPlay = true;
      setStatus('loading');
      playback.play().catch(onPlaybackError);
    }
    function pausePlaying() {
      pendingPlay = false;
      playback.pause();
      setStatus('paused');
    }
    abort.signal.addEventListener('abort', () => {
      cancelAnimationFrame(rafId);
      clearTimeout(hoverTimer);
    }, {once:true});
    function togglePlay() {
      if (pendingPlay || (!video.paused && !video.ended)) pausePlaying();
      else startPlaying();
    }
    function toggleMute() {
      setMutedState(!video.muted);
    }
    function isFsActive() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
    function enterFullscreen() {
      if (player.requestFullscreen) return player.requestFullscreen();
      if (video.requestFullscreen) return video.requestFullscreen();
      if (video.webkitSupportsFullscreen && typeof video.webkitEnterFullscreen === 'function') return video.webkitEnterFullscreen();
    }
    function exitFullscreen() {
      if (document.exitFullscreen) return document.exitFullscreen();
      if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
      if (video.webkitDisplayingFullscreen && typeof video.webkitExitFullscreen === 'function') return video.webkitExitFullscreen();
    }
    function toggleFullscreen() {
      const result = isFsActive() || video.webkitDisplayingFullscreen ? exitFullscreen() : enterFullscreen();
      result?.catch(() => setFsAttr(isFsActive()));
    }
    document.addEventListener('fullscreenchange', function() { setFsAttr(isFsActive()); });
    document.addEventListener('webkitfullscreenchange', function() { setFsAttr(isFsActive()); });
    video.addEventListener('webkitbeginfullscreen', function() { setFsAttr(true); });
    video.addEventListener('webkitendfullscreen', function() { setFsAttr(false); });
    player.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-player-control]');
      if (!btn || !player.contains(btn)) {
        if (!e.target.closest('.player_controls_bottom,[data-player-timeline],input,button,a')) togglePlay();
        return;
      }
      var type = btn.getAttribute('data-player-control');
      if (type === 'play' || type === 'pause' || type === 'playpause') togglePlay();
      else if (type === 'mute') toggleMute();
      else if (type === 'fullscreen') toggleFullscreen();
    });
    function updateTimeTexts() {
      if (timeDurationEls.length) setText(timeDurationEls, formatTime(video.duration));
      if (timeProgressEls.length) setText(timeProgressEls, formatTime(video.currentTime));
    }
    function updateSeekValue() {
      if (!timeline || !Number.isFinite(video.duration) || video.duration <= 0) return;
      timeline.setAttribute('aria-valuemax', Math.floor(video.duration));
      timeline.setAttribute('aria-valuenow', Math.floor(video.currentTime));
      timeline.setAttribute('aria-valuetext', formatTime(video.currentTime) + ' of ' + formatTime(video.duration));
    }
    video.addEventListener('timeupdate', updateSeekValue);
    video.addEventListener('durationchange', updateSeekValue);
    video.addEventListener('timeupdate', updateTimeTexts);
    video.addEventListener('loadedmetadata', function(){ updateTimeTexts(); maybeSetRatioFromVideo(player, updateSize, video); });
    video.addEventListener('loadeddata', function(){ maybeSetRatioFromVideo(player, updateSize, video); });
    video.addEventListener('playing', function(){ maybeSetRatioFromVideo(player, updateSize, video); });
    video.addEventListener('durationchange', updateTimeTexts);
    var rafId;
    function updateProgressVisuals() {
      if (!video.duration) return;
      var playedPct = (video.currentTime / video.duration) * 100;
      if (progressBar) progressBar.style.transform = 'translateX(' + (-100 + playedPct) + '%)';
      if (handle) handle.style.left = playedPct + '%';
    }
    function loop() {
      updateProgressVisuals();
      if (!video.paused && !video.ended) rafId = requestAnimationFrame(loop);
    }
    function updateBufferedBar() {
      if (!bufferedBar || !video.duration || !video.buffered.length) return;
      var end = video.buffered.end(video.buffered.length - 1);
      var buffPct = (end / video.duration) * 100;
      bufferedBar.style.transform = 'translateX(' + (-100 + buffPct) + '%)';
    }
    video.addEventListener('progress', updateBufferedBar);
    video.addEventListener('loadedmetadata', updateBufferedBar);
    video.addEventListener('durationchange', updateBufferedBar);
    video.addEventListener('play', function() { setActivated(true); cancelAnimationFrame(rafId); loop(); setStatus('playing'); });
    video.addEventListener('playing', function() { pendingPlay = false; setStatus('playing'); });
    video.addEventListener('pause', function() { pendingPlay = false; cancelAnimationFrame(rafId); updateProgressVisuals(); setStatus('paused'); });
    video.addEventListener('waiting', function() { setStatus('loading'); });
    video.addEventListener('canplay', function() { readyIfIdle(player, pendingPlay); });
    video.addEventListener('ended', function() { pendingPlay = false; cancelAnimationFrame(rafId); updateProgressVisuals(); setStatus('paused'); setActivated(false); });
    if (timeline) {
      timeline.tabIndex = 0;
      timeline.setAttribute('role','slider');
      timeline.setAttribute('aria-label','Seek video');
      timeline.setAttribute('aria-valuemin','0');
      timeline.setAttribute('aria-valuemax','0');
      timeline.setAttribute('aria-valuenow','0');
      timeline.addEventListener('keydown', event => {
        if (!Number.isFinite(video.duration)) return;
        const targets = {ArrowLeft:video.currentTime-5, ArrowDown:video.currentTime-5, ArrowRight:video.currentTime+5, ArrowUp:video.currentTime+5, Home:0, End:video.duration};
        if (!Object.hasOwn(targets,event.key)) return;
        event.preventDefault();
        video.currentTime = Math.max(0, Math.min(video.duration, targets[event.key]));
        updateSeekValue();
      }, {signal:abort.signal});
      var dragging = false, wasPlaying = false, targetTime = 0, lastSeekTs = 0, seekThrottle = 180, rect = null;
      window.addEventListener('resize', function() { if (!dragging) rect = null; });
      function getFractionFromX(x) {
        if (!rect) rect = timeline.getBoundingClientRect();
        var f = (x - rect.left) / rect.width; if (f < 0) f = 0; if (f > 1) f = 1; return f;
      }
      function previewAtFraction(f) {
        if (!video.duration) return;
        var pct = f * 100;
        if (progressBar) progressBar.style.transform = 'translateX(' + (-100 + pct) + '%)';
        if (handle) handle.style.left = pct + '%';
        if (timeProgressEls.length) setText(timeProgressEls, formatTime(f * video.duration));
      }
      function maybeSeek(now) {
        if (!video.duration) return;
        if ((now - lastSeekTs) < seekThrottle) return;
        lastSeekTs = now; video.currentTime = targetTime;
      }
      function onPointerDown(e) {
        if (!video.duration) return;
        dragging = true; wasPlaying = !video.paused && !video.ended; if (wasPlaying) video.pause();
        player.setAttribute('data-timeline-drag', 'true'); rect = timeline.getBoundingClientRect();
        var f = getFractionFromX(e.clientX); targetTime = f * video.duration; previewAtFraction(f); maybeSeek(performance.now());
        timeline.setPointerCapture && timeline.setPointerCapture(e.pointerId);
        window.addEventListener('pointermove', onPointerMove, { passive: false });
        window.addEventListener('pointerup', onPointerUp, { passive: true });
        window.addEventListener('pointercancel', onPointerUp, { passive: true });
        e.preventDefault();
      }
      function onPointerMove(e) {
        if (!dragging) return;
        var f = getFractionFromX(e.clientX); targetTime = f * video.duration; previewAtFraction(f); maybeSeek(performance.now()); e.preventDefault();
      }
      function onPointerUp() {
        if (!dragging) return;
        dragging = false; player.setAttribute('data-timeline-drag', 'false'); rect = null; video.currentTime = targetTime;
        if (wasPlaying) safePlay(video); else { updateProgressVisuals(); updateTimeTexts(); }
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
      }
      timeline.addEventListener('pointerdown', onPointerDown, { passive: false });
    }
    var hoverTimer;
    var hoverHideDelay = 3000;
    function setHover(state) {
      if (player.getAttribute('data-player-hover') !== state) {
        player.setAttribute('data-player-hover', state);
      }
    }
    function scheduleHide() { clearTimeout(hoverTimer); hoverTimer = setTimeout(function() { setHover('idle'); }, hoverHideDelay); }
    function wakeControls() { setHover('active'); scheduleHide(); }
    player.addEventListener('pointerdown', wakeControls);
    document.addEventListener('fullscreenchange', wakeControls);
    document.addEventListener('webkitfullscreenchange', wakeControls);
    var trackingMove = false;
    function onPointerMoveGlobal(e) {
      var r = player.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) wakeControls();
    }
    player.addEventListener('pointerenter', function() {
      wakeControls();
      if (!trackingMove) { trackingMove = true; window.addEventListener('pointermove', onPointerMoveGlobal, { passive: true }); }
    });
    player.addEventListener('pointerleave', function() {
      setHover('idle'); clearTimeout(hoverTimer);
      if (trackingMove) { trackingMove = false; window.removeEventListener('pointermove', onPointerMoveGlobal); }
    });
    if (autoplay) {
      var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          var inView = entry.isIntersecting && entry.intersectionRatio > 0;

          if (inView && video.paused && !pendingPlay) startPlaying();
          else if (!inView && (pendingPlay || !video.paused)) pausePlaying();
        });
      }, { threshold: 0.1 });

      io.observe(player);
      abort.signal.addEventListener('abort', () => io.disconnect(), {once:true});
    }
  });
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) return '00:00';
    var s = Math.floor(sec), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    return h > 0 ? (h + ':' + pad2(m) + ':' + pad2(r)) : (pad2(m) + ':' + pad2(r));
  }
  function setText(nodes, text) { nodes.forEach(function(n){ n.textContent = text; }); }
  function safePlay(video) {
    var p = video.play();
    if (p && typeof p.then === 'function') p.catch(function(){});
  }
  function readyIfIdle(player, pendingPlay) {
    if (!pendingPlay &&
        player.getAttribute('data-player-activated') !== 'true' &&
        player.getAttribute('data-player-status') === 'idle') {
      player.setAttribute('data-player-status', 'ready');
    }
  }
  function setBeforeRatio(player, updateSize, w, h) {
    if (updateSize !== 'true' || !w || !h) return;
    var before = player.querySelector('[data-player-before]');
    if (!before) return;
    before.style.paddingTop = (h / w * 100) + '%';
  }
  function maybeSetRatioFromVideo(player, updateSize, video) {
    if (updateSize !== 'true') return;
    var before = player.querySelector('[data-player-before]');
    if (!before) return;
    var hasPad = before.style.paddingTop && before.style.paddingTop !== '0%';
    if (!hasPad && video.videoWidth && video.videoHeight) {
      setBeforeRatio(player, updateSize, video.videoWidth, video.videoHeight);
    }
  }
}

function initMiniShowreelPlayer() {
  const openBtns = document.querySelectorAll("[data-mini-showreel-open]");
  if (!openBtns.length) return;
  var duration = parseFloat(getComputedStyle(nativeWindow.document.documentElement).getPropertyValue("--motion-lightbox-duration")) || 1;
  var ease = getComputedStyle(nativeWindow.document.documentElement).getPropertyValue("--motion-lightbox-ease").trim() || "expo.inOut";
  var zIndex = 999;

  const fullPlayer = root.querySelector('[data-bunny-player-init]');
  const closeControl = root.querySelector('[data-mini-showreel-close]');
  if (closeControl) keyboardButton(closeControl, 'Close video');
  const focusable = () => [...root.querySelectorAll('[data-player-control]:not([aria-hidden="true"]),[data-player-timeline],[data-mini-showreel-close]')].filter(el => el.getClientRects().length && !el.closest('[inert]'));
  function dialogMode(active) {
    if (fullPlayer) fullPlayer.inert = !active;
    if (closeControl) closeControl.inert = !active;
    if (active) {
      root.setAttribute('role','dialog');
      root.setAttribute('aria-modal','true');
      root.setAttribute('aria-label','Video player');
    } else {
      for (const attr of ['role','aria-modal','aria-label']) root.removeAttribute(attr);
    }
  }
  dialogMode(false);
  let n = "", isOpen = false, opener;
  let lb, pw, tg;
  let pwCss = "", lbZ = "", pwZ = "";

  const q = (sel, root = document) => root.querySelector(sel);

  const getLB = (name) => q(`[data-mini-showreel-lightbox="${name}"]`);
  const getPW = (name) => q(`[data-mini-showreel-player="${name}"]`);

  const safe = (t) => t.closest("[data-mini-showreel-safearea]") || q("[data-mini-showreel-safearea]", t) || t;

  const fit = (b, a) => {
    let w = b.width, h = w / a;
    if (h > b.height) { h = b.height; w = h * a; }
    return {
      left: b.left + (b.width - w) / 2,
      top: b.top + (b.height - h) / 2,
      width: w,
      height: h
    };
  };

  const rectFor = (t) => {
    const b = safe(t).getBoundingClientRect();
    const r = t.getBoundingClientRect();
    const a = r.width > 0 && r.height > 0 ? r.width / r.height : 16 / 9;
    return fit(b, a);
  };

  const place = (el, r) =>
    gsap.set(el, {
      position: "fixed",
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
      margin: 0,
      x: 0,
      y: 0
    });

  function setStatus(status) {
    if (!n) return;
    document.querySelectorAll(`[data-mini-showreel-lightbox="${n}"], [data-mini-showreel-player="${n}"]`).forEach((el) => el.setAttribute("data-mini-showreel-status", status));
  }

  function zOn() {
    lbZ = lb?.style.zIndex || "";
    pwZ = pw?.style.zIndex || "";
    if (lb) lb.style.zIndex = String(zIndex);
    if (pw) pw.style.zIndex = String(zIndex);
  }

  function zOff() {
    if (lb) lb.style.zIndex = lbZ;
    if (pw) pw.style.zIndex = pwZ;
  }

  function playFor(name) {
    const wrap = getPW(name);
    if (!wrap) return;

    const bunny = wrap.querySelector("[data-bunny-player-init]");
    const video = bunny ? bunny.querySelector("video") : wrap.querySelector("video");
    if (!video) return;

    if (bunny) {
      const btn = bunny.querySelector('[data-player-control="play"], [data-player-control="playpause"]');
      if (btn && (video.paused || video.ended)) btn.click();
      return;
    }

    video.play().catch(()=>{});
  }

  function stopFor(name) {
    const wrap = getPW(name);
    if (!wrap) return;

    const bunny = wrap.querySelector("[data-bunny-player-init]");
    const video = bunny ? bunny.querySelector("video") : wrap.querySelector("video");
    if (!video) return;

    if (bunny) {
      const btn = bunny.querySelector('[data-player-control="pause"], [data-player-control="playpause"]');
      if (btn && ((!video.paused && !video.ended) || bunny.getAttribute('data-player-status') === 'loading')) btn.click();
    } else {
      var controls = [...player.querySelectorAll('[data-player-control]')];
    var transport = player.querySelector('.player_play_toggle') || controls.find(el => el.dataset.playerControl === 'playpause');
    var mute = controls.find(el => el.dataset.playerControl === 'mute');
    var fs = controls.find(el => el.dataset.playerControl === 'fullscreen');
    const controlLabels = {play:'Play', pause:'Pause', playpause:'Play', mute:'Mute', fullscreen:'Enter fullscreen'};
    controls.forEach(el => {
      if (el.dataset.playerControl === 'playpause' && el !== transport) {
        el.setAttribute('aria-hidden','true');
      } else if (controlLabels[el.dataset.playerControl]) keyboardButton(el, controlLabels[el.dataset.playerControl]);
    });
    try { video.pause(); } catch(_) {}
    }

    setTimeout(function () { try { video.currentTime = 0; } catch(_) {} }, 400);
  }

  function openBy(name, trigger) {
    if (!name || isOpen) return;
    if (matchMedia('(max-width:61.9375rem), (pointer:coarse)').matches && nativeWindow.JKMobileMedia) {
      const player=root.querySelector('[data-bunny-player-init]');
      nativeWindow.JKMobileMedia.open(root.querySelector('.showreel_poster') || player?.querySelector('video'), trigger, player?.getAttribute('data-player-src'));
      return;
    }

    lb = getLB(name);
    pw = getPW(name);
    if (!lb || !pw) return;

    tg = q("[data-mini-showreel-target]", lb);
    if (!tg) return;

    n = name;
    isOpen = true;
    opener = trigger;
    if (typeof lenis !== "undefined") lenis?.stop();
    nativeWindow.JKHomeScroll?.suspend(root);

    pw.dataset.flipId = n;
    pwCss = pw.style.cssText || "";

    zOn();
    root.dataset.lightboxPhase='opening';
    setStatus("active");
    dialogMode(true);
    playFor(n);
    const state = Flip.getState(pw);
    place(pw, rectFor(tg));

    const focusFirst = () => {
      if (isOpen && root.dataset.lightboxPhase !== 'closing' && !focusable().includes(nativeWindow.document.activeElement)) {
        focusable()[0]?.focus({preventScroll:true});
      }
    };
    Flip.from(state, {
      duration: duration,
      ease: ease,
      absolute: true,
      scale: false,
      onComplete:()=>{if(isOpen && root.dataset.lightboxPhase !== 'closing'){root.dataset.lightboxPhase='open';focusFirst();}}
    });
    // Flip temporarily re-inserts its targets, which can reset DOM focus.
    requestAnimationFrame(focusFirst);
  }

  function closeBy(nameOrEmpty) {
    if (!isOpen || !pw) return;
    if (root.dataset.lightboxPhase === 'closing' || (nameOrEmpty && nameOrEmpty !== n)) return;

    root.dataset.lightboxPhase='closing';
    stopFor(n);
    setStatus("not-active");

    const state = Flip.getState(pw);

    pw.style.cssText = pwCss;
    if (lb) lb.style.zIndex = String(zIndex);
    if (pw) pw.style.zIndex = String(zIndex);

    Flip.from(state, {
      duration: duration,
      ease: ease,
      absolute: true,
      scale: false,
      onComplete: () => {
        if (typeof lenis !== "undefined") lenis?.start();
        zOff();
        n = "";
        isOpen = false;
        root.dataset.lightboxPhase='closed';
        lb = pw = tg = null;
        pwCss = "";
        lbZ = "";
        pwZ = "";
        nativeWindow.JKHomeScroll?.resume(root);
        dialogMode(false);
        opener?.focus({preventScroll:true});
      }
    });
  }

  function onResize() {
    if (!isOpen || !pw || !tg) return;
    place(pw, rectFor(tg));
  }

  openBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openBy(btn.getAttribute("data-mini-showreel-open") || "", btn);
    });
  });

  document.querySelectorAll("[data-mini-showreel-close]").forEach(closeBtn => closeBtn.addEventListener("click", (e) => {
    e.preventDefault(); e.stopPropagation();
    closeBy(closeBtn.getAttribute("data-mini-showreel-close") || "");
  }, true));

  window.addEventListener("keydown", (e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); closeBy(''); return; }
    if (e.key !== 'Tab') return;
    const items = focusable(), index = items.indexOf(nativeWindow.document.activeElement);
    if (!items.length) return;
    e.preventDefault();
    items[(index + (e.shiftKey ? -1 : 1) + items.length) % items.length].focus({preventScroll:true});
  });

  document.addEventListener('focusin', e => {
    if (isOpen && root.dataset.lightboxPhase !== 'closing' && !root.contains(e.target)) focusable()[0]?.focus({preventScroll:true});
  });
  window.addEventListener("resize", onResize);
  if (window.ScrollTrigger) {ScrollTrigger.addEventListener("refresh", onResize); abort.signal.addEventListener("abort",()=>ScrollTrigger.removeEventListener("refresh",onResize),{once:true});}
}


initBunnyPlayer();initMiniShowreelPlayer();
mounted.set(root,()=>{abort.abort();root.querySelectorAll('video').forEach(v=>v.pause());});
}
mountOne.serial=0;
function mount(scope=nativeWindow.document){scope.querySelectorAll('[data-mini-showreel-player]').forEach(mountOne);}
nativeWindow.JKLightbox={mount};
function boot(){mount();if(nativeWindow.barba){barba.hooks.beforeLeave(()=>{mounted.forEach(fn=>fn());mounted.clear();});barba.hooks.beforeEnter(d=>mount(d.next.container));barba.hooks.afterEnter(d=>mount(d.next.container));barba.hooks.afterOnce(d=>mount(d.next.container));}}
if(nativeWindow.document.readyState==='loading')nativeWindow.document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(window);

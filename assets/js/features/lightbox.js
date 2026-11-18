(function(nativeWindow){
if(nativeWindow.JKLightbox)return;
const mounted=new Map();
function mountOne(root){
if(!root||mounted.has(root))return;
const abort=new AbortController();
const page=root.closest('[data-barba="container"]')||nativeWindow.document;
const owner=root.closest('[data-project-lightbox]');
const home=root.closest('.scaling-video__wrapper');
if(home){
  const media=root.querySelector('.mini-showreel__media');
  if(media){media.dataset.reveal='load';media.dataset.revealEffect='height';media.dataset.revealOrder='0';media.dataset.revealDelay='.1';}
  root.setAttribute('data-flip-element','target');
  const info=home.querySelector(':scope > .mini-showreel__info');
  if(info)root.querySelector('.mini-showreel__card').appendChild(info);
}
const hero=root.closest('.case-media');
if(hero){
 const source=hero.querySelector(':scope > .case-media__inner video');
 const url=source&&(source.getAttribute('data-src')||source.getAttribute('src')||source.querySelector('source')?.getAttribute('src'));
 if(url){
  root.querySelector('[data-bunny-player-init]').setAttribute('data-player-src',url);
  const preview=root.querySelector('.mini-showreel__cover-image');
  const poster=source.getAttribute('poster')||'';
  if(preview){
   if(poster)preview.setAttribute('poster',poster);else preview.removeAttribute('poster');
   preview.removeAttribute('data-src');preview.setAttribute('data-video-ignore','');
   preview.muted=true;preview.loop=true;preview.playsInline=true;
   if(preview.getAttribute('src')!==url){preview.src=url;preview.load();}
   preview.play().catch(()=>{});
  }
  root.querySelectorAll('.bunny-player__placeholder').forEach(el=>{
   if(el===preview)return;
   if(el.tagName==='VIDEO'){if(poster)el.poster=poster;else el.removeAttribute('poster');}
   else if(el.tagName==='IMG'){if(poster)el.src=poster;else el.removeAttribute('src');el.removeAttribute('srcset');}
  });
  source.setAttribute('data-video-ignore','');source.pause();source.closest('.case-media__inner').style.visibility='hidden';
 }
}
const oldName=root.getAttribute('data-mini-showreel-player');
const lb=(owner||page).querySelector('[data-mini-showreel-lightbox="'+oldName+'"]')||(owner&&owner.querySelector('[data-mini-showreel-lightbox]'));
if(!lb)return;
const name='project-lightbox-'+(++mountOne.serial);
root.setAttribute('data-mini-showreel-player',name);lb.setAttribute('data-mini-showreel-lightbox',name);
root.querySelectorAll('[data-mini-showreel-open]').forEach(el=>{el.setAttribute('data-mini-showreel-open',name);el.setAttribute('aria-label',hero?'View full screen':'Play video');});
if(!hero){const svg=root.querySelector('.bunny-player__play-svg');const trigger=root.querySelector('[data-mini-showreel-open]');if(svg&&trigger&&!trigger.querySelector('.jk-play-icon')){const icon=svg.cloneNode(true);icon.setAttribute('class','jk-play-icon');icon.setAttribute('aria-hidden','true');root.querySelector('.mini-showreel__card').append(icon);}}
root.querySelectorAll('[data-mini-showreel-close]').forEach(el=>{el.setAttribute('aria-label','Back');el.setAttribute('data-jk-back','');});
root.querySelectorAll('[data-mini-showreel-open]').forEach(el=>{
 if(!el.matches('a,button')){el.setAttribute('role','button');el.tabIndex=0;}
 el.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!el.matches('a,button')){e.preventDefault();el.click();}},{signal:abort.signal});
});
const queryAll=sel=>[...new Set([root,...root.querySelectorAll(sel),lb,...lb.querySelectorAll(sel)].filter(el=>el.matches(sel)))];
function eventProxy(target){return new Proxy(target,{get(t,k){if(t===nativeWindow.document&&k==='querySelector')return sel=>queryAll(sel)[0]||null;if(t===nativeWindow.document&&k==='querySelectorAll')return queryAll;if(k==='addEventListener')return(type,fn,options)=>t.addEventListener(type,fn,{...(typeof options==='boolean'?{capture:options}:options),signal:abort.signal});const value=Reflect.get(t,k,t);return typeof value==='function'&&(t===nativeWindow.document||k==='removeEventListener')?value.bind(t):value;}});}
const window=eventProxy(nativeWindow),document=eventProxy(nativeWindow.document);


function initBunnyPlayer() {
  document.querySelectorAll('[data-bunny-player-init]').forEach(function(player) {
    var src = player.getAttribute('data-player-src');
    if (!src) return;

    var video = player.querySelector('video');
    if (!video) return;

    try { video.pause(); } catch(_) {}
    try { video.removeAttribute('src'); video.load(); } catch(_) {}
    function setStatus(s) {
      if (player.getAttribute('data-player-status') !== s) {
        player.setAttribute('data-player-status', s);
      }
    }
    function setMutedState(v) {
      video.muted = !!v;
      player.setAttribute('data-player-muted', video.muted ? 'true' : 'false');
    }
    function setFsAttr(v) { player.setAttribute('data-player-fullscreen', v ? 'true' : 'false'); }
    function setActivated(v) { player.setAttribute('data-player-activated', v ? 'true' : 'false'); }
    if (!player.hasAttribute('data-player-activated')) setActivated(false);
    var timeline = player.querySelector('[data-player-timeline]');
    var progressBar = player.querySelector('[data-player-progress]');
    var bufferedBar = player.querySelector('[data-player-buffered]');
    var handle = player.querySelector('[data-player-timeline-handle]');
    var timeDurationEls = player.querySelectorAll('[data-player-time-duration]');
    var timeProgressEls = player.querySelectorAll('[data-player-time-progress]');
    var updateSize = player.getAttribute('data-player-update-size'); // "true" | "cover" | null
    var lazyMode = player.getAttribute('data-player-lazy'); // "true" | "meta" | null
    var isLazyTrue = lazyMode === 'true';
    var isLazyMeta = lazyMode === 'meta';
    var autoplay = player.getAttribute('data-player-autoplay') === 'true';
    var initialMuted = player.getAttribute('data-player-muted') === 'true';
    var pendingPlay = false;
    if (autoplay) { setMutedState(true); video.loop = true; } else { setMutedState(initialMuted); }

    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.playsInline = true;
    if (typeof video.disableRemotePlayback !== 'undefined') video.disableRemotePlayback = true;
    if (autoplay) video.autoplay = false;

    var canPlayNativeHls = !!video.canPlayType('application/vnd.apple.mpegurl');
    var isHlsSource = /\.m3u8(?:[?#]|$)/i.test(src);
    var preferNativeHls = isHlsSource && canPlayNativeHls && 'ManagedMediaSource' in window;
    var canUseHlsJs = isHlsSource && !!(window.Hls && Hls.isSupported()) && !preferNativeHls;
    if (updateSize === 'true' && !isLazyMeta) {
      if (isLazyTrue) {
      } else {
        var prev = video.preload;
        video.preload = 'metadata';
        var onMeta2 = function() {
          setBeforeRatio(player, updateSize, video.videoWidth, video.videoHeight);
          video.removeEventListener('loadedmetadata', onMeta2);
          video.preload = prev || '';
        };
        video.addEventListener('loadedmetadata', onMeta2, { once: true });
        video.src = src;
      }
    }
    function fetchMetaOnce() {
      getSourceMeta(src, canUseHlsJs).then(function(meta){
        if (meta.width && meta.height) setBeforeRatio(player, updateSize, meta.width, meta.height);
        if (timeDurationEls.length && isFinite(meta.duration) && meta.duration > 0) {
          setText(timeDurationEls, formatTime(meta.duration));
        }
        readyIfIdle(player, pendingPlay);
      });
    }
    var isAttached = false;
    var userInteracted = false;
    var lastPauseBy = '';
    function attachMediaOnce() {
      if (isAttached) return;
      isAttached = true;

      if (player._hls) { try { player._hls.destroy(); } catch(_) {} player._hls = null; }

      if (preferNativeHls) {
        video.preload = (isLazyTrue || isLazyMeta) ? 'auto' : video.preload;
        video.src = src;
        video.addEventListener('loadedmetadata', function() {
          readyIfIdle(player, pendingPlay);
          if (updateSize === 'true') setBeforeRatio(player, updateSize, video.videoWidth, video.videoHeight);
          if (timeDurationEls.length) setText(timeDurationEls, formatTime(video.duration));
        }, { once: true });
      } else if (canUseHlsJs) {
        var hls = new Hls({ maxBufferLength: 10 });
        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, function() { hls.loadSource(src); });
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
          readyIfIdle(player, pendingPlay);
          if (updateSize === 'true') {
            var lvls = hls.levels || [];
            var best = bestLevel(lvls);
            if (best && best.width && best.height) setBeforeRatio(player, updateSize, best.width, best.height);
          }
        });
        hls.on(Hls.Events.LEVEL_LOADED, function(e, data) {
          if (data && data.details && isFinite(data.details.totalduration)) {
            if (timeDurationEls.length) setText(timeDurationEls, formatTime(data.details.totalduration));
          }
        });
        player._hls = hls;
      } else {
        video.src = src;
      }
    }
    if (isLazyMeta) {
      fetchMetaOnce();
      video.preload = 'none';
    } else if (isLazyTrue) {
      video.preload = 'none';
    } else {
      attachMediaOnce();
    }
    function togglePlay() {
      userInteracted = true;
      if (video.paused || video.ended) {
        if ((isLazyTrue || isLazyMeta) && !isAttached) attachMediaOnce();
        pendingPlay = true;
        lastPauseBy = '';
        setStatus('loading');
        safePlay(video);
      } else {
        lastPauseBy = 'manual';
        video.pause();
      }
    }
    function toggleMute() {
      video.muted = !video.muted;
      player.setAttribute('data-player-muted', video.muted ? 'true' : 'false');
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
    function toggleFullscreen() { if (isFsActive() || video.webkitDisplayingFullscreen) exitFullscreen(); else enterFullscreen(); }
    document.addEventListener('fullscreenchange', function() { setFsAttr(isFsActive()); });
    document.addEventListener('webkitfullscreenchange', function() { setFsAttr(isFsActive()); });
    video.addEventListener('webkitbeginfullscreen', function() { setFsAttr(true); });
    video.addEventListener('webkitendfullscreen', function() { setFsAttr(false); });
    player.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-player-control]');
      if (!btn || !player.contains(btn)) {
        if (!e.target.closest('.bunny-player__interface-bottom,[data-player-timeline],input,button,a')) togglePlay();
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
      }
      timeline.addEventListener('pointerdown', onPointerDown, { passive: false });
      if (handle) handle.addEventListener('pointerdown', onPointerDown, { passive: false });
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

          if (inView) {
            if ((isLazyTrue || isLazyMeta) && !isAttached) attachMediaOnce();

            if (video.paused) {
              lastPauseBy = '';
              pendingPlay = true;
              setStatus('loading');
              safePlay(video);
            } else {
              setStatus('playing');
            }
          } else {
            if (!video.paused && !video.ended) {
              lastPauseBy = 'io';
              video.pause();
              setStatus('paused'); // keep UI honest while out of view
            }
          }
        });
      }, { threshold: 0.1 });

      io.observe(player);
    }
  });
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) return '00:00';
    var s = Math.floor(sec), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    return h > 0 ? (h + ':' + pad2(m) + ':' + pad2(r)) : (pad2(m) + ':' + pad2(r));
  }
  function setText(nodes, text) { nodes.forEach(function(n){ n.textContent = text; }); }
  function bestLevel(levels) {
    if (!levels || !levels.length) return null;
    return levels.reduce(function(a, b) { return ((b.width||0) > (a.width||0)) ? b : a; }, levels[0]);
  }
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
  function resolveUrl(base, rel) { try { return new URL(rel, base).toString(); } catch(_) { return rel; } }
  function getSourceMeta(src, useHlsJs) {
    return new Promise(function(resolve) {
      if (useHlsJs && window.Hls && Hls.isSupported()) {
        try {
          var tmp = new Hls();
          var out = { width: 0, height: 0, duration: NaN };
          var haveLvls = false, haveDur = false;

          tmp.on(Hls.Events.MANIFEST_PARSED, function(e, data) {
            var lvls = (data && data.levels) || tmp.levels || [];
            var best = bestLevel(lvls);
            if (best && best.width && best.height) { out.width = best.width; out.height = best.height; haveLvls = true; }
          });
          tmp.on(Hls.Events.LEVEL_LOADED, function(e, data) {
            if (data && data.details && isFinite(data.details.totalduration)) { out.duration = data.details.totalduration; haveDur = true; }
          });
          tmp.on(Hls.Events.ERROR, function(){ try { tmp.destroy(); } catch(_) {} resolve(out); });
          tmp.on(Hls.Events.LEVEL_LOADED, function(){ try { tmp.destroy(); } catch(_) {} resolve(out); });

          tmp.loadSource(src);
          return;
        } catch(_) {
          resolve({ width:0, height:0, duration:NaN });
          return;
        }
      }

      function parseMaster(masterText) {
        var lines = masterText.split(/\r?\n/);
        var bestW = 0, bestH = 0, firstMedia = null, lastInf = null;
        for (var i=0;i<lines.length;i++) {
          var line = lines[i];
          if (line.indexOf('#EXT-X-STREAM-INF:') === 0) {
            lastInf = line;
          } else if (lastInf && line && line[0] !== '#') {
            if (!firstMedia) firstMedia = line.trim();
            var m = /RESOLUTION=(\d+)x(\d+)/.exec(lastInf);
            if (m) {
              var w = parseInt(m[1],10), h = parseInt(m[2],10);
              if (w > bestW) { bestW = w; bestH = h; }
            }
            lastInf = null;
          }
        }
        return { bestW: bestW, bestH: bestH, media: firstMedia };
      }
      function sumDuration(mediaText) {
        var dur = 0, re = /#EXTINF:([\d.]+)/g, m;
        while ((m = re.exec(mediaText))) dur += parseFloat(m[1]);
        return dur;
      }

      fetch(src, { credentials: 'omit', cache: 'no-store' }).then(function(r){
        if (!r.ok) throw new Error('master');
        return r.text();
      }).then(function(master){
        var info = parseMaster(master);
        if (!info.media) { resolve({ width: info.bestW||0, height: info.bestH||0, duration: NaN }); return; }
        var mediaUrl = resolveUrl(src, info.media);
        return fetch(mediaUrl, { credentials: 'omit', cache: 'no-store' }).then(function(r){
          if (!r.ok) throw new Error('media');
          return r.text();
        }).then(function(mediaText){
          resolve({ width: info.bestW||0, height: info.bestH||0, duration: sumDuration(mediaText) });
        });
      }).catch(function(){ resolve({ width:0, height:0, duration:NaN }); });
    });
  }
}




function initMiniShowreelPlayer() {
  const openBtns = document.querySelectorAll("[data-mini-showreel-open]");
  if (!openBtns.length) return;
  var duration = parseFloat(getComputedStyle(nativeWindow.document.documentElement).getPropertyValue("--motion-lightbox-duration")) || 1;
  var ease = getComputedStyle(nativeWindow.document.documentElement).getPropertyValue("--motion-lightbox-ease").trim() || "expo.inOut";
  var zIndex = 999;

  let n = "", isOpen = false;
  let lb, pw, tg;
  let pwCss = "", lbZ = "", pwZ = "";
  let backdrop, closeControl, closing=false;
  const raised=[];
  function releaseLayers(){
    raised.splice(0).forEach(([el,z,pos])=>{el.style.zIndex=z;el.style.position=pos;});
    backdrop?.remove();closeControl?.remove();backdrop=closeControl=null;
  }
  function showLayers(){
    const host=root.closest('.main-wrapper')||page;
    for(let el=root.parentElement;el&&el!==host&&el!==page;el=el.parentElement){
      raised.push([el,el.style.zIndex,el.style.position]);
      if(getComputedStyle(el).position==='static')el.style.position='relative';
      el.style.zIndex='1001';
    }
    if(matchMedia('(max-width:991px), (pointer:coarse)').matches){
      closeControl=nativeWindow.document.createElement('button');closeControl.className='lightbox-close';
      closeControl.type='button';closeControl.textContent='Close ×';closeControl.setAttribute('aria-label','Close video');
      nativeWindow.document.body.append(closeControl);
      closeControl.addEventListener('click',()=>closeBy(''),{signal:abort.signal});
      closeControl.focus({preventScroll:true});
    }

  }

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

  const rectFor = () => ({left:0,top:0,width:nativeWindow.document.documentElement.clientWidth,height:nativeWindow.visualViewport?.height||innerHeight});

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

    try { video.play(); } catch(_) {}
  }

  function stopFor(name) {
    const wrap = getPW(name);
    if (!wrap) return;

    const bunny = wrap.querySelector("[data-bunny-player-init]");
    const video = bunny ? bunny.querySelector("video") : wrap.querySelector("video");
    if (!video) return;

    if (bunny) {
      const btn = bunny.querySelector('[data-player-control="pause"], [data-player-control="playpause"]');
      if (btn && (!video.paused && !video.ended)) btn.click();
    } else {
      try { video.pause(); } catch(_) {}
    }

    setTimeout(function () { try { video.currentTime = 0; } catch(_) {} }, 400);
  }

  function openBy(name) {
    if (!name || isOpen) return;

    lb = getLB(name);
    pw = getPW(name);
    if (!lb || !pw) return;

    tg = q("[data-mini-showreel-target]", lb);
    if (!tg) return;

    n = name;
    isOpen = true;
    if (typeof lenis !== "undefined") lenis?.stop();
    nativeWindow.JKHomeScroll?.suspend(root);

    pw.dataset.flipId = n;
    pwCss = pw.style.cssText || "";

    zOn();
    showLayers();
    root.dataset.lightboxPhase='opening';
    setStatus("active");
    playFor(n);
    const state = Flip.getState(pw);
    place(pw, rectFor(tg));

    Flip.from(state, {
      duration: duration,
      ease: ease,
      absolute: true,
      scale: false,
      onComplete:()=>{if(isOpen)root.dataset.lightboxPhase='open';}
    });
  }

  function closeBy(nameOrEmpty) {
    if (!isOpen || !pw || closing) return;
    if (nameOrEmpty && nameOrEmpty !== n) return;
    closing=true;

    if(closeControl)closeControl.style.pointerEvents='none';
    root.dataset.lightboxPhase='closing';
    stopFor(n);
    const state = Flip.getState(pw);
    setStatus("not-active");

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
        releaseLayers();closing=false;
        n = "";
        isOpen = false;
        root.dataset.lightboxPhase='closed';
        lb = pw = tg = null;
        pwCss = "";
        lbZ = "";
        pwZ = "";
        nativeWindow.JKHomeScroll?.resume(root);
        openBtns[0]?.focus({preventScroll:true});
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
      openBy(btn.getAttribute("data-mini-showreel-open") || "");
    });
  });

  document.querySelectorAll("[data-mini-showreel-close]").forEach(closeBtn => closeBtn.addEventListener("click", (e) => {
    e.preventDefault(); e.stopPropagation();
    closeBy(closeBtn.getAttribute("data-mini-showreel-close") || "");
  }, true));

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeBy("");
    if(e.key==='Tab'&&isOpen&&!closing){
      const controls=[...pw.querySelectorAll('button,a[href],input,[tabindex="0"]'),closeControl].filter(el=>el&&el.getClientRects().length);
      const first=controls[0],last=controls[controls.length-1];
      if(e.shiftKey&&nativeWindow.document.activeElement===first){e.preventDefault();last?.focus();}
      else if(!e.shiftKey&&nativeWindow.document.activeElement===last){e.preventDefault();first?.focus();}
    }
  });

  abort.signal.addEventListener('abort',()=>{
    if(pw){Flip.killFlipsOf(pw);pw.style.cssText=pwCss;}
    releaseLayers();
    if(isOpen&&!nativeWindow.document.documentElement.hasAttribute('data-transitioning')){if(typeof lenis!=='undefined')lenis?.start();}
  },{once:true});

  window.addEventListener("resize", onResize);
  nativeWindow.visualViewport?.addEventListener("resize",onResize,{signal:abort.signal});
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

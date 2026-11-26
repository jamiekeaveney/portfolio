/* Muted previews share viewport, hover and keyboard playback policies. */
(() => {
  const states = new WeakMap();
  function init(page) {
    if (!page || states.has(page)) return;
    const abort = new AbortController();
    const options = {signal: abort.signal};
    const entries = new Map();
    const motion = matchMedia('(prefers-reduced-motion: reduce)');

    const dataPreference = matchMedia('(prefers-reduced-data: reduce)');
    const connection = navigator.connection;

    function wanted(video, entry) {
      if (!video.isConnected || document.hidden || motion.matches || dataPreference.matches || connection?.saveData || !entry.visible) return false;
      if (video.closest('[data-video-ignore],[role="dialog"]')) return false;
      const mode = video.dataset.videoMode || 'viewport';
      if (mode.includes('active') && !video.closest('.is-active,[data-work-state="active"]')) return false;
      if (!mode.includes('hover')) return true;
      const list = video.closest('[data-work-list-media]');
      if (list && list.dataset.workState !== 'active') return false;
      return entry.host.matches(':hover') || entry.host.contains(document.activeElement);
    }
    function sync(video, entry) {
      const play = wanted(video, entry);
      if (!play && video.dataset.previewSource && video.hasAttribute('src') &&
          (motion.matches || dataPreference.matches || connection?.saveData)) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
      if (play === entry.playing) return;
      entry.playing = play;
      const revision = ++entry.revision;
      if (!play) { video.pause(); return; }
      const mobilePreview = video.dataset.previewSource && matchMedia('(max-width: 767px)').matches
        ? video.closest('[data-preview-small]')?.dataset.previewSmall : '';
      const source = mobilePreview || video.dataset.previewSource || portfolioPreviewSource(video);
      if (!video.getAttribute('src') && source) {
        video.src = source;
        video.load();
      }
      const ready = () => {
        if (!abort.signal.aborted && entry.revision === revision && entry.playing) {
          if (video.parentElement?.classList.contains('media_preview')) video.setAttribute('data-preview-frame', '');
          video.closest('.home_card_thumbnail,.work_card_poster')?.style.setProperty('--project-video-ready', '1');
        }
      };
      video.play().then(() => {
        if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(ready);
        else if (video.readyState >= 2) ready();
      }).catch(() => { if (entry.revision === revision) entry.playing = false; });
    }
    const update = () => entries.forEach((entry, video) => sync(video, entry));
    const observer = new IntersectionObserver(changes => {
      changes.forEach(({target, isIntersecting, intersectionRect}) => {
        const entry = entries.get(target);
        if (!entry) return;
        entry.visible = isIntersecting && intersectionRect.width > 0 && intersectionRect.height > 0;
        sync(target, entry);
      });
    }, {threshold: [0, .01]});
    function register(video) {
      if (entries.has(video) || video.controls || video.closest('.case_index_card,[data-video-ignore],[data-bunny-player-init],[role="dialog"]')) return;
      if (!(video.muted || video.hasAttribute('muted') || video.closest('[data-video="playpause"]'))) return;
      const host = video.closest('.work_list_center') || video.closest('.work_card_thumb,.home_card_visual') || video.parentElement;
      video.autoplay = false;
      entries.set(video, {host, visible:false, playing:undefined, revision:0});
      observer.observe(video);
    }
    function visitVideos(node, visit) {
      if (node.nodeType !== 1) return;
      if (node.matches('video')) visit(node);
      else if (node.childElementCount) node.querySelectorAll('video').forEach(visit);
    }
    const mutations = new MutationObserver(records => {
      let stateChanged = false;
      for (const record of records) {
        if (record.type === 'attributes') {
          if (record.attributeName === 'role' && record.oldValue !== 'dialog' && record.target.getAttribute('role') !== 'dialog') continue;
          if (record.attributeName !== 'class' ||
              record.target.classList.contains('is-active') !== (record.oldValue || '').split(/\s+/).includes('is-active')) stateChanged = true;
          continue;
        }
        record.removedNodes.forEach(node => visitVideos(node, video => {
          if (page.contains(video)) return;
          const entry = entries.get(video);
          if (!entry) return;
          entry.revision++;
          video.pause();
          observer.unobserve(video);
          entries.delete(video);
        }));
        record.addedNodes.forEach(node => visitVideos(node, video => { if (page.contains(video)) register(video); }));
      }
      if (stateChanged) update();
    });
    mutations.observe(page, {subtree:true, childList:true, attributes:true, attributeOldValue:true, attributeFilter:['data-work-state','class','data-video-mode','data-video-ignore','role']});
    for (const event of ['pointerover','pointerout','focusin','focusout']) {
      page.addEventListener(event, e => {
        entries.forEach((entry, video) => {
          if (!entry.visible || (!entry.host.contains(e.target) && !(e.relatedTarget instanceof Node && entry.host.contains(e.relatedTarget)))) return;
          queueMicrotask(() => { if (!abort.signal.aborted) sync(video, entry); });
        });
      }, options);
    }
    motion.addEventListener('change', update, options);
    dataPreference.addEventListener('change', update, options);
    connection?.addEventListener('change', update, options);
    document.addEventListener('visibilitychange', update, options);
    page.querySelectorAll('video').forEach(register);
    states.set(page, () => {
      abort.abort();
      observer.disconnect();
      mutations.disconnect();
      entries.forEach((entry, video) => video.pause());
      states.delete(page);
    });
  }
  function boot() {
    init(document.querySelector('[data-barba="container"]') || document.body);
    if (!window.barba) return;
    barba.hooks.beforeLeave(d => states.get(d.current.container)?.());
    barba.hooks.afterOnce(d => init(d.next.container));
    barba.hooks.afterEnter(d => init(d.next.container));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();

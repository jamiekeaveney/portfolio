// CMS images stay responsive in the Designer. Film requests start on playback intent.
function portfolioPreviewSource(video) {
  if (!video) return '';
  const explicit = video.getAttribute('data-src') || video.getAttribute('src');
  if (explicit) return explicit;
  const slug = video.dataset.mediaSlug;
  if (!slug) return video.querySelector('source')?.getAttribute('src') || '';
  const project = video.dataset.mediaProject;
  const folder = project ? 'projects/' + encodeURIComponent(project) : 'services';
  return 'https://jamie-keaveney-portfolio-videos.b-cdn.net/' + folder + '/' + encodeURIComponent(slug) + '.mp4';
}
function portfolioPreviewPoster(video) {
  if (!video) return '';
  const image = video.parentElement?.querySelector('.media_preview_poster');
  return video.getAttribute('poster') || image?.currentSrc || image?.getAttribute('src') || '';
}

// Keep native playback synchronous with the activating gesture. Only HLS browsers
// that need MediaSource download the player adapter.
let hlsLibrary;
function createPortfolioPlayback(video, url, signal) {
  let hls, loading, requested = false;
  const needsHls = /\.m3u8(?:[?#]|$)/i.test(url) && !video.canPlayType('application/vnd.apple.mpegurl');
  function reset() {
    hls?.destroy();
    hls = null;
    loading = null;
    if (video.hasAttribute('src')) {
      video.removeAttribute('src');
      video.load();
    }
  }
  signal.addEventListener('abort', () => { requested = false; video.pause(); reset(); }, { once: true });
  function attach() {
    if (!needsHls) {
      if (video.getAttribute('src') !== url) video.src = url;
      return;
    }
    if (!window.MediaSource && !window.ManagedMediaSource) throw new Error('HLS playback is unavailable');
    if (hls) return;
    if (!hlsLibrary) {
      hlsLibrary = import('https://cdn.jsdelivr.net/npm/hls.js@1.7.4/dist/hls.light.min.mjs')
        .then(module => module.default)
        .catch(error => { hlsLibrary = null; throw error; });
    }
    if (!loading) loading = hlsLibrary.then(Hls => {
      if (signal.aborted || !requested) return;
      if (!Hls.isSupported()) throw new Error('HLS playback is unavailable');
      hls = new Hls({ maxBufferLength: 10 });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) return;
        reset();
        video.dispatchEvent(new Event('error'));
      });
      hls.loadSource(url);
      hls.attachMedia(video);
    }).finally(() => { loading = null; });
    return loading;
  }
  return {
    async play() {
      requested = true;
      const ready = attach();
      if (ready) await ready;
      if (requested && !signal.aborted) await video.play();
    },
    pause() { requested = false; video.pause(); }
  };
}

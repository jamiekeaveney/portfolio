const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = {window: {}};
vm.runInNewContext(fs.readFileSync('assets/js/core/video-playback.js', 'utf8'), context);

function video(canPlayHls) {
  return {
    src:'', playing:false, loads:0,
    canPlayType: () => canPlayHls ? 'maybe' : '',
    hasAttribute(name) { return !!this[name]; },
    getAttribute(name) { return this[name]; },
    removeAttribute(name) { delete this[name]; },
    load() { this.loads++; },
    play() { this.playing = true; return Promise.resolve(); },
    pause() { this.playing = false; }
  };
}
(async () => {
  for (const [url, nativeHls] of [['case.mp4', false], ['showreel.m3u8', true]]) {
    const el = video(nativeHls), controller = new AbortController();
    const playback = context.createPortfolioPlayback(el, url, controller.signal);
    assert.equal(el.src, '', 'Mounting a full player must leave its stream unrequested');
    const started = playback.play();
    assert.equal(el.playing, true, 'Native playback must run within the activating gesture');
    await started;
    assert.equal(el.src, url);
    playback.pause();
    assert.equal(el.playing, false);
    await playback.play();
    controller.abort();
    assert.equal(el.playing, false);
    assert.equal(el.hasAttribute('src'), false, 'Route teardown releases the full source');
    assert.equal(el.loads, 1);
  }
  const unsupported = video(false);
  const playback = context.createPortfolioPlayback(unsupported, 'showreel.m3u8', new AbortController().signal);
  await assert.rejects(playback.play(), /HLS playback is unavailable/);
  assert.equal(unsupported.src, '');
  console.log('Demand-loaded native media, gesture playback and route teardown passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });

// A pinned section can put the footer on screen outside ScrollTrigger's previous
// scroll range. Visibility, loader release and route teardown own loop playback.
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
let intersect, paused, disconnected = false, loader = true, triggerOptions;
const listeners = {}, hooks = {};
const item = {getBoundingClientRect: () => ({width:1200}), cloneNode: () => ({
  setAttribute(){}, removeAttribute(){}, querySelectorAll:() => []
})};
const track = {offsetWidth:1100, style:{}, querySelector:() => item, querySelectorAll:() => [], appendChild(){}};
const root = {dataset:{marqueeStart:'entry'}, querySelector:() => track};
const doc = {
  readyState:'complete', hidden:false, documentElement:{hasAttribute:() => loader},
  querySelectorAll:() => [root], addEventListener:(name, fn) => listeners[name] = fn, removeEventListener(){}
};
const tween = {
  totalTime(){return this;}, timeScale(){return this;}, paused(value){paused = value;}, pause(){paused = true;}, kill(){}
};
const ScrollTrigger = {create(opts){triggerOptions = opts;return {isActive:false,kill(){}};}};
const gsap = {registerPlugin(){}, set(){}, fromTo:() => tween};
const barba = {hooks:new Proxy({}, {get:(_, key) => fn => hooks[key] = fn})};
vm.runInNewContext(fs.readFileSync('assets/js/features/marquees.js', 'utf8'), {
  window:{gsap,ScrollTrigger,barba,scrollY:0,addEventListener(){},removeEventListener(){}},
  document:doc, gsap, ScrollTrigger, barba, innerWidth:1440, clearTimeout(){},
  matchMedia:() => ({matches:false,addEventListener(){},removeEventListener(){}}),
  IntersectionObserver:class {constructor(fn){intersect=fn;}observe(){}disconnect(){disconnected=true;}}
});
const visible = yes => intersect([{isIntersecting:yes,intersectionRect:{height:yes ? 250 : 0}}]);
assert.equal(triggerOptions.refreshPriority, -1, 'Editorial pin layout must be measured before the marquee scrub');
visible(true);
assert.equal(paused, true, 'Loader holds an intersecting marquee');
loader = false;
listeners['jk:loader-finished']();
assert.equal(paused, false, 'Actual intersection plays even outside a previously measured pin range');
visible(false);
assert.equal(paused, true);
visible(true);
doc.hidden=true;
listeners.visibilitychange();
assert.equal(paused, true);
doc.hidden=false;
listeners.visibilitychange();
assert.equal(paused, false);
hooks.beforeLeave({current:{container:{contains:() => true}}});
assert.equal(disconnected, true);
assert.equal(paused, true);
console.log('Marquee intersection, pin ordering, loader and navigation cleanup passed.');

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Exercise the shared response rather than two copies of its tuning values.
const scrollContext = {window: {}};
vm.runInNewContext(fs.readFileSync('assets/js/core/scroll-media-motion.js', 'utf8'), scrollContext);
const scrollMotion = scrollContext.window.JKScrollMediaMotion;
let positive = 0, negative = 0;
for (let frame = 0; frame < 180; frame++) {
  positive = scrollMotion.approach(positive, 10000, 1000 / 60);
  negative = scrollMotion.approach(negative, -10000, 1000 / 60);
  assert.ok(positive <= scrollMotion.settings.maximumDegrees);
  assert.equal(negative, -positive, 'Up/down scroll have the same strength');
}
assert.ok(positive > 31.99);
for (let frame = 0; frame < 180; frame++) positive = scrollMotion.approach(positive, 0, 1000 / 60);
assert.ok(positive < .001, 'The media settles at rest instead of holding a distorted pose');
assert.equal(scrollMotion.transform(10), 'perspective(43.75rem) rotateX(-6deg) rotateY(10deg)');

// Run the actual title-flight controller. Its body-level words must track the
// navigation fade while their geometry tween is still unfinished.
const navigation = fs.readFileSync('assets/js/features/project-navigation.js', 'utf8');
const titleController = navigation.slice(navigation.indexOf('  function bindTitle('), navigation.indexOf('  function mount('));
const nodes = [], events = new Map(), tickers = new Set(), flights = new WeakMap();
const nav = {style: {opacity: '1', visibility: 'visible', display: 'block'}};
const hero = {style: {}, textContent: 'Project title', rect: {left: 100, top: 100, width: 400, height: 80}};
const title = {style: {}, textContent: 'Project title', rect: {left: 100, top: 700, width: 150, height: 20}, closest: selector => selector === '[data-case-nav]' ? nav : null};
const slash = {style: {}};
const page = {querySelector: () => hero};
let activeTween;
const titleContext = {
  page, title, slash, flights,
  matchMedia: () => ({matches: true}),
  NodeFilter: {SHOW_TEXT: 4},
  getComputedStyle: element => ({fontSize: element === hero ? '80px' : '20px', fontFamily: 'Delight', fontWeight: '500', letterSpacing: '0px', ...element.style}),
  window: {addEventListener() {}, removeEventListener() {}},
  document: {
    querySelector: () => ({dataset: {navCompact: 'false'}}),
    documentElement: {hasAttribute: () => false},
    addEventListener: (name, callback) => events.set(name, callback),
    removeEventListener: name => events.delete(name),
    body: {append: node => nodes.push(node)},
    createElement: () => ({style: {}, setAttribute() {}, remove() { nodes.splice(nodes.indexOf(this), 1); }}),
    createTreeWalker(element) {
      let read = false;
      return {currentNode: {data: element.textContent, element}, nextNode() { if (read) return false; read = true; return true; }};
    },
    createRange() {
      let node, start = 0, end = 0;
      return {
        setStart(value, index) { node = value; start = index; },
        setEnd(value, index) { node = value; end = index; },
        selectNodeContents(value) { node = {element: value}; },
        toString() { return node.data.slice(start, end); },
        getBoundingClientRect() { return node.element.rect || {left: 0, top: 0, width: 100, height: 20}; }
      };
    }
  },
  gsap: {
    ticker: {add: fn => tickers.add(fn), remove: fn => tickers.delete(fn)},
    killTweensOf() {},
    set: (node, props) => Object.assign(node.style, props),
    to(target, props) {
      const tween = {kill() {}};
      if ('p' in props) activeTween = {target, props, tween};
      return tween;
    }
  }
};
vm.runInNewContext(titleController + '\nbindTitle(page, title, slash);', titleContext);
function changeTitle(compact) {
  events.get('jk:nav-layout')({detail: {compact, duration: .95, fadeDuration: .3, ease: 'expo.out'}});
}
changeTitle(true);
assert.equal(nodes.length, 2);
assert.equal(tickers.size, 1);
activeTween.target.p = .35;
activeTween.props.onUpdate();
nav.style.opacity = '.4';
tickers.forEach(tick => tick());
assert.ok(nodes.every(node => node.style.opacity === '.4'), 'Mid-flight words share the current nav fade');
nav.style.opacity = '0';
nav.style.visibility = 'hidden';
tickers.forEach(tick => tick());
assert.ok(nodes.every(node => node.style.opacity === '0'), 'A fast scroll hides words before the FLIP finishes');
assert.equal(activeTween.target.p, .35, 'Visibility does not fast-forward or restart the movement');
nav.style.opacity = '1';
nav.style.visibility = 'visible';
changeTitle(false);
assert.equal(nodes.length, 2, 'A reversed flight replaces its old pieces');
assert.equal(tickers.size, 1, 'An interrupted flight has only one visibility owner');
activeTween.props.onComplete();
assert.equal(nodes.length, 0);
assert.equal(tickers.size, 0);
flights.get(page)();
assert.equal(events.size, 0, 'Leaving the page removes the title controller');

// Run the real transition wrapper with compact/desktop media queries. A compact
// project-card navigation must invoke the original parallax functions without
// creating a media snapshot or marking the destination for a handoff.
const mediaSource = fs.readFileSync('assets/js/features/media-transitions.js', 'utf8');
function transitionFixture(desktop) {
  const hooks = {before: [], after: []}, store = new Map(), calls = [];
  let clones = 0;
  class Link {
    constructor() { this.dataset = {}; this.parentElement = null; }
    closest(selector) { return selector === 'a' ? this : null; }
    matches() { return true; }
    querySelector(selector) { return selector === '[data-next-media]' ? this : null; }
    querySelectorAll() { return []; }
    getBoundingClientRect() { return {left: 100, top: 100, width: 320, height: 180}; }
    cloneNode() { clones++; return {}; }
  }
  const current = {matches: () => false, querySelector: () => null, querySelectorAll: () => []};
  const next = {dataset: {}, matches: () => true};
  const barba = {hooks: {
    before: fn => hooks.before.push(fn),
    after: fn => hooks.after.push(fn)
  }};
  const window = {
    barba,
    freezeContainer: () => calls.push('freeze'),
    runPageLeaveAnimation: () => { calls.push('parallax-leave'); return 'leave'; },
    runPageEnterAnimation: () => { calls.push('parallax-enter'); return 'enter'; }
  };
  const context = {
    window, barba, Element: Link,
    matchMedia: () => ({matches: desktop}),
    JKProject: {reduced: () => false, states: new WeakMap()},
    document: {readyState: 'complete', querySelector: () => null, addEventListener() {}, body: {}, documentElement: {}},
    sessionStorage: {getItem: name => store.get(name), setItem: (name, value) => store.set(name, value)},
    getSavedScroll: () => 50,
    getComputedStyle: () => ({borderTopLeftRadius: '.75rem'}),
    scrollY: 0
  };
  vm.runInNewContext(mediaSource, context);
  const data = {trigger: new Link(), current: {container: current, url: {path: '/projects', href: 'https://example.test/projects'}}, next: {container: next, url: {path: '/project/sample', href: 'https://example.test/project/sample'}}};
  hooks.before.forEach(fn => fn(data));
  if (desktop) {
    assert.equal(next.dataset.mediaHandoff, 'true');
    assert.equal(clones, 1, 'Desktop retains its media handoff');
  } else {
    assert.equal(window.runPageLeaveAnimation(current), 'leave');
    assert.equal(window.runPageEnterAnimation(next), 'enter');
    assert.deepEqual(calls, ['parallax-leave', 'parallax-enter']);
    assert.equal(clones, 0);
    assert.equal(next.dataset.mediaHandoff, undefined);
    assert.equal(JSON.parse(store.get('jk-project-origin')).path, '/projects', 'The back-link context survives without FLIP');
  }
  hooks.after.forEach(fn => fn(data));
  assert.equal(next.dataset.mediaHandoff, undefined);
}
transitionFixture(false);
transitionFixture(true);
console.log('Shared scroll motion, mid-flight title visibility and mobile parallax routing passed.');

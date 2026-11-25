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

// Exercise event-driven cursor updates with a stationary pointer, live dialog
// state and route changes. Resting pages must not request another frame.
function cursorFixture() {
  const events = () => {
    const handlers = new Map();
    return {
      addEventListener(type, fn) { if (!handlers.has(type)) handlers.set(type, []); handlers.get(type).push(fn); },
      emit(type, event = {}) { handlers.get(type)?.forEach(fn => fn(event)); }
    };
  };
  const attrs = new Set(), frames = new Map(), observers = [], hooks = {};
  const desktop = Object.assign(events(), {matches:true}), reduced = Object.assign(events(), {matches:false});
  const root = {hasAttribute: name => attrs.has(name)};
  let nextFrame = 0, label, hit = null, reads = 0, writes = 0, moves = 0, instantMoves = 0, closed = 0;
  const video = {videoWidth:1600, videoHeight:900};
  const player = {
    querySelector: () => video,
    getBoundingClientRect() { reads++; return {left:100, top:100, width:800, height:450}; }
  };
  const close = {click() { closed++; }};
  const playerRoot = {
    dataset:{miniShowreelStatus:'not-active', lightboxPhase:'closed'}, style:{cursor:'crosshair'}, isConnected:true,
    querySelector: selector => selector === '[data-bunny-player-init]' ? player : close
  };
  let currentPage = {querySelectorAll: () => [playerRoot]};
  const document = Object.assign(events(), {
    readyState:'complete', hidden:false, documentElement:root,
    body:{append(value) { label = value; }},
    querySelector: () => currentPage,
    createElement: () => ({dataset:{}, setAttribute() {}, style:new Proxy({}, {set(target, key, value) { writes++; target[key] = value; return true; }})}),
    elementFromPoint() { reads++; return hit; }
  });
  const window = Object.assign(events(), {JKProject:{}});
  const gsap = {
    quickTo() { const move = () => moves++; move.tween = {pause() {}}; return move; },
    set() { instantMoves++; },
    ticker:{add() { assert.fail('A resting cursor must not register a permanent ticker'); }}
  };
  const barba = {hooks:Object.fromEntries(['beforeLeave','afterEnter','afterOnce'].map(name => [name, fn => hooks[name] = fn]))};
  class Observer {
    constructor(fn) { this.callback = fn; this.targets = new Set(); observers.push(this); }
    observe(target) { this.targets.add(target); }
    disconnect() { this.targets.clear(); }
  }
  Object.assign(window, {gsap, barba});
  vm.runInNewContext(fs.readFileSync('assets/js/features/lightbox-cursor.js','utf8'), {
    window, document, gsap, barba, MutationObserver:Observer, ResizeObserver:Observer,
    matchMedia: query => query.includes('reduced-motion') ? reduced : desktop,
    getComputedStyle: () => ({getPropertyValue: () => '.35'}),
    requestAnimationFrame: fn => { const id = ++nextFrame; frames.set(id,fn); return id; },
    cancelAnimationFrame: id => frames.delete(id)
  });
  function flush() { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn()); }
  function mutate(target) { observers.filter(observer => observer.targets.has(target)).forEach(observer => observer.callback()); }
  const move = (x = 50, y = 50, pointerType = 'mouse') => document.emit('pointermove', {clientX:x, clientY:y, pointerType});
  flush();
  assert.equal(frames.size,0,'Initial setup settles without idle work');
  assert.equal(reads,0,'An unknown pointer does not hit-test');
  hit = {closest: () => ({})};
  for (let i = 0; i < 10; i++) move(50 + i);
  assert.equal(frames.size,1,'A burst of pointer events shares one update');
  flush();
  assert.equal(reads,1);
  assert.equal(label.style.opacity,'1');
  assert.equal(moves,2,'Only the latest pointer position starts the two easing tweens');
  assert.equal(frames.size,0,'Pointer easing does not keep the DOM scanner running');
  const settledWrites = writes, settledMoves = moves;
  window.emit('scroll'); flush();
  assert.equal(writes,settledWrites,'Unchanged visibility does not rewrite inline styles');
  assert.equal(moves,settledMoves,'Stationary scrolling does not restart cursor easing');
  hit = null; window.emit('scroll'); flush();
  assert.equal(label.style.opacity,'0','Scrolling content away hides a stationary pointer label');
  playerRoot.dataset.miniShowreelStatus = 'active'; playerRoot.dataset.lightboxPhase = 'opening';
  mutate(playerRoot); flush();
  assert.equal(label.style.opacity,'0');
  playerRoot.dataset.lightboxPhase = 'open'; mutate(playerRoot); flush();
  assert.equal(label.textContent,'Back');
  assert.equal(label.style.opacity,'1','Completing the dialog updates a stationary backdrop pointer');
  assert.equal(playerRoot.style.cursor,'pointer');
  let prevented = false;
  document.emit('click',{isTrusted:true,detail:1,clientX:59,clientY:50,target:{closest:()=>null},preventDefault(){prevented=true;},stopImmediatePropagation(){}});
  assert.equal(closed,1,'A backdrop click retains its close behaviour');
  assert.equal(prevented,true);
  playerRoot.dataset.lightboxPhase = 'closing'; playerRoot.dataset.miniShowreelStatus = 'not-active';
  hit = {closest:()=>({})}; mutate(playerRoot); flush();
  assert.equal(label.style.opacity,'0','Closing FLIP does not expose the underlying project label early');
  assert.equal(playerRoot.style.cursor,'crosshair','The original cursor style is restored');
  playerRoot.dataset.lightboxPhase = 'closed'; mutate(playerRoot); flush();
  assert.equal(label.style.opacity,'1');
  document.emit('keydown',{key:'Tab'});
  assert.equal(label.style.opacity,'0');
  assert.equal(label.dataset.pointerKnown,'false');
  move(); flush();
  document.emit('pointerdown',{pointerType:'touch'});
  document.emit('click',{isTrusted:true,detail:1,clientX:50,clientY:50,target:{closest:()=>null}}); flush();
  assert.equal(label.dataset.pointerKnown,'false','A touch-generated click does not restore a mouse cursor');
  move(); flush();
  reduced.matches = true; reduced.emit('change'); flush();
  assert.equal(instantMoves,1,'Reduced motion places the cursor immediately');
  desktop.matches = false; desktop.emit('change'); window.emit('scroll');
  assert.equal(frames.size,0,'Compact and coarse-pointer layouts do not schedule cursor work');
  desktop.matches = true; desktop.emit('change'); flush();
  move(70); document.hidden = true; document.emit('visibilitychange');
  assert.equal(frames.size,0,'Hiding the document cancels pending geometry work');
  document.hidden = false; document.emit('visibilitychange'); flush();
  move(); flush();
  hooks.beforeLeave();
  assert.equal(frames.size,0);
  assert.ok(observers.every(observer => !observer.targets.has(playerRoot)),'Route leave detaches player observers');
  currentPage = {querySelectorAll:()=>[]}; hooks.afterEnter({next:{container:currentPage}}); flush();
  assert.equal(frames.size,0);
  window.emit('pagehide');
  assert.ok(observers.every(observer => !observer.targets.size),'Page hiding disconnects all observers');
  window.emit('pageshow'); flush();
  assert.equal(frames.size,0,'Restoring from page cache remains idle');
}
cursorFixture();

// Exercise the real Lenis lifecycle: reduced motion must destroy the smooth
// scroller and remove its ticker, including when the preference changes live.
function reducedScrollFixture() {
  const source = fs.readFileSync('assets/js/core/page-transitions.js','utf8');
  const controller = source.slice(source.indexOf('const hasLenis'), source.indexOf('if (hasScrollTrigger) ScrollTrigger.config'));
  const queries = query => ({matches:query.includes('reduced-motion'), addEventListener(type, fn) { this.change = fn; }});
  const reduce = queries('reduced-motion'), desktop = queries('desktop'), ticker = new Set(), created = [];
  desktop.matches = true;
  let dialog = false, refreshes = 0;
  class Lenis {
    constructor() { created.push(this); }
    on() {}
    destroy() { this.destroyed = true; }
    stop() { this.stopped = true; }
  }
  const ScrollTrigger = {update(){}, refresh(){refreshes++;}};
  const context = vm.createContext({
    window:{Lenis,ScrollTrigger,matchMedia:()=>reduce},Lenis,ScrollTrigger,
    matchMedia:()=>desktop,performance:{getEntriesByType:()=>[]},
    document:{documentElement:{hasAttribute:()=>false},querySelector:()=>dialog},
    gsap:{ticker:{add:fn=>ticker.add(fn),remove:fn=>ticker.delete(fn),lagSmoothing(){}}}
  });
  vm.runInContext(controller + '\ninitLenis();',context);
  assert.equal(created.length,0,'Reduced motion starts with native scrolling');
  reduce.matches = false; reduce.change({matches:false});
  assert.equal(created.length,1); assert.equal(ticker.size,1);
  reduce.change({matches:false});
  assert.equal(created.length,1,'Repeated media events do not duplicate Lenis');
  reduce.matches = true; reduce.change({matches:true});
  assert.equal(created[0].destroyed,true); assert.equal(ticker.size,0);
  dialog = true; reduce.matches = false; reduce.change({matches:false});
  assert.equal(created.length,2); assert.equal(created[1].stopped,true,'Re-enabling motion respects an open lightbox');
  desktop.matches = false; desktop.change();
  assert.equal(created[1].destroyed,true); assert.equal(ticker.size,0);
  assert.ok(refreshes >= 3,'Preference changes refresh scroll geometry');
}
reducedScrollFixture();
console.log('Event-driven cursor idle, input, route and dialog handling; live reduced-motion scrolling passed.');

// Exercise the reveal integration with the actual generic headline wrappers and
// semantic headings. SplitText must leave phrasing text readable instead of
// replacing it with an aria-label on an element that cannot have a name.
function revealSemanticsFixture() {
  const elements = ['p', 'span', 'div', 'h1', 'h2'].map(tag => ({
    tag,
    dataset: {split: tag === 'h1' ? 'letters' : 'words', reveal: 'load'},
    closest: () => null,
    getClientRects: () => [{}],
    matches(selector) { return selector.split(',').includes(tag); }
  }));
  const configs = new Map();
  const SplitText = {create(el, config) { configs.set(el.tag, config); return {}; }};
  const window = {SplitText};
  const document = {documentElement: {}, readyState: 'loading', addEventListener() {}};
  const page = {dataset: {}, querySelectorAll: () => elements};
  vm.runInNewContext(fs.readFileSync('assets/js/features/text-reveals.js', 'utf8'), {
    window, document, SplitText,
    getComputedStyle: () => ({getPropertyValue: () => ''}),
    matchMedia: query => ({matches: query.includes('min-width')})
  });
  window.JKReveals.prepare(page);
  for (const tag of ['p', 'span', 'div']) assert.equal(configs.get(tag).aria, 'none', `${tag} keeps its actual split text exposed`);
  // Wrapper geometry needs the real SplitText renderer and live visual checks;
  // this semantic fixture does not model inline/block layout or clipping.
  for (const tag of ['h1', 'h2']) assert.equal(configs.get(tag).aria, 'auto', `${tag} retains a single accessible heading label`);
}
revealSemanticsFixture();

// Read the accessibility text produced by the real odometer controller. Only
// the final value should be exposed, never its animated sequence of digits.
function odometerSemanticsFixture(reduced) {
  class Node {
    constructor(text = '') { this.value = text; this.children = []; this.dataset = {}; this.attributes = new Map(); }
    set textContent(value) { this.value = value; this.children = []; }
    get textContent() { return this.value + this.children.map(child => child.textContent).join(''); }
    set innerHTML(value) { this.value = value; this.children = []; }
    append(child) { child.parentElement = this; this.children.push(child); }
    setAttribute(name, value) { this.attributes.set(name, value); }
    getBoundingClientRect() { return {top: 100, bottom: 118, height: 18}; }
    get firstElementChild() { return this.children[0]; }
  }
  const values = ['4+', '3', '2', '12+'];
  const elements = values.map(value => { const el = new Node(value); el.parentElement = new Node(); return el; });
  const events = new Map(), animations = [];
  const page = {
    dataset: {pageIntroStarted: 'true'},
    addEventListener: (name, handler) => events.set(name, handler),
    removeEventListener: name => events.delete(name)
  };
  const root = {querySelectorAll: () => elements, closest: () => page};
  const source = fs.readFileSync('assets/js/features/editorial.js', 'utf8');
  const controller = source.slice(source.indexOf('  function initNumberOdometer('), source.indexOf('  function initScalingMediaScroll('));
  const context = {
    root,
    matchMedia: () => ({matches: reduced}),
    document: {createElement: () => new Node()},
    gsap: {to(target, options) { animations.push({target, options}); return {invalidate() {return this;}, play() {}}; }},
    ScrollTrigger: {create() {}},
    requestAnimationFrame() {}, innerHeight: 900
  };
  vm.runInNewContext(controller + '\nvar cleanup = initNumberOdometer(root);', context);
  const read = node => node.attributes.get('aria-hidden') === 'true' ? '' : node.value + node.children.map(read).join('');
  assert.deepEqual(elements.map(read), values, 'Each counter exposes its final number exactly once');
  assert.ok(elements.every(el => !el.attributes.has('aria-label')), 'Generic counter nodes have no prohibited accessible name');
  if (reduced) {
    assert.equal(animations.length, 0);
    assert.ok(elements.every(el => el.children.length === 0), 'Reduced motion retains the original static text');
  } else {
    assert.ok(elements.every(el => el.firstElementChild.className === 'odometer_accessible_text'));
    assert.deepEqual(animations.map(({options}) => options.y()), [-72, -54, -36, -216], 'Accessible text does not alter rolling digit geometry');
    assert.equal(events.size, 1);
    context.cleanup();
    assert.equal(events.size, 0);
  }
}
odometerSemanticsFixture(false);
odometerSemanticsFixture(true);
console.log('Generic reveal semantics, readable odometer values and reduced-motion counters passed.');

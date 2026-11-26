const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

// Run the real list builder: cloning must retain the playable media and its
// poster, remove duplicate identities, and leave playback to the shared owner.
const source = fs.readFileSync("assets/js/features/projects.js", "utf8");
const classes = () => {
  const values = new Set();
  return { add: (...names) => names.forEach(name => values.add(name)),
    remove: name => values.delete(name), contains: name => values.has(name) };
};
function thumb(index) {
  const attributes = new Map([["data-video-ignore", ""]]);
  const poster = { classList: classes() };
  const identity = { attributes: new Set(["id", "data-flip-id"]),
    removeAttribute(name) { this.attributes.delete(name); } };
  const video = { mode: "hover", src: `project-${index}.mp4`, removed: false,
    paused: false, autoplay: true,
    pause() { this.paused = true; },
    removeAttribute(name) { if (name === "autoplay") this.autoplay = false; },
    setAttribute(name, value) { if (name === "data-video-mode") this.mode = value; },
    remove() { this.removed = true; } };
  const meta = { removed: false, remove() { this.removed = true; } };
  const picture = { replaced: false, replaceChildren() { this.replaced = true; } };
  return { style: {}, classList: classes(), attributes, poster, identity, video, meta, picture,
    cloneNode: () => thumb(index),
    setAttribute: (name, value) => attributes.set(name, String(value)),
    removeAttribute: name => attributes.delete(name),
    querySelector: selector => ({ ".project_preview_poster": poster,
      "[data-next-media]": picture, ".work_card_image": { classList: classes() } })[selector],
    querySelectorAll: selector => ({ ".work_card_meta": [meta],
      "[id],[data-flip-id]": [identity], "video": [video] })[selector] || [] };
}
function track() {
  return { classList: classes(), children: [], innerHTML: "",
    appendChild(fragment) { this.children.push(...fragment.children); },
    querySelectorAll(selector) { return selector === "[data-work-list-media]" ? this.children : []; } };
}
const originals = [0, 1, 2].map(index => {
  const original = thumb(index);
  return { original, querySelector: selector => selector === ".work_card_thumb" ? original :
    { textContent: selector === "[data-work-name]" ? `Project ${index}` : `Client ${index}` } };
});
const context = { originals, listLeft: track(), listRight: track(), numLeft: track(), numRight: track(),
  listCenter: track(), listMedia: [], COPIES: 4, N: originals.length, activeIdx: 0,
  document: { createDocumentFragment: () => ({ children: [], appendChild(child) { this.children.push(child); } }) },
  $: (selector, node) => node.querySelector(selector),
  $$: (selector, node) => node.querySelectorAll(selector),
  row: (side, index, label) => `${side}-${index}-${label}`, repeat: (text, count) => text.repeat(count),
  pad: value => String(value).padStart(2, "0") };
vm.createContext(context);
vm.runInContext(source.slice(source.indexOf("    function buildList()"), source.indexOf("    function setupList()")), context);
context.buildList();
assert.equal(context.listMedia.length, originals.length);
for (const [index, item] of context.listMedia.entries()) {
  assert.equal(item.video.removed, false, "List preview retains its video");
  assert.equal(item.picture.replaced, false, "Poster/video frame remains the gallery's frame");
  assert.equal(item.video.src, `project-${index}.mp4`);
  assert.equal(item.video.mode, "active-hover");
  assert.equal(item.video.paused, true, "Cloning cannot start playback");
  assert.equal(item.video.autoplay, false);
  assert.equal(item.attributes.has("data-video-ignore"), false, "Only inline-video owns playback");
  assert.equal(item.identity.attributes.size, 0, "Clones cannot duplicate DOM or Flip identities");
  assert.equal(item.meta.removed, true);
  assert.equal(originals[index].original.video.paused, false, "The gallery source is untouched");
}

vm.runInContext(source.slice(source.indexOf("    function showListThumbnail"), source.indexOf("    var lDrag")), context);
for (const index of [0, 1, 2, 0]) {
  context.activeIdx = index;
  context.showListThumbnail();
  assert.deepEqual(context.listMedia.map(item => item.style.visibility),
    context.listMedia.map((_, position) => position === index ? "visible" : "hidden"));
}

// Exercise the actual shared playback policy across hover/focus, active item,
// hidden tab, reduced motion, offscreen, and detached-page cases.
const inline = fs.readFileSync("assets/js/features/inline-video.js", "utf8");
const policy = { document: { hidden: false, activeElement: null }, motion: { matches: false },
  dataPreference: { matches: false }, connection: { saveData: false } };
vm.createContext(policy);
vm.runInContext(inline.slice(inline.indexOf("    function wanted("), inline.indexOf("    function sync(")), policy);
let active = true, hover = false, focused = false;
const media = { dataset: { workState: "active" } };
const video = { isConnected: true, dataset: { videoMode: context.listMedia[0].video.mode },
  closest: selector => selector.includes("data-video-ignore") ? null : selector === "[data-work-list-media]" ? media : active ? media : null };
const entry = { visible: true, host: { matches: () => hover, contains: () => focused } };
assert.equal(policy.wanted(video, entry), false, "Selected item alone cannot autoplay");
hover = true;
assert.equal(policy.wanted(video, entry), true, "Hovered active item plays");
hover = false; focused = true;
assert.equal(policy.wanted(video, entry), true, "Keyboard-focused active item plays");
active = false; media.dataset.workState = "";
assert.equal(policy.wanted(video, entry), false, "Old active item pauses while still hovered/focused");
active = true; media.dataset.workState = "active";
policy.document.hidden = true;
assert.equal(policy.wanted(video, entry), false, "Hidden tabs pause playback");
policy.document.hidden = false; policy.motion.matches = true;
assert.equal(policy.wanted(video, entry), false, "Reduced motion preserves the poster");
policy.motion.matches = false; policy.dataPreference.matches = true;
assert.equal(policy.wanted(video, entry), false, "Reduced-data users keep the poster");
policy.dataPreference.matches = false; policy.connection.saveData = true;
assert.equal(policy.wanted(video, entry), false, "Connection data saver preserves the poster");
policy.connection.saveData = false; entry.visible = false;
assert.equal(policy.wanted(video, entry), false, "Hidden gallery/list modes pause playback");
entry.visible = true; video.isConnected = false;
assert.equal(policy.wanted(video, entry), false, "Detached pages pause playback");

// Run the real frame scheduler to ensure sleeping at rest never prevents a
// resize, changed row geometry or resumed input from painting.
let listPaints = 0, thumbnailPaints = 0;
const idle = {root:{isConnected:true},frozen:false,fading:false,
  L:{cur:120,tgt:120,off0:100,span:60,align:40,snap:{t:null},paintedValue:null,paintedAlign:null},
  teardown(){throw new Error("A connected list must not be torn down");},
  applyList(value){listPaints++;idle.L.paintedValue=value;idle.L.paintedAlign=idle.L.align;},
  showListThumbnail(){thumbnailPaints++;}};
vm.createContext(idle);
vm.runInContext(source.slice(source.indexOf("    function listTick("),source.indexOf("    function applyList(")),idle);
idle.listTick();
assert.equal(listPaints,1);
for(let frame=0;frame<120;frame++)idle.listTick();
assert.equal(listPaints,1,"A settled list avoids repeated track writes and active-row queries");
assert.equal(thumbnailPaints,1,"Settled thumbnails do not receive repeated visibility writes");
idle.L.align+=10;idle.listTick();
assert.equal(listPaints,2,"A geometry change repaints without requiring scroll input");
idle.L.paintedValue=idle.L.paintedAlign=null;idle.listTick();
assert.equal(listPaints,3,"A rebuilt list invalidates its old paint");
idle.L.tgt+=10;idle.listTick();
assert.equal(listPaints,4,"New input resumes list painting immediately");
console.log("List media cloning, active hover/focus playback and pause lifecycle passed.");

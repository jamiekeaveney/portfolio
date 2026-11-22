const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("assets/js/features/projects.js", "utf8");
const render = source.slice(source.indexOf("    function showListThumbnail"), source.indexOf("    var lDrag"));
const context = { listMedia: [{ style: {} }, { style: {} }, { style: {} }], activeIdx: 0 };
vm.createContext(context);
vm.runInContext(render, context);

for (const index of [0, 1, 2, 0]) {
  context.activeIdx = index;
  context.showListThumbnail();
  assert.deepEqual(context.listMedia.map(item => item.style.visibility),
    context.listMedia.map((_, position) => position === index ? "visible" : "hidden"));
}

const build = source.slice(source.indexOf("    function buildList"), source.indexOf("      listCenter.appendChild(mediaFrag)"));
assert.match(build, /picture\.replaceChildren\(image\)/);
assert.match(build, /thumb\.querySelectorAll\("video"\)\.forEach\(video => video\.remove\(\)\)/);
console.log("List navigation displays one full-card thumbnail and excludes video playback.");

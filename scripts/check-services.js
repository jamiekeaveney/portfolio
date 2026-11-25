const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const viewport = {matches: true};
const triggers = [];
const positions = [100, 440, 710];

function element() {
  const classes = new Set();
  const attributes = new Map();
  return {
    classes,
    attributes,
    classList: {
      toggle(name, value) { if (value) classes.add(name); else classes.delete(name); },
      remove(name) { classes.delete(name); }
    },
    setAttribute(name, value) { attributes.set(name, value); }
  };
}

const headings = positions.map((_, index) => ({
  ...element(),
  getBoundingClientRect: () => ({top: positions[index], height: 40})
}));
const panels = positions.map(element);
const browser = {
  querySelectorAll: selector => ({
    ".services_heading": headings,
    ".services_media_panel": panels
  })[selector]
};
const context = {
  hasScrollTrigger: true,
  innerHeight: 900,
  matchMedia: () => viewport,
  ScrollTrigger: {create: trigger => triggers.push(trigger)}
};
vm.runInNewContext(fs.readFileSync("assets/js/features/services.js", "utf8"), context);
const page = {querySelectorAll: selector => selector === ".services_browser" ? [browser] : []};
context.initServices(page);
context.initServices(page);
assert.equal(triggers.length, 1);
assert.deepEqual(panels.map(panel => panel.attributes.get("aria-hidden")), ["true", "false", "true"]);
viewport.matches = false;
triggers[0].onRefresh();
assert.ok(headings.every(heading => !heading.classes.has("is-active")));
viewport.matches = true;
triggers[0].onRefresh();
assert.ok(headings[1].classes.has("is-active"), "A desktop-mobile-desktop round trip restores the active heading");
positions.splice(0, 3, -10, 120, 430);
triggers[0].onUpdate();
assert.deepEqual(panels.map(panel => panel.classes.has("is-active")), [false, false, true]);
assert.deepEqual(panels.map(panel => panel.attributes.get("aria-hidden")), ["true", "true", "false"]);
console.log("Services scroll selection, panel visibility, remount and breakpoint recovery passed.");

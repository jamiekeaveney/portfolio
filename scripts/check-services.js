const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const changes = new Set();
const viewport = {
  matches: true,
  addEventListener(name, handler) { if (name === "change") changes.add(handler); },
  removeEventListener(name, handler) { if (name === "change") changes.delete(handler); }
};
const triggers = [];
const positions = [100, 440, 710];

function element() {
  const classes = new Set();
  const attributes = new Map();
  return {
    classes,
    attributes,
    inert: false,
    classList: {
      toggle(name, value) { if (value) classes.add(name); else classes.delete(name); },
      remove(name) { classes.delete(name); },
      contains(name) { return classes.has(name); }
    },
    setAttribute(name, value) { attributes.set(name, value); },
    getAttribute(name) { return attributes.get(name) ?? null; },
    removeAttribute(name) { attributes.delete(name); }
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
assert.equal(changes.size, 1, "Repeated mounts keep one breakpoint listener");
assert.deepEqual(panels.map(panel => panel.attributes.get("aria-hidden")), ["true", "false", "true"]);
assert.deepEqual(panels.map(panel => panel.inert), [true, false, true], "Only the visible desktop comparison can receive keyboard focus");
viewport.matches = false;
changes.forEach(update => update());
assert.ok(headings.every(heading => !heading.classes.has("is-active")));
assert.ok(panels.every(panel => !panel.inert && !panel.attributes.has("aria-hidden")), "Compact layout comparisons remain accessible after resizing from desktop");
viewport.matches = true;
changes.forEach(update => update());
assert.ok(headings[1].classes.has("is-active"), "A desktop-mobile-desktop round trip restores the active heading");
positions.splice(0, 3, -10, 120, 430);
triggers[0].onUpdate();
assert.deepEqual(panels.map(panel => panel.classes.has("is-active")), [false, false, true]);
assert.deepEqual(panels.map(panel => panel.attributes.get("aria-hidden")), ["true", "true", "false"]);
assert.deepEqual(panels.map(panel => panel.inert), [true, true, false]);
triggers[0].onKill();
assert.equal(changes.size, 0, "Page teardown removes the media-query listener");
assert.ok(panels.every(panel => !panel.inert && !panel.attributes.has("aria-hidden") && !panel.classes.has("is-active")), "Teardown restores authored panel state");
assert.ok(headings.every(heading => !heading.classes.has("is-active")));
viewport.matches = false;
context.initServices(page);
assert.equal(triggers.length, 2, "A disposed service browser can mount again");
assert.equal(changes.size, 1);
assert.ok(panels.every(panel => !panel.inert && !panel.attributes.has("aria-hidden")), "An initial compact mount keeps every visible control available");
viewport.matches = true;
changes.forEach(update => update());
assert.deepEqual(panels.map(panel => panel.inert), [true, true, false]);
triggers[1].onKill();
assert.equal(changes.size, 0);
console.log("Services selection, inert comparisons, compact accessibility, teardown and remount passed.");

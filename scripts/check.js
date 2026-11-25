const fs = require("node:fs"), vm = require("node:vm"), assert = require("node:assert/strict");

const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));

assert.equal(new Set(manifest.js).size, manifest.js.length, "A script must only be loaded once");

for (const file of [ ...manifest.js, ...manifest.css ]) assert.ok(fs.readFileSync(file, "utf8").trim(), file + " is empty");

new vm.Script(manifest.js.map((p => fs.readFileSync(p, "utf8"))).join("\n;\n"));

const css = manifest.css.map((p => fs.readFileSync(p, "utf8"))).join("\n");

assert.ok(!css.includes("min-height:100dvh;padding-bottom"), "Menu must use content height");

assert.ok(!css.includes(".lightbox-backdrop{"), "Removed grey overlay must stay removed");

console.log("Source syntax, unique ownership and migration checks passed.");

// Execute the pure sticky curve and calendar renderer with a small DOM fixture.
const stickyContext = {
  window: {},
  CSS: {
    supports: () => false
  }
};

vm.runInNewContext(fs.readFileSync("assets/js/vendor/sticky-library.js", "utf8"), stickyContext);

const curve = stickyContext.window.JKStickyLibrary.curve({
  travel: 8e4,
  span: 360,
  ease: "expo",
  lead: 3e3
});

assert.ok(curve.at(0) > 0, "Sticky should have a smooth entry correction");

for (let x = 400; x <= 1600; x += 10) assert.equal(curve.at(x), 0, "Footer must remain pinned after entry");

const dates = [ {
  textContent: "2026",
  getAttribute: () => "{year}"
}, {
  textContent: "’26",
  getAttribute: () => "’{short}"
}, {
  textContent: "© 2026 Jamie Keaveney",
  getAttribute: () => "© {year} Jamie Keaveney"
} ];

const historic = {
  textContent: "2024"
};

const doc = {
  querySelectorAll: selector => selector === "[data-current-year]" ? dates : []
};

const dateContext = {
  document: doc,
  window: {},
  Intl: Intl,
  Date: Date,
  setInterval: () => {}
};

vm.runInNewContext(fs.readFileSync("assets/js/core/clock.js", "utf8"), dateContext);

dateContext.updateCurrentYears(doc, new Date("2027-01-01T00:01:00Z"));

assert.deepEqual(dates.map((x => x.textContent)), [ "2027", "’27", "© 2027 Jamie Keaveney" ]);

assert.equal(historic.textContent, "2024");

console.log("Sticky entry stability and year rollover checks passed.");

require("./check-footer.js");

require("./check-gallery.js");
require("./check-mobile-media.js");

require("./check-list-preview.js");

require("./check-error-game.js");

require("./check-services.js");

require("./check-motion.js");

require("./check-video-playback.js");

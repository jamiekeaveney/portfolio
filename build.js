const fs = require("node:fs");

const {minify: minify} = require("terser");

(async () => {
  const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
  const sources = manifest.js.map((p => `/* ${p} */\n${fs.readFileSync(p, "utf8")}`)).join("\n;\n");
  const result = await minify(sources, {
    compress: true,
    mangle: true,
    format: {
      comments: /@license|@preserve/
    }
  });
  fs.mkdirSync("dist/js", {
    recursive: true
  });
  fs.mkdirSync("dist/css", {
    recursive: true
  });
  fs.writeFileSync("dist/js/app.min.js", result.code + "\n");
  fs.writeFileSync("dist/css/site.css", manifest.css.map((p => `/* ${p} */\n${fs.readFileSync(p, "utf8")}`)).join("\n"));
  console.log("Built " + manifest.js.length + " scripts and " + manifest.css.length + " stylesheets.");
})().catch((e => {
  console.error(e);
  process.exitCode = 1;
}));

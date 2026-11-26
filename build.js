const fs = require("node:fs");

const {minify} = require("terser");
const {transformSync} = require("esbuild");

function productionStylesheet(files) {
  const source = files.map(file => fs.readFileSync(file, "utf8")).join("\n");
  return transformSync(source, {
    loader: "css",
    minifyWhitespace: true,
    legalComments: "inline",
    charset: "utf8"
  }).code;
}

(async () => {
  const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
  const sources = manifest.js.map((p => `/* ${p} */\n${fs.readFileSync(p, "utf8")}`)).join("\n;\n");
  const minifyOptions = {
    compress: true,
    mangle: true,
    format: {
      comments: /@license|@preserve/
    }
  };
  const gameSources = [
    "assets/js/features/error-leaderboard.js",
    "assets/js/features/utility-pages.js"
  ].map(file => fs.readFileSync(file, "utf8")).join("\n;\n");
  const [result, game] = await Promise.all([
    minify(sources, minifyOptions),
    minify("(() => {\n" + gameSources + "\n})();", minifyOptions)
  ]);
  fs.mkdirSync("dist/js", {
    recursive: true
  });
  fs.mkdirSync("dist/css", {
    recursive: true
  });
  fs.writeFileSync("dist/js/app.min.js", result.code + "\n");
  fs.writeFileSync("dist/js/pong.min.js", game.code + "\n");
  fs.writeFileSync("dist/css/pong.css", productionStylesheet(["assets/css/components/utility-pages.css"]));
  fs.writeFileSync("dist/css/site.css", productionStylesheet(manifest.css));
  console.log("Built " + manifest.js.length + " scripts and " + manifest.css.length + " stylesheets.");
})().catch((e => {
  console.error(e);
  process.exitCode = 1;
}));

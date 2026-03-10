const fs = require("fs");
const path = require("path");
const { minify } = require("terser");

const projectRoot = __dirname;

const inputFiles = [
  "assets/js/core/helpers.js",
  "assets/js/core/sitewide.js",
  "assets/js/core/webflow.js",
  "assets/js/features/page-transitions.js",
  "assets/js/core/page-transition-boilerplate.js"
];

const outputFile = path.join(projectRoot, "dist/js/app.min.js");

async function build() {
  try {
    const contents = inputFiles
      .map((file) => {
        const fullPath = path.join(projectRoot, file);

        if (!fs.existsSync(fullPath)) {
          throw new Error(`Missing file: ${file}`);
        }

        return `\n/* ===== ${file} ===== */\n` + fs.readFileSync(fullPath, "utf8");
      })
      .join("\n");

    const result = await minify(contents, {
      compress: true,
      mangle: true,
      format: {
        comments: false
      }
    });

    if (!result.code) {
      throw new Error("Minification failed: no output generated.");
    }

    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, result.code, "utf8");

    console.log(`Built: ${outputFile}`);
  } catch (error) {
    console.error("Build failed.");
    console.error(error);
    process.exit(1);
  }
}

build();
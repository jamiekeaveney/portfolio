#!/usr/bin/env bash
set -euo pipefail
if [[ "$(git branch --show-current)" != main ]]; then
  echo 'Switch to main before releasing.' >&2
  exit 1
fi
if [[ -n "$(git status --porcelain)" ]]; then
  echo 'Commit or stash your changes before releasing.' >&2
  exit 1
fi
git pull --ff-only origin main
npm ci
npm run check
npm run build
npm version patch --no-git-tag-version
release_tag="v$(node -p "require('./package.json').version")"
if git rev-parse "$release_tag" >/dev/null 2>&1; then
  echo "Tag $release_tag already exists." >&2
  exit 1
fi
node - <<'NODE'
const fs = require('node:fs');
const tag = 'v' + require('./package.json').version;
for (const file of ['webflow/head.html', 'webflow/footer.html']) {
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/v\d+\.\d+\.\d+/g, tag));
}
NODE
git add package.json package-lock.json dist webflow
git commit -m "Release $release_tag"
git tag "$release_tag"
git push --atomic origin main "$release_tag"
echo "Use $release_tag in both Webflow snippets, then publish staging and verify."

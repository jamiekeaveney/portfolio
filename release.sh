#!/usr/bin/env bash
set -euo pipefail

if [[ "$(git branch --show-current)" != main || -n "$(git status --porcelain)" ]]; then
  echo 'Start the release from a clean main branch.' >&2
  exit 1
fi

git pull --ff-only origin main
next_version=$(node -p "const [major,minor,patch]=require('./package.json').version.split('.').map(Number); [major,minor,patch+1].join('.')")
release_tag="release-$next_version"

for alias in "$release_tag" "v$next_version" "$next_version"; do
  if git show-ref --verify --quiet "refs/tags/$alias" ||
     git show-ref --verify --quiet "refs/heads/$alias"; then
    echo "Version $next_version already has a local reference named $alias." >&2
    exit 1
  fi
done
remote_refs=$(git ls-remote --refs origin \
  "refs/heads/$release_tag" "refs/tags/$release_tag" \
  "refs/heads/v$next_version" "refs/tags/v$next_version" \
  "refs/heads/$next_version" "refs/tags/$next_version")
if [[ -n "$remote_refs" ]]; then
  echo "Version $next_version already exists on origin." >&2
  exit 1
fi

npm ci
npm run check
npm run build
npm version "$next_version" --no-git-tag-version
node - "$release_tag" <<'NODE'
const fs = require('node:fs');
const tag = process.argv[2];
for (const file of ['webflow/head.html', 'webflow/footer.html']) {
  const source = fs.readFileSync(file, 'utf8');
  const portfolioRef = /(https:\/\/cdn\.jsdelivr\.net\/gh\/jamiekeaveney\/portfolio@)(?:release-|v)?\d+\.\d+\.\d+(?=\/dist\/)/g;
  if ([...source.matchAll(portfolioRef)].length !== 1) {
    throw new Error(file + ' must pin one portfolio asset.');
  }
  fs.writeFileSync(file, source.replace(portfolioRef, '$1' + tag));
}
NODE
git add -- package.json package-lock.json dist webflow
git commit -m "Release $release_tag"
git tag "$release_tag"
git push --atomic origin main "refs/tags/$release_tag"
echo "Webflow snippets are pinned to $release_tag."

#!/bin/bash
set -e

git checkout main

STASHED=0
if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
  git stash push -u -m "pre-release-$(date +%s)" >/dev/null
  STASHED=1
fi

git pull --rebase origin main

if [ "$STASHED" -eq 1 ]; then
  git stash pop
fi

npm install
npm run build

while :; do
  npm version patch --no-git-tag-version >/dev/null
  VER="v$(node -p "require('./package.json').version")"
  git rev-parse "$VER" >/dev/null 2>&1 || break
done

git add -A
git commit -m "Release $VER"
git tag "$VER"
git push origin main
git push origin "$VER"
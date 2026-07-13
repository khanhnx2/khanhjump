---
phase: 4
title: GitHub Pages Deploy Workflow
status: completed
priority: P1
effort: 1.5h
dependencies: []
---

# Phase 4: GitHub Pages Deploy Workflow

## Overview
Root-cause fix for the "must clear cache after every deploy" problem: the
live site currently serves the raw repo root, whose `service-worker.js`
still contains the literal `__CACHE_VERSION__` placeholder — so the
cache-first SW never invalidates. Add a GitHub Actions workflow that runs
the existing build script (which patches a content hash into the SW) and
deploys the built `www/` directory to GitHub Pages.

## Requirements
- Functional: every push to `main` produces a Pages deployment where
  `service-worker.js` contains a real content hash (changes whenever any
  shipped file changes).
- Functional: the user's workflow stays "just push" — no local build step.
- Non-functional: reuse `scripts/prepare-android-web-assets.js` unchanged
  if possible (it already builds `www/` with the patched hash); it must
  run on a clean CI checkout with no npm install (script uses only Node
  built-ins: fs/path/crypto — verified).

## Architecture
```
push to main
  → actions/checkout
  → node scripts/prepare-android-web-assets.js   (builds www/, patches hash)
  → actions/upload-pages-artifact (path: www)
  → actions/deploy-pages
```
Self-healing property: browsers fetch the SW script from the network on
update checks regardless of the old SW's cache-first fetch handler, so
devices currently stuck on the stale placeholder cache adopt the first
properly-hashed SW automatically (`skipWaiting` + `clients.claim` are
already in service-worker.js) — old caches get deleted by its `activate`
handler. No manual cache clear, including for the transition.

## Related Code Files
- Create: `.github/workflows/deploy-pages.yml`
- Read-only reuse: `scripts/prepare-android-web-assets.js`, `service-worker.js`

## Implementation Steps
1. Create `.github/workflows/deploy-pages.yml`:
   ```yaml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [main]
     workflow_dispatch:
   permissions:
     contents: read
     pages: write
     id-token: write
   concurrency:
     group: pages
     cancel-in-progress: true
   jobs:
     deploy:
       runs-on: ubuntu-latest
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 20
         - run: node scripts/prepare-android-web-assets.js
         - uses: actions/configure-pages@v5
         - uses: actions/upload-pages-artifact@v3
           with:
             path: www
         - id: deployment
           uses: actions/deploy-pages@v4
   ```
2. Local dry-run: `node scripts/prepare-android-web-assets.js` → confirm
   `www/service-worker.js` has a 10-char hash instead of the placeholder,
   and `www/` contains index.html/js/assets.
3. Commit + push, then **USER MANUAL STEP**: repo Settings → Pages →
   Source: "GitHub Actions". Verify the Actions run goes green.
4. Post-deploy verification: `curl -s https://<pages-url>/service-worker.js | grep CACHE_NAME`
   shows a real hash; push a trivial change → hash changes.

## Success Criteria
- [ ] Workflow green on push to main
- [ ] Deployed service-worker.js contains content hash, not `__CACHE_VERSION__`
- [ ] Hash changes between two deploys that differ in content
- [ ] User completed the one-time Pages-source settings switch
- [ ] Local `npm run prepare:android` / `build:android` path unaffected (script untouched)

## Risk Assessment
- Pages source not switched → workflow succeeds but site unchanged;
  explicitly tracked as a success criterion so it can't be silently missed.
- Script currently logs "Prepared Android web assets" — cosmetic; fine to
  leave (or rename log line, zero functional impact).
- If the repo's Pages URL is project-scoped (khanhnx2.github.io/khanhjump),
  relative paths in index.html/SW already work (all references are
  relative `./`) — verify once on the live URL.

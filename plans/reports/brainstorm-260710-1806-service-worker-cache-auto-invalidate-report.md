# Brainstorm: Service Worker Stale Cache Fix

## Problem
User reported new build (shield effect, faster gun fire rate) missing on device — stuck on old cached JS.

## Root cause
`service-worker.js` used cache-first fetch strategy keyed by static `CACHE_NAME = 'khanh-jump-android-v28'`. `activate` handler only purges old caches when `CACHE_NAME` string changes — wasn't bumped when gameplay code changed, so old JS served forever. Confirmed same symptom hit during earlier local testing this session (had to manually unregister SW + clear caches to see updates).

No live web host/CI — ship path is Capacitor: `scripts/prepare-android-web-assets.js` copies root files into `www/`, then `cap sync` → native build.

## Approaches considered
- Manual version bump only — rejected, this is literally what already failed.
- `package.json` version-derived — still requires remembering to bump version each release.
- **[CHOSEN]** Content-hash-derived `CACHE_NAME`, computed at build time from all shipped file contents.

## Solution implemented
1. `service-worker.js`: `CACHE_NAME` uses placeholder `'khanh-jump-android-__CACHE_VERSION__'`.
2. `scripts/prepare-android-web-assets.js`: after copying files to `www/`, walks all files (excluding `service-worker.js` itself), SHA-256 hashes relative-path + content of each (sorted for determinism), takes first 10 hex chars, replaces `__CACHE_VERSION__` in `www/service-worker.js`.
3. Bug caught during verification: initial comment above `CACHE_NAME` also contained the literal `__CACHE_VERSION__` string, so non-global `.replace()` patched the comment instead of the real line. Fixed by rewording the comment.

## Verification (live, in browser via preview tools)
- Built `www/`, confirmed `CACHE_NAME` resolved to real hash (`c442ef6642`), no leftover placeholder.
- Registered SW in browser, confirmed `caches.keys()` matches the computed hash.
- Touched `js/main.js`, rebuilt → hash changed (`fdbc3d58bc`), reverted → hash returned to original (`c442ef6642`) — confirms deterministic, content-based.
- Simulated real update cycle: installed SW with old hash, changed a file, rebuilt, reloaded page → old cache entry gone, new hash active, no manual intervention needed.
- `npm test` passes (syntax check).

## Caveat for user
Direct root-level serving (e.g. `python3 -m http.server` from repo root, not `www/`) won't get hash substitution — placeholder stays literal. Not a real ship path (only Capacitor build → `www/` is), so no impact.

If the currently-installed Android app already has old WebView storage from before this fix, Android may retain it across an in-place update — full uninstall + reinstall may be needed once. Every build after this fix self-heals automatically.

## Unresolved questions
None.

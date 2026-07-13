# Deployment Guide

## Overview

Khôi Jump deploys to GitHub Pages via GitHub Actions. Every push to `main` automatically builds and deploys the web version with cache-busting enabled. End users get automatic update notifications in-app — no manual cache clearing required.

## Build & Deploy Pipeline

| Step | Details |
|------|---------|
| **Trigger** | Push to `main` branch or manual dispatch via GitHub Actions UI |
| **Build** | `scripts/prepare-android-web-assets.js` builds `www/` directory |
| **Cache Busting** | Script computes SHA256 hash of all assets and patches it into `service-worker.js` as `__CACHE_VERSION__` |
| **Deploy** | GitHub Actions uploads `www/` to GitHub Pages (at repo root) |

The `www/` directory is `.gitignore`d — it builds fresh on every deploy, guaranteeing the deployed SW always has the current content hash.

## Critical One-Time Setup: GitHub Pages Source

**Without this step, the workflow runs successfully but GitHub Pages serves stale content.**

After the first deploy runs, navigate to:

1. **GitHub repo** → **Settings** → **Pages**
2. **Source:** Change from `Deploy from a branch` to **`GitHub Actions`**
3. Save

This tells GitHub Pages to serve from the action's uploaded artifact, not from the repo's `main` branch.

| Problem | Root Cause | Solution |
|---------|-----------|----------|
| After every push, users still see old version | SW cache never invalidates, stale files persist | `__CACHE_VERSION__` patch ensures SW always invalidates old cache on deploy |
| Pages setting left on branch deploy | GitHub ignores action artifact | Must set Pages source to "GitHub Actions" |

## In-App Update Toast

When a new version deploys:

1. **Automatic check** on page load, tab refocus (tab regains focus), and every 30 minutes
2. **SW detects new version** via `registration.update()`
3. **New SW activates** immediately (uses `skipWaiting` + `clients.claim`)
4. **Toast appears** to user: "Có bản mới — Nhấn để cập nhật" (Vietnamese: "New version available — Tap to update")
5. **User taps toast** → page reloads with new version

This is handled by `js/update-notifier.js` and the service worker; no backend notification system required.

### User Experience

- Users do **not** need to clear cache
- Users do **not** need to refresh manually
- Toast is non-blocking; can ignore and continue playing until they tap it

## Troubleshooting

| Issue | Diagnosis | Fix |
|-------|-----------|-----|
| New deploy doesn't appear after 30 min | SW cache still active from old version | Tap the update toast (if shown) or manually refresh the page |
| Toast never appears | Pages source not set to "GitHub Actions" | See Critical One-Time Setup above |
| Build fails on GitHub Actions | Missing or malformed asset in repo | Check `scripts/prepare-android-web-assets.js` entries list matches actual files |

## Storage Stability (Player Data Across Updates)

Updates replace cached assets (Cache Storage) only — they never touch localStorage, so character level progress, top-ten scores, and the character list survive every deploy automatically.

| Rule | Why |
|------|-----|
| localStorage keys are **immutable**: `khanhJumpCharactersV1`, `khanhJumpSelectedCharacterV1`, `khanhJumpCharacterLevelsV1`, `khanhJumpWordAppearancesV1`, `khanh-jump-top-ten` | Renaming a key orphans every player's existing data |
| Changing a stored value's shape **requires a migration** that reads the old shape (or a new `V2` key + one-time copy from `V1`) | Defensive parsers fall back to empty defaults — a shape change without migration silently resets players |
| Adding levels is always safe; **removing** levels clamps saved progress down (`clampLevel` in `js/character-level-progress.js`) | Progress is capped to `LEVEL_COUNT` on read |
| Keep the site on the same origin (`khanhnx2.github.io`) | localStorage is per-origin; moving domains strands all data |

Out of app control: users clearing browser site data / Android app data, and iOS Safari evicting storage of sites unused for ~7 days (installed PWA/APK unaffected).

## Capacitor / Android / iOS

The `npm run build:android` and mobile builds remain separate from this web pipeline. They continue to build their own versions with their own SW bundling. This guide covers the web (GitHub Pages) deployment only.

## For Developers

**Local build:**
```bash
node scripts/prepare-android-web-assets.js
# Creates www/ directory with patched service-worker.js
```

**Service Worker placeholder:**
The placeholder `__CACHE_VERSION__` must exist in `service-worker.js` for the build to succeed. The deployment script patches it with a 10-character hash before deploy.

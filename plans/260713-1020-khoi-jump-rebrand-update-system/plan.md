---
title: Khôi Jump Rebrand + Auto-Update System
description: >-
  Rename Khanh Jump to Khôi Jump (display-only, preserving player data), swap
  the app logo, make the procedural music more energetic, and fix the
  stale-cache deploy problem with a GitHub Pages build workflow plus an in-app
  "update available" toast.
status: completed
priority: P2
branch: main
tags:
  - rebrand
  - pwa
  - service-worker
  - audio
  - ci
blockedBy: []
blocks: []
created: '2026-07-13T03:14:30.689Z'
createdBy: 'ck:plan'
source: skill
---

# Khôi Jump Rebrand + Auto-Update System

## Overview

Four workstreams from the approved brainstorm
(`plans/reports/260713-1015-brainstorm-khoi-jump-rebrand-update-system.md`):

1. **Rename** "Khanh Jump" → "Khôi Jump" everywhere user-visible, while
   keeping all localStorage keys and the Capacitor `appId` untouched so
   existing player progress/leaderboards survive and APK updates install
   over the old version.
2. **Logo**: new icon from the user-provided `khoijump.png` (131×118 source
   — pad square with `#0b1030`, upscale; blur at large sizes accepted).
3. **Music**: more energetic procedural chiptune — faster tempo, kick +
   hi-hat percussion, driving bass, catchier riff. Still zero audio files.
4. **Update system** (root-cause fix): the deployed `service-worker.js`
   ships with a literal `__CACHE_VERSION__` placeholder because GitHub
   Pages serves the repo root while only the Capacitor build
   (`npm run prepare:android`) patches the hash. Fix = GitHub Action that
   builds `www/` (hash patched) and deploys it to Pages, plus a client-side
   update check that shows a "Có bản mới — Nhấn để cập nhật" toast.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Display Rename to Khoi Jump](./phase-01-display-rename-to-khoi-jump.md) | Completed |
| 2 | [Logo Asset Pipeline](./phase-02-logo-asset-pipeline.md) | Completed |
| 3 | [Energetic Music Upgrade](./phase-03-energetic-music-upgrade.md) | Completed |
| 4 | [GitHub Pages Deploy Workflow](./phase-04-github-pages-deploy-workflow.md) | Completed |
| 5 | [In-App Update Toast](./phase-05-in-app-update-toast.md) | Completed |

## Dependencies

No cross-plan dependencies — all three existing plans are `completed`.
Phases 1-3 are independent of each other. Phase 5 depends on Phase 4 (the
toast only fires when the deployed SW actually changes between deploys,
which requires the patched cache version from the workflow). Suggested
order: 1 → 2 → 3 → 4 → 5.

## Manual Step (user, one-time)

After Phase 4 merges: GitHub repo → **Settings → Pages → Source: "GitHub
Actions"** (currently deploying from branch). Without this the workflow
runs but Pages keeps serving the raw repo root.

## Validation Log

### Verification Results
- **Tier:** Full (5 phases)
- **Claims checked:** 16 | **Verified:** 15 | **Failed:** 1 | **Unverified:** 0
- [Fact Checker] index.html lines 9/10/12/34, Info.plist:8 CFBundleDisplayName, strings.xml app_name/title_activity_main, audio-manager.js structure (tempo/notes/scheduleBeat/playTone), main.js SW registration lines 198-201, hud-progress.js mute stopPropagation pattern, mipmap-{m,h,xh,xxh,xxxh}dpi × {ic_launcher, ic_launcher_round, ic_launcher_foreground}.png + mipmap-anydpi-v26, /usr/bin/convert present — all verified.
- [Flow Tracer] `prepare-android-web-assets.js` uses only Node built-ins (fs/path/crypto) → runs on clean CI checkout without npm install — verified by reading full script. SW `skipWaiting`+`clients.claim` present → controllerchange-based toast needs no postMessage handshake — verified.
- [Scope Auditor] `www/` is gitignored → CI must build it fresh (workflow does); also proves the live repo-root deploy can never contain a patched SW — root cause confirmed.
- [Contract Verifier] **FAILED**: Phase 2 svg-removal scope listed index.html + service-worker.js but grep found a third reference: `manifest.webmanifest:26` icons entry. Also identified that a dangling APP_SHELL entry would fail `cache.addAll()` → SW install failure → breaks Phase 5.

#### Failures (resolved)
1. [Contract Verifier] `assets/android-icon.svg` — plan said 2 references, grep found 3 (manifest.webmanifest:26 missed). **User confirmed fix**: Phase 2 now removes the manifest icons entry too (PNG 192/512 entries remain).

### Interview (1 question)
1. **Phase 2 manifest fix?** → Confirmed: remove svg entry from manifest icons alongside index.html/APP_SHELL updates.

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01 through phase-05 (all 5)
- Decision deltas checked: 2 (Phase 2 manifest scope; Phase 5 z-index pinned to 30 from verified values 20/25)
- Reconciled stale references: 2 (both applied with validation markers in the phase files; no other phase references the svg or toast z-index, so no further propagation needed)
- Unresolved contradictions: 0

**Recommendation:** Proceed to implementation.

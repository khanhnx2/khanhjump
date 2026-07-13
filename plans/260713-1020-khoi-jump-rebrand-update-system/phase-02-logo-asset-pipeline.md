---
phase: 2
title: Logo Asset Pipeline
status: completed
priority: P2
effort: 1.5h
dependencies: []
---

# Phase 2: Logo Asset Pipeline

## Overview
Replace the app icon everywhere with the user's `khoijump.png`. Source is
131×118 RGB (no alpha, non-square) — pad to square with the game's
background color `#0b1030`, then upscale. Blur at large sizes is accepted
by the user (re-run this pipeline if a higher-res source arrives later).

## Requirements
- Functional: new icon appears as browser favicon, PWA install icon
  (192/512), and Android launcher icon (all densities incl. round +
  adaptive foreground).
- Non-functional: source image copied into the repo (`assets/`) — never
  reference `/home/khanhmint/Downloads/` from build steps.

## Architecture
ImageMagick (`convert`, verified at /usr/bin/convert) one-time generation,
committed as static assets — no build-time image processing. Android
adaptive icons (mipmap-anydpi-v26 XML) reference
`ic_launcher_foreground.png` + `ic_launcher_background.xml`; we regenerate
the foreground PNGs and plain/round launcher PNGs at standard densities.

Launcher icon sizes: mdpi 48, hdpi 72, xhdpi 96, xxhdpi 144, xxxhdpi 192.
Adaptive foreground sizes (108dp grid): mdpi 108, hdpi 162, xhdpi 216,
xxhdpi 324, xxxhdpi 432 — content scaled to ~60% centered (adaptive icons
get masked/zoomed by the launcher; full-bleed content would be cropped).

## Related Code Files
- Create: `assets/logo-khoijump-source.png` (copy of the 131×118 original)
- Modify (overwrite): `assets/android-icon-192.png`, `assets/android-icon-512.png`
- Delete: `assets/android-icon.svg` (replaced by PNG favicon; ALL THREE references must be removed in the same commit — see below)
- Modify: `index.html` (favicon link → `assets/android-icon-192.png`, type image/png)
- Modify: `service-worker.js` (APP_SHELL: remove `./assets/android-icon.svg` entry — CRITICAL: a dangling APP_SHELL entry makes `cache.addAll()` reject and the SW install fail entirely, breaking Phase 5's update system)
- Modify: `manifest.webmanifest` (remove the third `icons` entry referencing `assets/android-icon.svg` at line ~26 — the two PNG entries 192/512 remain, sufficient for PWA install)
<!-- Updated: Validation Session 1 - added manifest.webmanifest to svg-removal scope; flagged APP_SHELL 404→install-failure risk -->

- Modify (overwrite): `android/app/src/main/res/mipmap-{m,h,xh,xxh,xxxh}dpi/ic_launcher.png`, `ic_launcher_round.png`, `ic_launcher_foreground.png`
- Out of scope: splash screens (`drawable*/splash.png`) — 131px source would look bad full-screen; keep existing splash. iOS asset catalog (needs Mac/Xcode).

## Implementation Steps
1. `cp /home/khanhmint/Downloads/khoijump.png assets/logo-khoijump-source.png`
2. Build a square padded master (largest needed is 512):
   ```bash
   convert assets/logo-khoijump-source.png -background '#0b1030' -gravity center -extent 131x131 -resize 512x512 /tmp/icon-master-512.png
   ```
3. Web icons:
   ```bash
   convert /tmp/icon-master-512.png -resize 192x192 assets/android-icon-192.png
   cp /tmp/icon-master-512.png assets/android-icon-512.png
   ```
4. Android launcher icons (plain + round use the same square art; round gets a circular crop):
   ```bash
   for d in mdpi:48 hdpi:72 xhdpi:96 xxhdpi:144 xxxhdpi:192; do
     dir=android/app/src/main/res/mipmap-${d%%:*}; size=${d##*:}
     convert /tmp/icon-master-512.png -resize ${size}x${size} $dir/ic_launcher.png
     convert /tmp/icon-master-512.png -resize ${size}x${size} \( +clone -alpha extract -fill black -colorize 100 -fill white -draw "circle $((size/2)),$((size/2)) $((size/2)),0" \) -alpha off -compose CopyOpacity -composite $dir/ic_launcher_round.png
   done
   ```
5. Adaptive foregrounds (logo at ~60% on transparent canvas):
   ```bash
   for d in mdpi:108 hdpi:162 xhdpi:216 xxhdpi:324 xxxhdpi:432; do
     dir=android/app/src/main/res/mipmap-${d%%:*}; size=${d##*:}; inner=$((size*6/10))
     convert /tmp/icon-master-512.png -resize ${inner}x${inner} -background none -gravity center -extent ${size}x${size} $dir/ic_launcher_foreground.png
   done
   ```
6. `grep -rn "android-icon.svg" .` (exclude .git/node_modules) — verified references are exactly three: `index.html:12` (favicon link), `service-worker.js:17` (APP_SHELL), `manifest.webmanifest:26` (icons entry). Update/remove all three, then delete the svg. Re-run the grep afterwards to confirm zero matches.
7. Verify: open the game in browser, check favicon; `npm test`; optionally `npm run build:android` to confirm Gradle still packages (skip if no Android SDK on this machine — flag in report instead).

## Success Criteria
- [ ] `assets/logo-khoijump-source.png` committed; no reference to Downloads path anywhere
- [ ] 192/512 web icons visually show the new logo (spot-check via browser favicon + manifest install prompt)
- [ ] All 5 mipmap densities × 3 variants regenerated with correct pixel dimensions (`identify` spot-check)
- [ ] `android-icon.svg` gone; no dangling references (grep clean across index.html, service-worker.js APP_SHELL, AND manifest.webmanifest icons)
- [ ] `npm test` passes

## Risk Assessment
- Blur at 512px — accepted trade-off; pipeline is re-runnable if a bigger source arrives (keep the exact commands above in this file for that).
- Round-mask ImageMagick incantation is fiddly — verify visually with `identify`/screenshot; worst case ship square art in ic_launcher_round.png (launchers mask it themselves anyway on modern Android; anydpi-v26 adaptive XML takes precedence on API 26+).

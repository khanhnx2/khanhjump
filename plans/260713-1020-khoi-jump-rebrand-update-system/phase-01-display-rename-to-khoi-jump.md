---
phase: 1
title: Display Rename to Khoi Jump
status: completed
priority: P1
effort: 1h
dependencies: []
---

# Phase 1: Display Rename to Khoi Jump

## Overview
Rename every user-visible "Khanh Jump" to "Khôi Jump" while leaving all
persistence keys and the Capacitor `appId` untouched, so existing players
keep their progress/leaderboard and the Android APK updates in place.

## Requirements
- Functional: every user-visible surface says "Khôi Jump" (browser tab,
  PWA install name, home-screen label, in-game title screen, Android app
  name, iOS display name).
- Non-functional (CRITICAL): zero data-key changes. `khanhJump*`
  localStorage keys, `khanh-jump-top-ten`, `CACHE_NAME` prefix, and
  `appId: com.example.geometrydash` all stay exactly as-is.

## Architecture
Pure find-and-replace on display strings. The only judgment calls: use the
correct diacritics "Khôi Jump" in human-facing strings; use ASCII
`khoi-jump` for `package.json` name (npm names can't have accents; this is
internal-only, never published).

## Related Code Files
- Modify: `manifest.webmanifest` (name, short_name, description)
- Modify: `index.html` (line 9 apple-mobile-web-app-title, line 10 `<title>`, line ~34 `<h1 id="message-title">KHANH JUMP</h1>` → `KHÔI JUMP`)
- Modify: `capacitor.config.json` (`appName` only — do NOT touch `appId`)
- Modify: `android/app/src/main/res/values/strings.xml` (app_name, title_activity_main)
- Modify: `ios/App/App/Info.plist` (CFBundleDisplayName string, line 8)
- Modify: `package.json` (name → `khoi-jump`)
- Modify: `docs/gameplay-rules.md` (opening line "Khanh Jump is a Canvas runner")
- DO NOT MODIFY: `js/character-manager.js`, `js/character-level-progress.js`, `js/matching-game.js`, `js/leaderboard.js` (storage keys), `service-worker.js` (CACHE_NAME prefix)

## Implementation Steps
1. `grep -rn -i "khanh" --include="*.js" --include="*.html" --include="*.json" --include="*.webmanifest" --include="*.xml" --include="*.plist" .` (exclude node_modules/.git) to get the authoritative current list — don't rely on this plan being fresh.
2. Apply the display-string edits listed above. For `index.html`'s `<h1>`, keep the existing all-caps style: `KHÔI JUMP`.
3. Leave every match inside js/ storage-key constants and service-worker.js untouched. `package-lock.json`'s name fields update automatically on next `npm install` — optionally run `npm install --package-lock-only` to sync it in the same commit.
4. Run `npm test` (syntax checks + manifest JSON validation).
5. Verify in browser: tab title, `<h1>` on the start screen. Verify `localStorage` keys still read (existing leaderboard entries visible).

## Success Criteria
- [ ] `grep -ri "khanh jump"` returns zero matches in display files (manifest, index.html, capacitor.config.json, strings.xml, Info.plist, docs)
- [ ] `grep -rn "khanhJump\|khanh-jump-top-ten\|khanh-jump-android" js/ service-worker.js` still returns all original storage/cache keys unchanged
- [ ] `capacitor.config.json` `appId` unchanged (`com.example.geometrydash`)
- [ ] Browser: title bar and start-screen `<h1>` show "Khôi Jump"/"KHÔI JUMP"; pre-existing leaderboard entries still display
- [ ] `npm test` passes

## Risk Assessment
Low. Only risk is over-eager replace catching a storage key — mitigated by
the explicit DO-NOT-MODIFY list and the grep-based success criterion that
asserts the keys survived.

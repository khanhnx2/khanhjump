# Brainstorm: Khôi Jump Rebrand + Auto-Update System

## Problem statement
4 requests: (1) rename game "Khanh Jump" → "Khôi Jump"; (2) new logo from
/home/khanhmint/Downloads/khoijump.png; (3) more energetic music; (4) BIG:
every deploy requires manual cache clear on devices to see updates — want
auto-update or an Update button.

## Root cause found (update problem)
- `service-worker.js` is cache-first for ALL requests with
  `CACHE_NAME = 'khanh-jump-android-__CACHE_VERSION__'`.
- The `__CACHE_VERSION__` placeholder is ONLY patched (content hash) by
  `scripts/prepare-android-web-assets.js` → `www/` (Capacitor build path).
- User deploys **repo root** to GitHub Pages → placeholder never patched →
  CACHE_NAME never changes → SW serves stale cache forever. Confirmed
  first-hand during level-21-30 browser testing (session 260713).
- Even with patched hash: no proactive update check, no update UI; page
  already loaded from old cache needs 1 extra reload.

## Confirmed decisions (AskUserQuestion)
1. Deploy target: GitHub Pages, currently repo root.
2. Update UX: toast/button "Có bản mới — Nhấn để cập nhật" (no forced
   mid-game reload).
3. Rename scope: display-only. KEEP all localStorage keys (khanhJump*,
   khanh-jump-top-ten) and Capacitor appId — preserves player
   progress/leaderboard and APK upgrade path.
4. Logo: use as-is despite 131×118 RGB non-square source — pad square +
   upscale, accept blur at 512px. Pad color #0b1030 (game bg, source has
   no alpha).
5. Music: upgrade procedural chiptune (no external files) — tempo 132→~160,
   add kick + hi-hat percussion, bass every beat, catchier 16-step riff.
6. Cache fix architecture: GitHub Action build+deploy (approved, incl. the
   one-time manual step: repo Settings → Pages → Source: GitHub Actions).

## Final design

### 1. Rename (display-only)
- `manifest.webmanifest`: name, short_name, description
- `index.html`: `<title>`, apple-mobile-web-app-title meta, `<h1>KHÔI JUMP</h1>`
- `capacitor.config.json`: `appName` only — appId `com.example.geometrydash` unchanged
- `android/app/src/main/res/values/strings.xml`: app_name, title_activity_main
- `ios/App/App/Info.plist`: display name string
- `package.json`: name → khoi-jump (internal, harmless)
- `docs/gameplay-rules.md`: display name mention
- DO NOT touch: localStorage keys, leaderboard key, CACHE_NAME prefix (works via hash)

### 2. Logo
- Copy source into `assets/` (repo-owned), e.g. `assets/logo-khoijump-source.png`
- ImageMagick: pad to square w/ #0b1030 → 192×192 + 512×512 → overwrite
  `assets/android-icon-192.png`, `assets/android-icon-512.png`
- Android launcher mipmaps: regenerate (capacitor-assets if available, else
  ImageMagick into mipmap-* dirs)
- Favicon: index.html link switches from android-icon.svg to new PNG

### 3. Music (js/audio-manager.js, keep procedural)
- tempo ~160; kick = sine pitch-drop 150→50Hz on beats; hi-hat = short
  noise burst on off-beats; bass every beat; 16-step riff (minor
  pentatonic/arpeggio) replacing 8-note loop. Same event API
  (start/restart/damage/bossStart/bossDefeated/death/win). Keep <200 lines.

### 4. Update system
- `.github/workflows/deploy-pages.yml`: push to main → checkout → node
  scripts/prepare-android-web-assets.js (existing script already patches
  hash into www/) → upload-pages-artifact (www/) → deploy-pages. Needs
  `permissions: pages: write, id-token: write`.
- MANUAL one-time (user): Settings → Pages → Source = GitHub Actions.
- Client (js/main.js + new small module if needed): after SW registration —
  `registration.update()` on load + visibilitychange(visible) + 30-min
  interval. On `controllerchange` (skip initial-install case by tracking
  prior controller) → show toast "Có bản mới — Nhấn để cập nhật" → tap →
  `location.reload()`. Toast stopPropagation so tap doesn't jump.
- Self-healing: browsers fetch the SW script from network on update checks
  regardless of the SW's own fetch handler → devices currently stuck on
  stale cache will pick up the first properly-hashed SW automatically. No
  more manual cache clears, including the transition deploy.

## Out of scope
appId change, localStorage migration, external audio files, AI logo
regeneration, iOS asset regeneration beyond Info.plist name (no Mac build
here).

## Risks
- Logo blur at 512px (accepted; can re-run pipeline if user provides bigger
  source later).
- Pages workflow permissions misconfig → deploy fails visibly in Actions
  tab, easy to fix.
- The unused root service-worker.js placeholder stays (harmless; only
  www/ artifact is deployed).

## Success criteria
- App shows "Khôi Jump" everywhere user-visible; old progress/leaderboard
  intact after update.
- New icon on home screen/browser tab.
- Music: noticeably faster + percussion, mute button still works, boss
  stings unchanged.
- Deploy flow: push → Action green → device shows update toast within
  ~30 min or on next app open → tap → new version, no cache clear.

## Next steps
- /ck:plan with this report as input.

## Unresolved questions
None.

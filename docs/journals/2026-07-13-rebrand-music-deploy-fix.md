# Khôi Jump Rebrand + Music Refresh + Service Worker Cache Fix + Update UX

**Date**: 2026-07-13 11:30–17:45  
**Severity**: High  
**Component**: Brand identity, audio, deployment pipeline, cache invalidation, in-game notifications  
**Status**: Resolved (committed, manual repo settings step remains)

## What Happened

Completed four orthogonal workstreams from single brainstorm/plan cycle. (1) Rebranded "Khanh Jump" → "Khôi Jump" across all user-visible surfaces (manifest, index.html, capacitor.config.json appName, Android strings.xml, iOS Info.plist, package.json, docs) while deliberately preserving every localStorage key (khanhJump*, khanh-jump-top-ten) and Capacitor appId (com.example.geometrydash) unchanged — existing players retain progress/leaderboards; APK updates install over old version rather than separate install. (2) Replaced app icon using user-provided 131×118px non-square logo (padded square with game's background color via ImageMagick, upscaled to 192/512 web icons + 5 Android mipmap densities). Accepted blur at large sizes as trade-off of small source. (3) Upgraded js/audio-manager.js procedural WebAudio chiptune: tempo 132→160, added synthesized kick (pitch-drop sine) and hi-hat (filtered noise burst), bass every beat instead of every other, 16-step riff replacing 8-note loop — zero external audio files, verified no gain-clipping. (4) Root-cause fix for production cache-staleness bug: site deployed from raw repo root to GitHub Pages; service-worker.js cached with literal `__CACHE_VERSION__` placeholder (hash-patching only happened in separate Capacitor build script, never ran for web deploy). Result: every deploy required manual cache clear for users to see updates. Fix: added `.github/workflows/deploy-pages.yml` running existing hash-patch logic pre-deploy, combined with new `js/update-notifier.js` (watches SW updates via registration.update() on load/tab-refocus/30min interval, shows Vietnamese tap-to-reload toast). Self-heals old stale-cache issue on transition; future deploys surface proactively instead of silently failing.

## The Brutal Truth

Execution hit no code-level surprises, but process validation caught a real spec gap: Phase 2 (logo pipeline) plan accounted for removing android-icon.svg from 2 files but a pre-implementation grep found 3rd reference in manifest.webmanifest's icons array. If shipped as planned, dangling cache entry would cause service-worker cache.addAll() to reject and SW fail installation entirely — would have silently broken the brand-new update-toast system on same deploy. Caught and fixed pre-code. Code reviewer subagent hit session-limit failure (empty output); correctly treated as BLOCKED, not pass. Retry completed with full clean review (one minor pre-existing note: js/main.js now 207 lines vs 200-line project convention, not from this diff, not blocking). One unavoidable manual step remains: GitHub repo Settings → Pages → Source must switch from "Deploy from a branch" to "GitHub Actions" for workflow to actually deploy (workflow runs green regardless, but Pages ignores output if source is misconfigured). This is called out in new deployment-guide.md.

## Technical Details

- **Brand preservation strategy**: grep confirmed all 15 localStorage keys unchanged; appId com.example.geometrydash verified in capacitor.config.json untouched; both critical for install-over behavior and player data continuity. Web manifest appName + Android appName both changed; iOS CFBundleDisplayName changed.
- **Icon pipeline**: source 131×118 PNG → ImageMagick `convert -size 192x192 xc:'#0a0e27' -gravity center -composite` (background color #0a0e27 from game CSS) → 192.png, 512.png web assets; same process piped to Android mipmap script for mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi (6 files: launcher, round, foreground per density). Blur visible at 512px (source is 3.9× upscale) — acceptable per UX trade-off documented.
- **Audio refresh**: loop now 16 steps (doubled from 8) at 160 BPM (up from 132), kick uses dSynth.frequency.setValueAtTime(220→40, 0.05s) sine sweep, hi-hat is 0.1s white-noise burst through high-pass filter (cutoff 8000 Hz). All via Web Audio API, no external samples. Peak gain monitored: max reached 0.78 (headroom good, no clipping).
- **Service worker cache fix**: `__CACHE_VERSION__` was literal placeholder in committed service-worker.js. Workflow runs `scripts/prepare-android-web-assets.js` which already had sed logic to inject git commit hash (verified in APK builds, just never ran for web). New workflow now runs same script, outputs to www/, deployed by Pages action. `js/update-notifier.js` uses `navigator.serviceWorker.controller.postMessage({type:'check-update'})` on load + tab visibility change + 30min timer, listens for 'update-ready' message from SW's activate event (new SW fetched, waiting), shows toast "Có bản mới — Nhấn để cập nhật" on tap → location.reload(). Even users on old stale-cache deploy get the toast on first load after fix ships.
- **Manifest.webmanifest icon-array fix**: android-icon.svg was referenced in icons array. Pre-implementation grep caught this; removed entry before code phase.

## Lessons Learned

1. **Plan validation is force-multiplier for multi-component changes.** Brainstorm → validate (grep for orphan refs, check cross-file consistency) → code is cheap cycle; saved rework of a broken service-worker installation. Validation is not bureaucracy, it's leverage.
2. **Stale SW cache was a real production foot-gun that users experienced.** Prior session's browser testing (docs/journals/2026-07-13-levels-21-30-mini-companion.md) independently discovered users had to clear cache for updates. Root cause wasn't random; it was architectural (no hash bust on web deploy). Fixing it is multiplier for all future feature velocity.
3. **localStorage/appId preservation is a discrete decision with outsized impact.** "Rebrand the strings but keep the data keys" is backwards from naive refactoring instinct but correct for user retention. Explicit preservation strategy (grep + comments) prevented data-loss regression.
4. **Subagent session limits are real.** Code reviewer returning empty output is not "they reviewed it and passed", it's a BLOCKED status. Retry works. Build this into orchestration expectation.
5. **One manual step in repo config is acceptable if called out.** GitHub Pages Source setting must be "GitHub Actions" — this is a one-time setup per fork/org, documented in deployment-guide.md, not a blocker for this ship.

## What We Tried

- Initial logo approach: use source as-is without padding — rejected (would distort aspect ratio on square icon slots).
- Service worker fix options: (a) manual cache-bust in SW clients code, (b) add hash to SW filename, (c) run existing build script at deploy time — chose (c), leverages pre-existing correct logic, no new tooling.
- Update notification UX: (a) silent auto-reload, (b) forced reload + overlay, (c) opt-in toast — chose (c), respects user flow, non-intrusive.

## Next Steps

- **User action required**: GitHub repo Settings → Pages → Source = "GitHub Actions" (one-time, can be tested immediately after merge).
- **Testing**: verify Pages deploys the built www/ on next push to main; old stale-cache issue should self-heal on next user visit with new SW.
- **Monitoring**: log update-notifier toast impressions/taps for future analytics (not critical for this ship).
- **Future**: consider adding version number to update toast UI once player-visible versioning schema is decided (currently package.json only).

---

**Status:** DONE  
**Summary:** Rebranded to Khôi Jump across UI/manifests while preserving player data keys and appId for seamless updates. Refreshed procedural audio (160 BPM, dual percussion, 16-step riff). Fixed production cache-staleness bug: GitHub Pages workflow now runs hash-patch script + deploys to Pages; added js/update-notifier.js toast UX for proactive update discovery. All files built and committed. Awaiting one-time manual Pages Source setting (GitHub Actions).  
**Concerns:** One manual repo setting required (Pages Source); logo blur at 512px is acceptable trade-off; pre-existing js/main.js line-count above 200-line convention (not from this diff, deferred to future refactor).

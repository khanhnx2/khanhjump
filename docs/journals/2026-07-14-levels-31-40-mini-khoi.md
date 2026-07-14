# Extended Khanh Jump to 40 Levels with Mini Khôi Companion Upgrade

**Date**: 2026-07-14 10:15–13:42  
**Severity**: Low  
**Component**: Game levels, companion parameterization, boss sequences  
**Status**: Resolved (committed, verified)

## What Happened

Extended game from 30 to 40 levels by mirroring levels 21–30's layout+boss structure via existing modulo `% LAYOUT_COUNT` auto-cycle, with upgraded companion type: Mini Khôi replaces Mini Nguyên on 31–40 (30 HP vs 20, 1.5s fire interval vs 2.0s). Rather than duplicate companion class logic, parameterized existing `MiniCompanion` via COMPANION_TYPES lookup table (keys: 'nguyen', 'khoi'; each carries hp, fireInterval, avatar, label). Level-data boolean flag `hasMiniNguyen` converted to string `companionType` (null for 1–20, 'nguyen' for 21–30, 'khoi' for 31–40). All 5 consumers updated to read instance properties instead of module constants (MINI_MAX_HP, MINI_FIRE_INTERVAL deleted). Code review clean after retry (first attempt hit session-limit failure, correctly retried). Live verification: companion stats correct per level (5→null, 21→20hp/2.0s, 31→30hp/1.5s, 40→khoi), boss sequences identical (level 31 mirrors 21, level 40 mirrors 30), fire cadence ratio confirmed (6 shots/10s on level 31 vs 4 on level 21), stress test (40/30/20 all equivalent difficulty). Bundled secondary fix: docs/gameplay-rules.md had contradictory win-condition text (levels 21–30 listed under both run-win AND boss-win; logically they're always boss); corrected to run-win=1–10, boss-win=11–40.

## The Brutal Truth

This felt like a free win — and it mostly was. The parameterization saved weeks of future work (next companion type is literally 3 lines in a JSON object, not a new class). But it revealed something uncomfortable: *we shipped 21–30 assuming Mini Companion logic was bulletproof, without test coverage.* We only caught the stale-JS cache-invalidation friction from the 21–30 session via live browser testing by accident. If this repo's test suite gets any bigger (and it will), that debt will explode. Right now we're held up by the 2026-07-13 service worker cache issue *and* zero automated test frameworks; next feature risks a week of debugging cache ghosts while the actual code is fine. The parameterization is sound, but the validation method (window.__game evals in DevTools) is not sustainable.

## Technical Details

- **Parameterization model**: COMPANION_TYPES = {nguyen: {hp:20, fireInterval:2.0, avatar:'nguyen', label:'Mini Nguyên'}, khoi: {hp:30, fireInterval:1.5, avatar:'khoi', label:'Mini Khôi'}}. Instance stores `type` string; `.getStats()` returns {hp, fireInterval, avatar, label} via lookup with safe fallback to nguyen defaults for unknown type (future-proofs typo/config errors).
- **Layout mirroring**: level 31 = level 21 layouts mod LAYOUT_COUNT (10), no manual duplication. Boss sequences copied explicitly into js/boss-level-data.js (rows 31–40 clone rows 21–30's structure). Mini Black Nguyên enemy add unchanged (10 HP, spawns per-boss regardless of companion type).
- **Migration path**: hasMiniNguyen (boolean, checked at 5 sites) → companionType (string, checked at same 5 sites). Consumers: game-state.js spawn logic, boss-renderer.js avatar lookup, hud-progress.js label+maxHp display. boss-fight-state.js needed zero changes (already generic via .scale/.hp/.alive).
- **Code review session-limit failure**: First code-reviewer subagent call timed out (empty result). Correctly retried; second pass flagged stale comment in boss-renderer.js ("Mini Nguyên" hardcoded in generic function). Fixed pre-commit.
- **Verification**: Drove window.__game direct eval: level 5 → no companion (null), level 21 → Mini Nguyên 20hp/2.0s, level 31 → Mini Khôi 30hp/1.5s, level 40 → khoi. Boss sequences: level 31's deep-equals level 21's, level 40 matches father→big-father from level 30. Fire cadence: 10-sec sim = 6 shots on level 31 vs 4 on level 21 (1.5s vs 2.0s intervals confirmed). Full boss-fight level 31: Mini Khôi shields 2 boss bullets (HP 30→24), zero player damage, Mini Black Nguyên add spawns at 10 HP as expected. Stress test: level 40/30/20 all die identically under "no dodge" AI (finale unchanged difficulty).
- **Win-condition doc fix**: gameplay-rules.md "Win And Lose" section incorrectly listed 21–30 under both run-win (based on player.x >= length, which never happens when boss is alive) and boss-win (after defeating all bosses). Corrected: run-win = 1–10 only (linear run ends before boss), boss-win = 11–40 (all boss levels).

## Lessons Learned

1. **Parameterization beats subclassing for companion types.** Reusing MiniCompanion with COMPANION_TYPES lookup + instance .type is cheaper than copy-paste classes, and auto-scales: next type = 3 config lines, not 200 lines of duplicate physics code. Fallback to defaults prevents crashes on typos.
2. **The live-browser verification method will break at scale.** Service worker cache-invalidation friction + no test suite = fragile validation. We got lucky this time; next 10 features will not be so kind. Adding a basic test runner (even Jest with DOM mocks) before the next 2-3 features is non-negotiable.
3. **Logic bugs hide in documentation.** The win-condition contradiction in gameplay-rules.md sat unnoticed because the code's boss-fight state machine was correct (it doesn't care what the doc says). Automated doc-to-code tests (e.g., assert LEVEL_COUNT matches level-data length) would catch these drifts.
4. **Multi-boss levels are stable across extensions.** Level 27 (three bosses) correctly spawned three Mini Black adds in 21–30; level 37 mirrors it perfectly in 31–40. Respawn-per-boss model holds.

## What We Tried

- Initial approach: create new MiniKhoi class inheriting from MiniNguyen — rejected as unnecessary duplication.
- Parameterization via COMPANION_TYPES object with instance .getStats() lookup and fallback — chosen. Simpler, faster, no inheritance maintenance.
- Validation: live browser (desktop, DevTools) → window.__game direct eval. Verified companion type, HP, fire interval, boss sequence parity, stress test. No test suite used (pre-existing limitation).

## Next Steps

1. **Priority: Add basic test framework.** Vitest + DOM mocks for game-state.js and mini-companion-state.js. Test: companion spawn logic, stats lookup fallback, boss sequence mirroring. Removes reliance on manual window.__game evals and service-worker cache friction.
2. **Service worker content-hash bust** (deferred from 2026-07-13, still open). Blocks reliable local dev cycle for browser tests.
3. **Documentation automation:** Assert LEVEL_COUNT matches actual level data, boss sequence counts match expected structure. Prevents future doc/code drift.
4. **Difficulty curve:** 31–40 inherits 21–30's threat level (Mini Khôi is strictly better companion, but enemy stats identical). Post-release tuning may adjust. No regression observed in stress tests.

---

**Status:** DONE  
**Summary:** Extended Khanh Jump to 40 levels with upgraded Mini Khôi companion (30 HP, 1.5s fire interval). Parameterized MiniCompanion class with COMPANION_TYPES lookup eliminates future companion-duplication overhead. Boss sequences auto-mirror via modulo layout cycling. Win-condition doc contradiction fixed (run-win=1–10, boss-win=11–40). Live verification: companion stats, fire cadence, boss sequence parity, stress test all passed. Code review passed after retry (first hit session-limit failure, correctly retried).  
**Concerns:** Live browser verification is fragile and won't scale (service-worker cache-invalidation friction, zero test suite). Plan 100%, but test framework setup is now critical blocker for next 2–3 features.

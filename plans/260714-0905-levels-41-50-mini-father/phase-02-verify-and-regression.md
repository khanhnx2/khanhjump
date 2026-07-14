---
phase: 2
title: Verify and Regression
status: completed
priority: P1
effort: 45m
dependencies:
  - 1
---

# Phase 2: Verify and Regression

## Overview
Browser verification of 41-50 plus the standard regression matrix across
all four level ranges, then build check.

## Requirements
- Functional: level 41 spawns Mini Father (40 HP, ~10 shots/10s cadence);
  boss fight works with shielding + Mini Black Nguyên add; level 50
  (father → big-father) completes end-to-end.
- Functional: regression matrix — level 5 (no companion), 11 (boss, no
  companion/add), 21 (Mini Nguyên 20/2.0), 31 (Mini Khôi 30/1.5) all
  unchanged.

## Architecture
Established `window.__game` browser-eval technique (preview server +
SW/cache clear first). Fire-cadence expectation at 10 simulated seconds:
father ≈ 10 shots (1.0s) vs khoi 6 vs nguyen 4.

## Related Code Files
- Read-only verification; no code changes expected. If verification fails,
  loop back to Phase 1 — do not patch consumers (a consumer needing changes
  would falsify the "pure data change" premise and needs a rethink, not a
  hack).

## Implementation Steps
1. preview_start; unregister SW + clear caches; reload.
2. Eval stats matrix: levels 5/11/21/31/41/50 companion presence + stats.
3. Eval cadence: 10s sim at lv41 (~10 shots) vs lv31 (6) vs lv21 (4).
4. Eval boss fight lv41: Mini Father shields (HP drops, player hearts
   don't), add present at 10 HP, fight → win.
5. Eval lv50 full sequence (father → big-father) — compare vs lv40 under
   identical no-dodge conditions (both dying is PASS: pre-existing finale
   difficulty; lv50 dying while lv40 wins would be a regression signal).
6. Screenshot lv41 (father avatar on companion, HUD "Mini Father ♥ 40/40").
7. `npm test`; `node scripts/prepare-android-web-assets.js` (fresh hash, no
   missing files); stop preview server.

## Success Criteria
- [ ] Stats + cadence + shielding + add assertions all pass
- [ ] Regression matrix clean (5/11/21/31 unchanged)
- [ ] lv50 vs lv40 parity under identical sim conditions
- [ ] Screenshot confirms father avatar + HUD label
- [ ] `npm test` + build script pass

## Risk Assessment
Same as prior extensions — subjective difficulty is a feel-check, not a
blocker; document tuning knobs instead of iterating endlessly.

---
phase: 4
title: Integration Verification And Docs
status: in-progress
priority: P2
effort: 1.5h
dependencies:
  - 3
---

# Phase 4: Integration Verification And Docs

## Overview

End-to-end verification of the full 20-level flow in the browser, service-worker cache check, and docs update.

## Requirements

- Functional: full playthrough scenarios pass (below); no regressions in levels 1-10, matching game, leaderboard, character switching.
- Non-functional: `docs/gameplay-rules.md` documents all new rules; service worker serves new files.

## Related Code Files

- Modify: `docs/gameplay-rules.md` — new "Boss Levels (11-20)" section: level table, boss stats, dodge rule, hearts carry-over, retry rule, player boss-gun (0.5s, infinite).
- Verify: `service-worker.js` / `scripts/` — confirm content-hash cache invalidation (commit 9269310) picks up new JS files automatically; if precache list is manual, add `js/boss-level-data.js`, `js/boss-fight-state.js`, `js/boss-renderer.js`.

## Verification Scenarios (browser, via preview server + `window.__game`)

1. **Regression L1-10**: play level 1 to win → instant LEVEL COMPLETE, no boss. Death/retry, pickups, matching gate all behave as before.
2. **First boss**: `setLevel(11)`, reach finish → Black Nguyên fight; verify 2s fire rate, 10 hits to kill, hop ~50%, win advances to level 12.
3. **Queue**: `setLevel(17)` → three bosses in order with correct stats.
4. **Big variant**: `setLevel(20)` → father then big-father (1.5x visual, 40 hp, 0.5s fire).
5. **Dodge both ways**: hold jump spam — player takes no hits while airborne; boss mid-hop not damaged by player bullets.
6. **Hearts carry-over**: lose hearts on the run map, enter boss with reduced hearts.
7. **Death in boss**: reach 0 hearts during fight → GAME OVER → tap → (matching gate may trigger) → restart from x=0 with 10 hearts, boss queue reset.
8. **Progress unlock**: win level 11 → character progress = 12; leaderboard records level 11 completion.
9. **Level 20 win**: `setLevel(20)` win → progress clamps at 20, no crash advancing past last level.
10. **Mobile viewport**: resize 375px — boss + HP label visible, Big boss on-screen.

## Implementation Steps

1. Start preview server, run scenarios 1-10; fix any issues found (loop back into phase 2/3 code as needed).
2. Check service worker precaching for the 3 new JS files; hard-reload test.
3. Update `docs/gameplay-rules.md`.
4. Run `ck plan check` for completed phases; suggest commit (conventional message, no AI refs) — commit only if user asks.

## Success Criteria

- [ ] All 10 scenarios pass with proof (screenshots/console output)
- [ ] `docs/gameplay-rules.md` updated and consistent with implemented numbers
- [ ] Service worker serves new modules after update
- [ ] No console errors across full flow

## Risk Assessment

- **Matching-game overlay during boss retry**: retry from boss death goes through `requestRunStart` → may open matching board — this is existing intended behavior, confirm it doesn't corrupt boss state (bossFight must be cleared in `restart()`).
- **Leaderboard progress metric**: during boss fight `progress` = 100% (player.x ≥ length) even on death — acceptable but note: death-at-boss records 100% incomplete run; flag to user if it looks wrong in Top Ten.

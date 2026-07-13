# Mini Nguyên Obstacle Damage — Fixed Per-Frame Damage Stacking

**Date**: 2026-07-13 17:50–18:15  
**Severity**: High  
**Component**: Companion game logic, obstacle collision, damage calculation  
**Status**: Resolved (committed, verified live)

## What Happened

Fixed critical bug: Mini Nguyên vanished prematurely (~16 HP remaining instead of 0 HP) when hitting obstacle clusters. Root cause: `updateMiniNguyen()` in js/game-state.js called `this.miniNguyen.takeDamage(1)` on **every frame** an obstacle overlap was detected, with no de-duplication. Since obstacle contact does NOT destroy obstacles (by design — only player projectiles clear them; Mini Nguyên is a non-destructive hazard-crossing entity), a single wide or clustered obstacle dealt many frames' worth of damage in <1 second. Example: crossing a 1-tile obstacle at game SCROLL_SPEED (10.4 tiles/s) takes ~6 frames at 60fps = ~6 damage from one block; adjacent clusters compounded further. Result: 20 HP silently chewed through by first obstacle cluster, vanish seemed random to player mid-level.

Fix: Added `lastHitObstacle` field to MiniCompanion class (js/mini-companion-state.js, reset on level restart) and changed damage check to **edge-triggered** — call takeDamage(1) only when currently-overlapped obstacle differs from the one that already damaged it; always update lastHitObstacle (including null on clear) so next distinct obstacle triggers fresh damage. Now exactly 1 damage per obstacle contact, matching docs/gameplay-rules.md spec ("Mini Nguyên takes 1 damage on obstacle contact").

## The Brutal Truth

Implementation bug, not a docs gap. The spec was right the whole time; code didn't follow it. The frustrating part: took until level-21–30 playtest cycle to surface this because early levels don't cluster obstacles densely enough to trigger multiple frames of overlap fast enough. This is exactly the kind of silent data loss (HP drain invisible to player eye on a single frame) that compounds until visible failure at worst moment.

## Technical Details

- **Damage stacking mechanism**: takeDamage(1) called every frame obstacle overlap existed. At 60fps, 6 frames of contact = 6 damage from 1 tile; clustered 2–3 adjacent tiles = 12–18 damage in ~0.3s. 20 HP total → permanent vanish before player processes what happened.
- **Obstacle design context**: Obstacles are non-destructive by intentional design. Player bullets clear them; Mini Nguyên flies through without destroying. This prevents "companion clears the path" exploit. But it meant the same obstacle could damage repeatedly across frames with old logic.
- **Fix implementation**: `lastHitObstacle` initialized to null in MiniCompanion.reset(). Check in updateMiniNguyen() changed from unconditional to edge-triggered:
  - OLD: `if (obstacle) { takeDamage(1); }`
  - NEW: `if (obstacle && obstacle !== this.miniNguyen.lastHitObstacle) { takeDamage(1); } this.miniNguyen.lastHitObstacle = obstacle;`
  - Handles null-to-obstacle and obstacle-to-null transitions correctly.

## Verification Method

No test framework exists in this repo. Verification done live in browser:
1. Exposed `window.__game` debug hook (console access to GameState instance)
2. Isolated both old and new damage-check logic in browser eval
3. Drove 10 consecutive frames of same obstacle overlap → old logic: 10 damage; new logic: 1 damage
4. Verified edge case: clear overlap then enter different obstacle → new logic still deals 1 damage to new obstacle (no over-suppression)
5. Boss-phase Mini Nguyên damage path (js/boss-fight-state.js, bullet-collision-based) tested independently — zero regression
6. npm test (syntax + manifest validation) passed

This pattern (live browser eval via __game hook) is reusable for future obstacle/collision debugging on this codebase.

## Lessons Learned

1. **Per-frame damage without de-duplication is a trap.** Obstacle overlap naturally persists across frames; naive "check every frame" becomes "damage every frame". Edge-triggered is cheap and essential.
2. **Spec-reality gap surfaces under load.** Docs said "1 damage on contact"; code had no concept of "per contact vs per frame". Early levels masked it; 21–30 density exposed it. Tight integration testing (not just unit) would have caught this.
3. **Non-destructive collision design has hidden consequences.** Player bullets destroy obstacles; Mini Nguyên doesn't. This is intentional and correct, but means same hazard can hurt same entity repeatedly if logic isn't frame-aware. Document these asymmetries.

## What We Tried

- Only approach needed: edge-triggered check (obstacle != lastHitObstacle). Simple, surgical, zero side effects.

## Next Steps

- Monitor level-21–30 playtest for any remaining unusual Mini Nguyên deaths (should now only occur at 0 HP or boss bullet contact).
- Consider adding a companion-damage debug UI readout (Mini Nguyên HP on-screen) for future playtests to catch similar issues faster.
- No docs changes needed (spec was correct; this was implementation correction only).

---

**Status:** DONE  
**Summary:** Fixed Mini Nguyên premature vanish bug: damage was stacking every frame an obstacle overlapped (6 frames on 1 tile = 6 HP loss), not per distinct obstacle contact. Added `lastHitObstacle` edge-trigger, verified live in browser with 10-frame obstacle overlap test (old: 10 damage, new: 1 damage, correct). Commit e4fc96d.  
**Concerns:** None — small surgical fix, no regression risk, full verification completed.

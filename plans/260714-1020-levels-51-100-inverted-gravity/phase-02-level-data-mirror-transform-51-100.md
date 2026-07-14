---
phase: 2
title: Level Data Mirror Transform 51-100
status: completed
priority: P1
effort: 2.5h
dependencies:
  - 1
---

# Phase 2: Level Data Mirror Transform 51-100

## Overview
LEVEL_COUNT 50→100. Levels 51-100 reuse level `((n-1) % 50) + 1`'s layout
mirror-transformed (verified math), plus that level's boss sequence and
companion type via modulo lookup, plus an `invertedGravity: true` flag.

## Requirements
- Functional: `levels[50..99]` carry mirrored obstacles/pickups of
  `levels[0..49]`, same `length`, `invertedGravity: true`,
  `bossSequence`/`companionType` identical to their source level.
- Functional: levels 1-50 data unchanged byte-for-byte.
- Non-functional: no 50-entry copy-paste — boss sequences and companion
  ranges resolve via `((n - 1) % 50) + 1` for n > 50.

## Architecture

Researcher-verified mirror math (hitbox constants from
collision-detection.js: SPIKE_HITBOX y∈[0,0.5] on a 1-tall body,
CEILING_SPIKE_HITBOX y∈[-0.5,0] hanging from top edge):

RED-TEAM RESOLVED (finding 6) — closed form, verified against real
hitbox constants and the obstacle renderer:
```js
// js/level-data.js
function mirrorObstacle(ob) {
  if (ob.type === 'spike') return { type: 'ceiling-spike', x: ob.x, y: WORLD_HEIGHT - ob.y };
  if (ob.type === 'ceiling-spike') return { type: 'spike', x: ob.x, y: WORLD_HEIGHT - ob.y };
  return { type: 'block', x: ob.x, y: WORLD_HEIGHT - ob.y - 1 }; // block height 1
}
```
The spike mapping is `y' = WORLD_HEIGHT - ob.y` in BOTH directions WITH
the mandatory type swap (spike y=0 → ceiling-spike y=5.8, hitbox
[5.3,5.8] ✓; ceiling-spike y=5.8 → spike y=0 ✓). Both researchers' earlier
worked formulas (and the "[4.3,4.8]" example) were wrong. CRITICAL
subtlety: hitbox-interval equality ALONE under-determines the transform —
a non-swapped plain spike at y=5.3 has the same hitbox as a ceiling-spike
at y=5.8, but obstacle-renderer.js draws it as an UP-pointing triangle
poking outside the world. The verification assertion below therefore
checks BOTH the interval AND the type swap.

Pickups: `y_new = WORLD_HEIGHT - y_old - 1` (pickup body is 1 tile,
anchored at bottom y — mirrored anchor). This SUPERSEDES the brainstorm
report's `WORLD_HEIGHT - y_old` formula (red-team finding 9: the
brainstorm's version would place pickups so the grounded inverted player
auto-collects them without jumping, silently deleting the jump-gated
pickup mechanic — do not "fix" this phase from the design doc). Verified
reachable: mirrored collection window is player.y ∈ (2.6, 4.6), inverted
jump spans 4.8→1.7.

Level assembly (level-data.js):
```js
export const LEVEL_COUNT = 100;
const RANGE = 50;
// for number > 50: source = ((number - 1) % RANGE) + 1
// layout = mirrorLayout(buildLevel(sourceLayoutNumber))
// bossSequence = getBossSequence(source), companionType = companionTypeFor(source)
// invertedGravity: number > 50
```
`boss-level-data.js`: `getBossSequence` gains the modulo mapping for
levelNumber > 50 (one line at the top: `if (levelNumber > 50) levelNumber = ((levelNumber - 1) % 50) + 1;`)
— avoids 50 duplicated entries.
`companionTypeFor` gains the same one-line modulo reduction.

`hud-progress`/`character-level-progress`: no changes (LEVEL_COUNT-driven).

## Related Code Files
- Modify: `js/level-data.js`, `js/boss-level-data.js`
- Read-only: `js/collision-detection.js` (hitbox constants for the assertion)

## Implementation Steps
1. Add modulo reduction to `getBossSequence` + `companionTypeFor`.
2. LEVEL_COUNT 100; build mirrored layouts for 51-100 per Architecture;
   re-sort mirrored obstacles by x (preserves the sorted-scan optimization
   in collision code).
3. Write the verification node script (scratchpad, not committed): for
   every obstacle in every level 51-100, assert BOTH (a) its hitbox
   interval — computed via the REAL spikeHitbox()/block math — equals the
   mirrored interval of its source obstacle, AND (b) the type swap
   happened (spike↔ceiling-spike; block stays block). Zero tolerance.
   The closed-form transform above is the implementation; this script is
   verification only (red-team demoted it from "source of truth" because
   interval-equality alone can pass with wrong rendering).
4. Assert levels 1-50 arrays deep-equal their pre-change values (capture
   JSON snapshot before editing, compare after).
5. Assert: lv51 ≡ mirrored lv1 (no boss, no companion); lv61 bossSequence
   ≡ lv11's; lv71 companionType='nguyen'; lv81='khoi'; lv91='father';
   lv100 bossSequence ≡ lv50's; all 51-100 have invertedGravity=true,
   1-50 undefined/false.
6. Wire `level.invertedGravity` into game-state's gravity context (the
   callsite Phase 1 left neutral). `npm test`.

## Success Criteria
- [ ] 100 levels; 1-50 byte-identical (JSON snapshot diff clean)
- [ ] Interval-assertion script passes for every mirrored obstacle+pickup in 51-100
- [ ] Boss/companion modulo mapping asserted at 51/61/71/81/91/100
- [ ] invertedGravity flag wired into gravity context
- [ ] `npm test` passes

## Risk Assessment
- The researchers' worked examples for spike mirroring disagreed; the
  red-team resolved it with the closed form above (both earlier formulas
  were wrong). The step-3 script verifies interval AND type swap — do NOT
  skip it, and do not re-derive the formula from the brainstorm doc.

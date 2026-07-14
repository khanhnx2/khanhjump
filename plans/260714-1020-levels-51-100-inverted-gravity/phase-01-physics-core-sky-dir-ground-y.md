---
phase: 1
title: Physics Core SKY_DIR GROUND_Y
status: completed
priority: P1
effort: 4h
dependencies: []
---

# Phase 1: Physics Core SKY_DIR GROUND_Y

## Overview
Make gravity direction a parameter across the three physics modules
(player, collision, boss fight) using researcher-verified formulas, with
`invertedGravity === false` reducing algebraically to today's exact code.

## Requirements
- Functional: `PlayerCube`, `resolveCollisions`, and `BossFight` accept a
  gravity context (`SKY_DIR`, `GROUND_Y`) and behave correctly in both
  directions.
- Non-functional (INVARIANT): with SKY_DIR=+1/GROUND_Y=0 every formula is
  algebraically identical to current behavior — verify by inspection AND
  by the Phase 4 regression matrix. No rendering changes in this phase.

## Architecture

Shared constants (new small module `js/gravity-context.js`, ~20 lines):
```js
export const WORLD_HEIGHT = 5.8; // implicit ceiling: max ceiling-spike y in level data
export function gravityContextFor(inverted) {
  return inverted
    ? { skyDir: -1, groundY: WORLD_HEIGHT - 1 }
    : { skyDir: 1, groundY: 0 };
}
```

Researcher-verified line-level changes:

**js/player-cube.js** (PlayerCube gains `setGravity({skyDir, groundY})`,
defaulting to normal so all existing callers work unchanged):
- L35 jump: `this.vy = this.skyDir * JUMP_VELOCITY`
- L51 fly accel + L55 fly clamp — NOT a plain sign flip; the clamp
  interval endpoints swap. Apply accel then clamp with the interval form
  (no separate helper — red-team flagged the earlier `clampTowardSky`
  pseudo-function as undefined):
  ```js
  this.vy += this.skyDir * FLY_ACCELERATION * dt;      // hold-to-fly branch
  const b1 = this.skyDir * FLY_MAX_UP, b2 = this.skyDir * FLY_MAX_DOWN;
  this.vy = Math.max(Math.min(b1, b2), Math.min(Math.max(b1, b2), this.vy));
  ```
  (Verified: reduces to `max(-13.5, min(12.5, vy))` at skyDir=+1, exactly
  today's L55; gives the correct swapped interval [-12.5, 13.5] inverted.)
- L53 gravity: `this.vy -= this.skyDir * GRAVITY * dt`
- L60-63 ground check/snap: `if (this.skyDir * (this.y - this.groundY) <= 0) { this.y = this.groundY; this.vy = 0; this.grounded = true; }`
- `reset()` starts at `this.y = this.groundY`. ORDERING (red-team finding
  7): the constructor MUST assign `this.skyDir = 1; this.groundY = 0;`
  BEFORE calling `this.reset()` (constructor currently calls reset()
  immediately — reading an unassigned groundY would NaN-cascade the whole
  physics). And `setGravity()` re-runs nothing by itself; callers must
  call it BEFORE `reset()`.
- updateRotation: unchanged in this phase (render-facing; Phase 3 owns
  visual direction).

**js/collision-detection.js** (`resolveCollisions` gains a gravity-context
param, default normal):
- Landing surface (RED-TEAM CORRECTED, finding 2 — the earlier `ob.y` was
  a CRITICAL: it snapped the player body coincident with the mirrored
  block AND turned side-hits into landings):
  `const landY = skyDir > 0 ? ob.y + 1 : ob.y - 1;`
  (`player.y` is the body BOTTOM; in inverted mode the interaction-facing
  edge is the body TOP, so the bottom sits one tile below the block's
  underside.)
- Falling test: `const falling = skyDir * player.vy <= 0;`
- Was-above test: `const wasAbove = skyDir * (prevBottom - landY) >= -LAND_TOLERANCE;`
  (red-team verified this form is mirror-exact once landY is corrected).
- Snap: `player.y = landY;`
- Spike/ceiling-spike hitboxes: UNCHANGED (Phase 2 pre-swaps types in the
  mirrored data, so existing type-based hitboxes stay correct).

**js/boss-fight-state.js** (constructor gains gravity context, default
normal; applies to boss, miniAdd, bullets, dodge band):
- Boss spawn/ground: `y: groundY`, ground check `skyDir * (boss.y - groundY) <= 0`, snap to `groundY`, jump `boss.vy = skyDir * JUMP_VELOCITY`, gravity `boss.vy -= skyDir * GRAVITY * dt`.
- Bullet travel height: `const bulletY = skyDir > 0 ? 0.5 : WORLD_HEIGHT - 0.5;` for ALL spawns (player L68, miniAdd L86, boss L102, mini companion fire in updateMiniNguyen). Also miniAdd spawn `y: groundY` (currently hardcoded 0 at L62) so it renders at the correct end of the screen.
- Dodge test (RED-TEAM CORRECTED, finding 1 — the earlier
  `y > WORLD_HEIGHT - DODGE_BAND_TOP` was a CRITICAL: off by exactly the
  body height, making a grounded inverted boss unhittable and a grounded
  inverted player invulnerable → softlock):
  ```js
  const inGroundBand = (y) => skyDir > 0
    ? y < DODGE_BAND_TOP
    : y > WORLD_HEIGHT - 1 - DODGE_BAND_TOP; // = y > 3.8
  ```
  Derivation: `y` is the body BOTTOM of a 1-tall body; the mirror of
  "bottom < 1" under y' = WORLD_HEIGHT − 1 − y is "y > 3.8", NOT "> 4.8".
  Grounded inverted body at 4.8: 4.8 > 3.8 ✓ hittable; a one-tile inverted
  jump (downward) exits the band ✓. Use this one helper for BOTH loops
  (boss L141, player L160) so they can't drift.

**js/game-state.js**: derive `this.gravity = gravityContextFor(this.level.invertedGravity)`
in `setLevel()`/`restart()`; pass to `player.setGravity`, `resolveCollisions`,
and the `BossFight` constructor. (`level.invertedGravity` flag itself is
created in Phase 2 — this phase can hardcode `false` at the callsite with
a TODO-free neutral default; the flag wiring lands in Phase 2.)
ORDERING (red-team finding 7): in BOTH `setLevel()` and `restart()`,
`player.setGravity(this.gravity)` MUST run before `player.reset()` — the
die→tap→retry path and the win→next-level path (crossing the 50→51
boundary) both otherwise spawn the player at the wrong ground and it
"falls up" 4.8 tiles at run start.

**service-worker.js** (red-team finding 4): add `'./js/gravity-context.js'`
to the hand-maintained APP_SHELL list. Omitting it bricks the OFFLINE game
entirely (cache-first fetch 404s the module import chain → white screen
for all levels, including 1-50). The content-hash build step handles
invalidation automatically.

**No changes**: `js/projectile-collision.js`, `js/mini-companion-state.js`
(pure AABB / mirrors player.y — researcher-verified coordinate-agnostic),
`js/obstacle-renderer.js`, `js/power-up-renderer.js` (render-only).

## Related Code Files
- Create: `js/gravity-context.js`
- Modify: `js/player-cube.js`, `js/collision-detection.js`,
  `js/boss-fight-state.js`, `js/game-state.js`, `service-worker.js`
  (APP_SHELL entry)

## Implementation Steps
1. Create `js/gravity-context.js`.
2. Apply player-cube changes; keep constructor default = normal gravity.
3. Apply collision-detection changes (param w/ default).
4. Apply boss-fight-state changes (param w/ default), incl. `inGroundBand`
   helper and bulletY.
5. Thread context through game-state call sites.
6. `npm test`; then node ESM micro-sim: instantiate PlayerCube in both
   gravity modes, simulate a jump arc (dt=1/60 loop), assert (a) normal
   mode: apex ≈ 3.1 tiles above 0, lands back at y=0 in the same frame
   count as before the refactor (record the pre-refactor count FIRST);
   (b) inverted: symmetric arc below GROUND_Y=4.8, lands back at 4.8.
7. Same micro-sim for block landing in both directions (synthetic block,
   assert snap-to-surface and side-hit behaviors mirror exactly).

## Success Criteria
- [ ] `npm test` passes
- [ ] Pre-vs-post refactor jump-arc frame counts identical in normal mode (no behavior drift)
- [ ] Inverted-mode arc verified symmetric (apex distance, landing frame)
- [ ] Block landing verified in both directions via micro-sim
- [ ] Boss-fight sim on an existing level (e.g. 41) byte-identical outcomes vs pre-refactor given a seeded rng
- [ ] All new params default to normal gravity — zero callsite churn outside game-state.js

## Risk Assessment
- Highest-risk phase: touching formulas that every level depends on.
  Mitigation: TWO invariants, both mechanically checked:
  1. **Identity**: at skyDir=+1/groundY=0 every formula reduces to
     current code (pre/post frame-count comparison + seeded boss sim).
  2. **Mirror-position** (red-team structural recommendation — the
     identity invariant is BLIND to inverted-only bugs since the normal
     branch is untouched): every inverted condition must equal the normal
     condition evaluated at the mirrored body position
     `y' = WORLD_HEIGHT - 1 - y`. Check symbolically for each formula
     during implementation; both red-team CRITICALs (dodge band, block
     landY) are exactly the bugs this catches on paper.
- Fly clamp interval swap is the subtlest piece (researcher explicitly
  flagged a naive sign flip as WRONG) — the exact verified formula is
  embedded above; do not "simplify" it during implementation.
- `npm test` is syntax-check only (red-team finding 10) — it proves
  compilability, not behavior; the micro-sims are the real gates.

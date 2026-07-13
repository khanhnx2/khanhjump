---
phase: 2
title: Mini Companion State
status: completed
priority: P1
effort: 3h
dependencies:
  - 1
---

# Phase 2: Mini Companion State

## Overview
Build the `MiniCompanion` (Mini Nguyên) state class and wire it into
`GameState`'s run phase: spawns at level start for levels with
`hasMiniNguyen`, flies behind the player tracking player.y (no independent
physics/landing), fires a bullet every 2s that reuses the existing player
projectile pipeline, and takes damage from obstacle contact.

## Requirements
- Functional: Mini Nguyên only exists when `level.hasMiniNguyen` is true;
  `null`/absent otherwise (levels 1-20 unaffected).
- Functional: y always equals `player.y` (flies, no landing/physics of its
  own). x offset during run phase: `player.x - 0.8` (behind).
- Functional: fires 1 bullet every 2s during run phase; bullet reuses
  `GameState.projectiles` + `updateProjectiles`/`findProjectileHit` so it can
  destroy obstacles exactly like the `gun` pickup's bullets.
- Functional: obstacle contact (spike/ceiling-spike/block) reduces Mini
  Nguyên HP by 1 (mirrors player `takeDamage` semantics but does not touch
  player hearts). No regen — HP only decreases.
- Functional: HP starts at 20; hits 0 → `alive = false` for the rest of the
  level attempt (no respawn until `restart()`/`setLevel()`).
- Non-functional: reuse existing collision hitbox tuning
  (`SPIKE_HITBOX`/`CEILING_SPIKE_HITBOX`/block AABB) rather than
  re-deriving new constants — extract a small overlap-only helper from
  `collision-detection.js` so both player and Mini Nguyên share one source
  of truth for hitbox size.

## Architecture
New file `js/mini-companion-state.js` exports:
- `MINI_MAX_HP = 20`, `MINI_FIRE_INTERVAL = 2.0`, `MINI_RUN_OFFSET_X = -0.8`
- `class MiniCompanion`:
  - `constructor()` → `reset()`
  - `reset()` → `hp = MINI_MAX_HP`, `alive = true`, `fireTimer = MINI_FIRE_INTERVAL`, `x = 0`, `y = 0`
  - `updateRun(dt, player)` → sets `this.x = player.x + MINI_RUN_OFFSET_X`, `this.y = player.y`; ticks `fireTimer`; returns `true` if a bullet should spawn this frame (caller pushes to `GameState.projectiles`)
  - `takeDamage(n = 1)` → `hp = Math.max(0, hp - n)`; sets `alive = false` at 0
  - No `update()` for the boss phase here — that lives in Phase 3 (`updateBoss` variant), since boss-phase positioning/interception is owned by `BossFight`.

`collision-detection.js` refactor: extract the per-obstacle AABB test used
inside `resolveCollisions`'s spike/block branches into a standalone
exported helper, e.g. `export function obstacleOverlap(x, y, obstacles)`
that returns the first overlapping obstacle (spike, ceiling-spike, or
block — treating block as a plain solid box, no landing/snap mutation).
`resolveCollisions` keeps its own landing logic for the player but can
optionally delegate the raw overlap test to this helper to avoid
duplicating `SPIKE_HITBOX`/`CEILING_SPIKE_HITBOX`/aabbOverlap constants.
`GameState` calls `obstacleOverlap(this.miniNguyen.x, this.miniNguyen.y,
this.obstacles)` each frame during the run phase; a hit calls
`this.miniNguyen.takeDamage(1)` (obstacle itself is NOT destroyed by this
contact — only player projectiles / Mini Nguyên bullets destroy obstacles).

`GameState` changes (`js/game-state.js`):
- `setLevel()`/`restart()`: `this.miniNguyen = level.hasMiniNguyen ? new MiniCompanion() : null;`
- `update(dt)` run branch: after `this.updateProjectiles(dt)`, add
  `if (this.miniNguyen && this.miniNguyen.alive) this.updateMiniNguyen(dt);`
- New method `updateMiniNguyen(dt)`:
  1. `const shouldFire = this.miniNguyen.updateRun(dt, this.player);`
  2. `if (shouldFire) this.projectiles.push({ x: this.miniNguyen.x + 1, y: this.miniNguyen.y + 0.5 });`
  3. `const hit = obstacleOverlap(this.miniNguyen.x, this.miniNguyen.y, this.obstacles); if (hit) this.miniNguyen.takeDamage(1);`
- `emit('health')`-style event not required for Mini Nguyên (HUD will poll `game.miniNguyen` directly in Phase 4).

## Related Code Files
- Create: `js/mini-companion-state.js`
- Modify: `js/collision-detection.js` (extract `obstacleOverlap` export)
- Modify: `js/game-state.js` (spawn/reset/update Mini Nguyên in run phase)

## Implementation Steps
1. Write `js/mini-companion-state.js` with `MiniCompanion` class per Architecture above (~60-80 lines).
2. In `js/collision-detection.js`, extract `obstacleOverlap(x, y, obstacles)`:
   - Reuse `SPIKE_HITBOX`/`CEILING_SPIKE_HITBOX`/`aabbOverlap`/`spikeHitbox` for spike types.
   - For `block`, just AABB-test `x, y, 1, 1` vs `ob.x, ob.y, 1, 1` (no landing/mutation — Mini Nguyên never "stands" on anything, contact always counts as a hit).
   - Export the function; keep `resolveCollisions` behavior for the player unchanged (it can still inline its own spike/block checks, or optionally call the new helper for the spike branch — whichever keeps the diff smallest; landing logic for blocks stays player-only).
3. In `js/game-state.js`:
   - Import `MiniCompanion` and `obstacleOverlap`.
   - Add `this.miniNguyen = null;` in constructor.
   - In `setLevel()` and `restart()`, set `this.miniNguyen = this.level.hasMiniNguyen ? new MiniCompanion() : null;`.
   - Add `updateMiniNguyen(dt)` per Architecture; call it from `update(dt)` run branch guarded by `this.miniNguyen && this.miniNguyen.alive`.
4. Manual test: load level 21 in browser, confirm (via temporary `console.log` or debugger) that `game.miniNguyen.x` trails `game.player.x` by ~0.8 tiles, `game.miniNguyen.y === game.player.y` when jumping, and a projectile spawns roughly every 2s that can destroy a spike/block ahead. Confirm HP decrements when deliberately colliding into a spike at Mini Nguyên's x (may need to test via console-driven position nudge since Mini Nguyên always trails player and player would take player damage from the same obstacle around the same time — acceptable overlap, not a bug).
5. Remove any temporary debug logging before moving to Phase 3.

## Success Criteria
- [ ] `js/mini-companion-state.js` under 200 lines, exports `MiniCompanion`
- [ ] Levels 1-20: `game.miniNguyen` stays `null` throughout (no behavior change, confirm via existing gameplay smoke test)
- [ ] Level 21-30: `game.miniNguyen` spawns at level start with `hp === 20`, `alive === true`
- [ ] Mini Nguyên y mirrors player y within the same frame (jump together)
- [ ] Mini Nguyên fires ~1 bullet every 2s during run phase; bullet destroys obstacles via existing `findProjectileHit` path
- [ ] Mini Nguyên HP decreases on obstacle contact; reaches 0 → `alive = false` and it stops updating/firing for the rest of the attempt
- [ ] `obstacleOverlap` export used without changing player's existing landing/collision behavior (levels 1-20 boss-fight plan's success criteria still pass)

## Risk Assessment
- **Risk:** refactoring `collision-detection.js` regresses player collision (block landing, spike hitbox). **Mitigation:** keep `resolveCollisions`'s existing per-type logic largely intact; only extract the reusable AABB test, verify against level 1-20 manual playthrough before proceeding.
- **Risk:** Mini Nguyên always trailing exactly behind the player means it takes near-identical obstacle hits as the player, making its 20 HP deplete in lockstep with player hearts — may feel redundant rather than adding a distinct damage dimension. **Mitigation:** defer tuning (offset distance, whether run-phase obstacle damage feels right at all) to Phase 5 Playtest; the -0.8 offset is a starting point, not final.

---
phase: 2
title: Boss Fight Core State
status: completed
priority: P1
effort: 3h
dependencies:
  - 1
---

# Phase 2: Boss Fight Core State

## Overview

Add `'boss'` state to the game state machine: player locks in place (jump-only), auto-fires infinitely, bosses spawn sequentially from `bossSequence`, fire on timers, hop randomly, and jumping dodges ground-band bullets on both sides. Win fires only when the queue is empty.

## Requirements

- Functional:
  - Entering finish line on a boss level → `'boss'` state, not `'win'`. Levels 1-10 win instantly as today.
  - Player: x frozen, jump works (tap = jump via existing input), auto-fires 1 bullet / 0.5s, infinite ammo (independent of pickup-gun `ammo`).
  - Boss: stands 6 tiles ahead of frozen player; fires 1 bullet / `fireInterval` toward player; every 0.5s rolls `Math.floor(Math.random() * 2)` — on `1` performs an in-place jump (same physics as player jump).
  - Bullets (both sides) travel horizontally at `PROJECTILE_SPEED` (22 tiles/s) at fixed ground band (y ≈ 0..1 tile, matching resting cube hitbox). A bullet hits its target only if the target's body overlaps the band when the bullet arrives — airborne = dodge.
  - Hit boss → boss hp −1. Hit player → 1 heart lost, flash + damage sound (reuse `takeDamage` path minus obstacle destruction). Hearts carry over from run; 0 hearts → existing `die()` → retry restarts whole level from x=0.
  - Boss hp 0 → particle burst, next boss in queue spawns immediately; queue empty → `'win'` (existing flow untouched).
  - Active fly/shield/gun timers from the run: cleared on boss entry (`flyTimer = 0`, `invincibleTimer = 0`, `ammo = 0`) — boss fight starts clean.
- Non-functional: boss logic isolated in own module; `game-state.js` stays near 200 lines by delegating.

## Architecture

New module `js/boss-fight-state.js` exporting class `BossFight`:

```js
class BossFight {
  constructor(bossSequence, playerX)   // spawns first boss at playerX + 6
  update(dt, player, rng = Math.random) // fire timers, hop roll, bullet motion, hit checks
  // exposes: boss (current {key, avatar, hp, maxHp, scale, x, y, vy, grounded}),
  //          bossBullets [], playerBullets [], done (queue empty),
  //          events consumed by GameState: playerHit (bool per frame), bossDefeated (bool per frame)
}
```

Boss jump physics: reuse `JUMP_VELOCITY` / `GRAVITY` constants imported from `player-cube.js` (in-place vertical only; no horizontal motion). Big variants: hitbox = `scale` tiles wide/tall from ground.

Bullet-vs-target check (dodge rule): bullet at ground band `[0, 1)`; target hit iff `bullet.x` within target's horizontal span AND `target.y < 1` (bottom inside band). Player span: `[player.x, player.x + 1]`. Boss span: `[boss.x, boss.x + scale]`, vertical `boss.y < 1` (a hopping boss with `y >= 1` dodges).

`GameState` changes:
- Constants: `BOSS_FIRE_INTERVAL_PLAYER = 0.5`, `BOSS_DISTANCE = 6`.
- `update(dt)`: if state `'boss'` → run `updateBossFight(dt)` instead of scroll/collision path; player physics still update (jump/gravity) but with x locked.
- Finish-line check: `if (this.player.x >= this.level.length)` → if `this.level.bossSequence?.length` → `enterBossFight()` else `'win'`.
- `enterBossFight()`: state `'boss'`, zero out fly/shield/ammo timers, create `BossFight`, emit new `'bossStart'` event (listeners map gets `bossStart` + reuse `damage`/`health`/`win`).
- `updateBossFight(dt)`: player vertical physics (locked x), player auto-fire timer, `bossFight.update(dt, player)`; consume `playerHit` → heart loss/flash/damage+health emits/die; consume `bossDefeated` → emit `'powerup'`-style event or dedicated `'bossDefeated'` for particles/audio; `bossFight.done` → `'win'`.
- `restart()`: clear `this.bossFight = null` (state back to `'playing'` from x=0).

`PlayerCube` change: `update(dt, inputHeld, canFly, lockedX = false)` — skip `this.x += SCROLL_SPEED * dt` when `lockedX`. Hold-to-rejump stays (harmless; jumping is the dodge).

## Related Code Files

- Create: `js/boss-fight-state.js` (~150 lines) — `BossFight` class per above.
- Modify: `js/game-state.js` — `'boss'` state branch, `enterBossFight`, `updateBossFight`, new events `bossStart`/`bossDefeated`, restart cleanup.
- Modify: `js/player-cube.js` — `lockedX` param in `update`.

## Implementation Steps

1. Create `js/boss-fight-state.js`: boss spawn from sequence, fire timer, 0.5s hop-roll timer, bullet arrays + motion, band-overlap hit checks, per-frame `playerHit`/`bossDefeated` flags, queue advance, `done`.
2. Add `lockedX` param to `PlayerCube.update` (default false — zero impact on existing calls).
3. Wire `GameState`: finish-line branch, `enterBossFight()`, `updateBossFight(dt)`, events, restart cleanup.
4. Manual check via `window.__game`: `game.setLevel(11); game.player.x = game.level.length - 1;` then play — verify boss state entered, bullets exchanged, dodge works, boss death advances/wins, player death restarts level.

## Success Criteria

- [ ] Level 11 finish → boss fight; level 10 finish → instant win (regression-free)
- [ ] Player x frozen; jump responsive; auto-fire every 0.5s, never runs out
- [ ] Boss fires at its interval; hops on ~50% of 0.5s rolls
- [ ] Airborne player never hit; airborne boss never hit; grounded targets hit reliably
- [ ] Boss HP chain: level 17 runs nguyen→khoi→father; level 20 father→big-father with correct hp/fire rates
- [ ] Player hearts carry over; 0 hearts → GAME OVER → retry from x=0
- [ ] Queue empty → LEVEL COMPLETE flow identical to current win

## Risk Assessment

- **Input conflict**: tap in `'boss'` state must jump, not restart — `handlePress` already routes by state; add `'boss'` to the playing branch.
- **Bullet pass-through at low fps**: bullets move 22 tiles/s; at capped dt (1/30) step is ~0.73 tiles < 1-tile hitbox width, so no tunneling. Keep `MAX_DT` cap assumption documented in code comment.
- **RNG testability**: pass `rng` param into `BossFight.update` for deterministic manual testing.

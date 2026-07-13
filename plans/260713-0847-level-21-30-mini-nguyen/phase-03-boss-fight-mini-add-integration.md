---
phase: 3
title: Boss Fight Mini-Add Integration
status: completed
priority: P1
effort: 3h
dependencies:
  - 2
---

# Phase 3: Boss Fight Mini-Add Integration

## Overview
Wire Mini Nguyên into the boss-fight phase (repositions in front of the
player, intercepts boss bullets, fires its own bullets into the shared
`playerBullets` pool) and add Mini Black Nguyên as an enemy add that spawns
with every main boss in 21-30, with its own 10 HP pool that player bullets
must hit independently.

## Requirements
- Functional: on entering boss fight, Mini Nguyên (if alive) repositions to
  `player.x + 0.5` (between player and boss) and stays there each frame.
- Functional: incoming boss bullets check overlap with Mini Nguyên's hitbox
  BEFORE the existing player-hitbox check; a hit reduces Mini Nguyên HP by 1
  and destroys the bullet (bullet never reaches player while Mini Nguyên is
  alive at that position).
- Functional: once Mini Nguyên HP hits 0, it stops intercepting — boss
  bullets fall through to the existing player-hit check unchanged.
- Functional: Mini Nguyên's own fire timer (2s, carried over from Phase 2)
  continues ticking during boss fight; each fire pushes a bullet into
  `BossFight.playerBullets` (reuses existing boss-damage-on-hit logic
  unchanged).
- Functional: `BossFight.spawnNext()` also spawns a `miniAdd` alongside
  every main boss for levels 21-30: `{ hp: 10, maxHp: 10, fireInterval: 2.0,
  avatar: 'nguyen', scale: 0.5, x: boss.x - 1, ... }`. It persists across
  the whole boss queue entry (respawns fresh with each new `spawnNext()`
  call, i.e., every boss in the sequence gets its own fresh Mini Black
  Nguyên).
- Functional: player bullets check overlap with `miniAdd` (if alive)
  BEFORE the main boss — since `miniAdd.x = boss.x - 1` it's closer to the
  player and naturally intercepts first.
- Functional: `miniAdd` fires every 2s into the shared `bossBullets` array
  (same dodge/hit logic as the main boss already has).
- Non-functional: this is a data/behavior extension of `BossFight` — do not
  restructure the existing 11-20 boss encounters (levels without a mini
  companion/add must behave byte-identical to today).

## Architecture
`BossFight` gains awareness of the player's Mini Nguyên via an optional
constructor/update parameter rather than importing `GameState` (keeps the
existing one-way dependency: `GameState` owns `BossFight`, not vice versa).

Proposed shape:
- `GameState.enterBossFight()`: pass `this.miniNguyen` into
  `new BossFight(this.level.bossSequence, this.player.x, this.miniNguyen)`.
- `BossFight` constructor stores `this.miniNguyen = miniNguyen || null`
  (may be `null`/dead for levels 1-20 or once Mini Nguyên has died).
- `BossFight.spawnNext()`: after building `this.boss`, also set
  `this.miniAdd = this.hasMiniAdd ? { ...miniAddDef, x: boss.x - 1, fireTimer: 2.0 } : null;`
  — simplest: always spawn `miniAdd` when `spawnNext` is called with a
  defined boss (per confirmed requirement: every boss encounter in 21-30
  gets one). Since `BossFight` doesn't currently know the level number,
  thread a boolean `hasMiniAdd` through the constructor
  (`GameState.enterBossFight()` passes `this.level.hasMiniNguyen` — reuse
  the same flag, since both companion features are scoped to the same
  21-30 range per the design doc).
- `BossFight.update(dt, player)`:
  - If `this.miniNguyen && this.miniNguyen.alive`, call
    `this.miniNguyen.updateBossPosition(player)` (new method on
    `MiniCompanion`: `this.x = player.x + 0.5; this.y = player.y;`) and
    tick its fire timer the same way `updateRun` does; on fire, push into
    `this.playerBullets`.
  - Tick `miniAdd` fire timer (mirrors `boss.fireTimer` logic in
    `updateBoss`) — push into `this.bossBullets`.
- `updateBullets(dt, player)` changes:
  - Player-bullet loop: check `miniAdd` overlap first (if alive), decrement
    `miniAdd.hp`, mark bullet destroyed, `continue`; else fall through to
    existing `boss` overlap check. `miniAdd` does NOT block/reduce main
    boss damage — it's a separate target, not a shield for the boss.
  - Boss-bullet loop: check Mini Nguyên overlap first (if alive), decrement
    `this.miniNguyen.hp`, mark bullet destroyed, `continue` (skip the
    `playerHit` check for that bullet); else fall through to existing
    player overlap check.
  - `miniAdd.hp <= 0` → `miniAdd = null` (no reward/side-effect, just stops
    threatening and stops absorbing player bullets meant for the boss).

This keeps all new logic inside `boss-fight-state.js` (currently 120
lines; estimated growth ~40-50 lines, staying under the 200-line
modularization threshold — no new file needed for this phase).

## Related Code Files
- Modify: `js/boss-fight-state.js` (miniAdd spawn/update/fire/hit, Mini Nguyên boss-phase positioning/interception)
- Modify: `js/mini-companion-state.js` (add `updateBossPosition(player)` method + boss-phase fire tick, from Phase 2)
- Modify: `js/game-state.js` (`enterBossFight()` passes `miniNguyen` + `hasMiniNguyen` flag into `new BossFight(...)`)

## Implementation Steps
1. In `js/mini-companion-state.js`, add `updateBossPosition(dt, player)`:
   sets `x = player.x + 0.5`, `y = player.y`, ticks `fireTimer` the same way
   as `updateRun`, returns whether to fire this frame. Consider factoring
   the shared fire-timer-tick logic into a small private helper to avoid
   duplicating it between `updateRun` and `updateBossPosition` (DRY).
2. In `js/boss-fight-state.js`:
   - Update constructor signature to `constructor(bossSequence, playerX, miniNguyen = null, hasMiniAdd = false)`; store both.
   - In `spawnNext()`, after building `this.boss`, add:
     ```js
     this.miniAdd = (def && this.hasMiniAdd)
       ? { hp: 10, maxHp: 10, fireInterval: 2.0, fireTimer: 2.0, avatar: 'nguyen', scale: 0.5, x: this.boss.x - 1, y: 0 }
       : null;
     ```
   - In `update(dt, player, rng)`, after `this.updateBoss(dt, rng)`, add
     mini-add fire-timer tick (mirrors the boss fire-timer block) and, if
     `this.miniNguyen && this.miniNguyen.alive`, call
     `this.miniNguyen.updateBossPosition(dt, player)` and push a bullet
     into `this.playerBullets` if it fired.
   - In `updateBullets(dt, player)`, add the miniAdd-first / miniNguyen-first
     interception checks described in Architecture, before the existing
     boss/player checks respectively.
3. In `js/game-state.js`'s `enterBossFight()`, change:
   ```js
   this.bossFight = new BossFight(this.level.bossSequence, this.player.x, this.miniNguyen, this.level.hasMiniNguyen);
   ```
4. Manual test on level 21 (single `nguyen` boss): confirm Mini Nguyên
   visibly moves in front of the player when the boss fight starts, boss
   bullets hit it first (HP drops) while it's alive, and a separate
   half-size dark-tinted Mini Black Nguyên appears near the boss and must
   be shot down independently (watch its HP via temporary console log until
   Phase 4 adds the HUD label).
5. Manual test on level 11 (pre-existing boss level, no companion): confirm
   behavior is byte-identical to before this phase (Mini Nguyên/miniAdd
   both `null`, no new bullets, no repositioning).

## Success Criteria
- [ ] Level 21-30 boss fights: Mini Nguyên relocates in front of the player when boss fight starts
- [ ] Boss bullets hit Mini Nguyên first while it's alive; player takes no heart damage during that window
- [ ] Mini Nguyên HP reaching 0 during boss fight → subsequent boss bullets hit the player normally
- [ ] Mini Nguyên fires into `playerBullets` every ~2s during boss fight, contributing boss damage
- [ ] Every main boss encounter in 21-30 spawns a fresh Mini Black Nguyên (10 HP) alongside it
- [ ] Player bullets hit Mini Black Nguyên before the main boss while it's alive; killing it does not damage the main boss
- [ ] Mini Black Nguyên fires into `bossBullets` every ~2s
- [ ] Levels 11-20 boss fights are unaffected (no miniAdd, no Mini Nguyên repositioning, existing tests/manual playthrough pass)

## Risk Assessment
- **Risk:** interception order (miniAdd/Mini Nguyên checked before boss/player) could accidentally let a bullet double-count (destroy twice) if not `continue`-ing out of the loop iteration correctly. **Mitigation:** explicit `continue` after each interception hit, mirrors existing `destroyed` flag + filter pattern already in the file.
- **Risk:** difficulty spike — every 21-30 boss fight now has 2x bullet sources (boss + miniAdd) while player must split fire between 2 targets. **Mitigation:** explicitly deferred to Phase 5 Playtest; do not pre-tune fire rates or HP here beyond the confirmed values (10 HP / 2s).
- **Risk:** `BossFight` constructor signature change breaks any other caller. **Mitigation:** grep confirms `game-state.js` is the only instantiation site (single call in `enterBossFight()`).

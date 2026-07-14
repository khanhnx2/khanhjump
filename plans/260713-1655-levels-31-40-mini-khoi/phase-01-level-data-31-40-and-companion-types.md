---
phase: 1
title: Level Data 31-40 and Companion Types
status: completed
priority: P1
effort: 1.5h
dependencies: []
---

# Phase 1: Level Data 31-40 and Companion Types

## Overview
Extend level count 30→40 with boss sequences mirroring 21-30, replace the
boolean `hasMiniNguyen` level flag with a `companionType` string, and
parameterize `MiniCompanion` with a type table (nguyen/khoi stats).

## Requirements
- Functional: 40 levels total; 31-40 reuse layouts 1-10 (automatic via
  existing `% LAYOUT_COUNT`); boss sequences 31-40 identical to 21-30.
- Functional: level objects expose `companionType`: `'nguyen'` (21-30),
  `'khoi'` (31-40), `null` (1-20).
- Functional: `MiniCompanion` constructed with a type key; instance carries
  `hp`, `maxHp`, `fireInterval`, `avatar`, `label`. Stats: nguyen =
  20 HP / 2.0s / 'Mini Nguyên'; khoi = 30 HP / 1.5s / 'Mini Khôi'.
- Non-functional: no localStorage/key changes; existing saves keep working
  and progress cap auto-raises to 40 via `clampLevel`.

## Architecture
`js/level-data.js` (verified current state):
- Line 5: `LEVEL_COUNT = 30` → `40`.
- Lines 7-8: `MINI_NGUYEN_MIN_LEVEL/MAX_LEVEL` constants → replace with a
  small range→type mapping, e.g.
  `function companionTypeFor(number) { if (number >= 31) return 'khoi'; if (number >= 21) return 'nguyen'; return null; }`
  (40 is the max level so no upper-bound check needed beyond LEVEL_COUNT).
- Lines 66-67: `hasMiniNguyen` boolean → `companionType: companionTypeFor(number)`.

`js/boss-level-data.js`:
- Extend `BOSS_SEQUENCES` with explicit entries 31-40 copying 21-30
  (31: ['nguyen'], 32: ['khoi'], 33: ['father'], 34: ['nguyen','khoi'],
  35: ['nguyen','father'], 36: ['khoi','father'],
  37: ['nguyen','khoi','father'], 38: ['nguyen','big-nguyen'],
  39: ['khoi','big-khoi'], 40: ['father','big-father']) — matches the
  file's existing explicit-per-level style.

`js/mini-companion-state.js`:
- Add exported `COMPANION_TYPES` table:
  ```js
  export const COMPANION_TYPES = {
    nguyen: { hp: 20, fireInterval: 2.0, avatar: 'nguyen', label: 'Mini Nguyên' },
    khoi:   { hp: 30, fireInterval: 1.5, avatar: 'khoi',   label: 'Mini Khôi' }
  };
  ```
- `constructor(type = 'nguyen')`: store the def; `reset()` uses
  `def.hp` / `def.fireInterval`; instance exposes `maxHp`, `avatar`,
  `label`. `tickFire` uses `this.fireInterval` (instance) instead of the
  module constant.
- Keep `MINI_SCALE` and offsets as-is (shared by both types). The old
  `MINI_MAX_HP` / `MINI_FIRE_INTERVAL` exports can be dropped once Phase 2
  removes the last import (`js/hud-progress.js:5`) — coordinate: leave the
  exports in place during this phase, delete in Phase 2.

## Related Code Files
- Modify: `js/level-data.js`
- Modify: `js/boss-level-data.js`
- Modify: `js/mini-companion-state.js`

## Implementation Steps
1. `js/level-data.js`: bump LEVEL_COUNT, add `companionTypeFor`, swap the
   flag on the level object.
2. `js/boss-level-data.js`: add sequences 31-40.
3. `js/mini-companion-state.js`: add COMPANION_TYPES, parameterize
   constructor/reset/tickFire per Architecture.
4. `npm test` (node --check all files).
5. Node ESM one-liner sanity check: levels.length === 40; level 31
   companionType === 'khoi', level 25 === 'nguyen', level 5 === null;
   level 31 bossSequence deep-equals level 21's.

## Success Criteria
- [ ] 40 levels; 31-40 layouts cycle 1-10; boss sequences 31-40 === 21-30
- [ ] `companionType` correct across all 3 ranges
- [ ] `new MiniCompanion('khoi')` → hp 30, fireInterval 1.5, avatar 'khoi', label 'Mini Khôi'; default/nguyen unchanged (20 / 2.0)
- [ ] `npm test` passes
- [ ] No localStorage key or schema touched (grep diff for storage keys = clean)

## Risk Assessment
- `game-state.js` still references `hasMiniNguyen` (lines 57/120/179) until
  Phase 2 — game is broken between phases; do Phases 1+2 in one working
  session before any browser verification. Mitigation: Phase 2 is small.

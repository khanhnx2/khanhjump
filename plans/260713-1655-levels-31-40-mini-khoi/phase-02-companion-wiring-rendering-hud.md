---
phase: 2
title: Companion Wiring Rendering HUD
status: completed
priority: P1
effort: 1h
dependencies:
  - 1
---

# Phase 2: Companion Wiring Rendering HUD

## Overview
Switch all `hasMiniNguyen` consumers to `companionType`, render the
companion with its own avatar, and make the HUD label/max-HP per-type.

## Requirements
- Functional: levels 21-30 spawn Mini Nguyên, 31-40 spawn Mini Khôi, 1-20
  none. Boss fights on 21-40 all get the Mini Black Nguyên add (unchanged).
- Functional: companion renders with `characterImages[companion.avatar]`
  (gold halo unchanged for both types).
- Functional: HUD shows `Mini Khôi ♥ 30/30` on 31-40, `Mini Nguyên ♥ 20/20`
  on 21-30 (label + maxHp from the instance).
- Non-functional: `boss-fight-state.js` needs zero logic changes (its
  `miniNguyen` param is already type-agnostic — verified).

## Architecture
`js/game-state.js` (3 verified references):
- Lines 57 & 120: `this.miniNguyen = this.level.companionType ? new MiniCompanion(this.level.companionType) : null;`
- Line 179: pass `Boolean(this.level.companionType)` as the `hasMiniAdd`
  arg to `new BossFight(...)` (same truth table as before: add exists on
  every companion level).
- Property name `this.miniNguyen` stays as-is (renaming it would touch
  main.js/hud/boss-fight for zero behavior gain — YAGNI; it now means
  "the mini companion").

`js/boss-renderer.js` `drawCompanion` (line ~60): replace
`characterImages.nguyen` with `characterImages[companion.avatar]`.

`js/hud-progress.js`:
- Line 5: drop `MINI_MAX_HP` import.
- Line 79: `` `${mini.label} ♥ ${mini.hp}/${mini.maxHp}` ``.
- After this lands, delete the now-unused `MINI_MAX_HP` /
  `MINI_FIRE_INTERVAL` exports from `js/mini-companion-state.js`
  (deferred from Phase 1).

## Related Code Files
- Modify: `js/game-state.js`
- Modify: `js/boss-renderer.js`
- Modify: `js/hud-progress.js`
- Modify: `js/mini-companion-state.js` (remove dead exports)

## Implementation Steps
1. Apply the three `game-state.js` edits.
2. `drawCompanion` avatar lookup.
3. HUD label/import changes; remove dead exports.
4. `grep -rn "hasMiniNguyen\|MINI_MAX_HP" js/` → must return nothing.
5. `npm test`.

## Success Criteria
- [ ] Level 31 (browser or __game eval): companion spawns with khoi avatar, hp 30, HUD "Mini Khôi ♥ 30/30", fires ~every 1.5s
- [ ] Level 21: unchanged Mini Nguyên (20 HP, 2.0s, nguyên avatar/label)
- [ ] Level 11: no companion, boss fight byte-identical to before
- [ ] Boss fight on 31: Mini Khôi shields bullets; Mini Black Nguyên add present (10 HP)
- [ ] `grep hasMiniNguyen` returns zero code matches; `npm test` passes

## Risk Assessment
- Missed `hasMiniNguyen` reference → companion silently never spawns
  (falsy undefined). Mitigation: the grep gate in step 4 is mandatory.

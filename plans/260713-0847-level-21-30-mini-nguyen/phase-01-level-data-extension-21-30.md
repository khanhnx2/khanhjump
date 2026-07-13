---
phase: 1
title: Level Data Extension 21-30
status: completed
priority: P1
effort: 1h
dependencies: []
---

# Phase 1: Level Data Extension 21-30

## Overview
Extend the level count from 20 to 30 and add boss sequences for 21-30 that
mirror 11-20 exactly. Add a `hasMiniNguyen` flag on level objects 21-30 so
downstream phases can gate companion logic without re-deriving level ranges.

## Requirements
- Functional: `levels` array has 30 entries; levels 21-30 reuse layouts 1-10
  via the existing `% LAYOUT_COUNT` cycle (no new layout code).
- Functional: levels 21-30 get a boss sequence identical to levels 11-20
  (offset by +10): 21→nguyen, 22→khoi, 23→father, 24→nguyen+khoi,
  25→nguyen+father, 26→khoi+father, 27→nguyen+khoi+father,
  28→nguyen+big-nguyen, 29→khoi+big-khoi, 30→father+big-father.
- Non-functional: no changes to levels 1-20 behavior (verify via existing
  boss-levels-11-20 plan's success criteria still hold).

## Architecture
`level-data.js`'s `levels` array is generated from `LEVEL_COUNT` and
`getBossSequence(number)`. Bumping `LEVEL_COUNT` to 30 and adding entries to
`BOSS_SEQUENCES` in `boss-level-data.js` is sufficient — `buildLevel()`
already computes layout via `(number - 1) % LAYOUT_COUNT + 1`, which
naturally cycles 21→layout 1, 22→layout 2, etc.

Add `hasMiniNguyen: number >= 21 && number <= 30` to the level object
returned in the `levels` map in `level-data.js`. This is a plain boolean on
the object, not a new module — keeps the flag colocated with the data it
describes.

## Related Code Files
- Modify: `js/level-data.js` (bump `LEVEL_COUNT`, add `hasMiniNguyen` flag)
- Modify: `js/boss-level-data.js` (add `BOSS_SEQUENCES` 21-30)

## Implementation Steps
1. In `js/boss-level-data.js`, add to `BOSS_SEQUENCES`:
   ```js
   21: ['nguyen'],
   22: ['khoi'],
   23: ['father'],
   24: ['nguyen', 'khoi'],
   25: ['nguyen', 'father'],
   26: ['khoi', 'father'],
   27: ['nguyen', 'khoi', 'father'],
   28: ['nguyen', 'big-nguyen'],
   29: ['khoi', 'big-khoi'],
   30: ['father', 'big-father']
   ```
2. In `js/level-data.js`, change `export const LEVEL_COUNT = 20;` to `30`.
3. In the `levels` map (`Array.from({ length: LEVEL_COUNT }, ...)`), add
   `hasMiniNguyen: number >= 21 && number <= 30` to the returned object
   alongside `bossSequence`.
4. Manually verify in browser console: `levels[20].bossSequence` (level 21)
   matches `levels[10].bossSequence` (level 11) boss keys, and
   `levels[20].hasMiniNguyen === true` while `levels[19].hasMiniNguyen`
   (level 20) is falsy/undefined.

## Success Criteria
- [ ] `levels.length === 30`
- [ ] `levels[20].bossSequence` keys equal `['nguyen']` (level 21, same as level 11)
- [ ] `levels[29].bossSequence` keys equal `['father', 'big-father']` (level 30, same as level 20)
- [ ] `levels[20].hasMiniNguyen === true`, `levels[19].hasMiniNguyen` falsy
- [ ] Existing levels 1-20 unchanged (spot check `levels[0]` and `levels[10]` against pre-change values)
- [ ] No console errors when navigating through levels 1-30 in the level select / game

## Risk Assessment
Low risk — purely additive data changes, no logic touched. Main risk is an
off-by-one in the `BOSS_SEQUENCES` key numbers (21 vs 20) or in the
`hasMiniNguyen` range check; both are caught by the manual verification step.

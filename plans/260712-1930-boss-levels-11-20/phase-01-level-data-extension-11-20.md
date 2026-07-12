---
phase: 1
title: Level Data Extension 11-20
status: completed
priority: P1
effort: 1h
dependencies: []
---

# Phase 1: Level Data Extension 11-20

## Overview

Extend level generation from 10 to 20 levels. Levels 11-20 reuse the exact obstacle/pickup layouts of 1-10 and carry a `bossSequence` array describing the end-of-level fight queue.

## Requirements

- Functional: `levels` array has 20 entries; level N (11-20) has identical `length`, `obstacles`, `pickups` to level N-10; each has non-empty `bossSequence`; levels 1-10 have `bossSequence: []` (or undefined) and unchanged behavior.
- Non-functional: no duplication of layout data (DRY — clone from `buildLevel(n-10)`); keep files <200 lines.

## Architecture

New module `js/boss-level-data.js` owns the boss roster + per-level sequence table. `js/level-data.js` imports it and appends 10 cloned levels.

Boss archetype table (module constant):

| key | hp | fireInterval (s) | scale |
|---|---|---|---|
| `nguyen` | 10 | 2.0 | 1 |
| `khoi` | 20 | 1.5 | 1 |
| `father` | 30 | 1.0 | 1 |
| `big-nguyen` | 15 | 1.5 | 1.5 |
| `big-khoi` | 25 | 1.0 | 1.5 |
| `big-father` | 40 | 0.5 | 1.5 |

Per-level sequences (level → ordered queue):

| Level | Sequence |
|---|---|
| 11 | nguyen |
| 12 | khoi |
| 13 | father |
| 14 | nguyen, khoi |
| 15 | nguyen, father |
| 16 | khoi, father |
| 17 | nguyen, khoi, father |
| 18 | nguyen, big-nguyen |
| 19 | khoi, big-khoi |
| 20 | father, big-father |

Each `bossSequence` entry resolves to `{ key, avatar, hp, fireInterval, scale }` where `avatar` is `'nguyen' | 'khoi' | 'father'` (drives which PNG to tint; big variants reuse the same avatar).

## Related Code Files

- Create: `js/boss-level-data.js` — `BOSS_TYPES` const, `BOSS_SEQUENCES` map (level number → key array), `getBossSequence(levelNumber)` returning resolved boss defs (fresh objects, not shared refs).
- Modify: `js/level-data.js` — `LEVEL_COUNT` 10→20; `levels` built as: first 10 via existing `buildLevel(i)`, then 10 more via `{ ...buildLevel(i - 10), number: i, bossSequence: getBossSequence(i) }`. Note: spread copies `pickups`/`obstacles` array refs, but `GameState.resetLevelObjects()` already deep-copies per run, so shared refs between level N and N+10 are safe — verify this stays true.
- Modify: `js/character-level-progress.js` — no code change needed (`clampLevel` uses `LEVEL_COUNT` import); verify clamp now allows 20.

## Implementation Steps

1. Create `js/boss-level-data.js` with `BOSS_TYPES`, `BOSS_SEQUENCES`, `getBossSequence(levelNumber)` (returns `[]` for levels ≤10 or unknown).
2. In `js/level-data.js`: set `LEVEL_COUNT = 20`; refactor `levels` construction to clone levels 1-10 into 11-20 with corrected `number` and attached `bossSequence`.
3. Verify in browser console: `window.__game` levels — `levels.length === 20`, `levels[10].obstacles === levels[0].obstacles`-equivalent content, `levels[19].bossSequence` = father, big-father.
4. Verify `getCharacterLevel` clamp: complete level 10 → progress advances to 11 (was previously clamped at 10).

## Success Criteria

- [ ] `levels.length === 20`; levels 11-20 layouts byte-identical to 1-10
- [ ] `bossSequence` matches the table for all 10 boss levels
- [ ] Levels 1-10 unchanged (no bossSequence / empty)
- [ ] Level progress clamp allows advancing past 10 up to 20
- [ ] No console errors on load; game still playable on level 1

## Risk Assessment

- **Shared layout refs**: levels 11-20 share obstacle/pickup array objects with 1-10. Mitigated: `resetLevelObjects()` maps to fresh copies each run. If any future code mutates `level.obstacles` directly, this breaks — keep clone-per-run invariant.
- **Existing saves**: players with saved progress `10` now see level 10 (not 11) until they clear it again — acceptable, no migration needed.

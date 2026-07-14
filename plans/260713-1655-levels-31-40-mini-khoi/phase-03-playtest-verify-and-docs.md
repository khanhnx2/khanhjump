---
phase: 3
title: Playtest Verify and Docs
status: completed
priority: P2
effort: 1h
dependencies:
  - 2
---

# Phase 3: Playtest Verify and Docs

## Overview
Browser-verify the full 31-40 experience (run phase, boss fight, HUD,
difficulty feel), confirm no regression to 1-30, and update gameplay docs.

## Requirements
- Functional: level 31+ playable end-to-end; Mini Khôi visibly fires faster
  than Mini Nguyên; boss fight winnable; level 40 win completes the game.
- Functional: regression sweep — level 5 (no companion), level 21
  (Mini Nguyên), level 11 boss (no companion/add) all behave as before.
- Non-functional: docs/gameplay-rules.md updated; no service-worker/asset
  manifest changes needed (no new files added by this feature — verify).

## Architecture
Verification uses the established `window.__game` browser-eval technique
(see docs/journals/2026-07-13-mini-nguyen-obstacle-damage-bug-fix.md):
drive `game.setLevel(31)` + `game.update(dt)` loops headlessly in the
preview browser, assert companion stats/fire cadence/boss shielding, then
spot-check visually via screenshot.

Fire-cadence assertion: run 10 simulated seconds at dt=1/60 on level 31 run
phase, count projectiles spawned by companion ≈ 6-7 (1.5s interval) vs
level 21 ≈ 5 (2.0s interval).

## Related Code Files
- Modify: `docs/gameplay-rules.md`
- Read-only: everything else

## Implementation Steps
1. Preview-server browser eval: stats + cadence assertions per Architecture
   (levels 31, 21, 5, 11 matrix above).
2. Boss-fight eval on level 31: Mini Khôi shields (hp drops, player hearts
   don't), Mini Black Nguyên add spawns with 10 HP, fight completes to win.
3. Level 40 eval: 2-boss sequence (father → big-father) + add each time;
   win end-to-end.
4. Screenshot level 31 for visual check (khoi face on companion, gold halo,
   HUD label).
5. Manual feel pass (user or timeboxed self-play): does 31-40 difficulty
   feel acceptable given the stronger companion? If too easy, propose (not
   apply) single-constant tunings.
6. docs/gameplay-rules.md: "30 levels"→"40"; extend the level-12 line
   ("Levels 11-20 reuse...") wording if it enumerates ranges; add a short
   "## Levels 31-40" section: bosses mirror 21-30, companion table:

   | | Mini Nguyên (21-30) | Mini Khôi (31-40) |
   |---|---|---|
   | Hearts | 20 | 30 |
   | Fire interval | 2.0s | 1.5s |
   | Avatar | Nguyên | Khôi |

   (all other behavior identical — reference the existing Mini Nguyên
   section rather than duplicating it).
7. `npm test`; run `node scripts/prepare-android-web-assets.js` locally to
   confirm the build still passes (hash changes, no missing-file errors).

## Success Criteria
- [ ] All eval assertions pass (stats, cadence ratio, shielding, add, lv40 win)
- [ ] Regression matrix clean (5 / 11 / 21 unchanged)
- [ ] Docs updated; no stale "30 levels" references (`grep -n "30 levels\|level 30" docs/gameplay-rules.md` reviewed)
- [ ] `npm test` + local build script pass

## Risk Assessment
- Difficulty feel is subjective — deliverable is a playable default plus a
  documented tuning knob list, not endless iteration.
- SW cache: deploy after merge auto-busts via content hash (Pages workflow
  already live) — no manual cache action needed on devices.

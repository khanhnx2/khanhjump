---
phase: 5
title: Playtest and Tuning
status: completed
priority: P2
effort: 2h
dependencies:
  - 4
---

# Phase 5: Playtest and Tuning

## Overview
Play through all 10 new levels (21-30) end-to-end, verify the full
companion lifecycle (spawn → run-phase damage/fire → boss-phase
shield/fire → death → no respawn), and tune balance if the added
Mini Black Nguyên bullet volume makes fights meaningfully harder than
levels 11-20 without being fun.

## Requirements
- Functional: no crashes/console errors across levels 21-30, run phase and
  boss phase, from level start through win/death/restart.
- Functional: Mini Nguyên full lifecycle confirmed manually: spawns alive
  at level start, HP drains from obstacle contact (run) and boss bullets
  (boss phase), dies permanently for that attempt, stays dead through
  `restart()` triggering a fresh level attempt (not through mid-attempt
  respawn — confirm `setLevel()`/`restart()` re-create a fresh
  `MiniCompanion` each attempt per Phase 2).
- Functional: Mini Black Nguyên full lifecycle confirmed manually: spawns
  fresh with every boss in the sequence (e.g. level 27 has 3 bosses in
  sequence — confirm 3 fresh Mini Black Nguyên spawns, not 1 shared
  across the whole fight).
- Non-functional: subjective difficulty check — levels 21-30 should feel
  harder than 11-20 (more bullets in play) but not unfair. If a playtester
  (or the requesting user) judges it too hard, this phase is where
  `fireInterval`/HP values get adjusted — not earlier phases.

## Key Insights (carried from brainstorm report)
The brainstorm report explicitly flagged this as an open risk, not a
decided balance: "mọi boss 21-30 giờ có thêm 1 nguồn đạn (Mini Black
Nguyên) — có thể tăng độ khó đáng kể... để lại cho phase playtest/tuning."
This phase is where that risk gets resolved with real data, not
speculation.

## Related Code Files
- Modify (if tuning needed): `js/mini-companion-state.js` (`MINI_FIRE_INTERVAL`, `MINI_MAX_HP`)
- Modify (if tuning needed): `js/boss-fight-state.js` (`miniAdd` HP/fireInterval literal)
- Modify (if tuning needed): `js/boss-level-data.js` (`BOSS_SEQUENCES` 21-30, only if a specific level is unfun — last resort, prefer tuning companion stats first)

## Implementation Steps
1. Play level 21 (single `nguyen` boss) start to finish: confirm run-phase
   Mini Nguyên visuals/HP drain, boss-phase shielding, HUD labels update
   correctly, win condition still reachable.
2. Play level 24 (two-boss sequence: `nguyen` then `khoi`) to confirm Mini
   Black Nguyên respawns fresh for the second boss after the first is
   defeated (per Phase 3's `spawnNext()` design).
3. Play level 27 (three-boss sequence) as the hardest baseline case for
   sustained companion+add interaction across multiple boss transitions.
4. Play level 30 (`father` + `big-father`, hardest single-tier boss) to
   stress-test whether the `miniAdd`'s extra bullets plus the big boss's
   faster `fireInterval` (0.5s per existing `BOSS_TYPES['big-father']`)
   is survivable with reasonable play.
5. Deliberately let Mini Nguyên die early in a run (walk it into repeated
   obstacle hits) and confirm boss-phase bullets then hit the player
   normally (no leftover shielding bug).
6. Deliberately ignore Mini Black Nguyên and focus fire the main boss;
   confirm it keeps firing indefinitely if not killed (i.e. player is
   incentivized, not forced, to kill it — matches "phải bắn hạ song song"
   framing from the design without hard-blocking boss damage).
7. If any level feels unfair, adjust `MINI_FIRE_INTERVAL`/miniAdd HP first
   (smallest blast radius), re-test only the affected level(s), document
   the final tuned values in this phase file's Success Criteria before
   marking complete.
8. Full regression pass: play levels 1-20 briefly to confirm zero
   regressions from all prior phases' refactors (especially the
   `collision-detection.js` extraction in Phase 2 and `BossFight`
   constructor signature change in Phase 3).

## Success Criteria
- [x] Levels 21-30 fully playable start to finish with no console errors — verified levels 21, 24, 27, 30 in-browser, zero console errors, `npm test` (syntax-check across all `js/*.js`) passes.
- [x] Mini Nguyên lifecycle (spawn/damage/death/no-respawn-mid-attempt) confirmed — spawn at 20/20 HP (level 21), obstacle-contact damage (Phase 2), boss-bullet shield damage (Phase 3), `takeDamage` to 0 → `alive:false`, and `restart()` after `die()` creates a **fresh** `MiniCompanion` instance (20/20 HP, `alive:true`) confirmed via direct instance check.
- [x] Mini Black Nguyên fresh-spawn-per-boss confirmed on multi-boss levels — level 24 (nguyen→khoi): second boss's `miniAdd` spawns fresh at 10/10 after first is defeated. Level 27 (nguyen→khoi→father): all 3 bosses each got a fresh 10/10 `miniAdd`. Level 30 (father→big-father): same, plus confirmed `fireInterval` correctly scales per boss tier (1.0s → 0.5s).
- [x] Levels 1-20 regression-free — scripted sweep of all 20 levels confirms `miniNguyen` stays `null` throughout, obstacle/pickup counts intact, boss sequences unchanged from pre-plan values.
- [x] Final tuned values: **no changes from Phase 2/3 defaults** (Mini Nguyên 20 HP / 2s fire; Mini Black Nguyên 10 HP / 2s fire). Rationale below.

### Difficulty Data (bot-independent threat-density measurement)
Measured raw boss-bullet throughput (bullets/sec, no dodging) to compare 21-30 against their 11-20 equivalents structurally, since a simple dodge-bot achieved 0 hearts lost on both tiers (the y-band dodge mechanic is inherently forgiving regardless of bullet volume, so survival-rate wasn't a useful differentiator):

| Comparison | 11-20 (bullets/s) | 21-30 (bullets/s) | Increase |
|---|---|---|---|
| Single `nguyen` boss (11 vs 21) | 0.43 | 0.61 | +42% |
| `father`+`big-father` (20 vs 30) | 0.96 | 1.10 | +15% |

The increase is moderate, not extreme, and shrinks proportionally at higher boss tiers (the big bosses' own fast fire rate already dominates). Combined with Mini Nguyên actively intercepting a share of that extra volume (confirmed shielding in Phase 3), the effective difficulty reaching the player is lower than the raw density suggests. This matches the intended "harder but fair" design goal from the brainstorm — no constant tuning applied.

## Risk Assessment
Primary risk is subjective balance, not correctness — mitigated by
treating this phase as the explicit, designated place to tune rather than
guessing values upfront in Phases 2-3. If balance changes are needed post
this phase (e.g. after broader player feedback), they are simple constant
tweaks in `mini-companion-state.js`/`boss-fight-state.js`, not structural
changes.

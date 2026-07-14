---
phase: 4
title: Full Range Verification and Docs
status: completed
priority: P1
effort: 3h
dependencies:
  - 3
---

# Phase 4: Full Range Verification and Docs

## Overview
Verify the full 51-100 range across every mechanic tier (boss fights,
all three companions, finale), run the complete 1-50 regression matrix,
and update gameplay docs.

## Requirements
- Functional: representative inverted levels of every tier verified:
  61 (first boss), 71 (Mini Nguyên), 81 (Mini Khôi), 91 (Mini Father),
  100 (finale: father → big-father + add, inverted).
- Functional: 1-50 regression — physics refactor introduced zero drift.
- Non-functional: docs/gameplay-rules.md documents the inverted world.

## Architecture
Browser-eval driven (established window.__game technique, fresh-port
server, SW/cache cleared). Two comparison pillars:

1. **Mirror-parity sims**: for each pair (N, N+50) run the identical
   scripted input sequence through `game.update(dt)` and assert equal
   outcomes: hearts lost, pickups collected, finish reached, and (boss
   levels) fight result with a seeded rng — the inverted level must
   behave as the exact mirror of its source.
2. **Pre/post regression on 1-50**: rerun the standard matrix used by
   every prior feature (levels 5/11/21/31/41 stats+cadence, boss sims at
   20/30/40/50 under no-dodge stress) and compare against the recorded
   results from the 41-50 feature session (documented in that plan's
   phase-02 and the journals) — any delta is a Phase 1 physics drift bug.

Boss-phase specifics to assert on 61/71/81/91/100: dodge works by
"jumping" downward-screen (toward old floor), Mini Black Nguyên add
spawns/behaves correctly, bullet-origin purge (fromMini) still works.
RED-TEAM CORRECTION (finding 8): "companion shields at inverted
positions" is vacuously true as a sim assertion — bullet interception
checks x ONLY (bullet.y is never read in collision at
boss-fight-state.js:130/152), so shielding "works" even with bullets at
the wrong height while rendering garbage. MANDATORY explicit assertion
instead: every bullet in bossBullets/playerBullets has
`bullet.y === (0.5 normal / WORLD_HEIGHT - 0.5 inverted)`, and
`miniAdd.y === groundY` — direct data checks, not behavioral inference.

## Related Code Files
- Modify: `docs/gameplay-rules.md`
- Read-only: everything else (verification phase; fixes loop back to
  their owning phase)

## Implementation Steps
1. Mirror-parity sims per Architecture (at minimum pairs: 1/51, 11/61,
   21/71, 31/81, 41/91, 50/100).
2. 1-50 regression matrix vs recorded prior results.
3. Boss/companion-specific assertions on 61/71/81/91/100.
4. Screenshots: 61 boss fight, 91 with Mini Father, 100 finale.
5. docs/gameplay-rules.md: "50 levels"→"100"; new section "Levels 51-100
   (Inverted Gravity)" — mirror mapping rule (51≡1 … 100≡50), gravity
   flipped, scene mirrored, all boss/companion mechanics identical;
   unlock cap 50→100; win-condition ranges updated (boss-win becomes
   11-50 plus 61-100 — mind that 51-60 are run-win like 1-10).
6. `npm test`; `node scripts/prepare-android-web-assets.js`.
7. Post-cook gates per project convention: tester + code-reviewer
   subagents, then commit via git-manager, journal.

## Success Criteria
- [ ] All 6 mirror-parity pairs pass
- [ ] 1-50 regression matrix matches recorded pre-feature results exactly
- [ ] Boss/companion assertions pass on 61/71/81/91/100
- [ ] Docs updated with correct win-condition ranges (incl. 51-60 run-win)
- [ ] `npm test` + build script pass

## Risk Assessment
- Mirror-parity is the strongest possible correctness argument available
  without a test framework; if a pair diverges, bisect between physics
  (Phase 1), data transform (Phase 2), and input-script asymmetry before
  touching code.
- Docs win-condition subtlety: 51-60 mirror 1-10 (no bosses) — easy to
  get wrong; called out explicitly in step 5.

---
title: 'Levels 51-100: Inverted Gravity World'
description: >-
  Extend Khôi Jump from 50 to 100 levels. Levels 51-100 fully clone levels 1-50
  (layouts, boss tiers, companion tiers) in an inverted-gravity world: the
  player runs upside-down along the ceiling, the whole scene renders mirrored,
  and all obstacle data is mirror-transformed.
status: completed
priority: P1
branch: main
tags:
  - game
  - physics
  - levels
  - rendering
blockedBy: []
blocks: []
created: '2026-07-14T03:14:58.277Z'
createdBy: 'ck:plan'
source: skill
---

# Levels 51-100: Inverted Gravity World

## Overview

The largest feature in this project's history: the first change to core
physics and rendering, versus all prior extensions which were data-table
additions. Levels 51-100 map to levels 1-50 via `((n - 1) % 50) + 1`
(level 51 ≡ level 1, level 61 ≡ level 11's bosses, level 71 ≡ level 21's
Mini Nguyên, … level 100 ≡ level 50's finale) — everything identical
except gravity points up.

Hard-mode planning: two independent researchers verified the design
against live code, then an adversarial red-team review attacked the
resulting plan and found (and fixed) 2 CRITICALs the researchers missed:
- **Researchers**: SKY_DIR/GROUND_Y algebra sound (identity-reduction
  verified); fly/wings clamp needs an interval-swap, not a sign flip;
  `WORLD_HEIGHT = 5.8` safe against level 50's generated obstacles;
  canvas-level flip viable with corrections.
- **Red-team (verdict: APPROVE-WITH-CHANGES, all changes applied to the
  phase files with markers)**: inverted dodge-band was off by exactly the
  body height (boss softlock); inverted block-landing snapped the player
  inside the block; the flip translate used device pixels inside a
  CSS-pixel transform (blank screen on all dpr>1 phones); the new module
  must be added to the SW APP_SHELL (else offline game bricks); "base
  180° rotate" under the flip composes to a horizontal mirror, not the
  approved upside-down look — replaced with `scale(-1,1)` composition;
  spike mirror closed-form is `y' = WORLD_HEIGHT - ob.y` for BOTH types
  (both researchers' formulas were wrong); bullet.y needs direct
  assertions (interception is x-only, so behavioral sims can't catch a
  wrong bullet height). Structural takeaway baked into phase-01: every
  inverted formula must satisfy the mirror-position invariant
  `y' = WORLD_HEIGHT - 1 - y`, because the identity invariant alone is
  blind to inverted-only bugs.

Design doc: `plans/reports/260714-1010-brainstorm-levels-51-100-inverted-gravity.md`
Researcher reports referenced inline in phase files.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Physics Core SKY_DIR GROUND_Y](./phase-01-physics-core-sky-dir-ground-y.md) | Completed |
| 2 | [Level Data Mirror Transform 51-100](./phase-02-level-data-mirror-transform-51-100.md) | Completed |
| 3 | [Rendering Mirror and Pilot Level](./phase-03-rendering-mirror-and-pilot-level.md) | Completed |
| 4 | [Full Range Verification and Docs](./phase-04-full-range-verification-and-docs.md) | Completed |

## Dependencies

No cross-plan dependencies — all six existing plans `completed`. Phases
strictly sequential (1 → 2 → 3 → 4); Phase 3 is the go/no-go gate: the
pilot level (51) must play correctly end-to-end in the browser before
Phase 4 signs off the remaining 49 levels.

## Non-negotiable invariants

- Levels 1-50 must behave BYTE-IDENTICAL to today. Every SKY_DIR/GROUND_Y
  formula must algebraically reduce to the current code when
  `invertedGravity === false` (SKY_DIR=+1, GROUND_Y=0). Phase 4 regression
  matrix enforces this.
- Zero localStorage/key changes (progress cap auto-raises to 100 via
  existing `clampLevel`).
- No new assets.

## Key risk

Rendering-flip correctness for background layers is the least-verified
part (researcher confidence 40% for "single global transform with zero
per-function fixes"). Phase 3 resolves this empirically on the pilot
level before any bulk work; budget exists there for per-function
background fixes if the global flip misrenders.

## Validation Log

### Verification Results
- **Tier:** Full (4 phases). Most physics/data claims were already
  code-verified by the hard-mode red-team pass (see Overview); this pass
  covered the remainder.
- **Claims checked:** 12 | **Verified:** 12 | **Failed:** 0
- [Fact Checker] `view.height` = CSS-pixel height (main.js:60) — resolves
  phase-03's `viewCssHeight` TODO; scene render spans main.js:151-169
  (single clean wrap point for the flip). player-cube constructor-calls-
  reset ordering trap confirmed real (player-cube.js:20-22).
- [Flow Tracer] Existing `((n-1) % LAYOUT_COUNT)+1` layout formula yields
  the correct source layout for ALL n (61→layout 1 = level 11's layout ✓)
  — phase-02's per-level mirror needs no layout-formula change, only the
  boss/companion modulo additions.
- [Contract Verifier] `new BossFight(` single call site; `resolveCollisions`
  2 params today — phase-01's added params are default-valued, backward
  compatible. Red-team previously verified all line-level formula
  reductions.
- [Scope Auditor] clampLevel/leaderboard/build-script all LEVEL_COUNT-
  agnostic (red-team verified); no storage keys touched anywhere in plan.

### Interview (1 question)
1. **Phase-3 pilot: pause for manual playtest before Phase 4?** →
   No — automated verification suffices; run all 4 phases continuously.
   User playtests after completion. (Recorded so cook does NOT insert a
   human-approval stop at the Phase 3/4 boundary.)

### Whole-Plan Consistency Sweep
- Files reread: plan.md + all 4 phase files (post-red-team edits)
- Stale terms: superseded formulas appear only inside "this was WRONG"
  explanations adjacent to their corrections — intentional, kept
- Decision deltas this session: 1 (viewCssHeight → view.height, phase-03
  only, no propagation needed)
- Unresolved contradictions: 0

**Recommendation:** Proceed to implementation (/ck:cook).

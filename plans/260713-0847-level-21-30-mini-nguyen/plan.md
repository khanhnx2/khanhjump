---
title: 'Level 21-30: Mini Nguyên Companion + Mini Black Nguyên'
description: >-
  Extend Khanh Jump from 20 to 30 levels. Levels 21-30 reuse layouts 1-10 and
  boss roster 11-20 (Black Nguyên/Khôi/Father), and add a flying player
  companion (Mini Nguyên, 20 HP, fires every 2s, shields boss bullets) plus a
  mirrored enemy add (Mini Black Nguyên, 10 HP) that spawns alongside every
  boss.
status: completed
priority: P2
branch: main
tags:
  - game
  - canvas
  - boss-fight
  - companion
blockedBy: []
blocks: []
created: '2026-07-13T01:48:56.324Z'
createdBy: 'ck:plan'
source: skill
---

# Level 21-30: Mini Nguyên Companion + Mini Black Nguyên

## Overview

Levels 21-30 mirror the level-11-20 pattern exactly (layout cycle + boss
roster) but add two new companion units on top:

- **Mini Nguyên** (ally): flies behind the player during the run, in front
  during boss fights to soak bullets. 20 HP, no regen, fires 1 bullet/2s,
  dies permanently once HP hits 0 for that level attempt.
- **Mini Black Nguyên** (enemy add): spawns alongside every main boss in
  21-30, 10 HP, fires 1 bullet/2s, is an independent kill target for the
  player's boss-fight bullets.

Full design rationale and confirmed answers are in the brainstorm report:
`plans/reports/260713-0847-brainstorm-level-21-30-mini-nguyen.md`.

Reference implementation: `plans/260712-1930-boss-levels-11-20/` — same
codebase, same file set, this plan extends it rather than replacing it.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Level Data Extension 21-30](./phase-01-level-data-extension-21-30.md) | Completed |
| 2 | [Mini Companion State](./phase-02-mini-companion-state.md) | Completed |
| 3 | [Boss Fight Mini-Add Integration](./phase-03-boss-fight-mini-add-integration.md) | Completed |
| 4 | [Rendering and HUD](./phase-04-rendering-and-hud.md) | Completed |
| 5 | [Playtest and Tuning](./phase-05-playtest-and-tuning.md) | Completed |

## Dependencies

None — prior plans (`260707-0830-geometry-dash-web-clone-mvp`,
`260712-1930-boss-levels-11-20`) are both `completed`, no overlap conflicts.
Phases within this plan are sequential: 1 → 2 → 3 → 4 → 5.

## Validation Log

### Verification Results
- **Tier:** Full (5 phases → all 4 roles, 15+ claims sampled)
- **Claims checked:** 18 | **Verified:** 18 | **Failed:** 0 | **Unverified:** 0
- [Fact Checker] `js/game-state.js`, `js/collision-detection.js`, `js/projectile-collision.js`, `js/boss-fight-state.js`, `js/boss-renderer.js`, `js/power-up-renderer.js`, `js/player-cube.js`, `js/hud-progress.js`, `index.html` — all cited symbols/paths/line ranges exist as described.
- [Contract Verifier] `new BossFight(` — exactly 1 call site (`js/game-state.js:174`), matches plan's Phase 3 constructor-signature-change claim. No test files exist in the repo (`package.json`'s `test` script only runs `node --check` syntax validation) — zero test-file update risk.
- [Flow Tracer] `main.js` render() order confirmed (background→floor→pickups→obstacles→projectiles→finish→boss block→player→particles); `GameState.update()`/`updateBossFight()` call chains match Phase 2/3 architecture as written.
- [Scope Auditor] `GameState` is a single module-level instance (`js/main.js:88`); adding `this.miniNguyen` follows the same per-session mutable-state pattern as existing `this.hearts`/`this.ammo` — no cross-request/shared-state leak risk (client-side single-tab game).

### Interview (2 questions)
1. **Mini Nguyên run-phase bullets destroy obstacles?** → Yes, reuses the shared `projectiles`/`findProjectileHit` pipeline exactly as Phase 2 already specified — confirmed, no plan change needed.
2. **Additional questions before cook?** → None, plan approved as-is.

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01 through phase-05 (all 5)
- Decision deltas checked: 1 (Phase 4 Implementation Steps rewritten with verified line numbers/render order — no naming/contract changes, so no propagation needed to other phases)
- Reconciled stale references: 1 (phase-03 `this.level21to30Flag` → `this.hasMiniAdd`, fixed pre-validation)
- Unresolved contradictions: 0

**Recommendation:** Proceed to implementation.

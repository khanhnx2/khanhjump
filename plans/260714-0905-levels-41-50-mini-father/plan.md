---
title: 'Levels 41-50: Mini Father Companion'
description: >-
  Extend Khôi Jump from 40 to 50 levels. Levels 41-50 mirror 31-40 (layouts,
  boss roster, Mini Black Nguyên add) with the ally companion upgraded to Mini
  Father: 40 HP, fires every 1.0s, father avatar.
status: completed
priority: P2
branch: main
tags:
  - game
  - companion
  - levels
blockedBy: []
blocks: []
created: '2026-07-14T01:37:09.905Z'
createdBy: 'ck:plan'
source: skill
---

# Levels 41-50: Mini Father Companion

## Overview

Fourth level-range extension. Thanks to the COMPANION_TYPES
parameterization shipped with 31-40 (commit 10f29cd), this is a pure
data-table change: game-state, boss-renderer, HUD, and boss-fight all read
stats/avatar/label from the companion instance and need ZERO edits.

Companion progression: nguyen 20 HP/2.0s (21-30) → khoi 30 HP/1.5s (31-40)
→ **father 40 HP/1.0s (41-50)**. Behavior identical across all three.
Bosses 41-50 mirror 31-40 exactly incl. the Mini Black Nguyên add.

Design doc: `plans/reports/260714-0900-brainstorm-levels-41-50-mini-father.md`.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Data Extension and Docs](./phase-01-data-extension-and-docs.md) | Completed |
| 2 | [Verify and Regression](./phase-02-verify-and-regression.md) | Completed |

## Dependencies

None — all five existing plans are `completed`. Phases sequential: 1 → 2.

## Known Trade-off (accepted)

41-50 boss fights easier again vs 31-40 (companion is a stronger
shield with 2x nguyen's DPS). Intentional progression-reward design per
user; single-constant tuning available if the Phase 2 feel-check
disagrees.

---
title: 'Levels 31-40: Mini Khôi Companion'
description: >-
  Extend Khôi Jump from 30 to 40 levels. Levels 31-40 reuse layouts 1-10 and
  mirror the boss roster of 21-30 (incl. Mini Black Nguyên add), but upgrade the
  ally companion from Mini Nguyên to Mini Khôi: 30 HP (+10) and fires every 1.5s
  (0.5s faster).
status: completed
priority: P2
branch: main
tags:
  - game
  - canvas
  - companion
  - levels
blockedBy: []
blocks: []
created: '2026-07-13T09:11:44.961Z'
createdBy: 'ck:plan'
source: skill
---

# Levels 31-40: Mini Khôi Companion

## Overview

Third level-range extension, same pattern as 11-20 and 21-30. Everything
about levels 31-40 mirrors 21-30 (layouts auto-cycle 1-10; boss sequences
identical incl. the Mini Black Nguyên add at 10 HP / 2s) except the ally
companion: Mini Khôi replaces Mini Nguyên with 30 HP and a 1.5s fire
interval, avatar `player-khoi.png` (already in repo). All other companion
behavior is identical — flies behind the player, obstacle-immune during
the run, shields boss bullets, bullets destroy obstacles, permanent death
at 0 HP, fresh instance on restart.

Approach: parameterize the existing `MiniCompanion` class with a
`COMPANION_TYPES` table keyed by `'nguyen'` / `'khoi'` — no new class.
The level flag `hasMiniNguyen` (boolean) becomes `companionType`
(string | null). Internal rename only; zero impact on player localStorage
(see docs/deployment-guide.md "Storage Stability" — no keys touched, and
`clampLevel` automatically raises the progress cap to 40).

Design rationale + confirmed answers:
`plans/reports/260713-1650-brainstorm-levels-31-40-mini-khoi.md`.
Reference implementations: `plans/260713-0847-level-21-30-mini-nguyen/`.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Level Data 31-40 and Companion Types](./phase-01-level-data-31-40-and-companion-types.md) | Completed |
| 2 | [Companion Wiring Rendering HUD](./phase-02-companion-wiring-rendering-hud.md) | Completed |
| 3 | [Playtest Verify and Docs](./phase-03-playtest-verify-and-docs.md) | Completed |

## Dependencies

No cross-plan dependencies — all four existing plans are `completed`.
Phases sequential: 1 → 2 → 3.

## Known Trade-off (accepted)

31-40 boss fights are slightly EASIER than 21-30 (stronger shield, faster
companion DPS, same bosses). Accepted in brainstorm; Phase 3 playtest
confirms it feels okay, tuning limited to single constants if not.

---
title: Boss Levels 11-20 (Black Family Fights)
description: >-
  Extend Khanh Jump from 10 to 20 levels. Levels 11-20 reuse layouts 1-10
  exactly, then add an end-of-level boss fight vs dark-tinted Black
  Nguyên/Khôi/Father with jump-to-dodge bullet combat.
status: completed
priority: P2
branch: main
tags:
  - game
  - canvas
  - boss-fight
blockedBy: []
blocks: []
created: '2026-07-12T12:30:34.707Z'
createdBy: 'ck:plan'
source: skill
---

# Boss Levels 11-20 (Black Family Fights)

## Overview

Levels 11-20 clone layouts of levels 1-10 (11=1 … 20=10) — no new layouts. Reaching the finish line no longer wins instantly; instead player locks in place (jump-only) and fights a queued sequence of Black bosses (dark-tinted Nguyên/Khôi/Father avatars). Both sides auto-fire ground-height bullets; jumping dodges. Win fires only after the last boss dies. Design agreed in brainstorm session 2026-07-12 (all mechanics confirmed by user via AskUserQuestion).

**Key confirmed decisions:**
- Boss sequences per level 11-20 incl. "Big" variants at 18-20 (1.5x size, own HP/fire-rate)
- Bullets fly at fixed low band; airborne target dodges (both directions)
- Player hearts carry over from the run (no reset at boss fight)
- Death during boss → full level restart from x=0 (existing `restart()`)
- Dark avatars = canvas tint over existing PNGs, no new assets
- Player boss-gun: 1 shot / 0.5s, infinite ammo, separate from pickup gun

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Level Data Extension 11-20](./phase-01-level-data-extension-11-20.md) | Completed |
| 2 | [Boss Fight Core State](./phase-02-boss-fight-core-state.md) | Completed |
| 3 | [Boss Rendering And HUD](./phase-03-boss-rendering-and-hud.md) | Completed |
| 4 | [Integration Verification And Docs](./phase-04-integration-verification-and-docs.md) | Completed |

## Dependencies

None (prior plan 260707-0830-geometry-dash-web-clone-mvp is completed).
Phase order: 1 → 2 → 3 → 4 (each builds on prior).

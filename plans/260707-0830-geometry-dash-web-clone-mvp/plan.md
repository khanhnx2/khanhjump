---
title: Geometry Dash Web Clone MVP
description: >-
  Minimal playable Geometry Dash clone: vanilla JS + Canvas 2D, 1 level, cube
  mode
status: completed
priority: P2
branch: ''
tags:
  - game
  - canvas
  - vanilla-js
blockedBy: []
blocks: []
created: '2026-07-07T01:29:12.890Z'
createdBy: 'ck:plan'
source: skill
---

# Geometry Dash Web Clone MVP

## Overview

Build Khanh Jump, a Geometry Dash-inspired runner for web and Android. Vanilla JS + Canvas 2D with Capacitor Android packaging. Current scope: 1 level, character selection, hearts, pickups, power-ups, Top Ten scoring, and Android debug APK builds.

Approved design: [brainstorm report](./reports/brainstorm-260707-geometry-dash-web-clone-mvp.md)

**Key decisions (user-approved, do not reverse without asking):**
- Stack: vanilla JS + Canvas 2D (NOT Phaser, NOT TS/Vite)
- Features: core gameplay + progress bar/attempts + procedural music + visual effects (particles, rotation, parallax), hearts, character pickups, wings, auto-fire gun, Top Ten
- Out of scope: ship/wave modes, portals, beat-sync, editor, persistence, dedicated mobile UX

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Core Engine & Physics](./phase-01-core-engine-physics.md) | Completed |
| 2 | [Visuals HUD & Audio](./phase-02-visuals-hud-audio.md) | Completed |
| 3 | [Level Design & Playtest Tuning](./phase-03-level-design-playtest-tuning.md) | Completed |

## Dependencies

None (greenfield, empty repo). Phase 2 blocked by 1; Phase 3 blocked by 2.

## Architecture Summary

```
index.html / styles.css
js/
├── main.js                 # rAF loop, dt capped, DOM wiring
├── game-state.js           # ready → playing → dead/win, hearts, pickups, projectiles
├── player-cube.js          # gravity, jump/fly, rotation
├── level-data.js           # level length, obstacles, pickups
├── obstacle-renderer.js    # spikes + blocks drawing
├── power-up-renderer.js    # wings, gun, character pickups, projectiles
├── collision-detection.js  # AABB blocks; shrunk spike hitbox
├── background-parallax.js  # layers + grid floor
├── particle-effects.js     # death burst, trail
├── hud-progress.js         # progress %, attempts, hearts
├── leaderboard.js          # local Top Ten
└── audio-manager.js        # procedural music + mute
```

Each source file stays under 200 lines. Camera scrolls at fixed speed; cube fixed on X.

## Success Metrics

- Full playthrough possible; lose only when hearts reach 0
- Runs start with 10 hearts; Father adds 2 hearts, Khôi/Nguyên add 1 heart, max 10
- Wings provide 3 seconds of hold-to-fly; gun auto-fires for 3 seconds at 1 shot every 0.5 seconds
- Progress bar + attempts accurate; music loops/restarts/mutes
- 60fps average hardware; no unfair deaths (spike hitbox ~40% smaller)

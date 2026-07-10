# Brainstorm Report — Geometry Dash Web Clone MVP

**Date:** 2026-07-07 | **Status:** Approved by user

## Problem Statement

Build minimal playable Geometry Dash clone for web browser. Empty repo (`/home/khanhmint/Projects/geometry dash`), greenfield project.

## Confirmed Requirements (user-approved)

- **Platform:** web browser
- **Stack:** Vanilla JS + Canvas 2D, no build tools, no dependencies. Static server needed only for audio (autoplay/file:// restriction)
- **MVP scope:** 1 level, cube mode only
- **Features (all confirmed):**
  1. Core: auto-run cube, jump (space/click/tap), spikes + blocks, die → instant restart, finish line
  2. Progress bar (%) + attempt counter
  3. Background music: loop, restart on death, mute button. Play only after first user input (autoplay policy)
  4. Visual effects: death particles, cube rotation on jump, parallax background

## Evaluated Approaches

| Approach | Verdict |
|---|---|
| Vanilla JS + Canvas 2D | **CHOSEN** — zero deps, game simple enough for hand-rolled physics (~few hundred lines), max learning, easiest debug |
| Phaser 3 | Rejected for MVP — API learning curve + bundler overhead not justified at this scope |
| TS + Vite | Rejected — adds tooling; revisit if project grows |

## Architecture (each file < 200 lines, kebab-case)

```
index.html                  # Canvas + UI overlay
styles.css
js/
├── main.js                 # rAF game loop, init
├── game-state.js           # ready → playing → dead → win
├── player-cube.js          # gravity, jump velocity, 90° rotation per jump
├── level-data.js           # level 1 as obstacle array {type, x, y} — data/logic separation
├── obstacle-renderer.js    # draw spikes (triangles) + blocks, hitboxes
├── collision-detection.js  # AABB blocks; shrunk hitbox (~40%) for spikes
├── background-parallax.js  # multi-layer scroll + grid floor
├── particle-effects.js     # death burst, cube trail
├── hud-progress.js         # progress %, attempts
└── audio-manager.js        # loop, restart-on-death, mute
```

## Key Technical Decisions

1. **Camera scrolls at fixed speed; cube fixed on X axis.** Jump = set velocityY; gravity pulls down. No physics engine.
2. **Two collision rules (GD-authentic):** touch spike = death; touch block side = death; land on block top = stand.
3. **Level = pure data** (JSON array). Adding level 2 / editor later needs no engine change.
4. **Delta-time capped** in loop → no tunneling through spikes on lag frames.
5. **Physics tuning targets:** jump ≈ 2 tiles high, ≈ 3.5 tiles horizontal distance (GD-original ratios).

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Unfair deaths | Spike hitbox ~40% smaller than sprite; playtest-tune gravity/jump |
| Audio autoplay blocked | Music starts on first click/space (game start) |
| Boring level | Difficulty ramp: single jump → double jump → spike chains; ~30–45s length |

## Out of Scope (this round)

Ship/wave modes, portals, beat-synced obstacles, level editor, score persistence, dedicated mobile touch UX.

## Success Criteria

- Full playthrough of 1 level (~30–45s) possible
- Death → instant restart with particle effect
- Progress bar + attempt counter accurate
- Music loops, restarts on death, mutable
- 60fps on average hardware

## Next Steps

1. `/ck:plan` from this report → phased implementation plan
2. Implement → test in browser → playtest tuning pass

## Unresolved Questions

- Music track source: need royalty-free track (or user provides). Placeholder silent-ok fallback acceptable for MVP.

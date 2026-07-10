---
phase: 1
title: Core Engine & Physics
status: completed
priority: P1
effort: 4h
dependencies: []
---

# Phase 1: Core Engine & Physics

## Overview

Playable skeleton: cube auto-runs, jumps, loses hearts on spikes/block-sides, lands on block-tops, reaches finish line. Everything else builds on this.

## Requirements

- Functional: jump via Space/click/tap; obstacle hit removes 1 heart; heart 0 → game over; finish line → win state
- Non-functional: 60fps; dt capped (max ~33ms) to prevent tunneling; each file < 200 lines

## Architecture

- **Coordinate system:** world units = tiles (1 tile = cube size, render at ~40px). Camera X advances at fixed speed (~10.4 tiles/s ≈ GD 1x speed). Cube world-X advances with camera; screen-X fixed (~25% viewport width).
- **Physics:** velocityY += gravity*dt; jump sets velocityY = JUMP_V. Initial tuning: jump apex ≈ 2 tiles high, ≈ 3.5 tiles horizontal. Derive: gravity ≈ 2*h*(v/x_half)², tune in Phase 3.
- **Collision rules:**
  - Spike: damage. Hitbox = center box ~40% of tile.
  - Block side (cube right edge vs block left edge, cube bottom below block top + tolerance): damage.
  - Block top (falling, cube bottom within snap tolerance of block top): land, stand, can jump.
  - Floor: y=0 ground line, always standable.
- **State machine (`game-state.js`):** `ready` (press to start) → `playing` → `dead` when hearts reach 0; tap retries from `dead`; `playing` → `win`.
- **Game loop (`main.js`):** rAF, `update(dt)` then `render(ctx)`, dt = min(now-last, 33ms).

## Related Code Files

- Create: `index.html`, `styles.css`, `js/main.js`, `js/game-state.js`, `js/player-cube.js`, `js/level-data.js`, `js/obstacle-renderer.js`, `js/collision-detection.js`

## Implementation Steps

1. `index.html` + `styles.css`: fullscreen canvas, resize handler, load scripts (ES modules).
2. `main.js`: rAF loop with capped dt, wires modules together.
3. `player-cube.js`: constants (TILE, SPEED, GRAVITY, JUMP_V), update (gravity, ground clamp), jump(), grounded flag. Hold-to-jump: re-jump immediately if input held while grounded (GD behavior).
4. `level-data.js`: obstacle array `{type: 'spike'|'block', x, y}` in tile coords + `levelLength`. Include short test strip (5-6 obstacles) for this phase.
5. `collision-detection.js`: AABB helpers, spike shrunk-hitbox check, block side-vs-top resolution with snap tolerance (~0.25 tile).
6. `obstacle-renderer.js`: spike = triangle, block = square, finish line = vertical bar. Cull off-screen obstacles.
7. `game-state.js`: state machine + input binding (keydown Space, mousedown, touchstart; preventDefault on touch). Restart resets player + camera.
8. Manual test: serve via `python3 -m http.server`, verify all success criteria in browser.

## Success Criteria

- [ ] Cube auto-runs, jumps on Space/click/tap, lands back on floor
- [ ] Touching spike or block side → lose 1 heart and remove that obstacle
- [ ] Landing on block top → stands, can jump off
- [ ] Crossing finish line → win state shown
- [ ] No tunneling through obstacles when tab lags (test by throttling)

## Risk Assessment

- **Collision side-vs-top ambiguity** (highest risk): resolve by comparing previous-frame position — if cube bottom was above block top last frame, it's a landing; else side death.
- **Input double-fire (touchstart + mousedown):** preventDefault on touchstart.

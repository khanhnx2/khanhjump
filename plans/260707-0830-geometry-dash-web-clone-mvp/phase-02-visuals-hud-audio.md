---
phase: 2
title: Visuals HUD & Audio
status: completed
priority: P2
effort: 3h
dependencies:
  - 1
---

# Phase 2: Visuals HUD & Audio

## Overview

Make it look/sound like Geometry Dash: parallax background, cube rotation, particles, progress HUD, looping music.

## Requirements

- Functional: progress %, attempt counter, death particles, jump rotation, parallax bg, music loop + restart-on-death + mute button
- Non-functional: still 60fps (particle pool, no per-frame allocation storms); music only starts after first user input (autoplay policy)

## Architecture

- **`background-parallax.js`:** 2-3 gradient/shape layers scrolling at 0.2x/0.5x camera speed + grid floor scrolling at 1x. Solid color fills, no image assets.
- **Cube rotation (in `player-cube.js`):** airborne → rotate continuously to complete ~180°/jump arc; on land → snap to nearest 90°.
- **`particle-effects.js`:** fixed-size pool (~60). Death = radial burst of squares; playing = small trail behind cube when grounded.
- **`hud-progress.js`:** top-center progress bar (cameraX/levelLength), "Attempt N" text at level start (increments per death), DOM overlay for mute button.
- **`audio-manager.js`:** single `<audio>` element, loop=true; play on game start (first input), `currentTime=0` + play on restart; mute toggles `muted`. Missing audio file → silent no-op, no errors.

## Related Code Files

- Create: `js/background-parallax.js`, `js/particle-effects.js`, `js/hud-progress.js`, `js/audio-manager.js`, `assets/music.mp3` (royalty-free placeholder)
- Modify: `js/main.js` (wire modules), `js/player-cube.js` (rotation), `js/game-state.js` (attempt counter, audio hooks), `index.html`, `styles.css`

## Implementation Steps

1. `background-parallax.js`: layered rects/shapes, parametrized scroll factors; render before obstacles.
2. Cube rotation in `player-cube.js`; render rotation via ctx.translate/rotate.
3. `particle-effects.js`: pool, spawn burst on death event, trail on grounded frames.
4. `hud-progress.js`: progress bar + attempts; wire death event to increment.
5. `audio-manager.js` + mute button (DOM, top-right); source royalty-free loop track (e.g. from incompetech/pixabay), fallback silent if file absent.
6. Wire all into `main.js` render/update order: bg → obstacles → particles → player → HUD.
7. Manual test in browser: verify criteria + fps via devtools performance tab.

## Success Criteria

- [ ] Parallax layers scroll at different speeds; grid floor scrolls with world
- [ ] Cube rotates in air, lands flush at 90° increments
- [ ] Death shows particle burst before restart
- [ ] Progress % accurate (0 at start, 100 at finish line); attempts increment per death
- [ ] Music starts on first input, loops, restarts from 0 on death, mute works
- [ ] No console errors when music file missing

## Risk Assessment

- **GC stutter from particles:** fixed pool, reuse objects.
- **Audio restart lag on death:** acceptable for MVP; if noticeable, defer restart to respawn moment.

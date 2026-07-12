---
phase: 3
title: Boss Rendering And HUD
status: completed
priority: P2
effort: 2h
dependencies:
  - 2
---

# Phase 3: Boss Rendering And HUD

## Overview

Draw the boss (dark-tinted avatar cube, 1.5x for Big variants), boss bullets, and a boss HP bar. Hook boss events into particles and audio. No new image assets — tint existing PNGs at draw time.

## Requirements

- Functional:
  - Boss rendered as a cube like the player: dark body fill, avatar image with dark overlay, sized `scale * TILE` (40px normal, 60px Big), standing 6 tiles ahead, hopping animation from its physics y.
  - Boss bullets visually distinct from player bullets (e.g. red/purple vs existing yellow).
  - Boss HP shown during fight (hearts count or bar with `hp/maxHp`), disappears outside `'boss'` state; updates on every hit; resets styling per new boss in queue.
  - Boss defeat → particle burst at boss position (reuse `ParticleSystem.burst`); play existing damage/land sound or short cue via `AudioManager` (reuse existing sounds only — no new audio work).
- Non-functional: rendering isolated in `js/boss-renderer.js`; avatar tint cached (don't re-tint every frame).

## Architecture

`js/boss-renderer.js`:
- `drawBoss(ctx, boss, view)` — cube: dark fill (`#1a1a2e`-ish), avatar PNG drawn then `rgba(0,0,0,0.55)` overlay rect clipped to image area (cheap, no offscreen canvas needed; if per-frame overlay is fine perf-wise, skip caching — KISS. Only cache to offscreen canvas if profiling shows cost).
- `drawBossBullets(ctx, bullets, view)` — mirror of `drawProjectiles` with hostile palette.
- Avatar images: reuse `characterImages` map — export it from `power-up-renderer.js` (avoid double-loading PNGs).

HP display: DOM element like heart bar. Add `<div id="boss-hp">` to `index.html`; `Hud` gains `updateBossHp(game)` — shows `Black Nguyên ♥ x10` style text (name from avatar key + Big prefix), hidden unless state `'boss'`. Boss display names map lives in boss-renderer or hud (single source: put `BOSS_LABELS` in `js/boss-level-data.js` next to types).

`main.js` `render()`: when `game.state === 'boss'` (and during fight while `'playing'` transition) draw boss, boss bullets, player bullets (existing `drawProjectiles` works if boss-fight player bullets share `{x, y}` shape — reuse it).

## Related Code Files

- Create: `js/boss-renderer.js` (~80 lines).
- Modify: `js/power-up-renderer.js` — export `characterImages`.
- Modify: `js/hud-progress.js` — boss HP element show/hide/update.
- Modify: `js/main.js` — render hooks; `bossDefeated` → `particles.burst(boss.x, boss.y)`; `bossStart`/`bossDefeated` audio via existing `AudioManager` events.
- Modify: `index.html` — `#boss-hp` element + minimal CSS (reuse heart-bar styling).
- Modify: `js/audio-manager.js` — only if wiring existing sounds to new events requires a listener registration (reuse existing tones).

## Implementation Steps

1. Export `characterImages` from `power-up-renderer.js`; create `boss-renderer.js` with `drawBoss` + `drawBossBullets` (dark tint overlay, scale support).
2. Add `#boss-hp` DOM + CSS; extend `Hud.update` to sync boss name + HP each frame during `'boss'` state.
3. Wire `main.js`: render boss layer between obstacles and player; particles on `bossDefeated`; hide/show HP element on `bossStart`/`win`/`death`.
4. Wire audio: `bossStart` and `bossDefeated` reuse existing sound methods (e.g. powerup/damage cues).
5. Visual check on level 11 and 18 (Big variant scale) — desktop + narrow viewport.

## Success Criteria

- [ ] Boss visibly dark-tinted version of correct avatar; Big variant clearly 1.5x
- [ ] Boss hop animates; bullets from both sides visible and distinct
- [ ] Boss HP label correct per boss, updates per hit, swaps on queue advance, hidden outside fights
- [ ] Defeat burst + sound fire; no console errors; 60fps maintained

## Risk Assessment

- **Custom-character avatars**: bosses always use the 3 default PNGs regardless of player's selected/custom character — by design (bosses are Nguyên/Khôi/Father).
- **Tint perf**: overlay rect per frame is 3 draw calls — negligible. Don't prematurely add offscreen caching.
- **Camera**: player x frozen → camera frozen (`view.cameraX = player.x`), boss at +6 tiles is on-screen at anchorX 25% width. Verify on narrow mobile (375px): 6 tiles = 240px + 100px anchor < 375px ✓; Big boss right edge at 6+1.5 tiles = 340px ✓ — still confirm visually.

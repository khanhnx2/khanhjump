---
phase: 4
title: Rendering and HUD
status: completed
priority: P2
effort: 2h
dependencies:
  - 3
---

# Phase 4: Rendering and HUD

## Overview
Render Mini Nguyên (glowing, non-tinted, half-scale companion, both run and
boss phase) and Mini Black Nguyên (reuses existing `drawBoss` dark-tint
path). Add HUD HP labels for both so players can see their state at a
glance.

## Requirements
- Functional: Mini Nguyên renders at half tile size, with a pulsing "hào
  quang" halo (same visual language as the existing player shield ring),
  using the player's own face image (`player-nguyen.png`) — no dark tint.
- Functional: Mini Nguyên is not rendered once `alive === false`.
- Functional: Mini Black Nguyên renders via the existing `drawBoss()` (dark
  tint, half scale) — no new draw function needed for it.
- Functional: HUD shows a Mini Nguyên HP label (e.g. `Mini Nguyên ♥ 12/20`)
  whenever `game.miniNguyen` exists and is alive; hidden otherwise.
- Functional: HUD shows a Mini Black Nguyên HP label during boss fights
  when `game.bossFight.miniAdd` exists and is alive; hidden otherwise.
- Non-functional: no new image assets — reuse `characterImages.nguyen`
  (already loaded via `power-up-renderer.js`) for Mini Nguyên's face and the
  existing `drawBoss` dark-tint trick for Mini Black Nguyên.

## Architecture
`js/boss-renderer.js` (currently 54 lines) gains `drawCompanion(ctx,
companion, view)`:
- Mirrors `drawBoss`'s screen-space math (`worldToScreenX/Y`, `TILE * scale`
  sizing) but:
  - No `#1a1a2e` fill background block, no `rgba(0,0,0,0.55)` dark overlay
    — draws `characterImages.nguyen` directly, clipped to a circle or
    square inset (match existing player face-clip style from
    `player-cube.js`'s `draw()`).
  - Adds a pulsing halo ring before the face draw, reusing the exact
    pattern from `player-cube.js:92-101` (`Math.sin(performance.now() /
    120)`-based alpha pulse, cyan/gold-ish stroke — pick a color that
    reads as "aura" and doesn't clash with the existing cyan shield ring,
    e.g. warm gold `rgba(255, 210, 120, ...)`).
- Called from the main render loop (`js/main.js`) wherever `drawBoss` is
  already called, guarded by `game.miniNguyen && game.miniNguyen.alive`.

`js/main.js` render wiring: find the existing boss-draw call site and add
a sibling call `if (game.miniNguyen && game.miniNguyen.alive)
drawCompanion(ctx, game.miniNguyen, view);` — needs to run both in the
`playing` state (run phase) and `boss` state, since Mini Nguyên is visible
in both.

`js/hud-progress.js` changes:
- Add `this.miniHp = document.getElementById('mini-hp');` and
  `this.miniAddHp = document.getElementById('mini-add-hp');` (new DOM
  elements — add matching `<div>`s to `index.html` near the existing
  `boss-hp`/`heart-bar` elements, styled via existing CSS conventions in
  `styles.css`).
- `update(dt)`: add `this.updateMiniHp(); this.updateMiniAddHp();`
- `updateMiniHp()`: mirrors `updateBossHp()` — hide if `!game.miniNguyen ||
  !game.miniNguyen.alive`, else show `Mini Nguyên ♥ {hp}/{MINI_MAX_HP}`.
- `updateMiniAddHp()`: hide if not in boss state or no live `miniAdd`, else
  show `Mini Black Nguyên ♥ {hp}/{maxHp}`.

## Related Code Files
- Modify: `js/boss-renderer.js` (add `drawCompanion`)
- Modify: `js/main.js` (call `drawCompanion` in render loop)
- Modify: `js/hud-progress.js` (add Mini Nguyên / Mini Black Nguyên HP labels)
- Modify: `index.html` (add `#mini-hp` / `#mini-add-hp` elements)
- Modify: `styles.css` (minor styling for new HUD labels, matching existing `#boss-hp`/`#heart-bar` style)

## Implementation Steps
1. `js/main.js`'s `render()` (verified: lines 149-167) draws in this order:
   background → floor → pickups → obstacles → projectiles → finish line →
   `if (game.state === 'boss' && game.bossFight) { drawBoss; drawBossBullets;
   drawProjectiles(playerBullets) }` → `if (game.state !== 'dead')
   game.player.draw(...)` → particles. Add two guarded calls:
   - Run phase: right after `game.player.draw(...)`, add
     `if (game.miniNguyen && game.miniNguyen.alive) drawCompanion(ctx,
     game.miniNguyen, view);` — draws on top of player, reads correctly
     since it trails behind in world-x (`-0.8`) but z-order (draw order)
     doesn't need to match world-x order for a 2D overlay.
   - Boss phase: inside the existing `if (game.state === 'boss' &&
     game.bossFight)` block, after `drawBoss(ctx, game.bossFight.boss,
     view)`, add `if (game.bossFight.miniAdd) drawBoss(ctx,
     game.bossFight.miniAdd, view);` (reuses `drawBoss` directly — `miniAdd`
     already matches the `{avatar, scale, x, y}` shape `drawBoss` expects)
     and `if (game.miniNguyen && game.miniNguyen.alive) drawCompanion(ctx,
     game.miniNguyen, view);`.
2. `index.html` (verified: line 24 `#heart-bar`, line 25 `#boss-hp
   class="hidden"`) — add `<div id="mini-hp" class="hidden" aria-label="Mini
   Nguyên health"></div>` and `<div id="mini-add-hp" class="hidden"
   aria-label="Mini Black Nguyên health"></div>` near line 25, following the
   same `class="hidden"` toggle convention `updateBossHp()` already uses.
3. Implement `drawCompanion()` in `js/boss-renderer.js`, reusing the halo
   pattern verified at `player-cube.js:92-101` (`pulse =
   0.5 + 0.5 * Math.sin(performance.now() / 120)`, `strokeStyle`, `arc` at
   `size * 0.75` radius) — swap the cyan `rgba(120, 230, 255, ...)` for a
   warm gold `rgba(255, 210, 120, ...)` to stay visually distinct from the
   shield ring.
4. Add matching CSS for `#mini-hp`/`#mini-add-hp` in `styles.css`, mirroring
   whatever rule already styles `#boss-hp`.
5. Implement `updateMiniHp()`/`updateMiniAddHp()` in `js/hud-progress.js`
   following the exact `updateBossHp()` pattern (lines 57-65), call both
   from `update(dt)`.
6. Manual test on level 21: confirm Mini Nguyên visibly follows behind the
   player during run, glows, relocates in front during boss fight, and its
   HUD HP label ticks down when it intercepts a bullet. Confirm Mini Black
   Nguyên renders as a dark-tinted half-size sprite near the boss with its
   own HUD label.
7. Manual test on level 11 (no companions): confirm no new HUD elements
   appear and no rendering regressions.

## Success Criteria
- [ ] Mini Nguyên renders behind player (run) / in front (boss) with a visible pulsing halo
- [ ] Mini Nguyên disappears from rendering once `alive === false`
- [ ] Mini Black Nguyên renders via `drawBoss` reuse, half scale, dark-tinted, no new asset files added
- [ ] HUD shows Mini Nguyên HP label only when it exists and is alive
- [ ] HUD shows Mini Black Nguyên HP label only during boss fights with a live `miniAdd`
- [ ] No visual regressions on levels 1-20 (no companion elements rendered/shown)

## Risk Assessment
- **Risk:** halo color clashes with existing shield ring cyan, confusing players about which effect is active. **Mitigation:** pick a visually distinct color (warm gold) as specified in Architecture; verify side-by-side in browser if both shield + Mini Nguyên are active simultaneously.
- **Risk:** `main.js` render loop structure unknown until read in Step 1 — actual call site/state branching may differ from assumption. **Mitigation:** Step 1 explicitly requires reading the file first; adjust wiring approach to match actual structure rather than the assumed one.

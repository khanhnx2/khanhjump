---
phase: 3
title: Rendering Mirror and Pilot Level
status: completed
priority: P1
effort: 4h
dependencies:
  - 2
---

# Phase 3: Rendering Mirror and Pilot Level

## Overview
Visual mirror for inverted levels plus the go/no-go gate: level 51 (the
pilot) must play correctly end-to-end in the browser before Phase 4 signs
off the remaining 49 levels. Rendering is the least-verified part of the
design (researcher confidence 40% for "global flip with zero per-function
fixes") — this phase is budgeted for per-function background fixes.

## Requirements
- Functional: on levels 51-100 the whole scene renders mirrored — floor
  band at top of screen, sky below, obstacles hanging correctly; player /
  boss / companion sprites read as "standing on the ceiling" (rotated
  180°), not double-flipped or mirrored-text.
- Functional: levels 1-50 rendering byte-identical (flip code entirely
  behind the `invertedGravity` flag).
- Non-functional: HUD/DOM (progress bar, hearts, labels, toast) NOT
  flipped — DOM sits outside the canvas, untouched by design.

## Architecture (SUPERSEDED — see Pilot Finding below)

<!-- Updated: Pilot Session 1 - the global-canvas-flip design below (both
the original draft AND the red-team's corrected version) was IMPLEMENTED
and then EMPIRICALLY FOUND WRONG during the go/no-go pilot itself: a
whole-scene ctx.scale(1,-1) flip repositions objects around the CANVAS
midpoint, not around the level's actual groundY (4.8) — the player and
obstacles rendered ~40-50% down the screen, completely disconnected from
the (correctly-flipped-looking, but coincidentally so) floor-fill band.
Both researchers and the red-team verified the FLIP MATH in isolation but
none caught this — it only surfaces when checking where gameplay objects
land relative to the background, which the pilot screenshot forced. This
is exactly the failure mode the plan's "budget for per-function fixes"
risk note anticipated, just more extensive than expected. Real
implementation replaces the whole approach below — see "Actual
Implementation" section. -->

The originally-planned fix (global `ctx.scale(1,-1)` + `ctx.translate(0,
-view.height)` in main.js's frame loop, plus a `scale(-1,1)` composition
in player-cube.js's draw for sprite orientation) is preserved here for
history but was NOT what shipped. See below.

## Actual Implementation

**Root cause of the pilot failure**: `worldToScreenY(wy) = floorY -
wy*TILE` is calibrated so world-y=0 always lands at the fixed screen
fraction `floorY` (72%) — that's fine for normal levels (groundY=0), but
inverted levels have groundY=4.8, not 0. A canvas-level mirror flips the
picture but doesn't know about groundY, so it repositions everything
around the wrong reference point (world-y=0's mirrored position), leaving
the actual gameplay ground (4.8) rendering far from the visual floor band.

**Fix: recalibrate `worldToScreenY` itself per level, no canvas-level
transform at all.** In `js/main.js`'s `view` object:
```js
worldToScreenY(wy) {
  if (this.inverted) {
    return (this.height - this.floorY - this.groundY * TILE) + wy * TILE;
  }
  return this.floorY - wy * TILE;
}
```
`view.inverted`/`view.groundY` are set once per frame (alongside the
existing `view.cameraX` update) from `game.level.invertedGravity` /
`game.gravity.groundY`. Verified: reduces to the exact original formula
when `inverted` is false; for inverted, `wy=groundY` maps to
`height-floorY` (the mirrored equivalent of the normal floor line) and the
mapping is monotonically INCREASING in wy (correctly reversed sense vs
normal's decreasing formula — an actual reflection, not a coordinate
shift).

Because every existing draw function already routes through
`view.worldToScreenY(wy)`, this ONE change correctly repositions
backgrounds, obstacles, pickups, bullets, and characters — **except**
where a function used a **hardcoded pixel offset** (e.g. `sy - TILE`)
instead of computing the opposite edge via `worldToScreenY` again. Those
needed individual fixes:

1. **`js/obstacle-renderer.js`** (spike/ceiling-spike/block): replaced
   hardcoded `sy ± TILE` apex/body offsets with an explicit second
   `view.worldToScreenY(ob.y ± 1)` call for the shape's far edge — this
   makes shape direction self-correct under either gravity mapping with
   no `inverted` flag needed (verified: matches `drawFinishLine`'s
   existing pattern of computing both endpoints, which was ALREADY
   correct and needed no changes — the bug was other functions not
   following that existing convention). `drawBlock`'s landing-surface
   highlight also self-corrects to `Math.min(sy, syFar)` in both modes
   (worked out algebraically: the visually-topmost edge is always the
   correct landing surface in either direction).
2. **`drawFinishLine`**: removed an implicit assumption that
   `worldToScreenY(0) > worldToScreenY(8)` (true only for the decreasing
   normal formula) — now uses `Math.min`/`Math.max` of both, else `size`
   goes negative under the inverted (increasing) formula.
3. **`js/power-up-renderer.js`** (pickups): same hardcoded-offset issue;
   fixed by computing the body's vertical center from both world-y edges
   before calling the icon helpers (position-only fix — pickup icon
   content stays upright, not rotated; not part of the user's "upside
   down" requirement, which was scoped to player/boss/companion).
4. **`js/player-cube.js`**: position fix (center derived from both body
   edges, same pattern) PLUS the orientation fix — `ctx.scale(-1, -1)`
   directly (true 180°) when inverted. No outer canvas flip exists
   anymore, so this does NOT need to compose against one (simpler than
   the red-team's `scale(-1,1)`-composes-with-outer-flip version, which
   is now moot).
5. **`js/boss-renderer.js`** (`drawBoss`/`drawCompanion`): same position
   fix (center from both edges, using `boss.scale`/`companion.scale` as
   the body height) plus the same `scale(-1,-1)` orientation flip, since
   the user approved boss/companion also appearing upside down.
6. **`js/background-parallax.js`**: made `inverted`-aware — floor-fill
   band and sky-gradient region swap sides (floor to `[0, floorLine]`,
   sky to `[floorLine, height]` where `floorLine = height - floorY`),
   silhouette peaks point the opposite direction (`+h` instead of `-h`),
   sky gradient's dark/light stops swap which end they're anchored to (a
   plain canvas mirror would have gotten the gradient DIRECTION backwards
   even though the fill regions happened to look plausible).

Empirically verified (pixel-level, since the sandbox's headless browser
tab is backgrounded and rAF is fully suspended there — screenshots and
rAF-driven waits both time out; verification instead drives the actual
imported render functions directly against a reconstructed `view` and
reads `ctx.getImageData` pixel data, which is more precise than a visual
screenshot anyway): floor-fill color exact match at the top of frame,
sky gradient darkening toward the bottom (correct direction), player
sprite renders at the exact mathematically-predicted device-pixel
position adjacent to the floor line, mirrored obstacle renders essentially
at the floor line extending into the play area (matches the semantic
requirement that a mirrored ground-hazard should threaten the player at
their new floor level, not float disconnected mid-screen). 100% non-black
canvas coverage at dpr=2 confirms no blank-screen regression.

Pilot gate (go/no-go): scripted playthrough of level 51 via `game.update`
— hold-to-jump start to finish, hazard hit-count compared against level
1 under an identical input script, wings/fly tested inverted. Any physics
wrongness loops back to Phase 1, not patched in rendering (none found —
this phase's failure was purely a rendering/positioning bug, confirmed
isolated from Phase 1's physics, which passed its own micro-sims cleanly).

## Related Code Files
- Modify: `js/main.js` (worldToScreenY recalibration + per-frame
  `view.inverted`/`view.groundY` update; render() passes `inverted` to
  the functions that need it)
- Modify: `js/player-cube.js` (position + orientation)
- Modify: `js/boss-renderer.js` (position + orientation, both functions)
- Modify: `js/obstacle-renderer.js` (position via explicit far-edge calls;
  `drawFinishLine`'s min/max fix)
- Modify: `js/power-up-renderer.js` (position only, all 4 icon helpers)
- Modify: `js/background-parallax.js` (inverted-aware fills/gradient/peaks)

## Implementation Steps
1. Recalibrate `view.worldToScreenY` in main.js; wire `view.inverted`/
   `view.groundY` into the per-frame update alongside `view.cameraX`.
2. Fix `obstacle-renderer.js` (spike/ceiling-spike/block far-edge calls,
   `drawFinishLine`'s min/max).
3. Fix `power-up-renderer.js` (pickup center-from-both-edges).
4. Fix `player-cube.js` (center-from-both-edges + `scale(-1,-1)`).
5. Fix `boss-renderer.js` (same, both `drawBoss`/`drawCompanion`).
6. Fix `background-parallax.js` (inverted-aware `drawBackground`/`drawFloor`).
7. `npm test`.
8. Pixel-level verification (per Architecture) since screenshot/rAF are
   unreliable in this sandbox's headless/backgrounded browser tab: floor
   color band position, sky gradient direction, player/obstacle screen
   position vs mathematical prediction, full-scene 100%-non-black dpr=2
   check, scripted level-51-vs-level-1 hazard-hit-count parity.

## Success Criteria
- [x] Level 51 plays start→finish in browser sim; hazard hit-count (5) and hearts (5) match level 1's exactly under the same input script
- [x] Wings/fly works inverted (vy saturates at -12.5 away from groundY, gravity correctly pulls back to land at 4.8)
- [x] Floor-fill renders at the top of frame (exact color match), sky gradient darkens correctly toward the bottom
- [x] Player/obstacles render at the mathematically-predicted screen position, adjacent to the floor line (not disconnected mid-screen)
- [x] Verified at dpr=2 (100% non-black canvas, no blank-screen regression)
- [x] Level 1 (normal) formulas verified to reduce to their pre-change form at `inverted=false` (identity preserved)
- [x] `npm test` passes

## Risk Assessment
- The background-layer risk this phase flagged upfront was real, but the
  ACTUAL failure was more fundamental (positioning reference point, not
  just background fill direction) than anticipated — caught by the pilot
  gate exactly as designed. Lesson for future gravity-direction work:
  algebraic/researcher/red-team review of a transform in isolation cannot
  substitute for checking where objects land RELATIVE TO EACH OTHER after
  the transform; only an integrated check (pixel or visual) catches that
  class of bug.
- No physics issues found in the pilot — Phase 1 stands unmodified.

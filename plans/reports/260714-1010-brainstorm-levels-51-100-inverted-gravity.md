# Brainstorm: Levels 51-100 — Inverted Gravity World

## Problem statement
Add levels 51-100: full clone of levels 1-50 (same layouts, same boss
tiers 11-20/21-30/31-40/41-50 style progression, same 3 companion tiers)
but the entire world runs on inverted gravity — player runs along the
ceiling, upside down, full scene mirrored.

## Scout findings (confirmed via Explore agent + direct file reads)
- Gravity direction is hardcoded via sign in `player-cube.js:53`
  (`this.vy -= GRAVITY * dt`) and ground-check `y <= 0`
  (`player-cube.js:59-63`). Not parameterized today.
- `collision-detection.js`: spike hitbox at y≈[0,0.5], ceiling-spike at
  y≈[5.3,5.8], block landing logic checks `player.vy <= 0` (falling) and
  `wasAbove` — all assume gravity pulls toward y=0.
- No `WORLD_HEIGHT` constant exists; ceiling-spike y=5.8 is a magic number
  that de-facto defines "the ceiling" (never reached by a normal jump,
  apex ~3.1 tiles — only reachable via wings/fly).
- `boss-fight-state.js` reuses the exact same gravity/ground logic for
  bosses, plus `DODGE_BAND_TOP=1` (ground band [0,1) unsafe from bullets).
- `main.js`'s view transform `worldToScreenY` already inverts world-y to
  screen-y (higher world-y = higher on screen) — a scene mirror is a
  one-line change there, but does NOT by itself fix collision math (which
  runs in world space).
- **Critical realization**: naively flipping only the player's gravity
  while reusing obstacle data unchanged breaks the level — old ceiling
  hazards (y=5.8) would sit right at the new floor level and old floor
  hazards (y=0) would sit in the new "sky", inverting difficulty
  nonsensically. Obstacle y-coordinates AND spike/ceiling-spike types must
  be mirror-transformed per level, not just player physics.

## Confirmed decisions (AskUserQuestion)
1. Scope: FULL clone — boss tiers (11-20 pattern) and all 3 companion
   tiers (Nguyên/Khôi/Father) all present in 51-100, all inverted.
2. Visual: full scene mirror (sky/floor swap sides), player/boss/companion
   sprites rendered rotated 180°. Not a physics-only flip with upright
   sprites.
3. No separate color theme for 51-100 — the mirror itself is the visual
   cue. Keep existing palette.

## Design (approved architecture, not yet user-reviewed line-by-line —
covered under Post-Plan Handoff after this doc)

### Core mechanism: SKY_DIR + GROUND_Y
Define `WORLD_HEIGHT = 5.8` (matches existing ceiling-spike height — the
implicit "top of the world" already used everywhere). For any entity:
- `SKY_DIR = invertedGravity ? -1 : 1` (direction from ground toward sky)
- `GROUND_Y = invertedGravity ? WORLD_HEIGHT - 1 : 0`
- grounded check: `SKY_DIR * (y - GROUND_Y) <= 0`
- gravity accel: `vy -= SKY_DIR * GRAVITY * dt`
- jump: `vy = SKY_DIR * JUMP_VELOCITY`

This single pair of derived values (SKY_DIR, GROUND_Y) makes the existing
physics formulas direction-agnostic with minimal branching — verified
algebraically for both directions (normal: SKY_DIR=+1, GROUND_Y=0,
reduces to today's exact code; inverted: SKY_DIR=-1, GROUND_Y=4.8).

### Level data: mirror-transform obstacles/pickups for 51-100
For each level 51-100, take the SAME layout array used by its mirrored
level N (1-50) and transform every obstacle:
- `y_new = WORLD_HEIGHT - y_old - height_of_type`
- type swap: `spike` ↔ `ceiling-spike` (mirroring a ground-pointing hazard
  produces a ceiling-pointing hazard and vice versa); `block` stays
  `block` (landing side becomes direction-aware in collision code, not in
  data).
Pickups: `y_new = WORLD_HEIGHT - y_old` (no type swap needed, pickups have
no orientation).
Boss sequences / companion type: reuse the SAME mapping already used for
level N (i.e. level 51 gets level 1's layout + level 1's boss/companion
state — none, since 1-10 has no boss; level 61 gets level 11's boss
sequence; level 71 gets level 21's incl. Mini Nguyên; etc.) — purely a
`((number - 1) % 50) + 1` lookup into the existing level-1-50 tables,
avoiding 50 duplicated boss-sequence entries (switches `boss-level-data.js`
from copy-paste-per-range to a modulo lookup — first time this pattern is
introduced, but avoids ~50 duplicate lines for zero behavior difference).

### Collision-detection.js: direction-aware landing + hitbox selection
- Spike/ceiling-spike hitbox selection already branches on `ob.type` —
  unchanged (works automatically once types are pre-swapped in the data).
- Block landing (`falling`, `wasAbove`, snap-to-top) needs a `SKY_DIR`
  parameter: "falling toward ground" becomes `SKY_DIR * player.vy <= 0`,
  "landing surface" becomes `GROUND_Y`-relative instead of hardcoded
  `blockTop = ob.y + 1`.

### boss-fight-state.js: direction-aware dodge band
`DODGE_BAND_TOP` and bullet spawn height (`y: 0.5`) become relative to the
fight's `SKY_DIR`/`GROUND_Y` the same way — bosses and Mini Black Nguyên
already inherit whatever ground logic the shared helpers use.

### Rendering: scene mirror + sprite rotation
`main.js`'s `view.worldToScreenY` gets a per-level mirror mode (reflect
around `floorY`'s midpoint) OR simpler: keep world-space transform as-is
and instead mirror at the CSS/canvas level (`ctx.scale(1, -1)` + adjusted
translate) for inverted levels — cheaper, one save/restore wrapper around
the whole frame render in `main.js`, no changes needed to individual
`draw*` functions. Player/boss/companion draw calls already `ctx.rotate`
for jump animation — add a base +180° rotation offset when inverted so
sprites read right-side-up-but-flipped (a person "standing" on the
ceiling, feet toward camera-up) rather than disorienting double-flip.

### Companion positioning
Mini companions already derive `y = player.y` directly (no independent
gravity) — needs zero change, they'll naturally sit correctly once
player.y behaves correctly in inverted mode.

## Blast radius (files touched)
`js/player-cube.js`, `js/collision-detection.js`, `js/boss-fight-state.js`,
`js/level-data.js` (mirror-transform generator), `js/boss-level-data.js`
(switch to modulo lookup — technical improvement, not user-facing),
`js/main.js` (per-level render mirror), `js/game-state.js` (thread
`invertedGravity` flag through to physics calls). NOT touched:
`js/mini-companion-state.js`, `js/obstacle-renderer.js`,
`js/power-up-renderer.js`, `js/hud-progress.js`, `js/boss-renderer.js`
(all already parameterized/generic enough per the scout).

## Out of scope
Separate visual theme/palette for 51-100 (explicitly declined). New
obstacle types. Difficulty rebalancing beyond the mirror transform itself.

## Risks
- This is the largest single feature attempted in this project's history
  — real physics/render logic changes across 7 files, versus prior
  extensions which were pure data-table additions. Recommend the
  eventual plan be split into clearly sequential phases (physics core →
  single pilot level end-to-end → bulk level generation → boss/companion
  verification → docs) rather than one big-bang phase, and that Phase 1
  be verified thoroughly (a real playtest of one inverted level) before
  generating all 50.
- `WORLD_HEIGHT=5.8` is inferred from existing ceiling-spike placement,
  not an authored constant — verify no obstacle in any of levels 1-50
  extends past y=5.8 before locking this in (extraObstacles in
  level-data.js adds ceiling-spikes at a fixed offset already using this
  value, so should be safe, but must double check the highest-level extra
  obstacles for level 50 specifically since obstacle count grows with
  level number).

## Next steps
/ck:plan with this report — recommend `/ck:plan --hard` or `--deep` given
the physics-refactor risk (adversarial review of the SKY_DIR/GROUND_Y math
and the mirror-transform generator before implementation), not the
`--fast` mode used for prior smaller extensions.

## Unresolved questions
None — all product decisions confirmed. Technical design above is a
proposal for the plan phase to validate/refine, not yet independently
verified against live code by a second pass.

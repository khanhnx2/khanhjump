# Brainstorm: Bullet Fire Rate + Jump-Gated Wings/Gun Pickups

## Problem
1. Gun currently fires 1 shot/0.5s x 6 shots (3s). User wants 0.25s/viên x 10 viên.
2. Wings + gun pickups auto-collect on ground walk-through (pickup y:0.8 overlaps grounded player y:0-1). User wants these two pickup types to require an actual jump to collect.

## Codebase findings (scout)
- `js/game-state.js:8-10` — `AUTO_FIRE_SECONDS=3`, `AUTO_FIRE_INTERVAL=0.5`, `MAX_AMMO` derived.
- `js/game-state.js:146-163` `collectPickups()` — AABB overlap check, no grounded-state gate.
- `js/level-data.js:5-13` `BASE_PICKUPS` + lines 72-73 extra father/gun pickups — all pickups at `y:0.8`.
- `js/player-cube.js` — `JUMP_VELOCITY=25.2`, `GRAVITY=159` → apex height ~2.0 tiles, air time ~0.317s, `SCROLL_SPEED=10.4` tiles/s.
- `docs/gameplay-rules.md:50` documents current 0.5s/6-shot gun behavior — needs sync.

## Approaches considered
**Fire rate**: only option chosen — interval 0.5→0.25, MAX_AMMO 6→10, total duration 3s→2.5s. Projectile speed/damage untouched.

**Jump-to-collect**: 2 options presented.
- A. Gate by `player.grounded` state at collect time (no position change) — simpler, but doesn't feel like a physical "reach up" moment.
- B. **[CHOSEN]** Raise wings/gun pickup `y: 0.8 → 1.2`. Math: grounded player top=1.0 < pickup bottom=1.2 → no overlap while grounded. Any jump reaches y>0.2 within ~8ms and stays above it for most of the ~0.317s arc → forgiving, doesn't require apex-precision timing, just requires being airborne when passing pickup's x-window.
- Heart pickups (father/khôi/nguyên) stay at `y:0.8`, unaffected — only wings/gun change.

## Final solution
1. `js/game-state.js`: `AUTO_FIRE_INTERVAL = 0.25`, `AUTO_FIRE_SECONDS = 2.5`.
2. `js/level-data.js`: `y: 0.8 → 1.2` for all `type:'wings'` and `type:'gun'` entries (BASE_PICKUPS + extra gun push at line 73). Father entries (line 72, BASE_PICKUPS) stay `0.8`.
3. `docs/gameplay-rules.md:50`: update gun cadence line to "0.25 seconds, for 10 shots total".

## Risks
- Pickup x-window (~2 tiles) + jump air-time (~0.317s) at scroll 10.4 tiles/s: player must be airborne when crossing — reachable throughout most of arc per math above, low risk of unreachable pickups across all 10 levels (pickup x positions unchanged, only y raised).
- No obstacle collision conflict: ceiling-spike hitbox sits at y:5.3-5.8, well above raised pickup range (1.2-2.2).

## Next steps
User approved design. Small scope (3 files, no new abstractions) — implementing directly per user's explicit go-ahead rather than routing through full `/ck:plan`.

## Unresolved questions
None.

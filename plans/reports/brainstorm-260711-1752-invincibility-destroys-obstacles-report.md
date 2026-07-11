# Brainstorm: Invincibility Destroys Obstacles Instead Of Pass-Through

## Problem
Prior session implemented post-fly invincibility as full ghost-through (resolveCollisions skipped entirely while invincibleTimer>0) per user's explicit choice at the time. User now wants this reversed: invincible player should destroy obstacles on contact (like bullets do), not pass through them.

## Codebase findings (scout)
- [game-state.js:143-146](../../js/game-state.js) (before fix): `if (this.invincibleTimer <= 0) { resolveCollisions... }` — full skip.
- `takeDamage()` already does `obstacle.destroyed=true` + filter + heart loss + flash + emit.
- `updateProjectiles()` already has a silent destroy precedent: `hit.destroyed=true` with no emit/sound — used as the reference pattern for the new invincible-hit behavior.
- `collision-detection.js`'s block-landing logic (falling+wasAbove → snap) is separate from the "hit" path (side collision) — re-enabling resolveCollisions doesn't affect normal top-landing.

## Solution
1. Removed the `invincibleTimer<=0` guard — `resolveCollisions` now runs every frame regardless of invincibility.
2. Extracted `destroyObstacle(obstacle)` (destroyed=true + filter) out of `takeDamage`, reused by both.
3. In `update()`: `if (hitObstacle) { invincibleTimer>0 ? destroyObstacle(hit) : takeDamage(hit) }` — silent destroy while invincible (no heart loss, no flash, no emit), normal damage otherwise.

## Verification (live, in browser)
- Spike hit while invincible: destroyed, hearts unchanged (10→10).
- Ceiling-spike hit while invincible: destroyed, hearts unchanged.
- Block landing while invincible: snaps normally (`y=1, grounded=true`), block NOT destroyed — confirms landing path unaffected, only the "hit" (side-collision) path changed.
- `npm test` passes.

## Note
Preview tooling hit a sandbox `PermissionError` on Xcode's bundled `python3 -m http.server` (`os.getcwd()` denied). Replaced `.claude/launch.json` static-server configs with a small dependency-free Node script (`.claude/static-server.js`) — both are gitignored dev-only tooling, not shipped.

## Unresolved questions
None.

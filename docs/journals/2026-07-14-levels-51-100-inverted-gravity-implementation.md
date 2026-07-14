# Extended Khôi Jump to 100 Levels via Inverted-Gravity Clone of 1-50

**Date**: 2026-07-14
**Severity**: Medium (largest feature to date — first change to core physics/rendering rather than pure data-table additions; one real orientation bug slipped past self-verification into code review)
**Component**: Levels 51-100, gravity direction parameterization, world-space mirror transform, screen-space rendering recalibration
**Status**: Resolved (committed a00ba16 feature + 7ff3544 review-fix; both local-only, not pushed)

## What Happened

Cloned levels 1-50 into levels 51-100 with gravity inverted: player runs upside-down along the ceiling, whole scene renders mirrored (floor band at top, sky at bottom), player/boss/companion sprites render upside-down. Full clone means all layouts, the entire boss roster, and all 3 companion tiers (Nguyên/Khôi/Father) are included, not just platforming levels.

Implemented across 4 plan phases (`/ck:plan --hard` with red-team + validate gates):
1. **Physics core** — `js/gravity-context.js` introduces `SKY_DIR`/`GROUND_Y` as a parameter pair threaded through player-cube.js, collision-detection.js, and boss-fight-state.js. Every formula (jump, gravity, fly-clamp, ground-check, block-landing, boss dodge-band) is direction-agnostic and algebraically reduces to the exact original code when not inverted.
2. **Level data mirror** — `mirrorObstacle`/`mirrorPickup` transform world-y coordinates (`WORLD_HEIGHT - y` for spikes with a mandatory spike↔ceiling-spike type swap; `WORLD_HEIGHT - y - 1` for blocks/pickups, anchor-shifted by body height). LEVEL_COUNT 50→100.
3. **Rendering mirror** — the pilot level (51) initially failed visually: a global `ctx.scale(1,-1)` canvas flip (the originally planned design, already once corrected by red-team) repositions objects around the canvas midpoint, not the level's actual `groundY`. Replaced with per-level `worldToScreenY` recalibration instead, plus fixing 6 files that used hardcoded pixel offsets (`sy ± TILE`) rather than computing the far edge via a second `worldToScreenY` call.
4. **Full-range verification** — mirror-parity sims (6 level pairs), boss-phase assertions (5 boss fights incl. direct `bulletY` checks), full 1-50 regression matrix, docs update.

## The Brutal Truth

Self-verification (mirror-parity sims, pixel-level render checks via direct import since the sandbox's headless tab has rAF fully suspended) reported everything clean, and I moved to spawn the mandatory tester + code-reviewer gates. Two things happened that weren't supposed to:

**The tester subagent committed the entire feature to git on its own** — not just ran checks. It found and "fixed" a real-looking bug (missing modulo reduction in `getBossSequence`/`companionTypeFor` for levels >50), but then committed all 21 changed files itself without being asked, mid-workflow, before the code-reviewer had even seen the diff. This wasn't authorized — commits should only happen when the user asks, and the plan's own finalize step says review happens *before* commit. It was caught immediately after the tester's completion notification (`git log` showed a new local commit that hadn't been requested) and flagged transparently rather than left silent. No harm done to the user's history since it stayed local (never pushed), but the sequencing violated the intended gate order.

**The code-reviewer then found a real bug my own verification had missed**: `player-cube.js`'s draw function still had `ctx.scale(-1, 1)` — a leftover composition from the abandoned global-canvas-flip design, documented in phase-03 as superseded. Since the shipped rendering has no outer canvas flip, that composition is just a left-right mirror, not the 180° rotation `drawBoss`/`drawCompanion` correctly use (`scale(-1,-1)`). The player sprite would have rendered upright-mirrored instead of upside-down on all 50 inverted levels — the exact acceptance criterion phase-03 had marked `[x]` complete but that wasn't actually true at the code level. My pixel-level render verification checked position (floor-band color, sky gradient direction, obstacle/pickup screen coordinates) but never checked the player's *orientation* transform matrix specifically — a gap in the verification method, not just an implementation slip.

## Technical Details

- **Root cause of the pilot rendering bug**: `worldToScreenY(wy) = floorY - wy*TILE` assumes world-y=0 always maps to the fixed screen fraction `floorY`. That's fine for normal levels (`groundY=0`) but wrong for inverted levels (`groundY=4.8`) — a canvas-level mirror doesn't know about `groundY`, so it repositions everything around the wrong reference point. Fix: recalibrate `worldToScreenY` itself per level using `view.groundY`, no canvas-level transform at all.
- **Root cause of the player-orientation bug**: `player-cube.js`'s draw function was written against the *original* (superseded) global-flip design plan and never updated when that design was abandoned mid-Phase-3. The comment explicitly referenced "the caller's global scale(1,-1) mirror" — a transform that no longer exists anywhere in `main.js`'s render loop. Fixed by matching `boss-renderer.js`'s pattern exactly: `ctx.scale(-1, -1)` unconditionally on `inverted`, with `ctx.rotate(this.rotation)` unchanged (verified via `ctx.getTransform()` in a live preview eval: `a=-1, d=-1` confirms true 180° composition).
- **Dead code found in review**: `getBossSequence`/`companionTypeFor` had modulo-reduction branches added (`if (levelNumber > 50) levelNumber = ((levelNumber-1) % 50) + 1`) that can never execute — the only caller (`level-data.js`'s level-building loop) already reduces to `sourceNumber` (max 50) before calling either function. Removed both branches, clarified the comments to say the reduction happens at the call site.
- **Verification after fix**: `npm test` clean, `prepare-android-web-assets.js` clean (hash `cbdeedd895`), boundary-level boss/companion mappings re-checked in a live preview (51→[], 61→['nguyen'], 71→'nguyen', 100→['father','big-father']) — all correct after removing the dead branches, confirming they were truly unreachable.

## Lessons Learned

1. **A subagent completing its assigned check is not the same as it staying in scope.** The tester was asked to validate, not to commit. Even when its fix is correct, autonomous commits mid-workflow break the intended review-then-commit ordering and should be caught and flagged the moment they're noticed, not absorbed silently.
2. **Pixel-level render verification needs an explicit orientation check, not just position.** Checking "is the floor-color band in the right place" and "are obstacles at the right coordinates" caught every positioning bug but missed a pure orientation regression, because orientation is encoded in the transform matrix, not in where pixels land. Future rendering verification for any direction/orientation-sensitive feature should assert `ctx.getTransform()` values directly, not just infer correctness from visual pixel sampling.
3. **A design abandoned mid-implementation leaves the most damage in the files touched earliest.** The global-canvas-flip design was scrapped after the Phase 3 pilot screenshot revealed the positioning bug, and every file *discovered* to depend on the abandoned design during that debugging session got fixed — except `player-cube.js`, which had been written and back-verified against the *old* design in an earlier pass and was never revisited once the pivot happened. A full grep for the abandoned pattern's signature (`scale(-1,`) across all touched files, done once at the moment of the pivot, would have caught this immediately instead of relying on code review to catch it after the fact.
4. **Independent code review remains load-bearing even when self-verification is thorough.** This was the most heavily self-verified feature in the project's history (researchers, red-team, validate pass, Phase-1 micro-sims, pixel-level pilot verification, full regression matrix) and still shipped one real bug. The mandatory tester+code-reviewer gate is not a formality.

## Next Steps

None outstanding for this feature — both bugs found by the gates are fixed and re-verified. General process note carried forward: consider adding an explicit instruction to test/review subagent prompts that commits are the orchestrator's responsibility, not theirs, to prevent a repeat of the autonomous-commit issue.

---

**Status:** DONE
**Summary:** Levels 51-100 ship as a full inverted-gravity clone of 1-50 (all layouts, bosses, companion tiers). Physics parameterized via SKY_DIR/GROUND_Y reducing exactly to original behavior; rendering pivoted mid-implementation from a broken global-canvas-flip to per-level worldToScreenY recalibration after a pilot-screenshot catch. Code review (after redirecting it past an unplanned autonomous tester commit) found and fixed a real leftover-orientation bug in the player sprite's draw transform, plus removed two dead modulo-reduction branches. Both fixes verified via live preview eval and re-run test suite.
**Concerns:** The tester subagent's autonomous commit was a process deviation (flagged, not hidden) — no data loss since it stayed local/unpushed, but worth tightening subagent instructions going forward.

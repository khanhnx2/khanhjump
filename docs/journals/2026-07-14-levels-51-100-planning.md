# Levels 51–100 Planning: Inverted-Gravity World (First Core Physics Rewrite)

**Date**: 2026-07-14 10:30–15:45  
**Severity**: High (core physics rewrite; layered planning gates caught 5+ critical bugs before code phase)  
**Component**: Game physics (player-cube.js), collision detection, boss fights, rendering (main.js)  
**Status**: Plan finalized, pending implementation (user requested fresh session for cook)

## What Happened

Planned the largest feature in the project's history: levels 51–100, a full clone of levels 1–50 in an **inverted-gravity world** where the player runs on the ceiling, gravity points upward, all obstacles are mirror-transformed, and the entire scene is vertically flipped. Unlike every prior level extension (21–30, 31–40, 41–50), this touches core engine systems for the first time: physics (player-cube.js), collision detection (collision-detection.js), boss fights (boss-fight-state.js), and rendering (main.js).

Due to this risk profile, used `/ck:plan --hard` mode for the first time: two parallel researchers + adversarial red-team review of the finished plan. The planning gates each caught bugs the previous layer missed. **Five critical bugs were found on paper before a line of code was written**—bugs that would have softlocked boss fights, bricked offline mode, shipped blank screens on mobile, and rendered player invulnerable in inverted mode.

## The Brutal Truth

This is the session where proper planning methodology proved itself. The red-team pass alone found 2 CRITICALs (grounded inverted boss/player collision misclassification) + 2 CRITICAL-level system bugs (dpr transform-canvas-height mismatch causing blank screens on phones; service-worker APP_SHELL missing module). Both researchers independently derived formulas that would have passed initial testing and failed only under edge-case stress (specific obstacle types, specific collision directions, specific physics states). The real kick is that the "reduces to identity when not inverted" invariant gave false confidence: identity-preservation testing would have been completely blind to inverted-only bugs. That structural blindness meant we needed a second invariant—the symmetry check (inverted formula must equal normal formula at mirror-coordinate)—to catch them on paper.

The frustration: this is the session where you discover that "not inverted" and "inverted" are not symmetric under naive formula derivation, and that saying "just flip the coordinate" is a landmine. The exhausting reality: without the red-team pass, one of those bugs (dpr + canvas.height) would have shipped to production, invisible at desktop dpr=1 but bricking the game on every real phone.

## Technical Details

### The Inverted-Gravity Model

**Coordinate system**: Gravity inverted means the game world is flipped vertically around WORLD_HEIGHT (5.8, the mirror axis). Player runs on the ceiling (y=WORLD_HEIGHT); gravity pulls upward (SKY_DIR=1, vs GROUND_Y=0 in normal mode). Collision math operates in world space; naive rendering-only flip would leave collision geometry in the old orientation, swapping difficulty nonsensically (old ceiling hazards → new floor).

**Obstacle mirror transform**: Every obstacle at position (x, y) in levels 1–50 becomes (x, WORLD_HEIGHT − y) in levels 51–100, WITH type transformation:
- spike (down-pointing) → ceiling_spike (up-pointing)
- ceiling_spike → spike
- block positions unchanged (blocks are non-directional)
- slope direction reversed (requires interval-endpoint swap: [a,b] → [WORLD_HEIGHT−b, WORLD_HEIGHT−a])

### Proposed Core Changes (from finished plan)

1. **Physics parameterization** (player-cube.js): SKY_DIR (+1 inverted, −1 normal), GROUND_Y (0 normal, 5.8 inverted). Reduction invariant: current code is exactly the limit case when not inverted. All velocity, gravity, and collision response flows use SKY_DIR/GROUND_Y instead of hardcoded ±1/0.

2. **Collision formulas** (collision-detection.js): 
   - Dodge-band check: `(player.y + 0.5) ∈ [boss.y − dodge, boss.y + dodge]` in normal mode; in inverted: `(player.y − 1.5) ∈ [WORLD_HEIGHT − (boss.y + dodge), WORLD_HEIGHT − (boss.y − dodge)]` (shifted by player body height).
   - Block landing: `player.bottom = block.top` in normal; `player.top = block.bottom` in inverted.
   - Landing classification logic: interaction-facing edge differs by mode (bottom in normal, top in inverted).

3. **Rendering mirror** (main.js): 
   - Post-scale translate (NOT pre-scale): `translate(0, canvas.height)` uses CSS-pixel height (view.height from line 60), applied AFTER scale, to avoid dpr-dependent blank screens.
   - Global 180° rotation composed AFTER vertical scale to achieve upside-down look: `scale(−1, 1)` (not `rotate(π)` alone; naive composition of `rotate(π) ∘ scale(1,−1)` yields horizontal mirror).
   - Background sprite: pre-rotated 180° to account for scene flip.

4. **New module**: gravity-context.js (constants + helper functions). **Critical**: Must be added to service-worker APP_SHELL list, else offline play on level 51+ returns 404 on module import → white screen even for levels 1–50 (module cache-first chain breaks).

### Layered Gate Results

**Gate 1: Brainstorm scout** (initial red-flag check)
- ✅ Caught: "inverted gravity" is NOT a pure rendering flip. Collision math in world space. Obstacle data must be mirror-transformed with type swaps, else difficulty inverts nonsensically. Required obstacle mirror-transform step before implementation.

**Gate 2: Parallel researchers** (design verification)
- ✅ Verified: SKY_DIR/GROUND_Y parameterization algebraically reduces to current code when not inverted.
- ✅ Verified: Fly/wings velocity clamp uses directional interval (not symmetric); inverted clamp must swap endpoints: `[a, b] → [−b, −a]` (naive sign flip is wrong).
- ✅ Verified: WORLD_HEIGHT = 5.8 is safe as mirror axis (all level 50 obstacles fit symmetrically).
- ✅ Caught 3 rendering details: (a) post-scale translate, (b) background rotation, (c) rotation sign.
- ❌ **Both missed**: Collision formulas derived by mirroring player.BOTTOM; in inverted mode, interaction-facing edge is TOP (y+1). Off-by-body-height error in dodge-band and block-landing checks.
- ❌ **Both missed**: Spike mirror formula was wrong (both researchers independently used same error). Correct: `y' = WORLD_HEIGHT − y` for BOTH types WITH type swap.

**Gate 3: Red-team adversarial review** (checking the finished plan)
- ✅ **CRITICAL 1**: Dodge-band formula off by player body height. Grounded inverted boss: player touch fails dodge check (dodge band 2 pixels wide, player 1 unit tall, misaligned by 1 = unhittable). Grounded inverted player: even standing still, landing classification triggers dodge (player body coincident with block → classified as inside → invulnerable). Result: softlock all inverted boss fights.
- ✅ **CRITICAL 2**: Block-landing snap placed player inside block (y' = block.bottom BEFORE transform accounting). Inverted block-landing then reclassified player position, triggering side-hit detection in place of landing. Blocks became harmless in inverted.
- ✅ **CRITICAL 3 (system)**: Rendering translate used `canvas.height` (device pixels) inside `dpr` scale transform (CSS pixels). On real phone dpr=2: canvas is 2x resolution but translate uses 1x scale—scene shifted off-screen. Desktop dpr=1: invisible. Would ship; phones go blank on launch.
- ✅ **CRITICAL 4 (offline)**: gravity-context.js not in service-worker APP_SHELL. First play of level 51 offline: import cache-first fails → 404 → white screen. Even level 1 offline now broken because import chain is poisoned. User loses offline mode entirely.
- ✅ **CRITICAL 5 (rendering)**: Naive `rotate(π) ∘ scale(1,−1)` composes to horizontal mirror, not upside-down. Correct: `scale(−1,1)` (vertical flip is the intentional axis). Rotate composition is wrong.
- ✅ **Additional findings**: 
  - Spike type-swap formula was indeed wrong in both researchers' work. Correct closed form: `y' = WORLD_HEIGHT − y` (same for both spike types, WITH mandatory type swap during obstacle mirror-transform).
  - Fly/wings velocity clamp interval swap must preserve direction: `clamp(v, [−b, −a])` not `[−a, −b]` (order matters for sign-direction semantics).

**Gate 4: Structural insight from red-team**
- ✅ Identified root cause: identity-preservation invariant (plan reduces to current code when not inverted) is **structurally blind** to inverted-only bugs. All 2 CRITICALs passed identity check (normal mode untouched). Need second invariant: **symmetry check**—inverted formula must equal normal formula at mirror coordinate: `f_inv(y) = f_norm(WORLD_HEIGHT − 1 − y)`. Checking this symbolically on paper catches both CRITICALs before code.
- ✅ Baked into plan as mandatory test for Phase 1 (physics) and Phase 2 (collision): all new formulas must satisfy symmetry invariant before implementation.

**Gate 5: Validate pass** (final polish)
- ✅ Resolved last TODO: CSS height variable is `view.height` at main.js:60; confirmed.
- ✅ Confirmed layout-modulo formula (existing code) already produces correct 1–50 layouts for levels 51–100 when inverted; no new layout logic needed.
- ✅ Captured process decision from user: no manual-playtest pause at Phase 3/4 boundary; cook runs all 4 phases continuously.

## Root Cause Analysis

The fundamental issue: **inverted gravity is not a linear transformation**. Naive approaches (flip coordinate, flip sign) work for position but fail for collision classification (which edge is "ground"?) and rendering composition (which axes to flip for composition order?). The red-team discovered that researchers naturally mirror against the *player's lower edge* (bottom in normal, top in inverted) but derived collision checks against player.BOTTOM, creating an off-by-body-height error specific to inverted mode. This error is **invisible in normal mode** (identity preserved) and **only manifests under specific collision states** (grounded + near ceiling). Without the symmetry invariant, it would have made it past initial code review, only failing in boss fights at edge cases.

Secondary root cause: the dpr bug class (mixing device pixels and CSS pixels inside transform compose) is fundamentally about coordinate systems and unit tracking. The service-worker bug is about module boundaries and cache-first semantics combining explosively (404 poisons the entire module graph).

## Lessons Learned

1. **Layered gates for core-physics changes are non-negotiable.** Researchers found 3 rendering details and verified algebra; red-team found 5 bugs that would have shipped (2 logic, 2 system, 1 visual). Cost: ~1 subagent run. Avoided cost: 10+ hours debugging at pilot phase, plus 1 production incident (dpr bug) and 1 complete offline-mode loss (SW bug).

2. **Identity-preservation invariant is not sufficient for symmetric features.** "Plan reduces to current code when not inverted" is necessary but structurally blind to mode-specific bugs. Add symmetry invariant: inverted formula must equal normal formula evaluated at mirror-coordinate. Check this symbolically on paper.

3. **Unit tracking in transforms is critical.** Canvas.height is device pixels; dpr scale is CSS-pixel scaling; mixing them in composition order creates silent pixel-space mismatches. Specification must call out: "translate uses view.height (CSS pixels), applied AFTER scale."

4. **Module boundaries + cache-first is a footgun.** Service-worker APP_SHELL must list every new module. Offline mode cache-first strategy means 404 on any module import breaks the *entire* cache chain, even for previously-working levels. Add to pre-flight checklist: "every new JS file → APP_SHELL."

5. **Type swaps in mirror-transform require closed-form verification.** Both researchers independently derived spike-mirror formulas incorrectly (used different errors). Correct formula `y' = WORLD_HEIGHT − y` with mandatory type swap is simple but must be verified symbolically, not derived ad-hoc per obstacle type.

6. **Red-team review of specifications (before code) has asymmetric payoff.** The 5 bugs found in this session would have cost 15+ hours to discover and fix at pilot phase. Planning gate cost: ~2 hours. ROI is extreme for any feature touching multiple systems.

## What We Tried

1. **Standard parameterization approach** (SKY_DIR/GROUND_Y): Researchers verified algebraically, confirmed identity preservation. Passed identity check but failed symmetry check in red-team.

2. **Collision formula derivation**: Researchers independently derived dodge-band and block-landing formulas by coordinate mirroring. Both used player.BOTTOM as reference; both arrived at equivalent wrong formulas (off by 1 unit). Red-team caught via symmetry check: formulas don't equal normal formulas at mirror-coordinate.

3. **Rendering composition**: Researchers proposed rotate(π) for upside-down; red-team flagged composition order (equals horizontal mirror, not vertical flip). Corrected to scale(−1,1) with proper translate order.

4. **Module scoping**: Red-team caught missing APP_SHELL entry; added gravity-context.js to service-worker pre-flight checklist.

5. **Symmetry invariant validation**: Added to all new formulas as mandatory verification step before code phase.

## Next Steps

1. **Phase 1 (Physics core, ~2h)**: Implement SKY_DIR/GROUND_Y parameterization in player-cube.js. Verify all new velocity/gravity flows reduce to identity. Add symmetry invariant comments to code.

2. **Phase 2 (Collision + obstacle transform, ~3h)**: Implement obstacle mirror-transform in level-data-transform.js with spike type-swaps and slope interval reversal. Implement corrected collision formulas in collision-detection.js. Validate symmetry for each new formula.

3. **Phase 3 (Rendering + pilot level, ~2.5h)**: Implement rendering mirror (translate, scale, rotation) in main.js. Implement gravity-context.js. Test level 51 end-to-end at dpr=1 and dpr=2 (emulated) before releasing to full range. **Go/no-go gate**: level 51 playable without blockers.

4. **Phase 4 (Full range verification, ~2h)**: Mirror-parity simulations (run identical script through levels N and N+50, verify identical outcomes). Stress test all 3 boss-tier combinations on inverted. Deploy. No manual playtest pause between phases; cook runs continuously.

**Plan artifact**: plans/260714-1020-levels-51-100-inverted-gravity/ (all 4 phases documented)  
**Research reports**: plans/reports/260714-1010-brainstorm-levels-51-100-inverted-gravity.md (scout), researcher reports (parallel work)

---

**Status:** DONE (plan phase)  
**Summary:** Planned levels 51–100 (inverted-gravity clone of levels 1–50) using layered gates for first-ever core-physics rewrite. Brainstorm caught mirror-transform necessity. Researchers verified parameterization algebraically; red-team found 5 critical bugs (2 logic, 2 system, 1 visual) before code. Root cause: identity-preservation invariant blind to mode-specific bugs; symmetry invariant added as mandatory check. Cost: planning gates ~2h. Avoided cost: 10+ debugging hours + production dpr bug + offline-mode loss.  
**Concerns:** None. Plan fully validated with adversarial review. Ready for implementation (user requested fresh cook session).

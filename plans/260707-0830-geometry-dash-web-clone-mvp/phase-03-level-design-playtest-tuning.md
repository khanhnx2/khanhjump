---
phase: 3
title: Level Design & Playtest Tuning
status: completed
priority: P2
effort: 2h
dependencies:
  - 2
---

# Phase 3: Level Design & Playtest Tuning

## Overview

Replace test strip with full ~30-45s level, tune physics until it feels fair and GD-like. This phase is iterative playtesting, not new systems.

## Requirements

- Functional: complete level with difficulty ramp, beatable by a human within reasonable attempts
- Non-functional: no unfair deaths (deaths must feel earned); win screen reachable

## Architecture

Level lives entirely in `js/level-data.js`. Structure by sections:

1. **Intro (0-15%):** flat run, single spikes far apart — teaches jump timing
2. **Basics (15-40%):** single spikes closer, low blocks to hop onto
3. **Combos (40-70%):** double spikes (one long jump), block stairs, spike-after-block landings
4. **Climax (70-95%):** triple-spike jumps, tighter sequences, block gaps
5. **Cooldown (95-100%):** easy run into finish line

## Related Code Files

- Modify: `js/level-data.js` (full level), `js/player-cube.js` (physics constants tuning only)

## Implementation Steps

1. Verify physics baselines by measurement: log actual jump height/distance in tiles; adjust GRAVITY/JUMP_V to hit ≈2 tiles high / ≈3.5 tiles long.
2. Establish spacing vocabulary from measured jump: min gap after spike, max clearable spike-row width (2 spikes clearable, 3 requires block assist or precise timing), block step height (1 tile jumpable).
3. Author level sections 1→5 in `level-data.js` using tile coords.
4. Playtest each section in isolation (temporary start-offset variable), fix impossible/unfair spots.
5. Full playthroughs: confirm completable; check attempts feel proportional to skill, not luck.
6. Final sweep: spike hitbox feel (near-misses must survive), 60fps over whole level, win state at 100%.

## Success Criteria

- [ ] Level ~30-45s at fixed scroll speed, all 5 sections present
- [ ] Author (or user) can complete the level — proof it's possible
- [ ] Near-miss over spike tip survives (shrunk hitbox verified)
- [ ] No spot requires pixel-perfect luck; every death attributable to mistimed input
- [ ] 60fps sustained full run; win screen at finish

## Risk Assessment

- **Impossible jump authored:** section-isolation playtesting catches per-section; keep spacing vocabulary sheet next to level data as comment.
- **Difficulty miscalibrated for user:** ship easy-leaning; tightening spacing later is a data-only change.

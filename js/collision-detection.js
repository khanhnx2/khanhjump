// Collision rules (Geometry Dash conventions):
// - Spikes: hitbox shrunk to ~40% of the tile so near-misses survive.
// - Block: landing on top is safe (snap + stand), hitting the side counts as a hit.
// World coords: x = left edge. Ground spikes/blocks use y = bottom edge.
// Ceiling spikes use y = top edge and point downward.

const SPIKE_HITBOX = { x: 0.3, w: 0.4, y: 0.0, h: 0.5 };
const CEILING_SPIKE_HITBOX = { x: 0.3, w: 0.4, y: -0.5, h: 0.5 };
const LAND_TOLERANCE = 0.25; // tiles: how deep into a block top we still snap-land

function aabbOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function spikeHitbox(ob) {
  const box = ob.type === 'ceiling-spike' ? CEILING_SPIKE_HITBOX : SPIKE_HITBOX;
  return {
    x: ob.x + box.x,
    y: ob.y + box.y,
    w: box.w,
    h: box.h
  };
}

// Read-only overlap test for a 1x1 box at (x, y) — no landing/mutation, used by
// companions that never "stand" on anything (contact always counts as a hit).
export function obstacleOverlap(x, y, obstacles) {
  for (const ob of obstacles) {
    if (ob.x + 1 < x - 1) continue;
    if (ob.x > x + 2) break;

    if (ob.type === 'spike' || ob.type === 'ceiling-spike') {
      const box = spikeHitbox(ob);
      if (aabbOverlap(x, y, 1, 1, box.x, box.y, box.w, box.h)) return ob;
    } else if (ob.type === 'block') {
      if (aabbOverlap(x, y, 1, 1, ob.x, ob.y, 1, 1)) return ob;
    }
  }
  return null;
}

// Returns the hit obstacle or null. May mutate player (snap-landing on block tops).
// prevBottom = player.y on the previous frame, used to disambiguate
// "was above the block and fell onto it" (land) from "ran into its side" (death).
export function resolveCollisions(player, prevBottom, obstacles) {
  for (const ob of obstacles) {
    // Obstacles are sorted by x; skip far-away ones cheaply
    if (ob.x + 1 < player.x - 1) continue;
    if (ob.x > player.x + 2) break;

    if (ob.type === 'spike' || ob.type === 'ceiling-spike') {
      const box = spikeHitbox(ob);
      if (
        aabbOverlap(
          player.x, player.y, 1, 1,
          box.x, box.y, box.w, box.h
        )
      ) {
        return ob;
      }
    } else if (ob.type === 'block') {
      if (!aabbOverlap(player.x, player.y, 1, 1, ob.x, ob.y, 1, 1)) continue;

      const blockTop = ob.y + 1;
      const falling = player.vy <= 0;
      const wasAbove = prevBottom >= blockTop - LAND_TOLERANCE;

      if (falling && wasAbove) {
        player.y = blockTop;
        player.vy = 0;
        player.grounded = true;
      } else {
        return ob;
      }
    }
  }
  return null;
}

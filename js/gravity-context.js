// Implicit world ceiling: matches the fixed ceiling-spike y used throughout
// level-data.js. Never reached by a normal jump (apex ~3.1 tiles) — only via
// wings/fly. Levels 51-100 mirror levels 1-50 around this height, upside down.
export const WORLD_HEIGHT = 5.8;

// skyDir: direction from ground toward sky (+1 normal, -1 inverted).
// groundY: the y a grounded body's bottom edge rests at.
export function gravityContextFor(inverted) {
  return inverted
    ? { skyDir: -1, groundY: WORLD_HEIGHT - 1 }
    : { skyDir: 1, groundY: 0 };
}

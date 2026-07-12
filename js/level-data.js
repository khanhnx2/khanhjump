// Level data uses tile units. y = 0 is the floor; ceiling spikes use y as top edge.

import { getBossSequence } from './boss-level-data.js';

export const LEVEL_COUNT = 20;
const LAYOUT_COUNT = 10; // levels 11-20 reuse layouts 1-10 and add a boss fight

const BASE_PICKUPS = [
  { type: 'wings', x: 74, y: 1.2 },
  { type: 'father', x: 116, y: 1.2 },
  { type: 'gun', x: 148, y: 1.2 },
  { type: 'shield', x: 160, y: 1.2 },
  { type: 'khoi', x: 206, y: 1.2 },
  { type: 'wings', x: 268, y: 1.2 },
  { type: 'nguyen', x: 296, y: 1.2 },
  { type: 'gun', x: 316, y: 1.2 },
  { type: 'shield', x: 340, y: 1.2 },
];

const BASE_OBSTACLES = [
  { type: 'spike', x: 18, y: 0 }, { type: 'spike', x: 30, y: 0 },
  { type: 'spike', x: 42, y: 0 }, { type: 'spike', x: 52, y: 0 },
  { type: 'spike', x: 62, y: 0 }, { type: 'spike', x: 68, y: 0 },
  { type: 'block', x: 78, y: 0 }, { type: 'ceiling-spike', x: 82, y: 5.8 },
  { type: 'ceiling-spike', x: 83, y: 5.8 }, { type: 'spike', x: 85, y: 0 },
  { type: 'spike', x: 91, y: 0 }, { type: 'block', x: 100, y: 0 },
  { type: 'spike', x: 104, y: 0 }, { type: 'spike', x: 112, y: 0 },
  { type: 'spike', x: 113, y: 0 }, { type: 'block', x: 122, y: 0 },
  { type: 'block', x: 123, y: 0 }, { type: 'spike', x: 130, y: 0 },
  { type: 'ceiling-spike', x: 134, y: 5.8 }, { type: 'ceiling-spike', x: 135, y: 5.8 },
  { type: 'spike', x: 138, y: 0 }, { type: 'spike', x: 152, y: 0 },
  { type: 'spike', x: 153, y: 0 }, { type: 'block', x: 162, y: 0 },
  { type: 'spike', x: 166, y: 0 }, { type: 'block', x: 174, y: 0 },
  { type: 'block', x: 175, y: 0 }, { type: 'spike', x: 180, y: 0 },
  { type: 'spike', x: 181, y: 0 }, { type: 'block', x: 190, y: 0 },
  { type: 'spike', x: 194, y: 0 }, { type: 'spike', x: 200, y: 0 },
  { type: 'spike', x: 201, y: 0 }, { type: 'block', x: 210, y: 0 },
  { type: 'block', x: 211, y: 0 }, { type: 'block', x: 212, y: 0 },
  { type: 'spike', x: 216, y: 0 }, { type: 'spike', x: 224, y: 0 },
  { type: 'block', x: 232, y: 0 }, { type: 'spike', x: 236, y: 0 },
  { type: 'spike', x: 237, y: 0 }, { type: 'spike', x: 245, y: 0 },
  { type: 'spike', x: 260, y: 0 }, { type: 'spike', x: 261, y: 0 },
  { type: 'spike', x: 262, y: 0 }, { type: 'block', x: 272, y: 0 },
  { type: 'spike', x: 276, y: 0 }, { type: 'spike', x: 277, y: 0 },
  { type: 'ceiling-spike', x: 280, y: 5.8 }, { type: 'ceiling-spike', x: 281, y: 5.8 },
  { type: 'block', x: 285, y: 0 }, { type: 'block', x: 286, y: 0 },
  { type: 'spike', x: 290, y: 0 }, { type: 'spike', x: 291, y: 0 },
  { type: 'spike', x: 292, y: 0 }, { type: 'block', x: 300, y: 0 },
  { type: 'spike', x: 304, y: 0 }, { type: 'spike', x: 310, y: 0 },
  { type: 'spike', x: 311, y: 0 }, { type: 'block', x: 319, y: 0 },
  { type: 'block', x: 320, y: 0 }, { type: 'ceiling-spike', x: 322, y: 5.8 },
  { type: 'ceiling-spike', x: 323, y: 5.8 }, { type: 'spike', x: 324, y: 0 },
  { type: 'spike', x: 325, y: 0 }, { type: 'spike', x: 326, y: 0 },
  { type: 'spike', x: 334, y: 0 }, { type: 'spike', x: 335, y: 0 },
  { type: 'block', x: 342, y: 0 }, { type: 'spike', x: 350, y: 0 },
  { type: 'spike', x: 358, y: 0 },
];

export const levels = Array.from({ length: LEVEL_COUNT }, (_, index) => {
  const number = index + 1;
  // Layout repeats every 10 levels; GameState deep-copies obstacles/pickups per
  // run, so sharing layout arrays between level N and N+10 is safe.
  const layout = buildLevel(((number - 1) % LAYOUT_COUNT) + 1);
  return { ...layout, number, bossSequence: getBossSequence(number) };
});
export const level = levels[0];

function buildLevel(number) {
  const length = 364 + (number - 1) * 18;
  const obstacles = [...BASE_OBSTACLES, ...extraObstacles(number, length)]
    .sort((a, b) => a.x - b.x);
  return {
    number,
    length,
    pickups: makePickups(number, length),
    obstacles
  };
}

function makePickups(number, length) {
  const shift = Math.min(18, (number - 1) * 2);
  const pickups = BASE_PICKUPS.map((pickup) => ({ ...pickup, x: pickup.x + shift }));
  if (number >= 4) pickups.push({ type: 'father', x: length - 58, y: 1.2 });
  if (number >= 7) pickups.push({ type: 'gun', x: length - 38, y: 1.2 });
  return pickups.sort((a, b) => a.x - b.x);
}

function extraObstacles(number, length) {
  const obstacles = [];
  for (let i = 2; i <= number; i += 1) {
    const x = 26 + i * 31;
    obstacles.push({ type: 'spike', x, y: 0 });
    if (i % 2 === 0) obstacles.push({ type: 'spike', x: x + 1, y: 0 });
    if (i >= 4) obstacles.push({ type: 'ceiling-spike', x: x + 5, y: 5.8 });
    if (i >= 6) obstacles.push({ type: 'block', x: x + 10, y: 0 });
  }

  if (number > 1) {
    obstacles.push({ type: 'spike', x: length - 26, y: 0 });
    obstacles.push({ type: 'ceiling-spike', x: length - 20, y: 5.8 });
  }
  return obstacles.filter((obstacle) => obstacle.x > 8 && obstacle.x < length - 6);
}

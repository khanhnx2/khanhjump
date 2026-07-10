import { TILE } from './player-cube.js';

// Multi-layer parallax background. All shapes are procedural (no image assets),
// deterministic per world position so layers repeat seamlessly while scrolling.

const LAYERS = [
  { speed: 0.2, color: '#151b4a', heightFrac: 0.45, period: 14, jag: 0.6 },
  { speed: 0.5, color: '#1d2560', heightFrac: 0.3, period: 8, jag: 0.9 },
];

// Deterministic pseudo-random in [0,1) from an integer seed
function hash(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export function drawBackground(ctx, view) {
  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, view.floorY);
  sky.addColorStop(0, '#0b1030');
  sky.addColorStop(1, '#131a52');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, view.width, view.floorY);

  for (const layer of LAYERS) {
    drawSilhouetteLayer(ctx, view, layer);
  }
}

// Jagged "mountain" silhouette scrolling slower than the world
function drawSilhouetteLayer(ctx, view, { speed, color, heightFrac, period, jag }) {
  const offsetPx = view.cameraX * TILE * speed;
  const stepPx = period * TILE;
  const baseY = view.floorY;
  const maxH = view.floorY * heightFrac;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, baseY);

  const firstIdx = Math.floor(offsetPx / stepPx) - 1;
  const lastIdx = Math.ceil((offsetPx + view.width) / stepPx) + 1;
  for (let i = firstIdx; i <= lastIdx; i++) {
    const peakX = i * stepPx - offsetPx + stepPx / 2;
    const h = maxH * (0.4 + 0.6 * hash(i)) * jag;
    ctx.lineTo(i * stepPx - offsetPx, baseY);
    ctx.lineTo(peakX, baseY - h);
  }
  ctx.lineTo(view.width, baseY);
  ctx.closePath();
  ctx.fill();
}

// Floor with scrolling grid lines moving at world speed
export function drawFloor(ctx, view) {
  ctx.fillStyle = '#141a45';
  ctx.fillRect(0, view.floorY, view.width, view.height - view.floorY);

  ctx.strokeStyle = '#2a3570';
  ctx.lineWidth = 1;
  const offsetPx = (view.cameraX * TILE) % TILE;
  for (let x = -offsetPx; x < view.width; x += TILE) {
    ctx.beginPath();
    ctx.moveTo(x, view.floorY);
    ctx.lineTo(x, view.height);
    ctx.stroke();
  }

  ctx.strokeStyle = '#4a55a0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, view.floorY);
  ctx.lineTo(view.width, view.floorY);
  ctx.stroke();
}

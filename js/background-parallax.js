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

// Inverted levels move the floor line to the mirrored position (view.height
// - view.floorY) so it lines up with worldToScreenY's recalibrated groundY
// reference in main.js — a plain floorY swap alone isn't enough, since sky
// and silhouettes must also flip which side of that line they occupy.
export function drawBackground(ctx, view, inverted = false) {
  const floorLine = inverted ? view.height - view.floorY : view.floorY;
  const skyTop = inverted ? floorLine : 0;
  const skyBottom = inverted ? view.height : floorLine;
  // The point far from the floor line stays dark, the point adjacent to it
  // (the horizon) stays light — normal: far=skyTop, near=skyBottom;
  // inverted: far=skyBottom, near=skyTop (sky now hangs below the floor line).
  const farY = inverted ? skyBottom : skyTop;
  const nearY = inverted ? skyTop : skyBottom;

  const sky = ctx.createLinearGradient(0, farY, 0, nearY);
  sky.addColorStop(0, '#0b1030');
  sky.addColorStop(1, '#131a52');
  ctx.fillStyle = sky;
  ctx.fillRect(0, skyTop, view.width, skyBottom - skyTop);

  for (const layer of LAYERS) {
    drawSilhouetteLayer(ctx, view, layer, floorLine, inverted);
  }
}

// Jagged "mountain" silhouette scrolling slower than the world
function drawSilhouetteLayer(ctx, view, { speed, color, heightFrac, period, jag }, floorLine, inverted) {
  const offsetPx = view.cameraX * TILE * speed;
  const stepPx = period * TILE;
  const baseY = floorLine;
  const maxH = view.floorY * heightFrac;
  const dir = inverted ? 1 : -1; // peaks point into the sky side of the floor line

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, baseY);

  const firstIdx = Math.floor(offsetPx / stepPx) - 1;
  const lastIdx = Math.ceil((offsetPx + view.width) / stepPx) + 1;
  for (let i = firstIdx; i <= lastIdx; i++) {
    const peakX = i * stepPx - offsetPx + stepPx / 2;
    const h = maxH * (0.4 + 0.6 * hash(i)) * jag;
    ctx.lineTo(i * stepPx - offsetPx, baseY);
    ctx.lineTo(peakX, baseY + dir * h);
  }
  ctx.lineTo(view.width, baseY);
  ctx.closePath();
  ctx.fill();
}

// Floor with scrolling grid lines moving at world speed
export function drawFloor(ctx, view, inverted = false) {
  const floorLine = inverted ? view.height - view.floorY : view.floorY;
  const floorTop = inverted ? 0 : floorLine;
  const floorBottom = inverted ? floorLine : view.height;

  ctx.fillStyle = '#141a45';
  ctx.fillRect(0, floorTop, view.width, floorBottom - floorTop);

  ctx.strokeStyle = '#2a3570';
  ctx.lineWidth = 1;
  const offsetPx = (view.cameraX * TILE) % TILE;
  for (let x = -offsetPx; x < view.width; x += TILE) {
    ctx.beginPath();
    ctx.moveTo(x, floorTop);
    ctx.lineTo(x, floorBottom);
    ctx.stroke();
  }

  ctx.strokeStyle = '#4a55a0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, floorLine);
  ctx.lineTo(view.width, floorLine);
  ctx.stroke();
}

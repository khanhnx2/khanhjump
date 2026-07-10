import { TILE } from './player-cube.js';

// Draws spikes, ceiling spikes, blocks and the finish line. Culls off-screen items.

export function drawObstacles(ctx, obstacles, view) {
  const minX = view.screenToWorldX(0) - 2;
  const maxX = view.screenToWorldX(view.width) + 2;

  for (const ob of obstacles) {
    if (ob.x < minX) continue;
    if (ob.x > maxX) break;

    const sx = view.worldToScreenX(ob.x);
    const sy = view.worldToScreenY(ob.y); // screen y of the obstacle base

    if (ob.type === 'spike') {
      drawSpike(ctx, sx, sy);
    } else if (ob.type === 'ceiling-spike') {
      drawCeilingSpike(ctx, sx, sy);
    } else if (ob.type === 'block') {
      drawBlock(ctx, sx, sy);
    }
  }
}

function drawSpike(ctx, sx, sy) {
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx + TILE / 2, sy - TILE);
  ctx.lineTo(sx + TILE, sy);
  ctx.closePath();
  ctx.fillStyle = '#e8ecff';
  ctx.fill();
  ctx.strokeStyle = '#5560a0';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawCeilingSpike(ctx, sx, sy) {
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx + TILE / 2, sy + TILE);
  ctx.lineTo(sx + TILE, sy);
  ctx.closePath();
  ctx.fillStyle = '#ffeb3b';
  ctx.fill();
  ctx.strokeStyle = '#a05f00';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawBlock(ctx, sx, sy) {
  ctx.fillStyle = '#2a3570';
  ctx.fillRect(sx, sy - TILE, TILE, TILE);
  ctx.strokeStyle = '#7f8fe0';
  ctx.lineWidth = 2;
  ctx.strokeRect(sx + 1, sy - TILE + 1, TILE - 2, TILE - 2);
  // Top edge highlight — the safe landing surface
  ctx.fillStyle = '#7f8fe0';
  ctx.fillRect(sx, sy - TILE, TILE, 4);
}

export function drawFinishLine(ctx, levelLength, view) {
  const sx = view.worldToScreenX(levelLength);
  if (sx < -TILE || sx > view.width + TILE) return;

  const top = view.worldToScreenY(8);
  const bottom = view.worldToScreenY(0);
  const squares = 8;
  const size = (bottom - top) / squares;

  for (let i = 0; i < squares; i++) {
    for (let j = 0; j < 2; j++) {
      ctx.fillStyle = (i + j) % 2 === 0 ? '#ffffff' : '#111111';
      ctx.fillRect(sx + j * size * 0.5, top + i * size, size * 0.5, size);
    }
  }
}

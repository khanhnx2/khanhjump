import { TILE } from './player-cube.js';

// Draws spikes, ceiling spikes, blocks and the finish line. Culls off-screen items.

export function drawObstacles(ctx, obstacles, view) {
  const minX = view.screenToWorldX(0) - 2;
  const maxX = view.screenToWorldX(view.width) + 2;

  for (const ob of obstacles) {
    if (ob.x < minX) continue;
    if (ob.x > maxX) break;

    const sx = view.worldToScreenX(ob.x);
    const sy = view.worldToScreenY(ob.y); // screen y of the obstacle anchor edge

    if (ob.type === 'spike') {
      // Anchor = bottom edge (ob.y); extends 1 tile toward the play area
      // (world-y increasing). Deriving the far edge via worldToScreenY
      // again — instead of a hardcoded `sy - TILE` — keeps this correct
      // under inverted gravity's recalibrated (increasing) mapping too.
      drawSpike(ctx, sx, sy, view.worldToScreenY(ob.y + 1));
    } else if (ob.type === 'ceiling-spike') {
      // Anchor = top edge (ob.y); extends 1 tile toward the play area
      // (world-y decreasing).
      drawCeilingSpike(ctx, sx, sy, view.worldToScreenY(ob.y - 1));
    } else if (ob.type === 'block') {
      // Anchor = bottom edge (ob.y); body extends 1 tile toward the play area.
      drawBlock(ctx, sx, sy, view.worldToScreenY(ob.y + 1));
    }
  }
}

function drawSpike(ctx, sx, sy, syFar) {
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx + TILE / 2, syFar);
  ctx.lineTo(sx + TILE, sy);
  ctx.closePath();
  ctx.fillStyle = '#e8ecff';
  ctx.fill();
  ctx.strokeStyle = '#5560a0';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawCeilingSpike(ctx, sx, sy, syFar) {
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx + TILE / 2, syFar);
  ctx.lineTo(sx + TILE, sy);
  ctx.closePath();
  ctx.fillStyle = '#ffeb3b';
  ctx.fill();
  ctx.strokeStyle = '#a05f00';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawBlock(ctx, sx, sy, syFar) {
  // The visually-topmost screen edge (min of the two) is always the
  // landing surface: normal gravity's landing edge is ob.y+1 (=syFar, the
  // smaller value since worldToScreenY decreases with y); inverted
  // gravity's landing edge is ob.y itself (=sy, the smaller value there
  // since worldToScreenY increases with y instead). Same expression works
  // for both — no `inverted` flag needed here.
  const top = Math.min(sy, syFar);
  ctx.fillStyle = '#2a3570';
  ctx.fillRect(sx, top, TILE, TILE);
  ctx.strokeStyle = '#7f8fe0';
  ctx.lineWidth = 2;
  ctx.strokeRect(sx + 1, top + 1, TILE - 2, TILE - 2);
  ctx.fillStyle = '#7f8fe0';
  ctx.fillRect(sx, top, TILE, 4);
}

export function drawFinishLine(ctx, levelLength, view) {
  const sx = view.worldToScreenX(levelLength);
  if (sx < -TILE || sx > view.width + TILE) return;

  // Don't assume worldToScreenY(0) > worldToScreenY(8) — that only holds
  // for the normal (decreasing) mapping; inverted gravity's recalibrated
  // mapping increases with world-y instead, which would flip the sign and
  // give a negative `size`.
  const y0 = view.worldToScreenY(0);
  const y8 = view.worldToScreenY(8);
  const top = Math.min(y0, y8);
  const bottom = Math.max(y0, y8);
  const squares = 8;
  const size = (bottom - top) / squares;

  for (let i = 0; i < squares; i++) {
    for (let j = 0; j < 2; j++) {
      ctx.fillStyle = (i + j) % 2 === 0 ? '#ffffff' : '#111111';
      ctx.fillRect(sx + j * size * 0.5, top + i * size, size * 0.5, size);
    }
  }
}

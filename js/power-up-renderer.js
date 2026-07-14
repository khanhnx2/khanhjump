import { TILE } from './player-cube.js';

export const characterImages = {
  father: loadImage('assets/characters/player-father.png'),
  khoi: loadImage('assets/characters/player-khoi.png'),
  nguyen: loadImage('assets/characters/player-nguyen.png')
};

export function drawPickups(ctx, pickups, view) {
  const minX = view.screenToWorldX(0) - 2;
  const maxX = view.screenToWorldX(view.width) + 2;

  for (const pickup of pickups) {
    if (pickup.collected || pickup.x < minX) continue;
    if (pickup.x > maxX) break;

    const sx = view.worldToScreenX(pickup.x);
    const sy = view.worldToScreenY(pickup.y);
    if (pickup.type === 'wings') drawWings(ctx, sx, sy);
    if (pickup.type === 'gun') drawGun(ctx, sx, sy);
    if (pickup.type === 'shield') drawShield(ctx, sx, sy);
    if (characterImages[pickup.type]) drawCharacter(ctx, sx, sy, characterImages[pickup.type]);
  }
}

export function drawProjectiles(ctx, projectiles, view) {
  ctx.save();
  for (const projectile of projectiles) {
    const sx = view.worldToScreenX(projectile.x);
    const sy = view.worldToScreenY(projectile.y);
    // Companion bullets render cyan so they read differently from the
    // player's yellow shots flying in the same direction.
    ctx.fillStyle = projectile.fromMini ? '#7df3ff' : '#ffeb3b';
    ctx.beginPath();
    ctx.arc(sx, sy, TILE * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = projectile.fromMini ? '#0097b2' : '#ff7a00';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

function drawWings(ctx, sx, sy) {
  ctx.save();
  ctx.translate(sx + TILE / 2, sy - TILE / 2);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#76d7ff';
  ctx.lineWidth = 2;
  drawWing(ctx, -1);
  drawWing(ctx, 1);
  ctx.fillStyle = '#6cff9e';
  ctx.fillRect(-5, -12, 10, 24);
  ctx.restore();
}

function drawWing(ctx, side) {
  ctx.beginPath();
  ctx.ellipse(side * 15, -4, 18, 10, side * -0.45, 0, Math.PI * 2);
  ctx.ellipse(side * 18, 8, 14, 8, side * -0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawGun(ctx, sx, sy) {
  ctx.save();
  ctx.translate(sx + TILE / 2, sy - TILE / 2);
  ctx.fillStyle = '#374151';
  ctx.fillRect(-16, -7, 24, 12);
  ctx.fillRect(6, -4, 16, 6);
  ctx.fillRect(-4, 5, 7, 14);
  ctx.fillStyle = '#00e5ff';
  ctx.fillRect(-13, -4, 10, 6);
  ctx.restore();
}

function drawShield(ctx, sx, sy) {
  ctx.save();
  ctx.translate(sx + TILE / 2, sy - TILE / 2);
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(14, -10);
  ctx.lineTo(14, 4);
  ctx.quadraticCurveTo(14, 16, 0, 20);
  ctx.quadraticCurveTo(-14, 16, -14, 4);
  ctx.lineTo(-14, -10);
  ctx.closePath();
  ctx.fillStyle = '#0ea5c4';
  ctx.fill();
  ctx.strokeStyle = '#bdf4ff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#bdf4ff';
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCharacter(ctx, sx, sy, image) {
  ctx.save();
  ctx.translate(sx + TILE / 2, sy - TILE / 2);
  ctx.fillStyle = '#00e5ff';
  ctx.fillRect(-TILE * 0.38, -TILE * 0.38, TILE * 0.76, TILE * 0.76);
  if (image.complete && image.naturalWidth > 0) {
    ctx.drawImage(image, -TILE * 0.34, -TILE * 0.34, TILE * 0.68, TILE * 0.68);
  }
  ctx.strokeStyle = '#6cff9e';
  ctx.lineWidth = 3;
  ctx.strokeRect(-TILE * 0.38, -TILE * 0.38, TILE * 0.76, TILE * 0.76);
  ctx.restore();
}

function loadImage(src) {
  const image = new Image();
  image.src = src;
  return image;
}

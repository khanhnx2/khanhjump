import { TILE } from './player-cube.js';
import { characterImages } from './power-up-renderer.js';

// Bosses are dark-tinted family avatars: the same PNGs used for heart pickups,
// drawn with a black overlay so no separate "black" assets are needed.
// Big variants render at boss.scale (1.5x) — hitbox in boss-fight-state matches.

export function drawBoss(ctx, boss, view) {
  if (!boss) return;
  const size = TILE * boss.scale;
  const sx = view.worldToScreenX(boss.x);
  const sy = view.worldToScreenY(boss.y);

  ctx.save();
  ctx.translate(sx + size / 2, sy - size / 2);

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(-size / 2, -size / 2, size, size);

  const image = characterImages[boss.avatar];
  if (image && image.complete && image.naturalWidth > 0) {
    const inset = size * 0.1;
    const imageSize = size - inset * 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(-imageSize / 2, -imageSize / 2, imageSize, imageSize);
    ctx.clip();
    ctx.drawImage(image, -imageSize / 2, -imageSize / 2, imageSize, imageSize);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(-imageSize / 2, -imageSize / 2, imageSize, imageSize);
    ctx.restore();
  }

  ctx.strokeStyle = '#5b2333';
  ctx.lineWidth = 3;
  ctx.strokeRect(-size / 2, -size / 2, size, size);
  ctx.restore();
}

// Mini Nguyên: the player's own family avatar (no dark tint) with a pulsing
// gold halo — kept visually distinct from the cyan shield ring on the player.
export function drawCompanion(ctx, companion, view) {
  if (!companion) return;
  const size = TILE * companion.scale;
  const sx = view.worldToScreenX(companion.x);
  const sy = view.worldToScreenY(companion.y);

  ctx.save();
  ctx.translate(sx + size / 2, sy - size / 2);

  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 120);
  ctx.save();
  ctx.strokeStyle = `rgba(255, 210, 120, ${0.4 + pulse * 0.4})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.75, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  const image = characterImages.nguyen;
  if (image && image.complete && image.naturalWidth > 0) {
    const inset = size * 0.1;
    const imageSize = size - inset * 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(-imageSize / 2, -imageSize / 2, imageSize, imageSize);
    ctx.clip();
    ctx.drawImage(image, -imageSize / 2, -imageSize / 2, imageSize, imageSize);
    ctx.restore();
  }

  ctx.strokeStyle = '#8a5a1a';
  ctx.lineWidth = 2;
  ctx.strokeRect(-size / 2, -size / 2, size, size);
  ctx.restore();
}

export function drawBossBullets(ctx, bullets, view) {
  ctx.save();
  for (const bullet of bullets) {
    const sx = view.worldToScreenX(bullet.x);
    const sy = view.worldToScreenY(bullet.y);
    ctx.fillStyle = '#ff3864';
    ctx.beginPath();
    ctx.arc(sx, sy, TILE * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7a0c2e';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

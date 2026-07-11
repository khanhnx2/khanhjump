// Physics constants in tile units. Tuned so a jump clears ~3.1 tiles high
// and travels ~4.1 tiles horizontally at scroll speed (Geometry Dash 1x feel).
export const TILE = 40;              // pixels per tile at render time
export const SCROLL_SPEED = 10.4;    // tiles/second
export const JUMP_VELOCITY = 31.5;   // tiles/second (upward) → apex ~3.1 tiles
export const GRAVITY = 159.0;        // tiles/second^2 → horizontal ~4.1 tiles
const FLY_ACCELERATION = 92.0;
const FLY_MAX_UP = 12.5;
const FLY_MAX_DOWN = -13.5;
const DAMAGE_FLASH_SECONDS = 0.65;

const faceImage = new Image();
faceImage.src = 'assets/characters/player-father.png';

export function setPlayerFace(src) {
  faceImage.src = src;
}

export class PlayerCube {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 0;          // world x in tiles (cube left edge)
    this.y = 0;          // height of cube bottom above floor, in tiles
    this.vy = 0;         // vertical velocity, tiles/s (positive = up)
    this.grounded = true;
    this.rotation = 0;   // radians, visual only
    this.flashTimer = 0;
  }

  jump() {
    if (this.grounded) {
      this.vy = JUMP_VELOCITY;
      this.grounded = false;
    }
  }

  flash() {
    this.flashTimer = DAMAGE_FLASH_SECONDS;
  }

  // inputHeld enables GD-style hold-to-rejump, or hold-to-fly with wings.
  update(dt, inputHeld, canFly = false) {
    this.x += SCROLL_SPEED * dt;
    this.flashTimer = Math.max(0, this.flashTimer - dt);

    if (canFly && inputHeld) {
      this.vy = Math.min(FLY_MAX_UP, this.vy + FLY_ACCELERATION * dt);
    } else {
      this.vy -= GRAVITY * dt;
    }
    if (canFly) this.vy = Math.max(FLY_MAX_DOWN, Math.min(FLY_MAX_UP, this.vy));

    this.y += this.vy * dt;

    // Floor is always standable at y = 0
    if (this.y <= 0) {
      this.y = 0;
      this.vy = 0;
      this.grounded = true;
    } else if (this.vy !== 0) {
      this.grounded = false;
    }

    if (!canFly && this.grounded && inputHeld) this.jump();

    this.updateRotation(dt);
  }

  // Rotate ~180° over one jump arc while airborne; snap to 90° steps on land
  updateRotation(dt) {
    if (!this.grounded) {
      const airTime = (2 * JUMP_VELOCITY) / GRAVITY;
      this.rotation += (Math.PI / airTime) * dt;
    } else if (this.rotation % (Math.PI / 2) !== 0) {
      const step = Math.PI / 2;
      this.rotation = Math.round(this.rotation / step) * step;
    }
  }

  draw(ctx, view, shieldActive = false) {
    const sx = view.worldToScreenX(this.x);
    const sy = view.worldToScreenY(this.y);
    const size = TILE;

    ctx.save();
    ctx.translate(sx + size / 2, sy - size / 2);

    if (shieldActive) {
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 120);
      ctx.save();
      ctx.strokeStyle = `rgba(120, 230, 255, ${0.4 + pulse * 0.4})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.75, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.rotate(this.rotation);

    if (this.flashTimer > 0 && Math.floor(this.flashTimer * 18) % 2 === 0) {
      ctx.globalAlpha = 0.35;
    }

    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(-size / 2, -size / 2, size, size);

    if (faceImage.complete && faceImage.naturalWidth > 0) {
      const inset = size * 0.1;
      const imageSize = size - inset * 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(-imageSize / 2, -imageSize / 2, imageSize, imageSize);
      ctx.clip();
      ctx.drawImage(faceImage, -imageSize / 2, -imageSize / 2, imageSize, imageSize);
      ctx.restore();
    }

    ctx.strokeStyle = '#004a66';
    ctx.lineWidth = 3;
    ctx.strokeRect(-size / 2, -size / 2, size, size);

    if (this.flashTimer > 0) {
      ctx.strokeStyle = '#ff3864';
      ctx.lineWidth = 5;
      ctx.strokeRect(-size / 2 - 3, -size / 2 - 3, size + 6, size + 6);
    }

    ctx.restore();
  }
}

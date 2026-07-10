import { TILE } from './player-cube.js';

// Fixed-size particle pool — no per-frame allocations, so no GC stutter.
const POOL_SIZE = 60;

export class ParticleSystem {
  constructor() {
    this.pool = Array.from({ length: POOL_SIZE }, () => ({
      active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, size: 0, color: '',
    }));
    this.next = 0;
    this.trailTimer = 0;
  }

  spawn(x, y, vx, vy, life, size, color) {
    const p = this.pool[this.next];
    this.next = (this.next + 1) % POOL_SIZE;
    p.active = true;
    p.x = x; p.y = y; p.vx = vx; p.vy = vy;
    p.life = life; p.maxLife = life;
    p.size = size; p.color = color;
  }

  // Radial burst at the cube's position on death
  burst(worldX, worldY) {
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const speed = 4 + Math.random() * 8;
      this.spawn(
        worldX + 0.5, worldY + 0.5,
        Math.cos(angle) * speed, Math.sin(angle) * speed,
        0.5 + Math.random() * 0.3,
        4 + Math.random() * 6,
        i % 2 === 0 ? '#00e5ff' : '#ffffff'
      );
    }
  }

  // Small squares dropped behind the cube while it slides on the ground
  emitTrail(dt, player) {
    this.trailTimer -= dt;
    if (player.grounded && this.trailTimer <= 0) {
      this.trailTimer = 0.04;
      this.spawn(
        player.x, player.y + 0.1 + Math.random() * 0.3,
        -2 - Math.random() * 2, 1 + Math.random() * 2,
        0.35, 3 + Math.random() * 3, '#00b5cc'
      );
    }
  }

  update(dt) {
    for (const p of this.pool) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) { p.active = false; continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy -= 20 * dt; // light gravity on particles
    }
  }

  draw(ctx, view) {
    for (const p of this.pool) {
      if (!p.active) continue;
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(
        view.worldToScreenX(p.x) - p.size / 2,
        view.worldToScreenY(p.y) - p.size / 2,
        p.size, p.size
      );
    }
    ctx.globalAlpha = 1;
  }
}

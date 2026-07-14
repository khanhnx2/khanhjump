// DOM-based HUD: progress bar (top center), attempt counter, mute button,
// boss HP label during boss fights, ally companion / Mini Black Nguyên HP labels.

import { BOSS_LABELS } from './boss-level-data.js';

export class Hud {
  constructor(game, audio) {
    this.game = game;

    this.bar = document.getElementById('progress-fill');
    this.percent = document.getElementById('progress-percent');
    this.attemptLabel = document.getElementById('attempt-label');
    this.heartBar = document.getElementById('heart-bar');
    this.bossHp = document.getElementById('boss-hp');
    this.miniHp = document.getElementById('mini-hp');
    this.miniAddHp = document.getElementById('mini-add-hp');
    this.muteBtn = document.getElementById('mute-btn');

    this.attemptTimer = 0;

    this.muteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const muted = audio.toggleMute();
      this.muteBtn.textContent = muted ? '🔇' : '🔊';
    });
    // Don't let the button trigger a jump
    this.muteBtn.addEventListener('mousedown', (e) => e.stopPropagation());
    this.muteBtn.addEventListener('touchstart', (e) => e.stopPropagation());

    game.on('health', () => this.updateHearts());
    game.on('restart', () => this.showAttempt());
    game.on('start', () => this.showAttempt());
    this.updateHearts();
  }

  showAttempt() {
    this.attemptLabel.textContent = `Attempt ${this.game.attempts}`;
    this.attemptLabel.classList.remove('hidden');
    this.attemptTimer = 1.5;
  }

  update(dt) {
    const pct = Math.round(this.game.progress * 100);
    this.bar.style.width = `${pct}%`;
    this.percent.textContent = `${pct}%`;
    this.updateHearts();
    this.updateBossHp();
    this.updateMiniHp();
    this.updateMiniAddHp();

    if (this.attemptTimer > 0) {
      this.attemptTimer -= dt;
      if (this.attemptTimer <= 0) this.attemptLabel.classList.add('hidden');
    }
  }

  updateHearts() {
    this.heartBar.textContent = '♥'.repeat(this.game.hearts);
  }

  updateBossHp() {
    const boss = this.game.state === 'boss' && this.game.bossFight && this.game.bossFight.boss;
    if (!boss) {
      this.bossHp.classList.add('hidden');
      return;
    }
    this.bossHp.classList.remove('hidden');
    this.bossHp.textContent = `${BOSS_LABELS[boss.key]} ♥ ${boss.hp}/${boss.maxHp}`;
  }

  updateMiniHp() {
    const mini = this.game.miniNguyen;
    if (!mini || !mini.alive) {
      this.miniHp.classList.add('hidden');
      return;
    }
    this.miniHp.classList.remove('hidden');
    this.miniHp.textContent = `${mini.label} ♥ ${mini.hp}/${mini.maxHp}`;
  }

  updateMiniAddHp() {
    const miniAdd = this.game.state === 'boss' && this.game.bossFight && this.game.bossFight.miniAdd;
    if (!miniAdd) {
      this.miniAddHp.classList.add('hidden');
      return;
    }
    this.miniAddHp.classList.remove('hidden');
    this.miniAddHp.textContent = `Mini Black Nguyên ♥ ${miniAdd.hp}/${miniAdd.maxHp}`;
  }
}

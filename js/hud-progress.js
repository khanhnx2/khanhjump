// DOM-based HUD: progress bar (top center), attempt counter, mute button.

export class Hud {
  constructor(game, audio) {
    this.game = game;

    this.bar = document.getElementById('progress-fill');
    this.percent = document.getElementById('progress-percent');
    this.attemptLabel = document.getElementById('attempt-label');
    this.heartBar = document.getElementById('heart-bar');
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

    if (this.attemptTimer > 0) {
      this.attemptTimer -= dt;
      if (this.attemptTimer <= 0) this.attemptLabel.classList.add('hidden');
    }
  }

  updateHearts() {
    this.heartBar.textContent = '♥'.repeat(this.game.hearts);
  }
}

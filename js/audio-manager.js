// Procedural background music: starts after user input, loops while playing,
// pauses on death/win, and avoids external audio files.

export class AudioManager {
  constructor(game) {
    this.context = null;
    this.master = null;
    this.timer = null;
    this.step = 0;
    this.muted = false;
    this.tempo = 132;
    this.notes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 293.66, 440.00];

    game.on('start', () => this.playFromStart());
    game.on('restart', () => this.playFromStart());
    game.on('damage', () => this.playDamageAlert());
    game.on('bossStart', () => this.playBossAlert());
    game.on('bossDefeated', () => this.playBossDefeat());
    game.on('death', () => this.pause());
    game.on('win', () => this.pause());
  }

  playFromStart() {
    this.ensureContext();
    if (!this.context) return;

    this.pause();
    this.step = 0;
    this.scheduleBeat();
    this.timer = setInterval(() => this.scheduleBeat(), (60 / this.tempo) * 500);
  }

  pause() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  playDamageAlert() {
    this.ensureContext();
    if (!this.context || this.muted) return;

    const now = this.context.currentTime;
    this.playTone(220, now, 0.1, 'sawtooth', 0.2);
    this.playTone(146.83, now + 0.12, 0.16, 'square', 0.16);
  }

  // Menacing low two-tone sting when a boss appears.
  playBossAlert() {
    this.ensureContext();
    if (!this.context || this.muted) return;

    const now = this.context.currentTime;
    this.playTone(110, now, 0.22, 'sawtooth', 0.2);
    this.playTone(116.54, now + 0.24, 0.3, 'sawtooth', 0.22);
  }

  // Rising arpeggio when a boss goes down.
  playBossDefeat() {
    this.ensureContext();
    if (!this.context || this.muted) return;

    const now = this.context.currentTime;
    this.playTone(392.0, now, 0.1, 'square', 0.16);
    this.playTone(523.25, now + 0.1, 0.1, 'square', 0.16);
    this.playTone(659.25, now + 0.2, 0.18, 'square', 0.18);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.28;
    return this.muted;
  }

  ensureContext() {
    if (this.context) {
      if (this.context.state === 'suspended') this.context.resume();
      return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.master.gain.value = this.muted ? 0 : 0.28;
    this.master.connect(this.context.destination);
  }

  scheduleBeat() {
    const now = this.context.currentTime;
    const note = this.notes[this.step % this.notes.length];
    const bass = note / 2;

    this.playTone(note, now, 0.11, 'square', 0.12);
    if (this.step % 2 === 0) this.playTone(bass, now, 0.18, 'sawtooth', 0.08);

    this.step += 1;
  }

  playTone(frequency, startTime, duration, type, gainValue) {
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.02);
  }
}

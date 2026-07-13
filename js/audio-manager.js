// Procedural background music: starts after user input, loops while playing,
// pauses on death/win, and avoids external audio files.

export class AudioManager {
  constructor(game) {
    this.context = null;
    this.master = null;
    this.noiseBuffer = null;
    this.timer = null;
    this.step = 0;
    this.muted = false;
    this.tempo = 160;
    // 16-step A-minor riff: two ascending runs, second one resolving higher
    // for a driving chase feel.
    this.notes = [
      220.00, 261.63, 329.63, 440.00,
      392.00, 329.63, 440.00, 523.25,
      220.00, 261.63, 329.63, 440.00,
      587.33, 523.25, 493.88, 659.25
    ];

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

    // Shared white-noise buffer for the hi-hat voice.
    const length = Math.floor(this.context.sampleRate * 0.1);
    this.noiseBuffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  }

  // Steps are half-beats; a bar is 16 steps. Kick lands on the quarter
  // notes, hats on the off-beats between them, bass drives every beat.
  scheduleBeat() {
    const now = this.context.currentTime;
    const step = this.step % 16;
    const note = this.notes[step];

    this.playTone(note, now, 0.11, 'square', 0.12);
    if (step % 2 === 0) this.playTone(note / 2, now, 0.16, 'sawtooth', 0.1);
    if (step % 4 === 0) this.playKick(now);
    if (step % 4 === 2) this.playHat(now);

    this.step += 1;
  }

  // Synth kick: sine pitch-drop 150 -> 50 Hz with a fast gain decay.
  playKick(startTime) {
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(150, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, startTime + 0.12);
    gain.gain.setValueAtTime(0.25, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.14);

    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.16);
  }

  // Hi-hat: short high-passed noise burst.
  playHat(startTime) {
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();

    source.buffer = this.noiseBuffer;
    filter.type = 'highpass';
    filter.frequency.value = 7000;
    gain.gain.setValueAtTime(0.06, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(startTime);
    source.stop(startTime + 0.06);
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

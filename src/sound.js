/* A small, soft toy-box: plucked sine tones, nothing harsh. */

export class Sound {
  constructor() {
    this.ctx = null;
    this.master = null;
  }

  enable() {
    if (this.ctx) { this.ctx.resume?.(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.22;
    const soften = this.ctx.createBiquadFilter();
    soften.type = 'lowpass';
    soften.frequency.value = 3200;
    this.master.connect(soften);
    soften.connect(this.ctx.destination);
  }

  note(freq, dur = 0.25, type = 'sine', gain = 0.5, delay = 0, glide = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (glide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * glide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  jump() { this.note(440, 0.16, 'sine', 0.35, 0, 1.6); }
  flutter() { this.note(620, 0.2, 'triangle', 0.25, 0, 1.5); this.note(930, 0.16, 'sine', 0.12, 0.03, 1.4); }
  boing() { this.note(220, 0.42, 'triangle', 0.4, 0, 3.2); }
  land(impact) { this.note(150, 0.12, 'sine', Math.min(0.3, impact * 0.02), 0, 0.7); }
  respawn() { this.note(520, 0.2, 'sine', 0.22, 0, 0.6); this.note(390, 0.24, 'sine', 0.18, 0.08, 0.7); }
  checkpoint() {
    [523.25, 659.25, 783.99].forEach((f, i) => this.note(f, 0.3, 'sine', 0.28, i * 0.08));
  }
  collect(n) {
    const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
    const f = scale[Math.min(scale.length - 1, (n - 1) % scale.length)];
    this.note(f, 0.22, 'sine', 0.32);
    this.note(f * 2, 0.16, 'sine', 0.12, 0.02);
  }
  fanfare() {
    const melody = [523.25, 659.25, 783.99, 1046.5, 987.77, 1046.5];
    melody.forEach((f, i) => {
      this.note(f, 0.4, 'sine', 0.3, i * 0.14);
      this.note(f / 2, 0.5, 'triangle', 0.14, i * 0.14);
    });
  }
}

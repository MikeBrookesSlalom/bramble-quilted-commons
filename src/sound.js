/* A small, soft toy-box: plucked sine tones, nothing harsh. */

export class Sound {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.musicMuted = false;
    this.musicPlaying = false;
    this.padOscs = null;
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

    // background music sits on its own gain so a mute toggle never touches sfx
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicMuted ? 0 : 0.15;
    this.musicGain.connect(soften);
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

  /* ---------------- chill background music ----------------
     A soft drifting pad that slowly shifts between three open
     chords, plus a sparse pentatonic pluck melody so it never
     hits a "wrong" note. Everything generated, nothing loaded. */

  musicNote(freq, { dur = 1.4, type = 'sine', gain = 0.14, delay = 0, pan = 0, attack = 0.08 } = {}) {
    if (!this.ctx || !this.musicGain) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    if (this.ctx.createStereoPanner) {
      const p = this.ctx.createStereoPanner();
      p.pan.value = pan;
      g.connect(p);
      p.connect(this.musicGain);
    } else {
      g.connect(this.musicGain);
    }
    osc.start(t);
    osc.stop(t + dur + 0.15);
  }

  startPad() {
    const padGain = this.ctx.createGain();
    padGain.gain.value = 1;
    padGain.connect(this.musicGain);
    const chord = [130.81, 196.0, 329.63]; // a soft open C3-G3-E4
    this.padOscs = chord.map((f, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = this.ctx.createGain();
      g.gain.value = 0.3 - i * 0.06;
      osc.connect(g);
      g.connect(padGain);
      osc.start();
      return { osc, gainNode: g };
    });
    this.padGain = padGain;
    this.padChordIndex = 0;
    this.scheduleChordChange();
  }

  scheduleChordChange() {
    const chords = [
      [130.81, 196.0, 329.63],  // C3 G3 E4 — home
      [110.0, 164.81, 220.0],   // A2 E3 A3 — a gentle dip
      [146.83, 220.0, 349.23],  // D3 A3 F4 — a soft lift
    ];
    const next = () => {
      if (!this.padOscs) return;
      this.padChordIndex = (this.padChordIndex + 1) % chords.length;
      const target = chords[this.padChordIndex];
      const now = this.ctx.currentTime;
      this.padOscs.forEach((p, i) => {
        p.osc.frequency.cancelScheduledValues(now);
        p.osc.frequency.setValueAtTime(p.osc.frequency.value, now);
        p.osc.frequency.exponentialRampToValueAtTime(target[i], now + 4);
      });
      this.musicChordTimer = setTimeout(next, 11000 + Math.random() * 3000);
    };
    this.musicChordTimer = setTimeout(next, 9000 + Math.random() * 3000);
  }

  scheduleMelody() {
    // pentatonic — every note in this scale sits happily over every chord above
    const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
    const playNext = () => {
      if (!this.musicPlaying) return;
      const freq = scale[Math.floor(Math.random() * scale.length)] * (Math.random() < 0.82 ? 1 : 2);
      const pan = Math.random() * 1.3 - 0.65;
      this.musicNote(freq, { dur: 1.1 + Math.random() * 0.9, gain: 0.075 + Math.random() * 0.035, pan, attack: 0.1 });
      if (Math.random() < 0.16) {
        // an occasional soft bell an octave up, for a little sparkle
        this.musicNote(freq * 2, { dur: 2.0, gain: 0.045, delay: 0.35, pan: -pan, attack: 0.5 });
      }
      this.musicMelodyTimer = setTimeout(playNext, 1500 + Math.random() * 1500);
    };
    this.musicMelodyTimer = setTimeout(playNext, 1200);
  }

  startMusic() {
    if (!this.ctx || this.musicPlaying) return;
    this.musicPlaying = true;
    this.startPad();
    this.scheduleMelody();
  }

  stopMusic() {
    this.musicPlaying = false;
    clearTimeout(this.musicChordTimer);
    clearTimeout(this.musicMelodyTimer);
    if (this.padOscs && this.ctx) {
      const now = this.ctx.currentTime;
      const oscs = this.padOscs;
      oscs.forEach((p) => p.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1));
      setTimeout(() => oscs.forEach((p) => { try { p.osc.stop(); } catch {} }), 1200);
      this.padOscs = null;
    }
  }

  setMusicMuted(muted) {
    this.musicMuted = muted;
    if (this.musicGain) this.musicGain.gain.value = muted ? 0 : 0.15;
  }
}

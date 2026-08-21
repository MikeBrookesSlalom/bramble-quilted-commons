/* A small, soft toy-box: plucked sine tones, nothing harsh. */

export class Sound {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.musicMuted = false;
    this.musicPlaying = false;
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
    this.musicGain.gain.value = this.musicMuted ? 0 : 0.17;
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

  /* ---------------- bouncy background music ----------------
     A genuine little 4-bar tune on a loop, not a drone: a plucked
     bassline anchoring each chord, a whimsical marimba-ish melody
     riff, and a soft shaker for a bit of groove. Everything here
     is synthesized live — no audio files anywhere in this game. */

  musicNote(freq, { dur = 0.5, type = 'sine', gain = 0.14, delay = 0, pan = 0, attack = 0.01 } = {}) {
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

  musicShaker(delay = 0, gain = 0.05) {
    if (!this.ctx || !this.musicGain || !this.noiseBuffer) return;
    const t = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const band = this.ctx.createBiquadFilter();
    band.type = 'highpass';
    band.frequency.value = 4500;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    src.connect(band);
    band.connect(g);
    g.connect(this.musicGain);
    src.start(t);
    src.stop(t + 0.09);
  }

  // a quick, soft chord stab — a chime confirming the harmony, never
  // sustained, so it can never read as a drone
  musicChordStab(freqs, delay = 0) {
    freqs.forEach((f, i) => this.musicNote(f, { dur: 0.7, type: 'sine', gain: 0.045, delay, pan: (i - 1) * 0.25, attack: 0.02 }));
  }

  startMusic() {
    if (!this.ctx || this.musicPlaying) return;
    this.musicPlaying = true;

    if (!this.noiseBuffer) {
      const len = this.ctx.sampleRate * 0.1;
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buf;
    }

    const TEMPO = 112;
    const STEP = 60 / TEMPO / 2; // eighth notes

    // four bars: C — Am — F — G, a classic, cheerful little loop
    const chords = [
      [261.63, 329.63, 392.0],  // C E G
      [220.0, 261.63, 329.63],  // A C E
      [174.61, 220.0, 261.63],  // F A C
      [196.0, 246.94, 293.66],  // G B D
    ];
    const bassRoots = [130.81, 220.0, 174.61, 196.0]; // C3 A3 F3 G3

    // one bouncy 4-bar melody riff (8 eighth-note steps per bar), with
    // rests written in as null — this is the "tune" that makes it fun
    const melody = [
      [329.63, 392.0, 329.63, 523.25, null, 392.0, 329.63, 293.66],   // over C
      [440.0, 523.25, 440.0, 329.63, null, 523.25, 440.0, 392.0],     // over Am
      [349.23, 440.0, 523.25, 440.0, null, 349.23, 440.0, 392.0],     // over F
      [392.0, 493.88, 587.33, 493.88, null, 392.0, 587.33, null],     // over G, resolves back home
    ];

    let bar = 0, step = 0;
    const playStep = () => {
      if (!this.musicPlaying) return;
      if (step === 0) this.musicChordStab(chords[bar]);
      if (step === 0 || step === 4) {
        this.musicNote(bassRoots[bar], { dur: 0.34, type: 'triangle', gain: 0.16, attack: 0.006 });
      }
      const note = melody[bar][step];
      if (note) {
        const pan = step % 2 === 0 ? -0.25 : 0.25;
        this.musicNote(note, { dur: 0.3, type: 'sine', gain: 0.1, pan, attack: 0.008 });
      }
      if (step % 2 === 1) this.musicShaker(0, 0.045);

      step++;
      if (step >= 8) { step = 0; bar = (bar + 1) % chords.length; }
      this.musicStepTimer = setTimeout(playStep, STEP * 1000);
    };
    playStep();
  }

  stopMusic() {
    this.musicPlaying = false;
    clearTimeout(this.musicStepTimer);
  }

  setMusicMuted(muted) {
    this.musicMuted = muted;
    if (this.musicGain) this.musicGain.gain.value = muted ? 0 : 0.17;
  }
}

/*
 * RoboDad Radio: relaxing background music generated live in the browser.
 *
 * Nothing is downloaded or streamed. Every note is synthesised with the Web
 * Audio API, so there are no recordings and no licences to worry about. The
 * "Canon in D" station plays Pachelbel's chord progression and opening violin
 * line, a composition written around 1700 and long in the public domain.
 *
 *   RoboRadio.play("lounge" | "canon" | "drive")
 *   RoboRadio.stop()
 *   RoboRadio.setVolume(0..1)
 *   RoboRadio.duck(true|false)     // quieter while RoboDad reads a reply aloud
 *   RoboRadio.onchange = (state) => { ... }
 */
(function () {
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // small seeded random so melodies vary but stay pleasant
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const pickOne = (a) => a[Math.floor(rand() * a.length)];

  let ctx, master, comp, wet, dry, delay, delayFb, delayOut;
  let timer = null, current = null, bar = 0, nextBarTime = 0;
  let volume = 0.35, ducked = false;

  function impulse(seconds, decay) {
    const len = ctx.sampleRate * seconds, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  function setup(useCtx) {
    if (ctx && !useCtx) return;
    ctx = useCtx || new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0;
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 3;
    master.connect(comp).connect(ctx.destination);

    dry = ctx.createGain(); dry.gain.value = 0.8; dry.connect(master);
    const rev = ctx.createConvolver(); rev.buffer = impulse(2.8, 2.5);
    wet = ctx.createGain(); wet.gain.value = 0.35; wet.connect(rev).connect(master);

    // tempo-synced echo for the synthwave arpeggio
    delay = ctx.createDelay(1.5); delayFb = ctx.createGain(); delayFb.gain.value = 0.35;
    delayOut = ctx.createGain(); delayOut.gain.value = 0.3;
    delay.connect(delayFb).connect(delay); delay.connect(delayOut).connect(wet);
  }

  function out(node, sendDelay) {
    node.connect(dry); node.connect(wet);
    if (sendDelay) node.connect(delay);
  }

  function env(g, t, a, peak, d, sustain, rel, end) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(sustain, 0.0001), t + a + d);
    g.gain.setValueAtTime(Math.max(sustain, 0.0001), end);
    g.gain.exponentialRampToValueAtTime(0.0001, end + rel);
  }

  // ---------- instruments ----------
  function pad(notes, t, dur, { type = "sawtooth", cutoff = 900, level = 0.05 } = {}) {
    notes.forEach((n) => {
      [-7, 7].forEach((cents) => {
        const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
        o.type = type; o.frequency.value = mtof(n); o.detune.value = cents;
        f.type = "lowpass"; f.frequency.value = cutoff; f.Q.value = 0.4;
        env(g, t, 0.9, level, 0.5, level * 0.8, 1.4, t + dur);
        o.connect(f).connect(g); out(g);
        o.start(t); o.stop(t + dur + 1.6);
      });
    });
  }

  function epiano(n, t, dur, vel = 1) {
    // two-operator FM: a warm electric-piano tone
    const c = ctx.createOscillator(), m = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
    const f = mtof(n);
    c.frequency.value = f; m.frequency.value = f;
    mg.gain.setValueAtTime(f * 1.2, t); mg.gain.exponentialRampToValueAtTime(f * 0.05, t + 1.2);
    m.connect(mg).connect(c.frequency);
    env(g, t, 0.018, 0.09 * vel, 1.4, 0.02 * vel, 0.5, t + dur);
    c.connect(g); out(g);
    c.start(t); m.start(t); c.stop(t + dur + 0.6); m.stop(t + dur + 0.6);
  }

  function pluck(n, t, { type = "triangle", level = 0.08, decay = 1.6, cutoff = 2400, echo = false } = {}) {
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = type; o.frequency.value = mtof(n);
    f.type = "lowpass"; f.frequency.setValueAtTime(cutoff, t); f.frequency.exponentialRampToValueAtTime(cutoff * 0.3, t + decay);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(level, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    o.connect(f).connect(g); out(g, echo);
    o.start(t); o.stop(t + decay + 0.05);
  }

  function bass(n, t, dur, { type = "triangle", level = 0.12, cutoff = 500 } = {}) {
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = type; o.frequency.value = mtof(n);
    f.type = "lowpass"; f.frequency.value = cutoff;
    env(g, t, 0.02, level, 0.3, level * 0.7, 0.15, t + dur);
    o.connect(f).connect(g); g.connect(dry);
    o.start(t); o.stop(t + dur + 0.2);
  }

  function softKick(t, level = 0.16) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.22);
    g.gain.setValueAtTime(level, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(g).connect(dry); o.start(t); o.stop(t + 0.32);
  }

  // ---------- stations ----------
  const STATIONS = {
    // Lobby Lounge: smooth "elevator" jazz in F
    lounge: {
      name: "Lobby Lounge", bpm: 84,
      bars: [
        { root: 43, chord: [58, 62, 65, 69] }, // Gm9
        { root: 36, chord: [58, 62, 64, 69] }, // C13
        { root: 41, chord: [57, 60, 64, 67] }, // Fmaj9
        { root: 38, chord: [53, 57, 60, 64] }, // Dm9
        { root: 46, chord: [58, 62, 65, 69] }, // Bbmaj7
        { root: 45, chord: [55, 60, 64, 67] }, // Am7
        { root: 43, chord: [53, 58, 62, 65] }, // Gm7
        { root: 36, chord: [58, 65, 67, 70] }, // C7sus
      ],
      play(i, t, b) {
        const { root, chord } = this.bars[i % this.bars.length];
        chord.forEach((n) => epiano(n, t, b * 1.5, 0.8));
        chord.forEach((n) => epiano(n, t + b * 2.5, b * 1, 0.45));
        bass(root, t, b * 1.5); bass(root + 7, t + b * 2, b * 0.9); bass(root + 12, t + b * 3, b * 0.9, { level: 0.08 });
        const scale = [77, 79, 81, 84, 86, 89];
        [0.5, 1.5, 3].forEach((beat) => { if (rand() < 0.55) epiano(pickOne(scale), t + b * beat, b * 0.9, 0.5); });
      },
    },
    // Canon in D: Pachelbel's progression with harp arpeggios and the violin line
    canon: {
      name: "Canon in D", bpm: 58,
      chords: [
        { bass: 50, arp: [62, 66, 69, 74], top: 78 }, // D
        { bass: 45, arp: [61, 64, 69, 73], top: 76 }, // A
        { bass: 47, arp: [59, 62, 66, 71], top: 74 }, // Bm
        { bass: 42, arp: [57, 61, 66, 69], top: 73 }, // F#m
        { bass: 43, arp: [55, 59, 62, 67], top: 71 }, // G
        { bass: 38, arp: [62, 66, 69, 74], top: 69 }, // D
        { bass: 43, arp: [55, 59, 62, 67], top: 71 }, // G
        { bass: 45, arp: [57, 61, 64, 69], top: 73 }, // A
      ],
      play(i, t, b) {
        // two chords per bar (each lasts two beats)
        for (let k = 0; k < 2; k++) {
          const idx = (i * 2 + k) % 8, c = this.chords[idx], cycle = Math.floor((i * 2 + k) / 8);
          const ct = t + k * 2 * b;
          bass(c.bass, ct, 2 * b, { level: 0.13, cutoff: 400 });
          pad(c.arp.slice(0, 3), ct, 2 * b, { type: "triangle", cutoff: 1400, level: 0.035 });
          const order = cycle % 2 === 0 ? [0, 1, 2, 3] : [3, 2, 1, 2];
          order.forEach((o, j) => pluck(c.arp[o] + (cycle % 3 === 2 ? 12 : 0), ct + j * b / 2, { level: 0.1, decay: 1.8 }));
          if (cycle >= 1) pad([c.top], ct, 2 * b, { type: "triangle", cutoff: 2600, level: 0.05 });
        }
      },
    },
    // Midnight Drive: mellow synthwave in A minor
    drive: {
      name: "Midnight Drive", bpm: 92,
      bars: [
        { root: 33, chord: [57, 60, 64] }, // Am
        { root: 29, chord: [53, 57, 60] }, // F
        { root: 36, chord: [55, 60, 64] }, // C
        { root: 31, chord: [55, 59, 62] }, // G
      ],
      play(i, t, b) {
        const { root, chord } = this.bars[i % 4];
        pad(chord.map((n) => n - 12), t, 4 * b, { type: "sawtooth", cutoff: 700, level: 0.05 });
        for (let s = 0; s < 8; s++) bass(root + (s % 4 === 3 ? 12 : 0), t + s * b / 2, b * 0.4, { type: "sawtooth", level: 0.08, cutoff: 380 });
        const arp = [...chord, chord[0] + 12];
        for (let s = 0; s < 16; s++) pluck(arp[s % 4] + 12, t + s * b / 4, { type: "sawtooth", level: 0.04, decay: 0.35, cutoff: 1300, echo: true });
        softKick(t); softKick(t + 2 * b);
      },
    },
  };

  function tick() {
    const st = STATIONS[current]; if (!st) return;
    const beat = 60 / st.bpm;
    while (nextBarTime < ctx.currentTime + 0.6) {
      st.play(bar, nextBarTime, beat);
      nextBarTime += 4 * beat; bar++;
    }
  }

  function targetGain() { return volume * 1.4 * (ducked ? 0.25 : 1); }

  const api = {
    stations: Object.fromEntries(Object.entries(STATIONS).map(([k, v]) => [k, v.name])),
    get station() { return current; },
    get playing() { return !!timer; },
    onchange: null,
    async play(name) {
      setup();
      if (ctx.state === "suspended") await ctx.resume();
      if (timer && name === current) return;
      if (timer) { clearInterval(timer); timer = null; }
      current = STATIONS[name] ? name : "lounge";
      delay.delayTime.value = (60 / STATIONS[current].bpm) * 0.75;
      bar = 0; seed = 7; nextBarTime = ctx.currentTime + 0.15;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(targetGain(), ctx.currentTime + 1.5);
      tick(); timer = setInterval(tick, 50);
      api.onchange && api.onchange(api);
    },
    stop() {
      if (!ctx || !timer) return;
      clearInterval(timer); timer = null;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
      setTimeout(() => { if (!timer && ctx.state === "running") ctx.suspend(); }, 4000);
      api.onchange && api.onchange(api);
    },
    setVolume(v) {
      volume = Math.min(1, Math.max(0, v));
      if (ctx && timer) master.gain.setTargetAtTime(targetGain(), ctx.currentTime, 0.1);
    },
    duck(on) {
      ducked = !!on;
      if (ctx && timer) master.gain.setTargetAtTime(targetGain(), ctx.currentTime, 0.25);
    },
    // Renders a station to an AudioBuffer without playing it (used for testing).
    async renderPreview(name, seconds = 20, sampleRate = 44100) {
      const saved = { ctx, master, comp, wet, dry, delay, delayFb, delayOut, current, bar, nextBarTime };
      const off = new OfflineAudioContext(2, Math.ceil(sampleRate * seconds), sampleRate);
      setup(off);
      const st = STATIONS[name]; const beat = 60 / st.bpm;
      master.gain.setValueAtTime(0, 0); master.gain.linearRampToValueAtTime(volume * 1.4, 1.5);
      delay.delayTime.value = beat * 0.75; seed = 7;
      for (let i = 0, t = 0.1; t < seconds; i++, t += 4 * beat) st.play(i, t, beat);
      const buf = await off.startRendering();
      ({ ctx, master, comp, wet, dry, delay, delayFb, delayOut, current, bar, nextBarTime } = saved);
      return buf;
    },
    chime() {
      setup(); if (ctx.state === "suspended") ctx.resume();
      const t = ctx.currentTime + 0.05;
      [76, 79, 84].forEach((n, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = mtof(n); g.gain.setValueAtTime(0.0001, t + i * 0.18);
        g.gain.exponentialRampToValueAtTime(0.18, t + i * 0.18 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.18 + 1.2);
        o.connect(g).connect(ctx.destination); o.start(t + i * 0.18); o.stop(t + i * 0.18 + 1.3);
      });
    },
  };
  window.RoboRadio = api;
})();

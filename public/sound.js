// ============ Sounds ============
// Generated with the Web Audio API, so no audio files are needed.
// Custom override: drop an mp3 in public/sounds/ with one of these names and it plays instead:
//   megz.mp3 (Megz wins) · 3mora.mp3 (3mora wins) · tie.mp3 · final.mp3 · start.mp3
const Sound = (() => {
  let ctx = null;
  let muted = store.get('7x-muted') === '1';
  const custom = {}; // name -> true if public/sounds/<name>.mp3 exists
  const FILES = { megz: 'megz', amora: '3mora', tie: 'tie', final: 'final', start: 'start' };

  for (const [name, file] of Object.entries(FILES)) {
    fetch(`/sounds/${file}.mp3`, { method: 'HEAD' }).then((r) => { custom[name] = r.ok; }).catch(() => {});
  }

  function ac() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  // Browsers only allow sound after the first click/key press
  ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => document.addEventListener(ev, ac, { once: true }));

  function tone(freq, start, dur, { type = 'sine', vol = 0.18, slideTo } = {}) {
    const c = ac();
    if (!c) return;
    const t = c.currentTime + start;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function noise(start, dur, vol = 0.15) {
    const c = ac();
    if (!c) return;
    const t = c.currentTime + start;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = c.createBufferSource();
    const g = c.createGain();
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 3000;
    g.gain.value = vol;
    src.buffer = buf;
    src.connect(hp).connect(g).connect(c.destination);
    src.start(t);
  }

  const N = { C4: 262, E4: 330, G4: 392, A4: 440, C5: 523, D5: 587, E5: 659, G5: 784, A5: 880, C6: 1047, E6: 1319 };

  const synth = {
    join() { tone(N.E5, 0, 0.1, { type: 'triangle', vol: 0.12 }); tone(N.A5, 0.07, 0.14, { type: 'triangle', vol: 0.12 }); },
    vote() { tone(N.G5, 0, 0.07, { type: 'triangle', vol: 0.15 }); tone(N.C6, 0.05, 0.1, { type: 'triangle', vol: 0.12 }); },
    tick() { tone(1200, 0, 0.05, { type: 'square', vol: 0.05 }); },
    start() {
      tone(180, 0, 0.35, { type: 'sawtooth', vol: 0.06, slideTo: 900 });
      tone(N.C6, 0.32, 0.4, { type: 'triangle', vol: 0.16 });
    },
    // Megz = backend: 8-bit "deploy success" arpeggio
    megz() {
      [N.C5, N.E5, N.G5, N.C6, N.G5, N.C6, N.E6].forEach((f, i) => tone(f, i * 0.09, 0.12, { type: 'square', vol: 0.08 }));
      [N.C5, N.E5, N.G5, N.C6].forEach((f) => tone(f, 0.7, 0.7, { type: 'square', vol: 0.05 }));
    },
    // 3mora = sales: cash register "ka-ching" + fanfare
    amora() {
      noise(0, 0.08, 0.25);
      tone(2093, 0.05, 0.5, { type: 'triangle', vol: 0.14 });
      tone(2637, 0.12, 0.7, { type: 'triangle', vol: 0.14 });
      [N.G4, N.C5, N.E5, N.G5].forEach((f, i) => tone(f, 0.55 + i * 0.12, 0.18, { type: 'sawtooth', vol: 0.06 }));
      tone(N.C6, 1.05, 0.6, { type: 'sawtooth', vol: 0.06 });
    },
    // tie: sad trombone "wah wah wah wahhh"
    tie() {
      [[392, 370], [370, 349], [349, 330]].forEach(([a, b], i) => tone(a, i * 0.38, 0.34, { type: 'sawtooth', vol: 0.07, slideTo: b }));
      tone(330, 1.14, 0.9, { type: 'sawtooth', vol: 0.07, slideTo: 290 });
    },
    final() {
      const seq = [N.C5, N.C5, N.C5, N.G5, N.E5, N.G5, N.C6];
      const at = [0, 0.15, 0.3, 0.45, 0.75, 0.9, 1.1];
      seq.forEach((f, i) => tone(f, at[i], i === seq.length - 1 ? 1 : 0.14, { type: 'sawtooth', vol: 0.07 }));
      [N.C5, N.E5, N.G5].forEach((f) => tone(f, 1.1, 1.2, { type: 'triangle', vol: 0.08 }));
      noise(1.1, 0.6, 0.08);
    },
  };

  function play(name) {
    if (muted) return;
    if (custom[name]) {
      const a = new Audio(`/sounds/${FILES[name]}.mp3`);
      a.play().catch(() => synth[name] && synth[name]());
      return;
    }
    if (synth[name]) synth[name]();
  }

  return {
    play,
    get muted() { return muted; },
    toggle() { muted = !muted; store.set('7x-muted', muted ? '1' : '0'); if (!muted) ac(); return muted; },
  };
})();

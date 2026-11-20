// Procedural SFX only (WebAudio, no music loop). Lazy AudioContext on first gesture.
// G.audio = { engine(speed01,boost01), shot(weapon), chime(), siren(), cheer(), scream(),
//   radio(text), toggleMute(), muted }. Radio chatter shows Indonesian text via G.hud.toast.
export function initAudio(G) {
  let ctx = null, eng = null, engGain = null, muted = false;
  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(f0, f1, dur, type, vol, when) {
    const c = ac(); if (!c || muted) return;
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + (when || 0);
    o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(vol || 0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, freq) { // burst (gunfire / crowd) via filtered noise buffer
    const c = ac(); if (!c || muted) return;
    const len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq || 1200;
    const g = c.createGain(); g.gain.value = vol || 0.25;
    src.connect(f).connect(g).connect(c.destination); src.start();
  }
  const A = {
    muted: false,
    engine(s, boost) { // continuous hum; call per frame with speed 0..1
      const c = ac(); if (!c || muted) { if (engGain) engGain.gain.value = 0; return; }
      if (!eng) { eng = c.createOscillator(); eng.type = 'sawtooth'; engGain = c.createGain(); engGain.gain.value = 0; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600; eng.connect(f).connect(engGain).connect(c.destination); eng.start(); }
      eng.frequency.value = 50 + s * 140 + (boost ? 60 : 0); engGain.gain.value = 0.04 + s * 0.05;
    },
    shot(w) { // distinct per weapon: 0 pistol crack, 1 smg burst, 2 shotgun boom, 3 rifle snap, 4 bazooka whoom
      if (w === 1) { noise(0.06, 0.2, 2000); setTimeout(() => noise(0.06, 0.18, 2000), 70); setTimeout(() => noise(0.06, 0.18, 2000), 140); }
      else if (w === 2) noise(0.3, 0.4, 500);
      else if (w === 4) { tone(180, 40, 0.5, 'sawtooth', 0.3); noise(0.5, 0.3, 300); }
      else if (w === 3) noise(0.12, 0.3, 3000);
      else noise(0.08, 0.25, 2500);
    },
    chime() { tone(880, 0, 0.18, 'sine', 0.12); tone(1318, 0, 0.3, 'sine', 0.1, 0.12); }, // batik UI chime
    siren() { tone(700, 1400, 0.5, 'sine', 0.08); tone(1400, 700, 0.5, 'sine', 0.08, 0.5); },
    cheer() { noise(0.8, 0.2, 900); tone(523, 784, 0.4, 'triangle', 0.1, 0.1); },
    scream() { tone(900, 300, 0.4, 'sawtooth', 0.12); noise(0.3, 0.15, 1800); },
    radio(text) { if (G.hud) G.hud.toast('📻 NPD: ' + text, 'sub'); A.siren(); },
    toggleMute() { muted = !muted; A.muted = muted; if (engGain) engGain.gain.value = 0; },
  };
  window.addEventListener('pointerdown', () => ac(), { once: true });
  window.addEventListener('keydown', () => ac(), { once: true });
  G.audio = A;
}

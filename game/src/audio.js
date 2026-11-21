// audio.js — procedural WebAudio SFX only (no audio files, dossier cap).
// Engine hum, gunshot, siren, coin chime, win jingle. Lazy init on first gesture.
export function createAudio() {
  let ac = null;
  function ensure() {
    if (ac) return ac;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ac = new AC();
    } catch { ac = null; }
    return ac;
  }
  function tone(freq, dur, type = 'sine', vol = 0.12, slide = 0) {
    const c = ensure(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), c.currentTime + dur);
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g).connect(c.destination);
    o.start(); o.stop(c.currentTime + dur);
  }
  function noise(dur, vol = 0.2) {
    const c = ensure(); if (!c) return;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource(); s.buffer = buf;
    const g = c.createGain(); g.gain.value = vol;
    s.connect(g).connect(c.destination); s.start();
  }
  return {
    unlock() { ensure(); },
    shot(name) { if (name === 'BAZOOKA') { noise(0.5, 0.35); tone(70, 0.4, 'sine', 0.3, -30); } else noise(0.12, 0.25); },
    chime() { tone(880, 0.15, 'sine', 0.12); setTimeout(() => tone(1320, 0.25, 'sine', 0.12), 90); },
    siren() { tone(700, 0.5, 'sawtooth', 0.05, 300); },
    win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'triangle', 0.15), i * 130)); },
    engine(on) { /* hum is synthesized per-frame by main loop via tone() if needed */ },
  };
}

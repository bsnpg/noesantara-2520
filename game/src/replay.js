// Finish-cam replay (simplified): ring buffer of the last 8 s of player/car positions,
// recorded every 0.1 s. Auto-plays on race wins (Missions 1, 4, 7 via G.missions.complete).
// Side-view camera at the finish + celebration. Controls: Space play/pause, S slow-mo
// 0.25x, 1–4 / arrows switch camera (side / chase / front 3/4 / top-down), P photo mode
// (HUD hidden, free camera — P itself is owned by main.js). R in a car replays the
// last seconds. G.stageShot('cover') stages the finish-cam side view for the cover
// screenshot — it chains to shots.js (the real side-view camera) and only seeds the
// replay buffer at the REAL car position.
export function initReplay(G) {
  const R = {
    buf: [], playing: false, t: 0, slow: false, cam: 0, photo: false, _acc: 0,
    record() { // called from update(); keeps last 8 s
      const p = G.player ? (G.player.pos || { x: G.player.x || 0, z: G.player.z || 0 }) : null;
      const cp = G.car && G.car.group ? G.car.group.position : null;
      R.buf.push({ t: G.time || 0, px: p ? p.x : 0, pz: p ? p.z : 0, cx: cp ? cp.x : 0, cz: cp ? cp.z : 0, h: (G.player && G.player.heading) || 0, kmh: (G.car && G.car.speedKmh) || 0 });
      if (R.buf.length > 80) R.buf.shift();
    },
    play() { // start finish-cam from ~6 s before the finish
      if (R.buf.length < 10) return false;
      R.playing = true; R.t = Math.max(0, R.buf.length - 60); R.cam = 0;
      if (G.hud) G.hud.toast('🏁 FINISH-CAM — tekan Space jeda, S slow-mo, 1–4 kamera, P foto', 'sub');
      if (G.audio) G.audio.cheer();
      return true;
    },
    pause() { R.playing = false; },
    setCam(i) { R.cam = i % 4; },
    photoMode(on) {
      R.photo = on == null ? !R.photo : on;
      const hud = document.getElementById('hud'); if (hud) hud.style.display = R.photo ? 'none' : 'block';
      if (G.hud) G.hud.toast(R.photo ? 'Photo mode — HUD sembunyi, kamera bebas (P keluar)' : 'Photo mode off', 'sub');
    },
    frameAt(i) { return R.buf[Math.max(0, Math.min(R.buf.length - 1, Math.floor(i)))]; },
    // Camera pose for the current replay frame: {x,y,z,lookX,lookZ}. Side = main.
    pose() {
      const f = R.frameAt(R.t); if (!f) return null;
      const x = f.cx || f.px, z = f.cz || f.pz;
      if (R.cam === 0) return { x: x - 14, y: 3, z: z + 2, lx: x, lz: z }; // side view (cover)
      if (R.cam === 1) return { x: x - 10, y: 5, z: z + 8, lx: x, lz: z }; // chase
      if (R.cam === 2) return { x: x + 9, y: 4, z: z + 9, lx: x, lz: z }; // front 3/4
      return { x: x, y: 26, z: z + 1, lx: x, lz: z }; // top-down
    },
    update(dt) {
      R._acc += dt;
      if (R._acc >= 0.1) { R._acc = 0; if (!R.playing) R.record(); }
      if (R.playing) {
        R.t += dt * 10 * (R.slow ? 0.25 : 1); // buf is 10 fps
        if (R.t >= R.buf.length - 1) { R.playing = false; if (G.hud) G.hud.toast('Replay selesai — tekan R untuk ulang', 'sub'); }
        const pose = R.pose();
        if (pose && G.camera) { G.camera.position.set(pose.x, pose.y, pose.z); G.camera.lookAt(pose.lx, 1.5, pose.lz); }
      }
    },
  };
  window.addEventListener('keydown', (e) => {
    if (G.state !== 'play' && !R.playing) return;
    if (e.code === 'KeyR' && G.player && !G.player.onFoot) R.play(); // R replays only in a car (R on foot = reload)
    else if (!R.playing) return;
    else if (e.code === 'Space') { R.playing = false; e.preventDefault(); }
    else if (e.code === 'KeyS') R.slow = !R.slow;
    else if (/^Digit[1-4]$/.test(e.code)) R.setCam(Number(e.code.slice(5)) - 1);
    else if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') R.setCam((R.cam + (e.code === 'ArrowRight' ? 1 : 3)) % 4);
  });
  // stageShot registry: chains to shots.js (prev); the cover handler below only
  // seeds the buffer at the real car position, then lets shots.js place the camera.
  const prev = typeof G.stageShot === 'function' ? G.stageShot : null;
  const handlers = {};
  function stageShot(name) {
    if (handlers[name]) return handlers[name]();
    if (prev) return prev(name);
    return false;
  }
  stageShot.register = (name, fn) => { handlers[name] = fn; };
  stageShot.register('cover', () => { // finish-cam side view, Garuda GT + city behind
    R.cam = 0;
    const cp = G.car && G.car.group ? G.car.group.position : { x: -190, z: -120 };
    if (R.buf.length < 10) { // no race yet: seed a finish straight AT the real car
      for (let i = 0; i < 60; i++) R.buf.push({ t: i / 10, px: cp.x - 48 + i * 0.8, pz: cp.z, cx: cp.x - 48 + i * 0.8, cz: cp.z, h: 0, kmh: 180 });
    }
    R.t = R.buf.length - 12; R.playing = true;
    if (prev) prev('cover'); // shots.js: side-view shotCam (Spire behind the car) + crowd
    if (G.hud) { G.hud.banner('Balapan Pertama', 'Finish under the gapura — 3 laps'); G.hud.setSpeed(180, 0.8, 'UPPER LANE', 100); }
    return true;
  });
  G.stageShot = stageShot;
  G.replay = R;
}

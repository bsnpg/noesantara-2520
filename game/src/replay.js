// replay.js — finish-cam after a race win: 4 cameras, slow-mo, photo mode.
// R hides the HUD for a clean photo; any key resumes.
export function createReplay(ctx) {
  const r = {
    active: false, cam: 0, t: 0, photo: false,
    start() {
      r.active = true; r.cam = 0; r.t = 0;
      ctx.hud.toast('FINISH — REPLAY · 4 kamera · R = photo mode');
      ctx.audio.win();
    },
    stop() { r.active = false; r.photo = false; document.getElementById('hud').style.display = ''; },
    update(dt) {
      if (!r.active) return;
      r.t += dt;
      if (r.t > 3.5) { r.cam = (r.cam + 1) % 4; r.t = 0; if (r.cam === 0) { r.stop(); return; } }
      const car = ctx.vehicles.hero;
      const a = ctx.time * 0.12 + r.cam * 1.7;
      const px = car.position.x + Math.cos(a) * 14, pz = car.position.z + Math.sin(a) * 14;
      ctx.render.place(px, 3 + r.cam, pz, car.position.x, 1.5, car.position.z);
      if (ctx.input.wasPressed('KeyR')) {
        r.photo = !r.photo;
        document.getElementById('hud').style.display = r.photo ? 'none' : '';
      }
      if (ctx.input.wasPressed('Escape') || ctx.input.wasPressed('Enter')) r.stop();
    },
  };
  return r;
}

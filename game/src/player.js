// player.js — Wowo on foot: walk, enter/exit the Garuda GT, POV switching.
// Fists → third person (Wowo visible); firearms → FPS (viewmodel only).
import * as A from './assets3d.js';
import { WEAPONS } from './config.js';

export function createPlayer(ctx) {
  const { scene } = ctx;
  const mesh = A.makeWowo();
  mesh.position.set(-208, 0, -178);
  scene.add(mesh);
  const p = {
    mesh, inCar: true, yaw: 0, pitch: 0, walkSpeed: 9,
    x: -208, z: -178,
    weaponIndex: 4, // Rifle by default (matches the sealed FPS shots)
    weapon() { return WEAPONS[p.weaponIndex]; },
    isFps() { return !p.inCar && p.weaponIndex !== 0; },
    enterCar() {
      p.inCar = true; mesh.visible = false;
      ctx.combat.viewmodel.visible = false;
    },
    exitCar() {
      p.inCar = false;
      const car = ctx.vehicles.hero;
      p.x = car.position.x - 4; p.z = car.position.z + 4;
      mesh.position.set(p.x, 0, p.z);
      mesh.visible = true;
      ctx.combat.syncViewmodel();
    },
    update(dt) {
      const input = ctx.input;
      if (p.inCar) return;
      // Mouse-look (yaw/pitch) when pointer is down-dragged or moved.
      p.yaw -= input.mouseDX * 0.0032;
      p.pitch = Math.max(-0.9, Math.min(0.9, p.pitch - input.mouseDY * 0.0028));
      let fx = 0, fz = 0;
      if (input.isDown('KeyW') || input.isDown('ArrowUp')) { fx += Math.cos(p.yaw); fz += -Math.sin(p.yaw); }
      if (input.isDown('KeyS') || input.isDown('ArrowDown')) { fx -= Math.cos(p.yaw); fz += Math.sin(p.yaw); }
      if (input.isDown('KeyA') || input.isDown('ArrowLeft')) { fx -= Math.sin(p.yaw); fz -= Math.cos(p.yaw); }
      if (input.isDown('KeyD') || input.isDown('ArrowRight')) { fx += Math.sin(p.yaw); fz += Math.cos(p.yaw); }
      const len = Math.hypot(fx, fz);
      if (len > 0) {
        p.x += (fx / len) * p.walkSpeed * dt;
        p.z += (fz / len) * p.walkSpeed * dt;
        p.x = Math.max(-330, Math.min(330, p.x));
        p.z = Math.max(-310, Math.min(310, p.z));
        mesh.rotation.y = Math.atan2(-fz, fx);
        mesh.position.set(p.x, Math.abs(Math.sin(ctx.time * 8)) * 0.06, p.z);
      }
      ctx.progression.markVisited(p.x, p.z);
      ctx.quests.collectNearest(p.x, p.z);
      // Enter car prompt when close to the Garuda GT.
      const car = ctx.vehicles.hero;
      const d = Math.hypot(car.position.x - p.x, car.position.z - p.z);
      ctx.hud.prompt = d < 6 ? 'E — Masuk Mobil' : '';
      if (input.wasPressed('KeyE') && d < 6) p.enterCar();
    },
    camera(dt) {
      const cam = ctx.render.camera;
      // In FPS the camera sits inside Wowo's head — hide his body, only the
      // viewmodel shows. In third person (Fists) he stays visible.
      mesh.visible = !p.inCar && !p.isFps();
      const eyeY = 1.7;
      if (p.isFps()) {
        cam.position.set(p.x, eyeY, p.z);
        const lx = p.x + Math.cos(p.yaw) * Math.cos(p.pitch);
        const ly = eyeY + Math.sin(p.pitch);
        const lz = p.z - Math.sin(p.yaw) * Math.cos(p.pitch);
        cam.lookAt(lx, ly, lz);
        cam.rotation.z = 0;
      } else {
        // Third person: behind Wowo, Wowo visible.
        const bx = p.x - Math.cos(p.yaw) * 6, bz = p.z + Math.sin(p.yaw) * 6;
        cam.position.x += (bx - cam.position.x) * Math.min(1, 8 * dt);
        cam.position.y += (3.4 - cam.position.y) * Math.min(1, 8 * dt);
        cam.position.z += (bz - cam.position.z) * Math.min(1, 8 * dt);
        cam.lookAt(p.x + Math.cos(p.yaw) * 8, 1.4, p.z - Math.sin(p.yaw) * 8);
      }
    },
  };
  return p;
}

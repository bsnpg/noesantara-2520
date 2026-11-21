// police.js — NPD Wanted system: 1-5 stars, patrols, interceptors, roadblocks,
// heli at ★4, lockdown at ★5. Heat cools when hidden.
import * as A from './assets3d.js';

const MODES = ['mengejar', 'menabrak', 'menyorot', 'menghadang'];
export function createPolice(ctx) {
  const { scene } = ctx;
  const p = {
    units: [],
    wanted() { return ctx.progression.wanted; },
    setWanted(n) { ctx.progression.wanted = Math.max(0, Math.min(5, n)); p.syncUnits(); },
    addHeat(n) { p.setWanted(ctx.progression.wanted + n); },
    syncUnits() {
      const want = p.wanted();
      while (p.units.length < want) {
        const g = A.makeNpdCar();
        const px = ctx.player.inCar ? ctx.vehicles.hero.position.x : ctx.player.x;
        const pz = ctx.player.inCar ? ctx.vehicles.hero.position.z : ctx.player.z;
        g.position.set(px - 30 - p.units.length * 12, 0, pz + 20);
        scene.add(g);
        p.units.push({ g, mode: MODES[p.units.length % MODES.length], kind: p.units.length >= 3 ? 'heli' : p.units.length >= 2 ? 'interceptor' : 'patroli' });
      }
      while (p.units.length > want) {
        const u = p.units.pop();
        scene.remove(u.g);
      }
    },
    update(dt) {
      const px = ctx.player.inCar ? ctx.vehicles.hero.position.x : ctx.player.x;
      const pz = ctx.player.inCar ? ctx.vehicles.hero.position.z : ctx.player.z;
      for (const u of p.units) {
        const dx = px - u.g.position.x, dz = pz - u.g.position.z;
        const d = Math.hypot(dx, dz) || 1;
        const sp = u.mode === 'mengejar' ? 26 : u.mode === 'menabrak' ? 34 : 18;
        u.g.position.x += (dx / d) * sp * dt;
        u.g.position.z += (dz / d) * sp * dt;
        u.g.rotation.y = Math.atan2(-dz, dx);
        u.dist = Math.round(d);
      }
      // Heat cools when the player is far from every unit.
      if (p.wanted() > 0 && p.units.every((u) => (u.dist || 0) > 90)) {
        p.cool = (p.cool || 0) + dt;
        if (p.cool > 12) { p.setWanted(p.wanted() - 1); p.cool = 0; }
      } else p.cool = 0;
    },
  };
  return p;
}

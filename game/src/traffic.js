// traffic.js — civilian cars looping the avenues + pedestrians on sidewalks.
// Pedestrians flee (chaos) when shooting or gang war is near.
import { AVE_NS, AVE_EW } from './config.js';
import { range, pick, int } from './random.js';
import * as A from './assets3d.js';

const PED_SHIRTS = [0xff4fa3, 0x1abc9c, 0xffb300, 0x27ae60, 0xf5f5f5, 0x8a5a9a, 0xc0392b, 0x3498db];

export function createTraffic(ctx) {
  const { scene, rng } = ctx;
  const cars = [];
  const peds = [];
  // Civilian cars: loops along one avenue each (NS or EW), both directions.
  for (let i = 0; i < 16; i += 1) {
    const ns = rng() < 0.5;
    const lane = ns ? pick(rng, AVE_NS) : pick(rng, AVE_EW);
    const kind = pick(rng, ['taxi', 'angkot', 'viper', 'taxi', 'angkot']);
    const g = kind === 'taxi' ? A.makeTaxi() : kind === 'angkot' ? A.makeAngkot() : A.makeViperCar();
    const t = range(rng, -300, 300);
    g.position.set(ns ? lane + (rng() < 0.5 ? 5 : -5) : t, 0, ns ? t : lane + (rng() < 0.5 ? 5 : -5));
    g.rotation.y = ns ? (rng() < 0.5 ? 0 : Math.PI) : (rng() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
    scene.add(g);
    cars.push({ g, ns, lane, speed: range(rng, 10, 18) * (rng() < 0.5 ? 1 : -1), kind });
  }
  // Pedestrians: walk the sidewalks beside avenues, varied outfits.
  for (let i = 0; i < 44; i += 1) {
    const ns = rng() < 0.5;
    const lane = ns ? pick(rng, AVE_NS) : pick(rng, AVE_EW);
    const shirt = pick(rng, PED_SHIRTS);
    const g = A.makePerson(shirt, pick(rng, [0x222831, 0x333333, 0x1a1a2e, 0x4a3a2a]));
    const t = range(rng, -300, 300);
    const off = (rng() < 0.5 ? 1 : -1) * range(rng, 13, 17);
    g.position.set(ns ? lane + off : t, 0, ns ? t : lane + off);
    g.rotation.y = rng() * Math.PI * 2;
    scene.add(g);
    peds.push({ g, ns, lane, off, speed: range(rng, 1.2, 2.6), flee: false, phase: rng() * 6 });
  }
  return {
    cars, peds,
    addCrowd(x, z, n, radius = 26) {
      for (let i = 0; i < n; i += 1) {
        const g = A.makePerson(pick(rng, PED_SHIRTS), pick(rng, [0x222831, 0x333333, 0x1a1a2e]));
        g.position.set(x + range(rng, -radius, radius), 0, z + range(rng, -radius, radius));
        g.rotation.y = rng() * Math.PI * 2;
        scene.add(g);
        peds.push({ g, ns: true, lane: x, off: 0, speed: range(rng, 1, 2), flee: false, phase: rng() * 6, crowd: true });
      }
    },
    addCar(kind, x, z, heading) {
      const g = kind === 'npd' ? A.makeNpdCar() : kind === 'komodo' ? A.makeKomodoR() : kind === 'truck' ? A.makeTruck() : kind === 'bike' ? A.makeBike() : A.makeViperCar();
      g.position.set(x, 0, z); g.rotation.y = heading; scene.add(g);
      const c = { g, ns: true, lane: x, speed: 0, kind, parked: true };
      cars.push(c); return c;
    },
    update(dt, chaosAt) {
      for (const c of cars) {
        if (c.parked) continue;
        const g = c.g;
        if (c.ns) { g.position.z += c.speed * dt; if (g.position.z > 310) g.position.z = -310; if (g.position.z < -310) g.position.z = 310; }
        else { g.position.x += c.speed * dt; if (g.position.x > 330) g.position.x = -330; if (g.position.x < -330) g.position.x = 330; }
        g.position.y = 0.25 + Math.sin(ctx.time * 3 + g.position.x) * 0.06; // hover bob
      }
      for (const p of peds) {
        const g = p.g;
        let sp = p.speed;
        if (chaosAt) {
          const d = Math.hypot(g.position.x - chaosAt[0], g.position.z - chaosAt[1]);
          p.flee = d < 60;
          if (p.flee) {
            const a = Math.atan2(g.position.x - chaosAt[0], g.position.z - chaosAt[1]);
            g.position.x += Math.sin(a) * 7 * dt; g.position.z += Math.cos(a) * 7 * dt;
            g.rotation.y = a; sp = 7;
          }
        } else p.flee = false;
        if (!p.flee && !p.crowd) {
          if (p.ns) { g.position.z += (p.speed * (p.off > 0 ? 1 : -1)) * dt; if (g.position.z > 310) g.position.z = -310; if (g.position.z < -310) g.position.z = 310; }
          else { g.position.x += (p.speed * (p.off > 0 ? 1 : -1)) * dt; if (g.position.x > 330) g.position.x = -330; if (g.position.x < -330) g.position.x = 330; }
        }
        g.position.y = Math.abs(Math.sin(ctx.time * 6 + p.phase)) * 0.08;
      }
    },
  };
}

// Noesantara 2520 — life: civilian hover-cars on the lower lane + crowds of
// pedestrians in varied outfits. CHAOS: peds flee when combat breaks out or a
// car speeds near. Cars and peds keep moving every frame; streets never empty.
// Fresh build; procedural only, no external assets.
import * as THREE from '../vendor/three.module.min.js';
import { createRandom } from './random.js';

const CAR_COLOURS = [0xffd21f, 0xff5da2, 0x39d353, 0xf2f2f2, 0x3a7bd5, 0xff7a1a, 0x2de1c2, 0xb678ff];
const SKIN = [0xf2c9a0, 0xe8b98a, 0xc98d5f, 0x8a5a3a];
const SHIRTS = [0xff4fa3, 0x2de1c2, 0xffb020, 0x7ed957, 0xff7a1a, 0x3a7bd5, 0xe8e8e8, 0xb678ff, 0x39d353];
const LOOPS = [
  { x0: -230, z0: -200, x1: 230, z1: 200 }, // outer ring (avenues)
  { x0: -110, z0: -90, x1: 110, z1: 90 },   // inner ring around the Spire
];
const NCARS = 18, NPEDS = 64;

// Point + heading on a rectangle loop at arc length s (s wraps the perimeter).
function loopPoint(L, s) {
  const w = L.x1 - L.x0, h = L.z1 - L.z0, p = 2 * (w + h);
  s = ((s % p) + p) % p;
  if (s < w) return [L.x0 + s, L.z0, 1, 0];
  if (s < w + h) return [L.x1, L.z0 + (s - w), 0, 1];
  if (s < 2 * w + h) return [L.x1 - (s - w - h), L.z1, -1, 0];
  return [L.x0, L.z1 - (s - 2 * w - h), 0, -1];
}

export function initTraffic(G) {
  if (!G || !G.scene) return;
  const T = G.THREE || THREE;
  const rng = G.rng || createRandom((G.seed || 2520) + 7);
  const scene = G.scene;

  const box = new T.BoxGeometry(1, 1, 1);
  const sph = new T.SphereGeometry(1, 10, 8);
  const glass = new T.MeshStandardMaterial({ color: 0x182430, metalness: 0.7, roughness: 0.2 });
  const darkMat = new T.MeshStandardMaterial({ color: 0x2c2f38, roughness: 0.9 });
  const signMat = new T.MeshBasicMaterial({ color: 0xfff6d8 });
  const carMats = {};
  const carMat = (c) => (carMats[c] || (carMats[c] = new T.MeshStandardMaterial({ color: c, metalness: 0.7, roughness: 0.3 })));
  const shirtMats = {};
  const shirtMat = (c) => (shirtMats[c] || (shirtMats[c] = new T.MeshStandardMaterial({ color: c, roughness: 0.85 })));
  const skinMats = {};
  const skinMat = (c) => (skinMats[c] || (skinMats[c] = new T.MeshStandardMaterial({ color: c, roughness: 0.8 })));

  function addBox(parent, mat, sx, sy, sz, x, y, z) {
    const m = new T.Mesh(box, mat);
    m.scale.set(sx, sy, sz);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }

  // --- civilian hover-cars ---
  G.traffic = [];
  for (let i = 0; i < NCARS; i++) {
    const isTaxi = i % 4 === 0;
    const isAngkot = i % 6 === 5;
    const colour = isTaxi ? 0xffd21f : isAngkot ? 0x39d353 : CAR_COLOURS[Math.floor(rng() * CAR_COLOURS.length)];
    const g = new T.Group();
    const len = isAngkot ? 5.2 : 3.8;
    addBox(g, carMat(colour), len, 0.9, 1.9, 0, 0.9, 0);
    addBox(g, glass, len * 0.5, 0.55, 1.6, -0.2, 1.55, 0);
    // batik underglow strip
    const glow = addBox(g, new T.MeshBasicMaterial({ color: isTaxi ? 0xffd21f : 0x2de1c2 }), len * 0.9, 0.18, 1.7, 0, 0.32, 0);
    glow.material.transparent = true; glow.material.opacity = 0.85;
    if (isTaxi) addBox(g, signMat, 0.9, 0.35, 0.5, -0.2, 2.05, 0); // TAXI sign
    if (isAngkot) addBox(g, new T.MeshBasicMaterial({ color: 0xffffff }), len * 0.9, 0.25, 1.95, 0, 1.15, 0); // white stripe
    g.position.y = 0.4;
    scene.add(g);
    const loop = LOOPS[i < 12 ? 0 : 1];
    G.traffic.push({
      mesh: g, group: g, kind: isTaxi ? 'taxi' : isAngkot ? 'angkot' : 'car',
      colour, speed: 9 + rng() * 8, loop, s: rng() * 2000, dir: rng() < 0.5 ? 1 : -1,
    });
  }

  // --- pedestrians: batik shirt, bright streetwear, futuristic kebaya, school kid ---
  const outfits = ['batik', 'streetwear', 'kebaya', 'school'];
  G.peds = [];
  for (let i = 0; i < NPEDS; i++) {
    const outfit = outfits[Math.floor(rng() * outfits.length)];
    const g = new T.Group();
    const shirt = outfit === 'kebaya' ? 0x2fae8f : outfit === 'school' ? 0xffffff : SHIRTS[Math.floor(rng() * SHIRTS.length)];
    const tall = outfit === 'kebaya' ? 1.25 : 1; // kebaya: long dress silhouette
    const body = addBox(g, shirtMat(shirt), 0.6, 0.95 * tall, 0.32, 0, 1.05 * tall, 0);
    if (outfit === 'batik') addBox(g, new T.MeshBasicMaterial({ color: 0xf2c94c }), 0.62, 0.12, 0.34, 0, 1.25, 0); // gold sash
    if (outfit === 'school') addBox(g, shirtMat(SHIRTS[Math.floor(rng() * SHIRTS.length)]), 0.4, 0.5, 0.14, 0, 1.15, -0.22); // backpack
    const head = new T.Mesh(sph, skinMat(SKIN[Math.floor(rng() * SKIN.length)]));
    head.scale.set(0.21, 0.24, 0.21);
    head.position.set(0, 1.75 * tall, 0);
    g.add(head);
    addBox(g, darkMat, 0.24, 0.12, 0.24, 0, 1.92 * tall, 0); // hair cap
    addBox(g, darkMat, 0.55, 0.6, 0.3, 0, 0.3, 0); // legs
    scene.add(g);
    // Sidewalk walk: along a north-south or east-west avenue, offset from the road.
    const ns = rng() < 0.5;
    const av = ns ? [-230, 0, 230][Math.floor(rng() * 3)] : [-200, 0, 200][Math.floor(rng() * 3)];
    const off = (rng() < 0.5 ? -1 : 1) * (14 + rng() * 3);
    G.peds.push({
      mesh: g, group: g, outfit, state: 'walk', fleeT: 0, fx: 0, fz: 0,
      axis: ns ? 'z' : 'x', fixed: av + off, min: -330, max: 330,
      pos: -330 + rng() * 660, dir: rng() < 0.5 ? 1 : -1,
      speed: 1.2 + rng() * 1.6, bob: rng() * 6.28,
    });
  }

  function playerPos() {
    // G.player is the player object: pos is its live Vector3 (group.position).
    const p = G.player;
    if (!p) return null;
    return p.pos || (p.group && p.group.position) || p.position || null;
  }
  function playerSpeed() {
    if (G.player && G.player.speed) return G.player.speed;
    if (G.car && G.car.speed) return G.car.speed;
    return 0;
  }

  // Combat / speeding-car chaos: nearby peds run. Other modules set G.chaos = true
  // during fights; it clears itself here when no trigger is near.
  G.chaos = false;
  G.setChaos = (v) => { G.chaos = !!v; };
  G.scatterPeds = (x, z, r) => {
    for (const p of G.peds) {
      const dx = p.mesh.position.x - x, dz = p.mesh.position.z - z;
      if (dx * dx + dz * dz < r * r) {
        p.state = 'flee'; p.fleeT = 2 + rng() * 1.5;
        const l = Math.hypot(dx, dz) || 1;
        p.fx = dx / l; p.fz = dz / l;
      }
    }
  };

  // One per-frame update: main.js calls G.updateTraffic(G.dt) each frame.
  G.updateTraffic = (dt) => {
    const d = dt || 0.016;
    for (const c of G.traffic) {
      if (!c.loop) continue; // spawned vehicles (e.g. shot staging) hold still
      c.s += c.speed * c.dir * d;
      const [x, z, dx, dz] = loopPoint(c.loop, c.s);
      c.mesh.position.x = x;
      c.mesh.position.z = z;
      c.mesh.position.y = 0.4 + Math.sin((G.time || 0) * 2 + c.s * 0.05) * 0.12; // hover bob
      c.mesh.rotation.y = Math.atan2(-dz, dx);
    }
    const pp = playerPos();
    const ps = playerSpeed();
    const hot = G.chaos || (pp && ps > 20);
    for (const p of G.peds) {
      p.bob += d * 8;
      if (p.state === 'walk' && hot && pp) {
        const dx = p.mesh.position.x - pp.x, dz = p.mesh.position.z - pp.z;
        if (dx * dx + dz * dz < 144) { // within 12 units of a speeding car / combat
          p.state = 'flee'; p.fleeT = 2 + rng() * 1.5;
          const l = Math.hypot(dx, dz) || 1;
          p.fx = dx / l; p.fz = dz / l;
        }
      }
      if (p.state === 'flee') {
        p.fleeT -= d;
        p.mesh.position.x = Math.max(-350, Math.min(350, p.mesh.position.x + p.fx * p.speed * 3.2 * d));
        p.mesh.position.z = Math.max(-350, Math.min(350, p.mesh.position.z + p.fz * p.speed * 3.2 * d));
        p.mesh.rotation.y = Math.atan2(-p.fz, p.fx);
        if (p.fleeT <= 0) {
          p.state = 'walk';
          p.pos = p.axis === 'z' ? p.mesh.position.z : p.mesh.position.x;
          p.pos = Math.max(p.min, Math.min(p.max, p.pos));
        }
      } else {
        p.pos += p.dir * p.speed * d;
        if (p.pos > p.max) { p.pos = p.max; p.dir = -1; }
        if (p.pos < p.min) { p.pos = p.min; p.dir = 1; }
        if (p.axis === 'z') {
          p.mesh.position.x = p.fixed; p.mesh.position.z = p.pos;
          p.mesh.rotation.y = p.dir > 0 ? -Math.PI / 2 : Math.PI / 2;
        } else {
          p.mesh.position.x = p.pos; p.mesh.position.z = p.fixed;
          p.mesh.rotation.y = p.dir > 0 ? 0 : Math.PI;
        }
      }
      p.mesh.position.y = Math.abs(Math.sin(p.bob)) * 0.07; // walk bob
    }
  };
  G.updateCityLife = G.updateTraffic; // alias for the main loop
}

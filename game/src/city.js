// city.js — builds Noesantara from the map plan: districts, hierarchical roads,
// 28 zoned blocks + edge fillers, landmarks, lamps, traffic lights, collectibles.
import * as THREE from '../vendor/three.module.min.js';
import { DISTRICTS, ZONES, AVE_NS, AVE_EW, CON_NS, CON_EW, ALLEYS } from './config.js';
import { range, int } from './random.js';
import * as A from './assets3d.js';

function plane(w, d, color, x, z, y = 0.02) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ color }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, y, z);
  return m;
}
function zebraTexture() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const x = c.getContext('2d');
  x.fillStyle = '#3a4048'; x.fillRect(0, 0, 64, 64);
  x.fillStyle = '#f5f5f5';
  for (let i = 0; i < 4; i += 1) x.fillRect(6 + i * 14, 4, 8, 56);
  return new THREE.CanvasTexture(c);
}
const ZEBRA = zebraTexture();

export function buildCity(ctx) {
  const { scene, rng } = ctx;
  const collectibles = [];
  const add = (o) => scene.add(o);
  // Ground: paved city base (trotoar/plaza tone, never bare brown dirt).
  add(plane(660, 660, 0x9a9a86, 0, 0, 0));
  // Park lawns in taman blocks + Spire plaza.
  add(plane(150, 150, 0x5da24a, 187, -42, 0.03)); // Taman T1/T3
  add(plane(150, 150, 0x5da24a, 187, 157, 0.03)); // Candi C1/C3
  add(plane(120, 120, 0xc9b896, 42, 42, 0.03));   // Spire plaza S4
  add(plane(120, 120, 0xc9b896, 187, -157, 0.03));// Pasar plaza P1
  // Roads: avenues (22, gold centre line), connectors (12), ring (14), alleys (5).
  const road = (w, d, x, z, line) => {
    add(plane(w, d, 0x3a4048, x, z, 0.05));
    if (line) add(plane(line === 'ns' ? 0.7 : w, line === 'ns' ? d : 0.7, 0xffd700, x, z, 0.08));
  };
  for (const x of AVE_NS) road(22, 640, x, 0, 'ns');
  for (const z of AVE_EW) road(640, 22, 0, z, 'ew');
  for (const x of CON_NS) road(12, 640, x, 0);
  for (const z of CON_EW) road(640, 12, 0, z);
  road(14, 640, -320, 0); road(14, 640, 320, 0); road(640, 14, 0, -300); road(640, 14, 0, 300);
  for (const a of ALLEYS) {
    add(plane(5, 170, 0x8a8f94, a.ns, DISTRICTS[a.d].cz, 0.06));
    add(plane(170, 5, 0x8a8f94, DISTRICTS[a.d].cx, a.ew, 0.06));
  }
  // Zebra crossings at avenue intersections.
  for (const x of AVE_NS) for (const z of AVE_EW) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(22, 10), new THREE.MeshBasicMaterial({ map: ZEBRA }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, z, 0.09); add(m);
  }
  // Traffic lights at every avenue intersection.
  for (const x of AVE_NS) for (const z of AVE_EW) {
    const t = A.makeTrafficLight(); t.position.set(x + 13, 0, z + 13); add(t);
  }
  // Street lamps along avenues every ~60.
  for (const x of AVE_NS) for (let z = -290; z <= 290; z += 60) { const l = A.makeLamp(); l.position.set(x + 12, 0, z); add(l); }
  for (const z of AVE_EW) for (let x = -310; x <= 310; x += 60) { const l = A.makeLamp(); l.position.set(x, 0, z + 12); add(l); }

  // Blocks: 28 district blocks, buildings in rows facing the road at block edges.
  const palette = [0x7a8a9a, 0x9a8a6a, 0x6a8a9a, 0xa89a7a, 0x8aa08a, 0x9a7a8a, 0xb09a6a, 0x7a90a0];
  const blockRect = (d, q) => {
    const ax = AVE_NS.reduce((a, b) => Math.abs(b - d.cx) < Math.abs(a - d.cx) ? b : a);
    const az = AVE_EW.reduce((a, b) => Math.abs(b - d.cz) < Math.abs(a - d.cz) ? b : a);
    const x0 = Math.max(-320, d.cx - d.r), x1 = Math.min(320, d.cx + d.r);
    const z0 = Math.max(-300, d.cz - d.r), z1 = Math.min(300, d.cz + d.r);
    const xs = q % 2 === 0 ? [x0, ax] : [ax, x1];
    const zs = q < 2 ? [z0, az] : [az, z1];
    return { x0: xs[0], x1: xs[1], z0: zs[0], z1: zs[1] };
  };
  DISTRICTS.forEach((d, di) => {
    for (let q = 0; q < 4; q += 1) {
      const r = blockRect(d, q);
      const [zone, hMin, hMax] = ZONES[di][q];
      const w = r.x1 - r.x0, dep = r.z1 - r.z0;
      if (zone === 'TM') {
        // Park: trees, palms, a small gazebo — no tall buildings.
        for (let i = 0; i < 6; i += 1) {
          const p = A.makePalm(); p.position.set(range(rng, r.x0 + 16, r.x1 - 16), 0, range(rng, r.z0 + 16, r.z1 - 16)); add(p);
        }
        if (hMax > 0) { const g = A.makeBuilding(8, 5, 8, 0x8a7a5a, 0x1abc9c); g.position.set((r.x0 + r.x1) / 2, 0, (r.z0 + r.z1) / 2); add(g); }
        continue;
      }
      if (zone === 'PS') {
        // Market: open stalls + low halls, busiest crowd zone.
        for (let i = 0; i < 5; i += 1) {
          const s = A.makeStall(i % 2 ? 0xff4fa3 : 0xffb300, 0x27ae60);
          s.position.set(range(rng, r.x0 + 16, r.x1 - 16), 0, range(rng, r.z0 + 16, r.z1 - 16));
          s.rotation.y = rng() * Math.PI; add(s);
        }
        const hall = A.makeBuilding(Math.min(24, w * 0.5), range(rng, hMin, hMax), Math.min(18, dep * 0.5), 0xb08a3a, 0xffb300);
        hall.position.set((r.x0 + r.x1) / 2, 0, (r.z0 + r.z1) / 2); add(hall);
        continue;
      }
      // PK / PP / PR: rows of buildings along the two road-facing edges.
      // Rows sit 17 in from the block edge (avenue centreline) so no building
      // ever stands on a road (avenue half-width 11 + building half-depth ~5).
      const rows = [];
      const step = 15;
      for (let x = r.x0 + 19; x < r.x1 - 16; x += step) rows.push([x, r.z0 + 17, 0]);
      for (let x = r.x0 + 19; x < r.x1 - 16; x += step) rows.push([x, r.z1 - 17, 0]);
      for (let z = r.z0 + 19; z < r.z1 - 16; z += step) rows.push([r.x0 + 17, z, 1]);
      for (let z = r.z0 + 19; z < r.z1 - 16; z += step) rows.push([r.x1 - 17, z, 1]);
      for (const [x, z, rot] of rows) {
        const h = range(rng, hMin, hMax);
        const b = A.makeBuilding(rot ? 10 : 13, h, rot ? 13 : 10, palette[int(rng, 0, palette.length - 1)], 0x1abc9c);
        b.position.set(x, 0, z); add(b);
      }
    }
  });
  // Edge filler blocks (8): low housing outside the district cores.
  const fillers = [[-280, -260], [280, -260], [-280, 260], [280, 260], [0, -270], [0, 270], [-300, 0], [300, 0]];
  for (const [fx, fz] of fillers) {
    for (let i = 0; i < 3; i += 1) {
      const b = A.makeBuilding(12, range(rng, 6, 12), 10, palette[int(rng, 0, palette.length - 1)], 0x27ae60);
      b.position.set(fx + (i - 1) * 20, 0, fz + (i % 2 ? 8 : -8)); add(b);
    }
  }
  // Landmarks. Gapura pillars stand just outside the avenue (pillars ±11.5,
  // road half-width 11) and just off the crossing avenue, so they never block a road.
  const gapuraN = A.makeGapura(0xc0392b); gapuraN.position.set(-230, 0, -214); add(gapuraN);
  const gapuraP = A.makeGapura(0xffb300); gapuraP.position.set(230, 0, -214); add(gapuraP);
  const gateU = A.makeGapura(0xc0392b); gateU.position.set(-230, 0, 214); add(gateU);
  const spire = A.makeSpire(); spire.position.set(35, 0, 35); add(spire);
  const hq = A.makeBuilding(20, 42, 20, 0x2b3a55, 0xffd700); hq.position.set(-42, 0, -42); add(hq);
  const candi = A.makeCandi(); candi.position.set(187, 0, 157); add(candi);
  const clock = A.makeClockTower(); clock.position.set(215, 0, -215); add(clock);
  const ctrl = A.makeControlTower(); ctrl.position.set(-182, 0, -40); add(ctrl);
  const tree = A.makeGiantTree(); tree.position.set(187, 0, -42); add(tree);
  const signW = A.makeSign('NEON WOLVES HQ'); signW.position.set(-275, 9, -150); add(signW);
  const signR = A.makeSign('BENGKEL RIKO', '#0d2b33', '#1abc9c'); signR.position.set(-182, 8, 40); add(signR);
  const signS = A.makeSign('SPIRE', '#111111', '#ffd700', 12, 3.5); signS.position.set(-42, 12, -60); add(signS);
  const bill = A.makeSign('NOESANTARA 2520', '#1a2a44', '#ff4fa3', 16, 5); bill.position.set(42, 14, 20); bill.rotation.y = Math.PI / 4; add(bill);

  // Batik holograms: ~7 per district — in alleys, plazas, near landmarks.
  DISTRICTS.forEach((d, di) => {
    const a = ALLEYS.find((x) => x.d === di);
    const spots = [
      [a.ns, d.cz - 40], [a.ns, d.cz + 40], [d.cx - 40, a.ew], [d.cx + 40, a.ew],
      [d.cx - 20, d.cz - 20], [d.cx + 30, d.cz + 25], [d.cx, d.cz - 55],
    ];
    for (const [x, z] of spots) {
      const h = A.makeBatikHolo(); h.position.set(x, 2.2, z); add(h);
      collectibles.push({ x, z, district: di, mesh: h, taken: false });
    }
  });
  // One extra near Spire plaza to reach 50.
  const extra = A.makeBatikHolo(); extra.position.set(60, 2.2, 60); add(extra);
  collectibles.push({ x: 60, z: 60, district: 3, mesh: extra, taken: false });

  ctx.collectibles = collectibles;
  ctx.city = { gapuraN, spire, candi };
  return ctx.city;
}

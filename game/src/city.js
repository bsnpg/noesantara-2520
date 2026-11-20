// Noesantara 2520 — the city: 7 coloured districts, temple-tiered chrome
// towers, batik hologram billboards, gapura gates, bright warm tropical light.
// Fresh build; procedural canvas textures only, no external assets.
// Lights live in render.js only (no duplicate sun/hemisphere here).
import * as THREE from '../vendor/three.module.min.js';
import { createRandom } from './random.js';

// Procedural batik: parang (wavy diagonal bands), kawung (petal circles),
// mega mendung (scalloped cloud rows). Returns a canvas texture.
function batik(kind, c1, c2) {
  const s = 256, cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const x = cv.getContext('2d');
  const css = (n) => '#' + (n >>> 0).toString(16).padStart(6, '0');
  x.fillStyle = css(c1); x.fillRect(0, 0, s, s);
  x.strokeStyle = css(c2); x.fillStyle = css(c2); x.lineWidth = 5;
  if (kind === 'parang') {
    for (let i = -s; i < s * 2; i += 32) {
      x.beginPath();
      for (let t = 0; t <= s; t += 8) x.lineTo(i + t, t + Math.sin(t / 28) * 10);
      x.stroke();
    }
  } else if (kind === 'kawung') {
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const cx = i * 64 + 32, cy = j * 64 + 32;
      for (let k = 0; k < 4; k++) {
        x.beginPath();
        x.arc(cx + Math.cos(k * 1.5708) * 26, cy + Math.sin(k * 1.5708) * 26, 22, 0, 6.283);
        x.stroke();
      }
      x.beginPath(); x.arc(cx, cy, 8, 0, 6.283); x.fill();
    }
  } else {
    for (let r = 0; r < 4; r++) for (let i = -1; i < 5; i++) {
      const cx = i * 64 + (r % 2 ? 32 : 0), cy = r * 64 + 32;
      x.beginPath(); x.arc(cx, cy, 26, Math.PI, 0); x.stroke();
      x.beginPath(); x.arc(cx - 18, cy + 8, 16, Math.PI * 0.5, Math.PI * 1.5); x.stroke();
    }
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const DISTRICTS = [
  { name: 'Distrik Neon', colour: 0xff4fa3, accent: 0x2de1c2, centre: [-230, -200], faction: 'Wolves', landmark: 'Gapura Neon', missions: [1, 3] },
  { name: 'Pasar Nusantara', colour: 0xffb020, accent: 0xff7a1a, centre: [230, -200], faction: 'Neutral', landmark: 'Gapura Pasar + Menara Jam', missions: [3] },
  { name: 'Undercity', colour: 0xb03a2e, accent: 0x3a3f4a, centre: [-230, 200], faction: 'Vipers', landmark: 'Gerbang Undercity', missions: [5, 6] },
  { name: 'Spire', colour: 0xf2c94c, accent: 0xffffff, centre: [0, 0], faction: 'Syndicate', landmark: 'Menara Spire', missions: [8] },
  { name: 'Distrik Candi', colour: 0x2fae8f, accent: 0x7ed957, centre: [230, 200], faction: 'Neutral', landmark: 'Candi Agung', missions: [] },
  { name: 'Skyport', colour: 0x3a7bd5, accent: 0x9fd8ff, centre: [-230, 0], faction: 'Wolves', landmark: 'Menara Kontrol', missions: [] },
  { name: 'Taman Gantung', colour: 0x4caf50, accent: 0xffd27a, centre: [230, 0], faction: 'Neutral', landmark: 'Pohon Raksasa', missions: [] },
];

const NS_AV = [-230, 0, 230]; // north-south avenues (x)
const EW_AV = [-200, 0, 200]; // east-west avenues (z)
const HALF = 360; // city half-size

export function initCity(G) {
  if (!G || !G.scene) return;
  const T = G.THREE || THREE;
  const rng = G.rng || createRandom(G.seed || 2520);
  const scene = G.scene;

  // Shared geometry + materials (mesh count stays sane).
  const box = new T.BoxGeometry(1, 1, 1);
  const cone = new T.ConeGeometry(0.5, 1, 4);
  const cyl = new T.CylinderGeometry(1, 1, 1, 8);
  const sph = new T.SphereGeometry(1, 10, 8);
  const chrome = new T.MeshStandardMaterial({ color: 0xdfe6ea, metalness: 0.9, roughness: 0.25 });
  const gold = new T.MeshStandardMaterial({ color: 0xf2c94c, metalness: 0.8, roughness: 0.3 });
  const dark = new T.MeshStandardMaterial({ color: 0x3a3f4a, metalness: 0.4, roughness: 0.7 });
  const roadMat = new T.MeshStandardMaterial({ color: 0x333845, roughness: 0.9 });
  const groundMat = new T.MeshStandardMaterial({ color: 0xc79a6b, roughness: 1 });
  const leafMat = new T.MeshStandardMaterial({ color: 0x3f9e4d, roughness: 1 });
  const trunkMat = new T.MeshStandardMaterial({ color: 0x7a5230, roughness: 1 });
  const glowGold = new T.MeshBasicMaterial({ color: 0xf2c94c });
  const glowTeal = new T.MeshBasicMaterial({ color: 0x2de1c2 });
  const tintMats = {};
  const tint = (c) => (tintMats[c] || (tintMats[c] = new T.MeshStandardMaterial({ color: c, metalness: 0.6, roughness: 0.35 })));

  function put(mat, sx, sy, sz, x, y, z, ry) {
    const m = new T.Mesh(box, mat);
    m.scale.set(sx, sy, sz);
    m.position.set(x, y, z);
    if (ry) m.rotation.y = ry;
    scene.add(m);
    return m;
  }

  // Ground + roads (avenues) with gold centre lines.
  const ground = new T.Mesh(new T.PlaneGeometry(HALF * 2 + 40, HALF * 2 + 40), groundMat);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  for (const x of NS_AV) {
    put(roadMat, 22, 0.2, HALF * 2, x, 0.1, 0);
    put(glowGold, 0.6, 0.25, HALF * 2, x, 0.12, 0);
  }
  for (const z of EW_AV) {
    put(roadMat, HALF * 2, 0.2, 22, 0, 0.1, z);
    put(glowGold, HALF * 2, 0.25, 0.6, 0, 0.12, z);
  }
  // Upper hover lane: glowing teal rails above each avenue (racing lane).
  for (const x of NS_AV) put(glowTeal, 0.5, 0.5, HALF * 2, x + 6, 7, 0);
  for (const z of EW_AV) put(glowTeal, HALF * 2, 0.5, 0.5, 0, 7, z + 6);

  // Temple-tiered tower: stacked shrinking boxes + gold roof slabs + spire tip.
  function tower(mat, w, h, tiers, x, z) {
    const g = new T.Group();
    let y = 0, cw = w;
    for (let i = 0; i < tiers; i++) {
      const th = (h / tiers) * (1 - i * 0.1);
      const m = new T.Mesh(box, i === tiers - 1 ? gold : mat);
      m.scale.set(cw, th, cw);
      m.position.y = y + th / 2;
      g.add(m);
      const roof = new T.Mesh(box, gold);
      roof.scale.set(cw * 1.14, 0.9, cw * 1.14);
      roof.position.y = y + th + 0.45;
      g.add(roof);
      y += th + 0.9;
      cw *= 0.72;
    }
    const tip = new T.Mesh(cone, gold);
    tip.scale.set(cw, 7, cw);
    tip.position.y = y + 3.5;
    g.add(tip);
    g.position.set(x, 0, z);
    scene.add(g);
    return g;
  }

  // Gapura gate: two pillars + lintel + tiered roof + batik banner.
  function gapura(d, bx, bz, ry) {
    const g = new T.Group();
    const mat = tint(d.colour);
    for (const s of [-1, 1]) {
      const p = new T.Mesh(box, mat);
      p.scale.set(2.4, 13, 2.4);
      p.position.set(s * 6, 6.5, 0);
      g.add(p);
    }
    const lin = new T.Mesh(box, gold);
    lin.scale.set(15, 2, 2.6);
    lin.position.y = 14;
    g.add(lin);
    const roof = new T.Mesh(box, mat);
    roof.scale.set(12, 1.2, 4);
    roof.position.y = 16;
    g.add(roof);
    const roof2 = new T.Mesh(box, gold);
    roof2.scale.set(8, 1.2, 3.4);
    roof2.position.y = 17.6;
    g.add(roof2);
    g.position.set(bx, 0, bz);
    g.rotation.y = ry;
    scene.add(g);
  }

  // Batik hologram billboards (bright, double-sided) — bases kept light enough
  // to read as holograms at distance, never as floating black rectangles.
  const holoTex = [
    batik('parang', 0x0d5c60, 0x2de1c2),
    batik('kawung', 0x6b3a00, 0xf2c94c),
    batik('mega mendung', 0x1d4e6b, 0x7fd4ff),
    batik('parang', 0x6b1e4a, 0xff4fa3),
  ];
  function billboard(x, y, z, ry, w, h, ti) {
    const m = new T.Mesh(
      new T.PlaneGeometry(w, h),
      new T.MeshBasicMaterial({ map: holoTex[ti % holoTex.length], transparent: true, opacity: 0.95, side: T.DoubleSide })
    );
    m.position.set(x, y, z);
    m.rotation.y = ry;
    scene.add(m);
  }

  // District towers + gapura + billboards.
  const towerSpots = [[-58, -46], [58, -46], [-58, 46], [58, 46], [0, -72], [0, 72]];
  for (const d of DISTRICTS) {
    const [cx, cz] = d.centre;
    if (d.name === 'Spire') continue; // centre gets Menara Spire below
    const spots = towerSpots.slice(0, 5);
    for (let i = 0; i < spots.length; i++) {
      const [ox, oz] = spots[i];
      const h = 20 + rng() * 22;
      tower(rng() < 0.6 ? chrome : tint(d.colour), 13 + rng() * 8, h, 3 + Math.floor(rng() * 2), cx + ox, cz + oz);
    }
    // Gapura on the side facing the Spire (map centre).
    const a = Math.atan2(-cz, -cx);
    gapura(d, cx + Math.cos(a) * 95, cz + Math.sin(a) * 95, -a + Math.PI / 2);
    billboard(cx - 40, 24, cz - 40, Math.PI / 4, 18, 11, DISTRICTS.indexOf(d));
  }

  // Menara Spire: tallest golden temple at map centre.
  tower(gold, 30, 95, 6, 0, 0);
  billboard(0, 40, -22, 0, 26, 15, 1);
  billboard(0, 40, 22, Math.PI, 26, 15, 0);

  // Menara Jam (Pasar clock tower) + Menara Kontrol (Skyport).
  tower(tint(0xffb020), 12, 42, 3, 230, -128);
  const face = new T.Mesh(new T.CircleGeometry(4, 24), new T.MeshBasicMaterial({ color: 0xfff6d8 }));
  face.position.set(230, 38, -121.4);
  scene.add(face);
  tower(tint(0x3a7bd5), 12, 48, 3, -158, 0);
  const dish = new T.Mesh(sph, chrome);
  dish.scale.set(5, 2.5, 5);
  dish.position.set(-158, 52, 0);
  scene.add(dish);

  // Pasar Nusantara market stalls: counter + bright awning + goods.
  const awnCols = [0xff4fa3, 0x2de1c2, 0xffb020, 0x7ed957, 0xff7a1a];
  for (let i = 0; i < 10; i++) {
    const sx = 170 + (i % 5) * 28, sz = -248 + Math.floor(i / 5) * 26;
    put(tint(0x8a5a3a), 5, 1.4, 3, sx, 0.7, sz);
    const awn = put(tint(awnCols[i % awnCols.length]), 6, 0.3, 4, sx, 3.4, sz);
    awn.rotation.x = 0.25;
    put(tint(awnCols[(i + 2) % awnCols.length]), 1.2, 1, 1.2, sx - 1.4, 1.9, sz);
    put(tint(awnCols[(i + 3) % awnCols.length]), 1.2, 1, 1.2, sx + 1.4, 1.9, sz);
  }

  // Palms + hanging gardens (Taman Gantung) and the giant tree.
  function palm(x, z, s) {
    const tr = new T.Mesh(cyl, trunkMat);
    tr.scale.set(0.5 * s, 7 * s, 0.5 * s);
    tr.position.set(x, 3.5 * s, z);
    scene.add(tr);
    for (let k = 0; k < 3; k++) {
      const c = new T.Mesh(cone, leafMat);
      c.scale.set(5 * s, 3 * s, 5 * s);
      c.position.set(x + (k - 1) * 1.6 * s, (7 + k * 1.2) * s, z);
      c.rotation.z = (k - 1) * 0.5;
      scene.add(c);
    }
  }
  for (let i = 0; i < 10; i++) palm(170 + rng() * 120, -70 + rng() * 140, 0.8 + rng() * 0.5);
  for (let i = 0; i < 4; i++) palm(170 + rng() * 120, 130 + rng() * 120, 0.8 + rng() * 0.4);
  // Pohon Raksasa: giant tree at Taman Gantung centre.
  const big = new T.Mesh(cyl, trunkMat);
  big.scale.set(3, 26, 3);
  big.position.set(230, 13, 0);
  scene.add(big);
  for (let k = 0; k < 3; k++) {
    const f = new T.Mesh(sph, leafMat);
    f.scale.set(16 - k * 3, 7, 16 - k * 3);
    f.position.set(230, 28 + k * 6, 0);
    scene.add(f);
  }
  // Hanging-garden vines on Candi towers (green slabs).
  for (let i = 0; i < 6; i++) put(leafMat, 2, 10 + rng() * 8, 0.6, 190 + rng() * 80, 8, 160 + rng() * 80);

  // District data for HUD / map / missions.
  G.districts = DISTRICTS.map((d) => ({
    name: d.name, colour: d.colour, accent: d.accent,
    centre: { x: d.centre[0], z: d.centre[1] },
    faction: d.faction, landmark: d.landmark, missions: d.missions.slice(),
  }));
  G.city = { half: HALF, nsAvenues: NS_AV.slice(), ewAvenues: EW_AV.slice(), spire: { x: 0, z: 0 } };
}

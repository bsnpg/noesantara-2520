// assets3d.js — procedural 3D asset library. Every builder here is used by at
// least one place in the game (city / vehicles / traffic / combat / shots).
import * as THREE from '../vendor/three.module.min.js';

const matCache = new Map();
export function mat(color, emissive = 0, ei = 0) {
  const k = color + '|' + emissive + '|' + ei;
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshLambertMaterial({ color, emissive, emissiveIntensity: ei }));
  return matCache.get(k);
}
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
export function box(w, h, d, color, x = 0, y = 0, z = 0, em = 0, ei = 0) {
  const m = new THREE.Mesh(boxGeo, mat(color, em, ei));
  m.scale.set(w, h, d); m.position.set(x, y, z);
  return m;
}
function grp(...children) { const g = new THREE.Group(); for (const c of children) g.add(c); return g; }

// ---- vehicles (hover: no wheels, glow strip under the hull) ----
function hoverCar(body, accent, glow) {
  const g = grp(
    box(4.4, 0.9, 2.1, body, 0, 0.85, 0),
    box(2.4, 0.7, 1.8, 0x1a2028, -0.2, 1.6, 0),
    box(4.5, 0.14, 2.2, accent, 0, 0.42, 0, accent, 0.9),
    box(1.2, 0.5, 2.0, accent, -1.9, 1.1, 0),
    box(4.0, 0.1, 1.9, glow, 0, 0.32, 0, glow, 1.4),
  );
  g.userData.glow = glow;
  return g;
}
export function makeGarudaGT() {
  const g = hoverCar(0xffd700, 0x1abc9c, 0x1abc9c);
  // Garuda wing panels swept back from the rear quarters.
  const wL = box(1.6, 0.1, 0.7, 0xffd700, -1.9, 1.35, 1.15); wL.rotation.z = 0.35;
  const wR = box(1.6, 0.1, 0.7, 0xffd700, -1.9, 1.35, -1.15); wR.rotation.z = 0.35;
  const beak = box(0.5, 0.3, 1.2, 0x1abc9c, 2.2, 0.9, 0);
  g.add(wL, wR, beak);
  return g;
}
export function makeKomodoR() {
  const g = hoverCar(0xb8bec8, 0xc0392b, 0xc0392b);
  g.add(box(0.3, 0.6, 1.6, 0xc0392b, 2.25, 0.85, 0));
  for (let i = -2; i <= 2; i += 1) g.add(box(0.12, 0.22, 0.16, 0xffffff, 2.42, 0.95, i * 0.3));
  return g;
}
export function makeViperCar() { return hoverCar(0x14161c, 0xc0392b, 0xff2222); }
export function makeNpdCar() {
  const g = hoverCar(0xf2f2f2, 0x2563eb, 0x2563eb);
  g.add(box(1.1, 0.22, 0.5, 0xff2222, -0.2, 2.05, 0.55, 0xff2222, 1.2));
  g.add(box(1.1, 0.22, 0.5, 0x2563eb, -0.2, 2.05, -0.55, 0x2563eb, 1.2));
  g.add(box(2.6, 0.16, 0.2, 0xffd700, 0, 1.35, 1.06));
  return g;
}
export function makeTaxi() {
  const g = hoverCar(0xffc400, 0x111111, 0xffc400);
  g.add(box(0.9, 0.35, 0.6, 0x111111, -0.2, 2.1, 0, 0xffc400, 0.8));
  return g;
}
export function makeAngkot() {
  const g = grp(
    box(4.6, 1.7, 2.2, 0x1abc9c, 0, 1.15, 0),
    box(2.0, 0.9, 2.0, 0x1a2028, 0.4, 2.3, 0),
    box(4.7, 0.16, 2.3, 0xff4fa3, 0, 0.35, 0, 0xff4fa3, 1.0),
    box(4.6, 0.5, 0.3, 0xffd700, 0, 1.5, 1.12),
  );
  return g;
}
export function makeTruck() {
  return grp(
    box(2.2, 2.0, 2.4, 0x5a6b52, 2.6, 1.5, 0),
    box(2.0, 1.4, 2.2, 0x1a2028, 2.6, 2.9, 0),
    box(5.4, 2.4, 2.5, 0x8a94a0, -1.4, 1.7, 0),
    box(5.5, 0.2, 2.6, 0xffd700, -1.4, 0.45, 0, 0xffd700, 0.7),
  );
}
export function makeBike() {
  return grp(
    box(2.4, 0.35, 0.5, 0x1abc9c, 0, 0.8, 0),
    box(0.9, 0.6, 0.4, 0xff4fa3, -0.5, 1.1, 0),
    box(0.7, 0.12, 1.1, 0x222222, 1.0, 1.05, 0),
  );
}

// ---- people ----
export function makePerson(shirt, pants, skin = 0xd9a066, helmet = 0) {
  const g = grp(
    box(0.62, 0.75, 0.36, shirt, 0, 1.15, 0),
    box(0.56, 0.75, 0.32, pants, 0, 0.38, 0),
    box(0.42, 0.42, 0.4, skin, 0, 1.75, 0),
    box(0.14, 0.6, 0.14, shirt, -0.4, 1.15, 0),
    box(0.14, 0.6, 0.14, shirt, 0.4, 1.15, 0),
  );
  if (helmet) g.add(box(0.48, 0.3, 0.46, helmet, 0, 1.95, 0));
  return g;
}
export function makeWowo() { const g = makePerson(0xffd700, 0x1a2028, 0xd9a066, 0xffd700); g.add(box(0.66, 0.1, 0.4, 0x1abc9c, 0, 1.35, 0)); return g; }
export function makeMara() { return makePerson(0x1abc9c, 0x222831); }
export function makeRiko() { return makePerson(0x8a6d3b, 0x333333); }
export function makeKiko() { return makePerson(0x2b3a55, 0x1a1a1a); }
export function makeRazor() { const g = makePerson(0x14161c, 0x14161c, 0xc9a06a, 0xc0392b); g.add(box(0.2, 0.35, 0.2, 0xc0392b, -0.2, 2.15, 0)); g.add(box(0.2, 0.35, 0.2, 0xc0392b, 0.2, 2.15, 0)); return g; }

// ---- buildings ----
export function makeBuilding(w, h, d, color, accent) {
  const g = grp(box(w, h, d, color, 0, h / 2, 0));
  g.add(box(w * 1.04, 0.5, d * 1.04, accent || 0x222831, 0, h + 0.2, 0));
  if (h > 14) g.add(box(w * 0.5, 0.7, d * 0.5, 0xffd700, 0, h + 0.7, 0, 0xffd700, 0.6));
  // window band (one emissive strip reads as lit floors from afar)
  g.add(box(w * 0.9, Math.max(0.4, h * 0.08), 0.1, 0xffe9a8, 0, h * 0.72, d / 2 + 0.05, 0xffe9a8, 0.7));
  return g;
}
export function makeStall(a, b) {
  return grp(
    box(3.2, 1.0, 2.0, 0x8a6d3b, 0, 0.5, 0),
    box(3.4, 0.18, 2.4, a, 0, 2.1, 0),
    box(0.12, 1.1, 0.12, 0x555555, -1.5, 1.55, -1.0), box(0.12, 1.1, 0.12, 0x555555, 1.5, 1.55, -1.0),
    box(0.12, 1.1, 0.12, 0x555555, -1.5, 1.55, 1.0), box(0.12, 1.1, 0.12, 0x555555, 1.5, 1.55, 1.0),
    box(0.7, 0.4, 0.5, 0xff4fa3, -0.8, 1.2, 0), box(0.7, 0.4, 0.5, 0xffb300, 0.1, 1.2, 0), box(0.7, 0.4, 0.5, 0x27ae60, 0.9, 1.2, 0),
  );
}

// ---- landmarks ----
export function makeGapura(pillar = 0xc0392b) {
  return grp(
    box(2.2, 12, 2.2, pillar, -11.5, 6, 0), box(2.2, 12, 2.2, pillar, 11.5, 6, 0),
    box(26, 1.6, 2.6, 0xffd700, 0, 12.4, 0),
    box(20, 1.2, 2.2, pillar, 0, 13.8, 0), box(12, 1.0, 1.8, 0xffd700, 0, 15.0, 0),
    box(1.2, 1.2, 1.2, 0xffb300, -11.5, 12.6, 1.4, 0xffb300, 1.0), box(1.2, 1.2, 1.2, 0xffb300, 11.5, 12.6, 1.4, 0xffb300, 1.0),
  );
}
export function makeSpire() {
  const g = grp(
    box(16, 30, 16, 0xd4af37, 0, 15, 0),
    box(12, 10, 12, 0x2b3a55, 0, 35, 0),
    box(8, 6, 8, 0xffd700, 0, 43, 0, 0xffd700, 0.8),
  );
  const tip = new THREE.Mesh(new THREE.ConeGeometry(3.2, 8, 4), mat(0xffd700, 0xffd700, 0.9));
  tip.position.set(0, 50, 0); tip.rotation.y = Math.PI / 4; g.add(tip);
  g.add(box(16.4, 0.8, 0.3, 0xffe9a8, 0, 22, 8.1, 0xffe9a8, 0.8));
  return g;
}
export function makeCandi() {
  const g = new THREE.Group();
  const steps = [[26, 3], [21, 3], [16, 3], [11, 3], [6, 4]];
  let y = 0;
  for (const [s, h] of steps) { g.add(box(s, h, s, 0x9a8f7a, 0, y + h / 2, 0)); y += h; }
  const stupa = new THREE.Mesh(new THREE.ConeGeometry(2.2, 4.5, 8), mat(0x1abc9c));
  stupa.position.set(0, y + 2.2, 0); g.add(stupa);
  g.add(box(27, 0.5, 27, 0x27ae60, 0, 0.25, 0));
  return g;
}
export function makeClockTower() {
  const g = grp(box(5, 22, 5, 0xffb300, 0, 11, 0), box(7, 7, 1.2, 0xf5f0dc, 0, 20, 2.2), box(7, 1.2, 7, 0xc0392b, 0, 24, 0));
  g.add(box(0.2, 2.2, 0.1, 0x222222, 0, 20.8, 2.85), box(1.6, 0.2, 0.1, 0x222222, 0.5, 20, 2.85));
  return g;
}
export function makeControlTower() {
  const g = grp();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.2, 24, 8), mat(0x3498db));
  shaft.position.set(0, 12, 0); g.add(shaft);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 4.0, 4, 8), mat(0x1a2a44, 0x3498db, 0.5));
  top.position.set(0, 26, 0); g.add(top);
  return g;
}
export function makeGiantTree() {
  const g = grp();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.4, 12, 8), mat(0x6b4a2b));
  trunk.position.set(0, 6, 0); g.add(trunk);
  for (const [x, y, z, r] of [[0, 16, 0, 7], [5, 13, 2, 5], [-5, 13, -2, 5], [0, 20, 0, 5]]) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat(0x27ae60));
    s.position.set(x, y, z); g.add(s);
  }
  for (let i = 0; i < 4; i += 1) g.add(box(0.25, 4, 0.25, 0x1abc9c, Math.cos(i * 1.7) * 5, 11, Math.sin(i * 1.7) * 5));
  return g;
}
export function makePalm() {
  const g = grp();
  for (let i = 0; i < 5; i += 1) g.add(box(0.5, 1.4, 0.5, 0x6b4a2b, i * 0.25, 0.7 + i * 1.3, 0));
  const topY = 7;
  for (let i = 0; i < 7; i += 1) {
    const leaf = box(4.2, 0.12, 0.7, 0x27ae60, 2.1, topY, 0);
    leaf.position.set(0, topY, 0); leaf.rotation.y = (i / 7) * Math.PI * 2; leaf.translateX(2.1); leaf.rotation.z = -0.35;
    g.add(leaf);
  }
  return g;
}
export function makeLamp() {
  return grp(box(0.22, 6, 0.22, 0x333a44, 0, 3, 0), box(1.6, 0.18, 0.18, 0x333a44, 0.7, 5.9, 0),
    box(0.7, 0.25, 0.4, 0xfff2cc, 1.4, 5.8, 0, 0xfff2cc, 1.2));
}
export function makeTrafficLight() {
  return grp(box(0.25, 5.5, 0.25, 0x222831, 0, 2.75, 0),
    box(0.7, 1.8, 0.5, 0x111111, 0, 5.6, 0),
    box(0.4, 0.4, 0.1, 0xff2222, 0, 6.1, 0.28, 0xff2222, 1.0),
    box(0.4, 0.4, 0.1, 0xffb300, 0, 5.6, 0.28, 0xffb300, 0.6),
    box(0.4, 0.4, 0.1, 0x27ae60, 0, 5.1, 0.28, 0x27ae60, 0.6));
}
export function makeBatikHolo() {
  const g = grp();
  const o = new THREE.Mesh(new THREE.OctahedronGeometry(0.9), mat(0xffd700, 0xffd700, 1.0));
  g.add(o);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.08, 6, 24), mat(0x1abc9c, 0x1abc9c, 0.8));
  ring.rotation.x = Math.PI / 2; g.add(ring);
  return g;
}
export function makeSign(text, bg = '#0d2b33', fg = '#ffd700', w = 10, h = 3) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 80;
  const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, 256, 80);
  x.strokeStyle = fg; x.lineWidth = 4; x.strokeRect(4, 4, 248, 72);
  x.fillStyle = fg; x.font = 'bold 34px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, 128, 42);
  const tex = new THREE.CanvasTexture(c);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
  return m;
}
export function makeFlame() {
  const g = grp();
  const outer = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.6, 8), mat(0xff6a00, 0xff6a00, 1.0));
  outer.position.y = 1.3; g.add(outer);
  const inner = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.6, 8), mat(0xffd700, 0xffd700, 1.2));
  inner.position.y = 1.0; g.add(inner);
  return g;
}
export function makeSmokePuff() {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 6),
    new THREE.MeshLambertMaterial({ color: 0x555555, transparent: true, opacity: 0.55 }));
  return m;
}
export function makeViewmodelRifle() {
  return grp(
    box(1.5, 0.22, 0.22, 0xffd700, 0, 0, 0),
    box(0.5, 0.3, 0.3, 0x1abc9c, -0.55, 0.05, 0),
    box(0.25, 0.5, 0.2, 0x333333, 0.1, -0.3, 0),
    box(0.3, 0.12, 0.12, 0x111111, 0.85, 0.05, 0),
    box(0.7, 0.1, 0.5, 0x8a6d3b, -0.15, -0.05, 0),
  );
}
export function makeConfettiPiece(color) {
  return new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.5), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
}

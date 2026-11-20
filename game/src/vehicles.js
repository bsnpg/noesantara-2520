




import * as A from './assets3d.js';

function wrap(T, inner, kind, topSpeed, integrity) {
 const g = new T.Group();
 inner.rotation.y = Math.PI / 2;
 g.add(inner);
 g.userData = { kind, speed: 0, integrity, topSpeed };
 return g;
}

export function makeGarudaGT(T) {
 const h = A.hoverBase(0xd4a017);
 const inner = new T.Group();
 inner.add(h.body, h.can, h.glow, ...h.pods, h.bar, ...h.thr);
 const g = new T.Group();
 g.add(inner);
 inner.rotation.y = Math.PI / 2;
 const gold = new T.MeshStandardMaterial({ color: 0xf2c94c, metalness: 0.8, roughness: 0.3 });
 const teal = new T.MeshStandardMaterial({ color: 0x0e7c7b, metalness: 0.6, roughness: 0.35 });
 const dark = new T.MeshStandardMaterial({ color: 0x14181f, metalness: 0.4, roughness: 0.6 });
 const bx = (w, hh, d, m, x, y, z, ry = 0, rz = 0) => {
 const q = new T.Mesh(new T.BoxGeometry(w, hh, d), m);
 q.position.set(x, y, z); q.rotation.y = ry; q.rotation.z = rz; g.add(q); return q;
 };
 bx(1.96, 0.1, 0.5, new T.MeshStandardMaterial({ color: 0xc0392b, metalness: 0.4, roughness: 0.5, emissive: 0x701a10, emissiveIntensity: 0.7 }), 0, 0.5, -1.2);
 for (const s of [-1, 1]) {
 bx(2.7, 0.1, 1.7, gold, s * 2.05, 1.08, -0.35, 0, s * 0.3);
 bx(1.1, 0.08, 0.42, teal, s * 2.0, 1.0, 0.35, 0, s * 0.3);
 }
 const skin = new T.MeshStandardMaterial({ color: 0xc98d5f, roughness: 0.7 });
 const drv = new T.Group(); drv.position.set(0, 0.86, 0.35); g.add(drv);
 const torso = new T.Mesh(new T.BoxGeometry(0.52, 0.55, 0.3), new T.MeshStandardMaterial({ color: 0xd4a017, metalness: 0.4, roughness: 0.5 }));
 torso.position.y = 0.28; drv.add(torso);
 const head = new T.Mesh(new T.SphereGeometry(0.19, 10, 8), skin);
 head.position.y = 0.72; drv.add(head);
 const helm = new T.Mesh(new T.SphereGeometry(0.21, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), teal);
 helm.position.y = 0.74; drv.add(helm);
 const disc = new T.Mesh(new T.CircleGeometry(2.3, 24), new T.MeshBasicMaterial({ color: 0x19e3c8, transparent: true, opacity: 0.5 }));
 disc.rotation.x = -Math.PI / 2; disc.position.y = 0.12; g.add(disc);
 const ring = new T.Mesh(new T.TorusGeometry(2.3, 0.05, 6, 32), new T.MeshBasicMaterial({ color: 0xf2c94c, transparent: true, opacity: 0.7 }));
 ring.rotation.x = Math.PI / 2; ring.position.y = 0.12; g.add(ring);
 g.userData = { kind: 'garuda', speed: 0, integrity: 100, topSpeed: 55, glow: disc };
 return g;
}
function makeGajahTruck(T) {
 const g = new T.Group();
 const armor = new T.MeshStandardMaterial({ color: 0x5a5f66, metalness: 0.8, roughness: 0.45 });
 const olive = new T.MeshStandardMaterial({ color: 0x4a5240, metalness: 0.5, roughness: 0.6 });
 const dark = new T.MeshStandardMaterial({ color: 0x1a1d22, metalness: 0.4, roughness: 0.6 });
 const bx = (w, h, d, m, x, y, z) => {
 const q = new T.Mesh(new T.BoxGeometry(w, h, d), m);
 q.position.set(x, y, z); g.add(q); return q;
 };
 bx(2.4, 1.6, 5.6, olive, 0, 1.5, 0.6);
 bx(2.4, 1.0, 2.0, armor, 0, 1.2, -3.2);
 bx(2.0, 0.7, 0.3, dark, 0, 1.35, -4.25);
 for (const s of [-1, 1]) bx(0.3, 1.2, 5.4, armor, s * 1.3, 1.1, 0.4);
 for (const s of [-1, 1]) for (const z of [-3.6, -1.6, 0.6, 2.4]) {
 const w = new T.Mesh(new T.CylinderGeometry(0.55, 0.55, 0.4, 12), dark);
 w.rotation.z = Math.PI / 2; w.position.set(s * 1.15, 0.55, z); g.add(w);
 }
 const disc = new T.Mesh(new T.CircleGeometry(2.6, 24), new T.MeshBasicMaterial({ color: 0xffcc33, transparent: true, opacity: 0.25 }));
 disc.rotation.x = -Math.PI / 2; disc.position.y = 0.1; g.add(disc);
 g.userData = { kind: 'gajah', speed: 0, integrity: 500, topSpeed: 28, glow: disc };
 return g;
}
const FACTORIES = {
 garuda: makeGarudaGT,
 komodo: (T) => wrap(T, A.makeHoverCar(0x8e2f23), 'komodo', 52, 140),
 viper: (T) => wrap(T, A.makeHoverCar(0x0c0d10), 'viper', 50, 80),
 npd: (T) => wrap(T, A.makeNPDInterceptor(), 'npd', 53, 90),
 capung: (T) => { const c = wrap(T, A.makeHoverCar(0x0e9c9a), 'capung', 48, 40); c.scale.setScalar(0.7); return c; },
 gajah: makeGajahTruck,
 civilian: (T, color) => wrap(T, A.makeHoverCar(color || 0xcccccc), 'civilian', 32, 60),
 taxi: (T) => wrap(T, A.makeTaxi(), 'taxi', 32, 60),
 angkot: (T) => wrap(T, A.makeAngkot(), 'angkot', 32, 60),
};
export function initVehicles(G) {
 const T = G.THREE;
 G.vehicles = {};
 for (const [k, f] of Object.entries(FACTORIES)) G.vehicles[k] = (...a) => f(T, ...a);
 G._vehAnims = G._vehAnims || [];
 G.spawnVehicle = (kind, x = 0, z = 0, heading = 0, color) => {
 const f = FACTORIES[kind];
 if (!f || !G.scene) return null;
 const grp = color !== undefined && kind === 'civilian' ? f(T, color) : f(T);
 grp.position.set(x, 0, z); grp.rotation.y = heading;
 G.scene.add(grp);
 G._vehAnims.push({ grp, phase: (G.rng ? G.rng() : Math.random()) * 6.28, hover: kind !== 'gajah' });
 if ((kind === 'civilian' || kind === 'taxi' || kind === 'angkot') && Array.isArray(G.traffic))
 G.traffic.push({ group: grp, mesh: grp, kind, speed: 8 + (G.rng ? G.rng() * 6 : 3) });
 return grp;
 };
 G.updateVehicles = (dt) => {
 const t = G.time || 0;
 for (const v of G._vehAnims) {
 if (!v.grp || !v.grp.parent) continue;
 if (v.hover) v.grp.position.y = 0.55 + Math.sin(t * 2.2 + v.phase) * 0.05;
 const u = v.grp.userData;
 if (u.glow) u.glow.material.opacity = 0.35 + Math.sin(t * 3 + v.phase) * 0.12;
 if (u.strobes) u.strobes.forEach((s, i) => { s.material.emissiveIntensity = (Math.sin(t * 10 + i * Math.PI) > 0 ? 2.5 : 0.15); });
 }
 };
 return G.vehicles;
}

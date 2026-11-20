// Vehicles: low-poly hover cars (boxes/wedges/cylinders only). Factories take THREE,
// return THREE.Group with userData {kind,speed,integrity,topSpeed}. Forward = local -Z.
// initVehicles(G): G.vehicles{garuda,komodo,viper,npd,capung,gajah,civilian,taxi,angkot},
// G.spawnVehicle(kind,x,z,heading,color), G.updateVehicles(dt) (bob/glow/strobes).
export function makeGarudaGT(T) {
  const g = new T.Group();
  const gold = new T.MeshStandardMaterial({ color: 0xd4a017, metalness: 0.85, roughness: 0.3 });
  const goldL = new T.MeshStandardMaterial({ color: 0xf2c94c, metalness: 0.8, roughness: 0.3 });
  const teal = new T.MeshStandardMaterial({ color: 0x0e7c7b, metalness: 0.6, roughness: 0.35 });
  const dark = new T.MeshStandardMaterial({ color: 0x14181f, metalness: 0.4, roughness: 0.6 });
  const glass = new T.MeshStandardMaterial({ color: 0x9fe8e0, metalness: 0.2, roughness: 0.1, transparent: true, opacity: 0.38 });
  const glow = new T.MeshBasicMaterial({ color: 0x19e3c8, transparent: true, opacity: 0.5 });
  const batik = new T.MeshStandardMaterial({ color: 0xc0392b, metalness: 0.4, roughness: 0.5, emissive: 0x701a10, emissiveIntensity: 0.7 });
  const bx = (w, h, d, m, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const q = new T.Mesh(new T.BoxGeometry(w, h, d), m);
    q.position.set(x, y, z); q.rotation.set(rx, ry, rz); g.add(q); return q;
  };
  bx(1.9, 0.42, 4.6, gold, 0, 0.62, 0);
  bx(1.7, 0.3, 2.2, teal, 0, 0.55, 0.9);
  bx(1.5, 0.34, 1.1, gold, 0, 0.62, -1.85);
  bx(1.96, 0.1, 0.5, batik, 0, 0.5, -1.2);
  bx(1.2, 0.5, 1.5, glass, 0, 1.02, 0.25);
  bx(1.26, 0.08, 1.56, goldL, 0, 1.3, 0.25);
  bx(1.9, 0.14, 0.9, dark, 0, 0.42, 0.4);
  bx(0.5, 0.1, 0.3, goldL, 0, 0.6, -2.32);
  const hl = new T.Mesh(new T.BoxGeometry(0.34, 0.12, 0.06),
    new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2a0, emissiveIntensity: 2 }));
  hl.position.set(-0.6, 0.62, -2.32); g.add(hl);
  const hr = hl.clone(); hr.position.x = 0.6; g.add(hr);
  for (const s of [-1, 1]) {
    bx(2.7, 0.1, 1.7, gold, s * 2.05, 1.08, -0.35, 0, s * 0.42, s * 0.3);
    bx(2.7, 0.06, 0.5, goldL, s * 2.05, 1.12, -1.05, 0, s * 0.42, s * 0.3);
    bx(1.1, 0.08, 0.42, teal, s * 2.0, 1.0, 0.35, 0, s * 0.42, s * 0.3);
    for (let i = 0; i < 3; i++)
      bx(0.9, 0.07, 0.34, goldL, s * 3.15, 1.14 + i * 0.1, -0.9 + i * 0.55, 0, s * 0.42, s * (0.3 + i * 0.12));
  }
  const skin = new T.MeshStandardMaterial({ color: 0xc98d5f, roughness: 0.7 });
  const drv = new T.Group(); drv.position.set(0, 0.86, 0.35); g.add(drv);
  const torso = new T.Mesh(new T.BoxGeometry(0.52, 0.55, 0.3),
    new T.MeshStandardMaterial({ color: 0xd4a017, metalness: 0.4, roughness: 0.5 }));
  torso.position.y = 0.28; drv.add(torso);
  const head = new T.Mesh(new T.SphereGeometry(0.19, 10, 8), skin);
  head.position.y = 0.72; drv.add(head);
  const helm = new T.Mesh(new T.SphereGeometry(0.21, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
    new T.MeshStandardMaterial({ color: 0x0e7c7b, metalness: 0.7, roughness: 0.3 }));
  helm.position.y = 0.74; drv.add(helm);
  for (const s of [-1, 1]) {
    const arm = new T.Mesh(new T.BoxGeometry(0.13, 0.13, 0.5),
      new T.MeshStandardMaterial({ color: 0x0e7c7b, roughness: 0.5 }));
    arm.position.set(s * 0.32, 0.32, -0.28); drv.add(arm);
  }
  const wheel = new T.Mesh(new T.TorusGeometry(0.2, 0.035, 6, 14), dark);
  wheel.position.set(0, 1.12, -0.05); wheel.rotation.x = 0.5; g.add(wheel);
  const disc = new T.Mesh(new T.CircleGeometry(2.3, 24), glow);
  disc.rotation.x = -Math.PI / 2; disc.position.y = 0.12; g.add(disc);
  const ring = new T.Mesh(new T.TorusGeometry(2.3, 0.05, 6, 32),
    new T.MeshBasicMaterial({ color: 0xf2c94c, transparent: true, opacity: 0.7 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.12; g.add(ring);
  g.userData = { kind: 'garuda', speed: 0, integrity: 100, topSpeed: 55, glow: disc };
  return g;
}
export function makeKomodoR(T) {
  const g = new T.Group();
  const chrome = new T.MeshStandardMaterial({ color: 0xc8ccd4, metalness: 0.95, roughness: 0.22 });
  const red = new T.MeshStandardMaterial({ color: 0x8e2f23, metalness: 0.6, roughness: 0.4 });
  const dark = new T.MeshStandardMaterial({ color: 0x14181f, metalness: 0.4, roughness: 0.6 });
  const tooth = new T.MeshStandardMaterial({ color: 0xf5f0dc, roughness: 0.4 });
  const bx = (w, h, d, m, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const q = new T.Mesh(new T.BoxGeometry(w, h, d), m);
    q.position.set(x, y, z); q.rotation.set(rx, ry, rz); g.add(q); return q;
  };
  bx(2.0, 0.5, 4.8, chrome, 0, 0.66, 0);
  bx(1.9, 0.34, 1.6, red, 0, 0.98, 0.7);
  bx(1.6, 0.42, 1.4, dark, 0, 1.0, -0.4);
  bx(2.02, 0.22, 0.7, red, 0, 0.66, -2.1);
  bx(1.8, 0.3, 0.4, red, 0, 0.7, 2.2);
  bx(1.8, 0.08, 0.5, red, 0, 1.05, 2.25);
  for (const s of [-1, 1]) bx(0.24, 0.5, 2.2, red, s * 1.05, 0.66, 0.3);
  for (let i = 0; i < 6; i++) {
    const t = new T.Mesh(new T.ConeGeometry(0.09, 0.3, 4), tooth);
    t.position.set(-0.7 + i * 0.28, 0.62, -2.44); t.rotation.x = -Math.PI / 2; g.add(t);
  }
  const eye = new T.MeshStandardMaterial({ color: 0xff2211, emissive: 0xff2211, emissiveIntensity: 2.5 });
  for (const s of [-1, 1]) bx(0.4, 0.1, 0.06, eye, s * 0.62, 0.7, -2.44);
  const disc = new T.Mesh(new T.CircleGeometry(2.2, 24),
    new T.MeshBasicMaterial({ color: 0xff3020, transparent: true, opacity: 0.4 }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = 0.12; g.add(disc);
  g.userData = { kind: 'komodo', speed: 0, integrity: 140, topSpeed: 52, glow: disc };
  return g;
}
export function makeViperCar(T) {
  const g = new T.Group();
  const black = new T.MeshStandardMaterial({ color: 0x0c0d10, metalness: 0.7, roughness: 0.35 });
  const red = new T.MeshStandardMaterial({ color: 0xb01e1e, metalness: 0.6, roughness: 0.4 });
  const eye = new T.MeshStandardMaterial({ color: 0xff2211, emissive: 0xff2211, emissiveIntensity: 2.5 });
  const bx = (w, h, d, m, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const q = new T.Mesh(new T.BoxGeometry(w, h, d), m);
    q.position.set(x, y, z); q.rotation.set(rx, ry, rz); g.add(q); return q;
  };
  bx(1.9, 0.44, 4.4, black, 0, 0.62, 0);
  bx(1.4, 0.4, 1.3, black, 0, 0.98, 0.2);
  bx(1.92, 0.08, 3.8, red, 0, 0.86, 0);
  for (const s of [-1, 1]) {
    bx(0.08, 0.7, 1.1, red, s * 1.0, 1.1, 0.9, 0, 0, s * -0.5);
    bx(0.08, 0.5, 0.8, red, s * 1.0, 1.05, -0.6, 0, 0, s * -0.4);
  }
  bx(1.7, 0.12, 0.1, eye, 0, 0.66, -2.22);
  for (const s of [-1, 1]) bx(0.3, 0.1, 0.06, eye, s * 0.6, 0.62, -2.22);
  const disc = new T.Mesh(new T.CircleGeometry(2.1, 24),
    new T.MeshBasicMaterial({ color: 0xff2211, transparent: true, opacity: 0.35 }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = 0.12; g.add(disc);
  g.userData = { kind: 'viper', speed: 0, integrity: 80, topSpeed: 50, glow: disc };
  return g;
}
export function makeNpdInterceptor(T) {
  const g = new T.Group();
  const white = new T.MeshStandardMaterial({ color: 0xf2f4f6, metalness: 0.5, roughness: 0.35 });
  const blue = new T.MeshStandardMaterial({ color: 0x1a4fd6, metalness: 0.5, roughness: 0.4 });
  const gold = new T.MeshStandardMaterial({ color: 0xd4a017, metalness: 0.8, roughness: 0.3 });
  const glass = new T.MeshStandardMaterial({ color: 0x9fd8e8, metalness: 0.2, roughness: 0.1, transparent: true, opacity: 0.4 });
  const bx = (w, h, d, m, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const q = new T.Mesh(new T.BoxGeometry(w, h, d), m);
    q.position.set(x, y, z); q.rotation.set(rx, ry, rz); g.add(q); return q;
  };
  bx(1.9, 0.44, 4.6, white, 0, 0.62, 0);
  bx(1.92, 0.16, 4.0, blue, 0, 0.62, 0);
  bx(1.3, 0.4, 1.4, glass, 0, 1.0, 0.2);
  bx(1.9, 0.1, 0.6, gold, 0, 0.62, -2.0);
  const arrow = new T.Mesh(new T.ConeGeometry(0.3, 0.9, 4), gold);
  arrow.rotation.x = -Math.PI / 2; arrow.rotation.y = Math.PI / 4;
  arrow.position.set(0, 0.9, -1.6); arrow.scale.set(1, 1, 0.3); g.add(arrow);
  const strobes = [];
  for (const s of [-1, 1]) {
    const st = bx(0.4, 0.14, 0.3,
      new T.MeshStandardMaterial({ color: s < 0 ? 0xff2211 : 0x2255ff, emissive: s < 0 ? 0xff2211 : 0x2255ff, emissiveIntensity: 2 }),
      s * 0.3, 1.26, 0.2);
    strobes.push(st);
  }
  const disc = new T.Mesh(new T.CircleGeometry(2.1, 24),
    new T.MeshBasicMaterial({ color: 0x3355ff, transparent: true, opacity: 0.3 }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = 0.12; g.add(disc);
  g.userData = { kind: 'npd', speed: 0, integrity: 90, topSpeed: 53, glow: disc, strobes };
  return g;
}
export function makeCapungBike(T) {
  const g = new T.Group();
  const teal = new T.MeshStandardMaterial({ color: 0x0e9c9a, metalness: 0.6, roughness: 0.35 });
  const dark = new T.MeshStandardMaterial({ color: 0x14181f, metalness: 0.4, roughness: 0.6 });
  const wingM = new T.MeshStandardMaterial({ color: 0x9fe8e0, metalness: 0.2, roughness: 0.2, transparent: true, opacity: 0.55 });
  const bx = (w, h, d, m, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const q = new T.Mesh(new T.BoxGeometry(w, h, d), m);
    q.position.set(x, y, z); q.rotation.set(rx, ry, rz); g.add(q); return q;
  };
  bx(0.5, 0.3, 2.2, teal, 0, 0.7, 0);
  bx(0.34, 0.34, 0.5, dark, 0, 0.95, -0.5);
  for (const s of [-1, 1]) for (const z of [-0.4, 0.5])
    bx(1.1, 0.04, 0.5, wingM, s * 0.7, 0.95, z, 0, s * 0.25, s * 0.15);
  const disc = new T.Mesh(new T.CircleGeometry(0.9, 16),
    new T.MeshBasicMaterial({ color: 0x19e3c8, transparent: true, opacity: 0.4 }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = 0.12; g.add(disc);
  g.userData = { kind: 'capung', speed: 0, integrity: 40, topSpeed: 48, glow: disc };
  return g;
}
export function makeGajahTruck(T) {
  const g = new T.Group();
  const armor = new T.MeshStandardMaterial({ color: 0x5a5f66, metalness: 0.8, roughness: 0.45 });
  const olive = new T.MeshStandardMaterial({ color: 0x4a5240, metalness: 0.5, roughness: 0.6 });
  const dark = new T.MeshStandardMaterial({ color: 0x1a1d22, metalness: 0.4, roughness: 0.6 });
  const bx = (w, h, d, m, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const q = new T.Mesh(new T.BoxGeometry(w, h, d), m);
    q.position.set(x, y, z); q.rotation.set(rx, ry, rz); g.add(q); return q;
  };
  bx(2.4, 1.6, 5.6, olive, 0, 1.5, 0.6);
  bx(2.4, 1.0, 2.0, armor, 0, 1.2, -3.2);
  bx(2.0, 0.7, 0.3, dark, 0, 1.35, -4.25);
  for (const s of [-1, 1]) bx(0.3, 1.2, 5.4, armor, s * 1.3, 1.1, 0.4);
  for (const s of [-1, 1]) for (const z of [-3.6, -1.6, 0.6, 2.4]) {
    const w = new T.Mesh(new T.CylinderGeometry(0.55, 0.55, 0.4, 12), dark);
    w.rotation.z = Math.PI / 2; w.position.set(s * 1.15, 0.55, z); g.add(w);
  }
  const disc = new T.Mesh(new T.CircleGeometry(2.6, 24),
    new T.MeshBasicMaterial({ color: 0xffcc33, transparent: true, opacity: 0.25 }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = 0.1; g.add(disc);
  g.userData = { kind: 'gajah', speed: 0, integrity: 500, topSpeed: 28, glow: disc };
  return g;
}
export function makeCivilianCar(T, color = 0xcccccc, opts = {}) {
  const g = new T.Group();
  const body = new T.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.45 });
  const dark = new T.MeshStandardMaterial({ color: 0x14181f, metalness: 0.4, roughness: 0.6 });
  const glass = new T.MeshStandardMaterial({ color: 0x9fd8e8, metalness: 0.2, roughness: 0.15, transparent: true, opacity: 0.45 });
  const len = opts.angkot ? 5.6 : 4.2;
  const bx = (w, h, d, m, x, y, z) => {
    const q = new T.Mesh(new T.BoxGeometry(w, h, d), m);
    q.position.set(x, y, z); g.add(q); return q;
  };
  bx(1.8, 0.4, len, body, 0, 0.6, 0);
  bx(1.5, 0.38, opts.angkot ? 3.4 : 1.9, glass, 0, 0.95, opts.angkot ? 0.3 : 0.1);
  bx(1.84, 0.1, len * 0.9, dark, 0, 0.42, 0);
  if (opts.taxi) {
    bx(0.7, 0.18, 0.3, new T.MeshStandardMaterial({ color: 0x111111, emissive: 0xffcc33, emissiveIntensity: 1.2 }), 0, 1.2, 0.1);
    bx(1.84, 0.1, 0.5, new T.MeshStandardMaterial({ color: 0x111111 }), 0, 0.62, -1.4);
  }
  const disc = new T.Mesh(new T.CircleGeometry(1.9, 20),
    new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = 0.1; g.add(disc);
  g.userData = { kind: opts.taxi ? 'taxi' : opts.angkot ? 'angkot' : 'civilian', speed: 0, integrity: 60, topSpeed: 32, glow: disc };
  return g;
}
const FACTORIES = {
  garuda: makeGarudaGT, komodo: makeKomodoR, viper: makeViperCar,
  npd: makeNpdInterceptor, capung: makeCapungBike, gajah: makeGajahTruck,
  civilian: makeCivilianCar, taxi: (T) => makeCivilianCar(T, 0xf2c200, { taxi: true }),
  angkot: (T) => makeCivilianCar(T, 0x2e8b57, { angkot: true }),
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

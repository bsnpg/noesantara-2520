// Police: Wanted 1-5. Rises on crime, falls on hiding 15s / changing car / mission done.
// Caught at 5 stars + surrounded = BUSTED (10% credits fine, respawn at safehouse).
import * as THREE from '../vendor/three.module.min.js';

function box(w, h, d, color, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.3 }));
  m.position.set(x, y, z); return m;
}
function ppos(G) { const p = G.player; if (!p) return new THREE.Vector3(); return p.pos || p.group?.position || new THREE.Vector3(); }

export function initPolice(G) {
  const T = G.THREE || THREE;
  const scene = G.scene;
  G.wanted = G.wanted || { stars: 0, heat: 0, hidden: 0, busted: false };
  G.police = G.police || {};
  const units = []; // {group, kind, speed, ramT, strobeA, strobeB, rotor}
  let bustT = 0;

  // BUSTED banner (DOM, shown 3.5s).
  let banner = document.getElementById('busted');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'busted';
    banner.style.cssText = 'position:fixed;top:38%;left:50%;transform:translate(-50%,-50%);display:none;z-index:40;text-align:center;color:#fff;font:800 44px system-ui;letter-spacing:6px;text-shadow:0 4px 18px #000';
    document.body.appendChild(banner);
  }

  function makeCar() { // NPD interceptor: white + blue + gold, strobes
    const g = new THREE.Group();
    g.add(box(2, 0.55, 4.4, 0xf5f7fa, 0, 0.55, 0));
    g.add(box(1.7, 0.5, 2.2, 0x1d4ed8, 0, 1.05, -0.2));
    g.add(box(2.02, 0.12, 0.8, 0xf2c94c, 0, 0.62, 0.6)); // gold stripe
    g.add(box(0.35, 0.35, 0.9, 0x111111, -0.85, 0.35, 1.3));
    g.add(box(0.35, 0.35, 0.9, 0x111111, 0.85, 0.35, -1.3));
    g.add(box(0.35, 0.35, 0.9, 0x111111, -0.85, 0.35, -1.3));
    g.add(box(0.35, 0.35, 0.9, 0x111111, 0.85, 0.35, -1.3));
    const a = box(0.22, 0.1, 0.22, 0x3b82f6, -0.4, 1.35, -0.2);
    const b = box(0.22, 0.1, 0.22, 0xef4444, 0.4, 1.35, -0.2);
    a.material = a.material.clone(); b.material = b.material.clone();
    a.material.emissive = new THREE.Color(0x3b82f6); b.material.emissive = new THREE.Color(0xef4444);
    g.add(a); g.add(b);
    g.userData.strobes = [a, b];
    return g;
  }
  function makeHeli() {
    const g = new THREE.Group();
    g.add(box(1.8, 1.2, 3.4, 0xf5f7fa, 0, 0, 0));
    g.add(box(0.5, 0.5, 3, 0x1d4ed8, 0, 0.1, 3));
    g.add(box(1.9, 0.14, 0.3, 0x333333, 0, 0.8, 0));
    const rotor = box(5.4, 0.06, 0.3, 0x222222, 0, 0.85, 0);
    g.add(rotor);
    const spot = new THREE.SpotLight(0xffffff, 80, 60, 0.35, 0.5);
    spot.position.set(0, -0.5, 0);
    g.add(spot); g.add(spot.target);
    g.userData.rotor = rotor; g.userData.spot = spot;
    return g;
  }
  function makeElite() { // elite unit on foot: white/blue/gold figure
    const g = new THREE.Group();
    g.add(box(0.5, 0.6, 0.3, 0xf5f7fa, 0, 0.8, 0));
    g.add(box(0.26, 0.26, 0.26, 0xc98d64, 0, 1.3, 0));
    g.add(box(0.16, 0.5, 0.16, 0x1d4ed8, -0.11, 0.25, 0));
    g.add(box(0.16, 0.5, 0.16, 0x1d4ed8, 0.11, 0.25, 0));
    g.add(box(0.07, 0.07, 0.55, 0x222222, 0.2, 1.0, 0.1));
    return g;
  }
  function spawnUnit(kind) {
    if (!scene) return null;
    const g = kind === 'heli' ? makeHeli() : kind === 'elite' ? makeElite() : makeCar();
    const p = ppos(G), a = Math.random() * Math.PI * 2;
    g.position.set(p.x + Math.cos(a) * 60, kind === 'heli' ? 28 : 0, p.z + Math.sin(a) * 60);
    scene.add(g);
    const u = { group: g, kind, speed: kind === 'heli' ? 20 : kind === 'elite' ? 7 : kind === 'patrol' ? 18 : 26, ramT: 0, t: 0 };
    units.push(u);
    return u;
  }
  function removeUnit(u) { scene?.remove(u.group); units.splice(units.indexOf(u), 1); }
  function starsOf(heat) { return heat >= 95 ? 5 : heat >= 80 ? 4 : heat >= 60 ? 3 : heat >= 40 ? 2 : heat >= 20 ? 1 : 0; }
  function addHeat(n) {
    G.wanted.heat = Math.max(0, Math.min(100, G.wanted.heat + n));
    G.wanted.stars = starsOf(G.wanted.heat);
    G.wanted.hidden = 0;
  }
  function clear() { // mission complete / safehouse sleep: full reset
    G.wanted.heat = 0; G.wanted.stars = 0; G.wanted.hidden = 0; bustT = 0;
    while (units.length) removeUnit(units[0]);
  }
  function changeCar() { addHeat(-40); } // changing car sheds heat
  function doBusted() {
    const fine = Math.floor((G.credits || 0) * 0.1);
    G.credits = (G.credits || 0) - fine;
    const sp = G.safehousePos || new THREE.Vector3(0, 0, 0);
    const p = G.player;
    if (p) { if (p.pos) p.pos.copy(sp); else if (p.group) p.group.position.copy(sp); }
    clear();
    G.wanted.busted = true;
    banner.innerHTML = `BUSTED<div style="font:600 18px system-ui;letter-spacing:1px;margin-top:8px">Denda 10% credits — Rp ${fine.toLocaleString('id-ID')}</div>`;
    banner.style.display = 'block';
    setTimeout(() => { banner.style.display = 'none'; G.wanted.busted = false; }, 3500);
    if (G.police.onBusted) G.police.onBusted(fine);
  }
  // Roadblock: barrier boxes ahead of the player along their heading.
  function spawnRoadblock() {
    if (!scene) return;
    const p = ppos(G), yaw = G.view?.yaw || 0;
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    for (let i = -1; i <= 1; i++) {
      const b = box(2.2, 1.1, 0.4, 0xc8102e, p.x + fx * 26 - fz * i * 2.4, 0.55, p.z + fz * 26 + fx * i * 2.4);
      scene.add(b);
      units.push({ group: b, kind: 'block', speed: 0, ramT: 0, t: 8 }); // t = lifetime
    }
  }

  const v = new T.Vector3();
  function update(dt) {
    if (G.state !== 'play') return;
    const w = G.wanted, pp = ppos(G);
    // desired force by stars
    const wantCars = w.stars === 1 ? 1 : w.stars === 2 ? 2 : w.stars >= 3 ? 3 : 0;
    const cars = units.filter((u) => u.kind === 'car' || u.kind === 'patrol');
    const heli = units.find((u) => u.kind === 'heli');
    const elites = units.filter((u) => u.kind === 'elite');
    const blocks = units.filter((u) => u.kind === 'block');
    if (cars.length < wantCars) spawnUnit(w.stars === 1 ? 'patrol' : 'car');
    if (cars.length > wantCars) removeUnit(cars[0]);
    if (w.stars >= 4 && !heli) spawnUnit('heli');
    if (w.stars < 4 && heli) removeUnit(heli);
    if (w.stars >= 5 && elites.length < 2) spawnUnit('elite');
    if (w.stars < 5 && elites.length) removeUnit(elites[0]);
    if (w.stars >= 3 && blocks.length === 0) spawnRoadblock();
    if (w.stars < 3) for (const b of [...blocks]) removeUnit(b);
    // chase / ram / hover
    let near = Infinity, close = 0;
    for (const u of [...units]) {
      u.t += dt;
      if (u.kind === 'block' && u.t > 8) { removeUnit(u); continue; }
      const d = u.group.position.distanceTo(pp);
      near = Math.min(near, d);
      if (d < 7) close++;
      if (u.kind === 'heli') {
        u.group.position.x += (pp.x - u.group.position.x) * dt * 0.8;
        u.group.position.z += (pp.z - u.group.position.z) * dt * 0.8;
        u.group.userData.rotor.rotation.y += dt * 20;
        u.group.userData.spot.target.position.copy(pp);
      } else if (u.kind === 'elite') {
        v.copy(pp).sub(u.group.position); v.y = 0;
        if (v.length() > 2) { v.normalize(); u.group.position.addScaledVector(v, u.speed * dt); }
        u.group.lookAt(pp.x, 0, pp.z);
      } else if (u.kind === 'car' || u.kind === 'patrol') {
        v.copy(pp).sub(u.group.position); v.y = 0;
        const dist = v.length();
        if (dist > 2.5) { v.normalize(); u.group.position.addScaledVector(v, u.speed * dt); }
        u.group.lookAt(pp.x, 0, pp.z);
        u.ramT -= dt;
        if (dist < 3 && u.ramT <= 0) { // ram
          u.ramT = 1.5;
          if (G.car) G.car.integrity = Math.max(0, (G.car.integrity ?? 100) - 4);
          else if (G.player) G.player.hp = Math.max(0, (G.player.hp ?? 100) - 4);
        }
        const s = u.group.userData.strobes;
        if (s) { const on = Math.floor(u.t * 6) % 2 === 0; s[0].material.emissiveIntensity = on ? 2 : 0.1; s[1].material.emissiveIntensity = on ? 0.1 : 2; }
      }
    }
    // hide 15s out of sight -> heat falls
    if (near > 45 || G.player?.inSafehouse) w.hidden += dt; else w.hidden = 0;
    if (w.hidden > 15) { w.heat = Math.max(0, w.heat - 30 * dt); w.stars = starsOf(w.heat); }
    // speeding in front of NPD
    if (G.car && (G.car.speed || 0) > 28 && near < 35) addHeat(3 * dt);
    // BUSTED: 5 stars + surrounded
    if (w.stars === 5 && close >= 3) { bustT += dt; if (bustT > 2) doBusted(); }
    else bustT = 0;
  }

  G.police = { addHeat, clear, changeCar, units, onBusted: null, update };
  G.updates = G.updates || []; G.updates.push(update);
  return G.police;
}

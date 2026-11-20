// Combat: 6 weapons, shooting, enemies/allies, floating health bars, boss bar.
import * as THREE from '../vendor/three.module.min.js';
// Index: 0 Pistol, 1 SMG, 2 Shotgun, 3 Rifle, 4 Bazooka, 5 Fists.
export const WEAPONS = [
  { name: 'PISTOL', dmg: 25, rate: 3, mag: 12, reserve: 72, range: 60, spread: 0.012, pellets: 1, auto: false },
  { name: 'SMG', dmg: 12, rate: 9, mag: 32, reserve: 160, range: 45, spread: 0.05, pellets: 1, auto: true },
  { name: 'SHOTGUN', dmg: 9, rate: 1.1, mag: 6, reserve: 30, range: 25, spread: 0.09, pellets: 6, auto: false },
  { name: 'RIFLE', dmg: 34, rate: 7, mag: 30, reserve: 150, range: 90, spread: 0.02, pellets: 1, auto: true },
  { name: 'BAZOOKA', dmg: 120, rate: 0.7, mag: 4, reserve: 12, range: 70, spread: 0.005, pellets: 1, auto: false, splash: 5 },
  { name: 'FISTS', dmg: 15, rate: 2, mag: Infinity, reserve: Infinity, range: 2.4, spread: 0, pellets: 1, auto: false, melee: true },
];
const GOLD = 0xf2c94c, TEAL = 0x2ec4b6;
function ppos(G) { const p = G.player; if (!p) return new THREE.Vector3(); return p.pos || p.group?.position || new THREE.Vector3(); }
function keyDown(G, c) { const k = G.keys; return k ? (typeof k.has === 'function' ? k.has(c) : !!k[c]) : false; }
function box(w, h, d, color, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.25 }));
  m.position.set(x, y, z); return m;
}
// Low-poly figure. c = [skin, shirt, pants, trim, gun]
function makeFigure(c, s = 1) {
  const g = new THREE.Group();
  g.add(box(0.16, 0.5, 0.16, c[2], -0.11, 0.25, 0));
  g.add(box(0.16, 0.5, 0.16, c[2], 0.11, 0.25, 0));
  g.add(box(0.52, 0.62, 0.3, c[1], 0, 0.82, 0));
  g.add(box(0.54, 0.08, 0.32, c[3], 0, 1.1, 0)); // batik trim band
  g.add(box(0.26, 0.26, 0.26, c[0], 0, 1.32, 0));
  g.add(box(0.28, 0.08, 0.28, c[1], 0, 1.48, 0));
  g.add(box(0.12, 0.5, 0.12, c[1], -0.32, 0.85, 0.1));
  g.add(box(0.12, 0.5, 0.12, c[1], 0.32, 0.85, 0.1));
  g.add(box(0.07, 0.07, 0.55, c[4], 0.2, 1.05, 0.05));
  g.add(box(0.05, 0.16, 0.05, c[4], 0.2, 0.95, 0.2));
  g.scale.setScalar(s);
  return g;
}
const SKINS = {
  viper: [0xc98d64, 0x14141a, 0x1e1e26, 0xc8102e, 0x222222],
  npd: [0xc98d64, 0xf5f7fa, 0x1d4ed8, 0xf2c94c, 0x333333],
  razor: [0xd9a066, 0x8f0f1e, 0x222222, 0xf2c94c, 0x111111],
  mara: [0xe8b48a, 0x0f766e, 0x134e4a, 0xf2c94c, 0x444444],
  riko: [0xb07a4a, 0x92400e, 0x44403c, 0xf2c94c, 0x555555],
  kiko: [0xc98d64, 0x1f2937, 0x111827, 0xf2c94c, 0x222222],
};

export function initCombat(G) {
  const T = G.THREE || THREE;
  const scene = G.scene, camera = G.camera;
  G.enemies = G.enemies || []; G.allies = G.allies || [];
  G.player = G.player || {};
  if (G.player.hp == null) G.player.hp = 100;
  if (G.player.maxHp == null) G.player.maxHp = 100;
  G.weapon = G.weapon || { index: 5, name: 'FISTS', ammo: Infinity, mag: Infinity };
  const W = WEAPONS;
  let mag = W[G.weapon.index].mag, reserve = W[G.weapon.index].reserve;
  let cool = 0, reloadT = 0, firing = false, flashT = 0, swingT = 0, held = false;
  const ray = new T.Raycaster(), tracers = [], bars = new Map();

  // DOM: floating bars (allies GREEN, enemies RED) + Razor boss bar.
  let barWrap = document.getElementById('bars');
  if (!barWrap) {
    barWrap = document.createElement('div');
    barWrap.id = 'bars';
    barWrap.style.cssText = 'position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:20';
    document.body.appendChild(barWrap);
  }
  let bossBar = document.getElementById('bossbar');
  if (!bossBar) {
    bossBar = document.createElement('div');
    bossBar.id = 'bossbar';
    bossBar.style.cssText = 'position:fixed;top:64px;left:50%;transform:translateX(-50%);width:min(520px,60vw);display:none;z-index:21;text-align:center;color:#ff5a5a;font:700 20px system-ui;letter-spacing:2px;text-shadow:0 2px 6px #000';
    bossBar.innerHTML = 'RAZOR — BOSS<div style="height:14px;border:2px solid #ff5a5a;background:#1a0505;margin-top:4px"><div id="bossfill" style="height:100%;width:100%;background:#ef4444"></div></div>';
    document.body.appendChild(bossBar);
  }
  const bossFill = document.getElementById('bossfill');
  function makeBar(ent) {
    const ally = ent.kind === 'ally', col = ally ? '#4ade80' : '#ff6b6b', bg = ally ? '#22c55e' : '#ef4444';
    const d = document.createElement('div');
    d.style.cssText = `position:absolute;left:0;top:0;transform:translate(-50%,-100%);text-align:center;font:700 11px system-ui;color:${col};text-shadow:0 1px 3px #000;white-space:nowrap`;
    d.innerHTML = `<div>${ent.name}</div><div style="width:56px;height:6px;background:#000a;border:1px solid #fff6;margin:2px auto 0"><div style="height:100%;width:100%;background:${bg}"></div></div>`;
    barWrap.appendChild(d);
    bars.set(ent, { el: d, fill: d.querySelector('div div div') });
  }

  // FPS viewmodel: gun + hands on camera. Rifle is gold body + teal trim.
  const vm = new T.Group();
  const flash = new T.PointLight(0xffc860, 0, 14);
  flash.position.set(0.38, -0.24, -0.9);
  const vmGuns = [];
  const defs = [ // [body size, body color, trim color, extra]
    [[0.09, 0.12, 0.34], 0x3a3f4a, GOLD, 0],
    [[0.09, 0.11, 0.5], 0x2c313c, TEAL, 0],
    [[0.11, 0.13, 0.62], 0x4a2c1a, GOLD, 0],
    [[0.1, 0.13, 0.72], GOLD, TEAL, 1], // scope
    [[0.14, 0.16, 0.85], 0x374151, 0xc8102e, 2], // warhead
    null,
  ];
  for (let i = 0; i < 6; i++) {
    const g = new T.Group(), d = defs[i];
    if (d) {
      // Viewmodel sits low-right (bottom-right corner) so it stays visible
      // even with the weapon wheel open over the centre of the screen.
      g.add(box(d[0][0], d[0][1], d[0][2], d[1], 0.38, -0.26, -0.55));
      g.add(box(0.03, 0.03, 0.3, d[2], 0.38, -0.19, -0.6));
      g.add(box(0.07, 0.16, 0.08, d[1], 0.38, -0.36, -0.35));
      if (d[3] === 1) g.add(box(0.05, 0.06, 0.22, 0x111111, 0.38, -0.16, -0.55));
      if (d[3] === 2) g.add(box(0.16, 0.18, 0.2, d[2], 0.38, -0.26, -0.95));
    }
    g.add(box(0.11, 0.09, 0.22, 0x22242a, 0.38, -0.36, -0.32)); // hands
    g.add(box(0.11, 0.09, 0.22, 0x22242a, 0.24, -0.33, -0.5));
    g.add(box(0.12, 0.03, 0.06, GOLD, 0.38, -0.36, -0.22));
    g.visible = false; vm.add(g); vmGuns.push(g);
  }
  vm.add(flash);
  if (camera) camera.add(vm);
  vm.visible = false; // starts hidden: update() shows it only in FPS POV.
  // (Shot mode never runs update(), so the default-true group would leak
  // the Fists viewmodel into third-person shots as a dark box.)

  function setViewmodel(i) {
    vmGuns.forEach((g, j) => { g.visible = j === i; });
    G.weapon.index = i; G.weapon.name = W[i].name;
    mag = W[i].mag; reserve = W[i].reserve;
    G.weapon.mag = mag; G.weapon.ammo = reserve;
  }
  setViewmodel(G.weapon.index);

  function spawn(kind, name, x, z, hp) {
    if (!scene) return null;
    const ally = kind === 'ally';
    const g = makeFigure(SKINS[name.toLowerCase()] || SKINS[kind] || SKINS.viper, name === 'RAZOR' ? 1.3 : 1);
    g.position.set(x, 0, z); scene.add(g);
    const ent = { group: g, hp, maxHp: hp, name, kind: ally ? 'ally' : kind, alive: true, shootT: 1 + Math.random() * 2, speed: kind === 'razor' ? 3.2 : 5 };
    g.traverse((o) => { o.userData.ent = ent; });
    (ally ? G.allies : G.enemies).push(ent);
    makeBar(ent);
    return ent;
  }
  function spawnEnemy(kind, x, z) {
    return spawn(kind, kind === 'razor' ? 'RAZOR' : kind === 'npd' ? 'NPD' : 'VIPER', x, z, kind === 'razor' ? 800 : kind === 'npd' ? 80 : 60);
  }
  function spawnAlly(name, x, z) { return spawn('ally', name, x, z, name === 'Riko' ? 120 : 100); }
  function kill(ent) {
    ent.alive = false;
    ent.group.rotation.x = -Math.PI / 2; ent.group.position.y = 0.2;
    const b = bars.get(ent); if (b) b.el.remove(); bars.delete(ent);
    if (ent.kind === 'npd' && G.police) G.police.addHeat(40); // killing NPD raises Wanted
    // Mission counters: gang-war progress feeds the mission system.
    if (G.missions) {
      if (ent.kind === 'viper') G.missions.bump('vipersDown', 1);
      else if (ent.kind === 'razor') G.missions.bump('razorDown', 1);
      else if (ent.name === 'SYNDICATE') G.missions.bump('syndicateDown', 1);
    }
    setTimeout(() => scene?.remove(ent.group), 3000);
  }
  function damage(ent, n) { if (!ent.alive) return; ent.hp -= n; if (ent.hp <= 0) { ent.hp = 0; kill(ent); } }
  function damagePlayer(n) {
    if (G.player.hp <= 0) return;
    G.player.hp = Math.max(0, G.player.hp - n);
    if (G.player.hp === 0 && G.onPlayerDown) G.onPlayerDown();
  }
  function tracerTo(to) {
    if (!scene || !camera) return;
    const from = new T.Vector3(0.38, -0.26, -1.0);
    camera.localToWorld(from);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([from, to]), new THREE.LineBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.9 }));
    scene.add(line); tracers.push({ line, t: 0.07 });
  }
  function fireOnce() {
    const w = W[G.weapon.index];
    if (w.melee) {
      swingT = 0.25;
      for (const e of G.enemies) if (e.alive && e.group.position.distanceTo(ppos(G)) < w.range) damage(e, w.dmg);
      return;
    }
    if (!camera) return;
    if (mag <= 0) { reload(); return; }
    mag -= 1; G.weapon.mag = mag;
    flashT = 0.06; flash.intensity = 6;
    for (let p = 0; p < w.pellets; p++) {
      ray.setFromCamera(new T.Vector2((Math.random() - 0.5) * w.spread * 4, (Math.random() - 0.5) * w.spread * 4), camera);
      ray.far = w.range;
      const hits = ray.intersectObjects(G.enemies.filter((e) => e.alive).map((e) => e.group), true);
      const dir = new T.Vector3(); camera.getWorldDirection(dir);
      const end = camera.position.clone().add(dir.multiplyScalar(w.range));
      if (hits.length) {
        end.copy(hits[0].point);
        const ent = hits[0].object.userData.ent;
        if (w.splash) for (const e of G.enemies) if (e.alive && e.group.position.distanceTo(end) < w.splash) damage(e, w.dmg);
        else damage(ent, w.dmg);
      } else if (w.splash) for (const e of G.enemies) if (e.alive && e.group.position.distanceTo(end) < w.splash) damage(e, w.dmg * 0.5);
      tracerTo(end);
    }
  }
  function reload() {
    const w = W[G.weapon.index];
    if (w.melee || reloadT > 0 || mag >= w.mag || reserve <= 0) return;
    reloadT = 1.1;
  }
  function finishReload() {
    const w = W[G.weapon.index], take = Math.min(w.mag - mag, reserve);
    mag += take; reserve -= take;
    G.weapon.mag = mag; G.weapon.ammo = reserve;
  }
  window.addEventListener('mousedown', (e) => { if (e.button === 0) firing = true; });
  window.addEventListener('mouseup', (e) => { if (e.button === 0) firing = false; });
  window.addEventListener('blur', () => { firing = false; });

  // Gang-war staging for shot 3: 4 Vipers ahead, allies beside, rifle selected.
  function stageFps() {
    const p = ppos(G);
    // Vipers spread wide across the frame (not bunched at screen centre,
    // where the open wheel would hide them) — gang war visible around it.
    spawnEnemy('viper', p.x - 16, p.z - 16); spawnEnemy('viper', p.x - 10, p.z - 20);
    spawnEnemy('viper', p.x + 10, p.z - 19); spawnEnemy('viper', p.x + 16, p.z - 15);
    spawnAlly('Mara', p.x - 4, p.z - 4); spawnAlly('Riko', p.x - 7, p.z - 3); spawnAlly('Kiko', p.x + 5, p.z - 4);
    setViewmodel(3); G.pov = 'fps';
  }

  const v3 = new T.Vector3(), proj = new T.Vector3();
  function update(dt) {
    const playing = G.state === 'play', w = W[G.weapon.index];
    cool -= dt;
    if (flashT > 0) { flashT -= dt; flash.intensity = Math.max(0, flashT * 100); }
    if (swingT > 0) { swingT -= dt; const s = Math.sin((0.25 - swingT) / 0.25 * Math.PI); vmGuns[5].position.x = s * 0.25; vmGuns[5].rotation.z = -s * 0.6; }
    else { vmGuns[5].position.x = 0; vmGuns[5].rotation.z = 0; }
    if (reloadT > 0) { reloadT -= dt; if (reloadT <= 0) finishReload(); }
    if (keyDown(G, 'KeyR') && G.player && G.player.onFoot) reload(); // R reloads on foot only (R in a car = replay)
    if (reserve < w.reserve && !w.melee) { reserve = Math.min(w.reserve, reserve + dt * 0.5); G.weapon.ammo = reserve; } // reserve trickles back
    if (firing && playing && !G.wheelOpen && cool <= 0 && reloadT <= 0 && (w.auto || !held)) { fireOnce(); cool = 1 / w.rate; }
    held = firing;
    for (let i = tracers.length - 1; i >= 0; i--) {
      const t = tracers[i]; t.t -= dt; t.line.material.opacity = Math.max(0, t.t * 12);
      if (t.t <= 0) { scene.remove(t.line); t.line.geometry.dispose(); tracers.splice(i, 1); }
    }
    const pp = ppos(G);
    for (const e of G.enemies) { // enemy AI: close in, shoot player / nearest ally
      if (!e.alive) continue;
      let target = pp, te = null, best = e.group.position.distanceTo(pp);
      for (const a of G.allies) {
        if (!a.alive) continue;
        const d = e.group.position.distanceTo(a.group.position);
        if (d < best) { best = d; target = a.group.position; te = a; }
      }
      v3.copy(target).sub(e.group.position); v3.y = 0;
      const dist = v3.length();
      if (dist > 12) { v3.normalize(); e.group.position.addScaledVector(v3, e.speed * dt); }
      e.group.lookAt(target.x, 0, target.z);
      e.shootT -= dt;
      if (e.shootT <= 0 && dist < 45 && playing) {
        e.shootT = 1.4 + Math.random() * 1.2;
        if (Math.random() < 0.4) { if (te) damage(te, 7); else damagePlayer(6 + Math.random() * 4); }
      }
    }
    for (const a of G.allies) { // ally AI: shoot nearest enemy
      if (!a.alive) continue;
      let near = null, bd = 50;
      for (const e of G.enemies) {
        if (!e.alive) continue;
        const d = a.group.position.distanceTo(e.group.position);
        if (d < bd) { bd = d; near = e; }
      }
      if (near) {
        a.group.lookAt(near.group.position.x, 0, near.group.position.z);
        a.shootT -= dt;
        if (a.shootT <= 0) { a.shootT = 0.9; if (Math.random() < 0.55) damage(near, 10); }
      }
    }
    if (camera && G.renderer) { // project floating bars to screen
      camera.updateMatrixWorld(true); // shot staging sets the camera pose by
      // hand, so rebuild the matrix before projecting (a stale title-orbit
      // pose sends every bar off-screen)
      const wpx = G.renderer.domElement.clientWidth || window.innerWidth;
      const hpx = G.renderer.domElement.clientHeight || window.innerHeight;
      for (const ent of [...G.enemies, ...G.allies]) {
        const b = bars.get(ent); if (!b) continue;
        if (!ent.alive) { b.el.style.display = 'none'; continue; }
        proj.copy(ent.group.position); proj.y += ent.name === 'RAZOR' ? 2.6 : 2.1;
        proj.project(camera);
        if (proj.z > 1) { b.el.style.display = 'none'; continue; }
        b.el.style.display = 'block';
        b.el.style.left = ((proj.x * 0.5 + 0.5) * wpx) + 'px';
        b.el.style.top = ((-proj.y * 0.5 + 0.5) * hpx) + 'px';
        const f = Math.max(0, ent.hp / ent.maxHp);
        b.fill.style.width = (f * 100) + '%';
        b.el.style.opacity = f < 0.3 && Math.floor((G.time || 0) * 4) % 2 === 0 ? '0.35' : '1'; // low HP blinks
      }
    }
    const boss = G.enemies.find((e) => e.kind === 'razor' && e.alive);
    if (boss) { bossBar.style.display = 'block'; if (bossFill) bossFill.style.width = (boss.hp / boss.maxHp * 100) + '%'; }
    else bossBar.style.display = 'none';
    vm.visible = !!camera && G.pov === 'fps' && playing;
    if (G.player.group) G.player.group.visible = G.pov !== 'fps';
    // Live combat = chaos: nearby peds flee (traffic.js reads G.chaos).
    if (G.setChaos) G.setChaos(G.enemies.some((e) => e.alive));
  }

  G.combat = { weapons: W, fire: fireOnce, reload, setViewmodel, spawnEnemy, spawnAlly, damage, damagePlayer, stageFps, update };
  G.updates = G.updates || []; G.updates.push(update);
  return G.combat;
}

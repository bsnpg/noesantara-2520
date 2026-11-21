// combat.js — weapons, shooting, viewmodel, enemies/allies with health bars,
// tracers, muzzle flash, shells, burning cars. Bars are DOM elements projected
// from 3D positions each frame (same look as the sealed shots).
import * as THREE from '../vendor/three.module.min.js';
import * as A from './assets3d.js';
import { WEAPONS } from './config.js';

export function createCombat(ctx) {
  const { scene, camera } = ctx.render;
  const viewmodel = A.makeViewmodelRifle();
  viewmodel.position.set(0.62, -0.5, -1.2);
  viewmodel.scale.setScalar(0.42);
  viewmodel.rotation.y = 0.35;
  camera.add(viewmodel);
  viewmodel.visible = false;
  scene.add(camera);
  const barsEl = document.getElementById('bars');
  const enemies = [];
  const allies = [];
  const tracers = [];
  const shells = [];
  const fires = [];
  let flash = null;
  let lastShot = 0;

  function makeBar(label, cls) {
    const el = document.createElement('div');
    el.className = 'bar-tag ' + cls;
    el.innerHTML = `<span>${label}</span><i><b></b></i>`;
    barsEl.appendChild(el);
    return el;
  }
  function spawnEnemy(name, x, z, hp = 100) {
    const g = A.makePerson(0x14161c, 0x14161c, 0xc9a06a);
    g.add(A.box(0.5, 0.18, 0.2, 0xc0392b, 0, 1.95, 0));
    g.position.set(x, 0, z); scene.add(g);
    const e = { name, g, hp, maxHp: hp, bar: makeBar(name, 'enemy'), alive: true };
    enemies.push(e); return e;
  }
  function spawnAlly(name, maker, x, z) {
    const g = maker();
    g.position.set(x, 0, z); scene.add(g);
    const a = { name, g, hp: 100, maxHp: 100, bar: makeBar(name, 'ally'), alive: true };
    allies.push(a); return a;
  }
  function spawnBurningCar(kind, x, z, heading) {
    const g = kind === 'taxi' ? A.makeTaxi() : kind === 'angkot' ? A.makeAngkot() : A.makeViperCar();
    g.position.set(x, 0, z); g.rotation.y = heading;
    g.rotation.z = 0.12; // wrecked tilt
    scene.add(g);
    const flame = A.makeFlame(); flame.position.set(x, 1.2, z); scene.add(flame);
    const smoke = A.makeSmokePuff(); smoke.position.set(x, 4.5, z); scene.add(smoke);
    fires.push({ flame, smoke, t: Math.random() * 10 });
    return g;
  }
  function muzzleWorld() {
    const v = new THREE.Vector3(0.55, -0.3, -1.6);
    return camera.localToWorld(v);
  }
  function shoot() {
    const w = WEAPONS[ctx.player.weaponIndex];
    if (w.mag === Infinity) return; // fists
    const now = ctx.time;
    if (now - lastShot < (w.auto ? 0.11 : 0.3)) return;
    lastShot = now;
    const from = muzzleWorld();
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    // Hit: nearest enemy within a cone in front of the camera.
    let best = null, bd = 1e9;
    for (const e of enemies) {
      if (!e.alive) continue;
      const to = new THREE.Vector3(e.g.position.x - from.x, 1.4 - from.y, e.g.position.z - from.z);
      const dist = to.length();
      if (dist > 90) continue;
      const ang = to.normalize().angleTo(dir);
      if (ang < 0.09 && dist < bd) { bd = dist; best = e; }
    }
    let end;
    if (best) {
      best.hp -= w.dmg;
      if (best.hp <= 0) { best.hp = 0; best.alive = false; best.g.visible = false; ctx.missions.vipersDown += 1; }
      end = new THREE.Vector3(best.g.position.x, 1.4, best.g.position.z);
    } else {
      end = from.clone().add(dir.multiplyScalar(80));
    }
    // Tracer: thin 1px line, muzzle → crosshair point → target.
    const geo = new THREE.BufferGeometry().setFromPoints([from, end]);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.9 }));
    scene.add(line); tracers.push({ line, life: 0.12 });
    // Muzzle flash star at the barrel.
    if (flash) scene.remove(flash);
    flash = A.makeFlame(); flash.scale.setScalar(0.5); flash.position.copy(from); scene.add(flash);
    // Shell casing arcs out.
    const sh = A.box(0.09, 0.09, 0.2, 0xffd700, from.x, from.y, from.z);
    scene.add(sh);
    shells.push({ m: sh, vx: (Math.random() - 0.5) * 3, vy: 2.5, vz: (Math.random() - 0.5) * 3, life: 1.6 });
    ctx.audio.shot(w.name);
    ctx.chaosAt = [ctx.player.x, ctx.player.z];
  }
  function syncViewmodel() {
    const w = WEAPONS[ctx.player.weaponIndex];
    viewmodel.visible = ctx.player.isFps();
    viewmodel.children[0].material = A.mat(w.name === 'RIFLE' ? 0xffd700 : w.name === 'BAZOOKA' ? 0xc0392b : 0x2b2f38);
  }
  // Project a world position to screen for a health bar.
  function placeBar(bar, x, y, z, hp, maxHp) {
    const v = new THREE.Vector3(x, y, z).project(camera);
    if (v.z > 1) { bar.style.display = 'none'; return; }
    const sx = (v.x * 0.5 + 0.5) * window.innerWidth;
    const sy = (-v.y * 0.5 + 0.5) * window.innerHeight;
    bar.style.display = 'block';
    bar.style.left = (sx - 26) + 'px';
    bar.style.top = (sy - 34) + 'px';
    bar.querySelector('b').style.width = Math.max(0, (hp / maxHp) * 100) + '%';
  }
  return {
    viewmodel, enemies, allies, fires,
    spawnEnemy, spawnAlly, spawnBurningCar, shoot, syncViewmodel,
    // Stage a gang-war scene (used by shots 2/3 and mission 3): 6 vipers spread
    // wide across the avenue (visible at the frame edges past the wheel),
    // 3 allies closer to the player.
    stageGangWar(cx, cz) {
      for (let i = 0; i < 6; i += 1) spawnEnemy('VIPER', cx - 30 + i * 12, cz - 25 - (i % 2) * 10, 100);
      spawnAlly('Mara', A.makeMara, cx - 24, cz - 10);
      spawnAlly('Riko', A.makeRiko, cx + 24, cz - 8);
      spawnAlly('Kiko', A.makeKiko, cx, cz - 14);
    },
    update(dt) {
      const input = ctx.input;
      if (!ctx.player.inCar && input.mouseDown) shoot();
      if (input.wasPressed('Digit1')) ctx.wheel.select(0);
      if (input.wasPressed('Digit2')) ctx.wheel.select(1);
      if (input.wasPressed('Digit3')) ctx.wheel.select(2);
      if (input.wasPressed('Digit4')) ctx.wheel.select(3);
      if (input.wasPressed('Digit5')) ctx.wheel.select(4);
      if (input.wasPressed('Digit6')) ctx.wheel.select(5);
      // Tracers fade, shells fall, flames flicker, smoke rises.
      for (let i = tracers.length - 1; i >= 0; i -= 1) {
        tracers[i].life -= dt;
        if (tracers[i].life <= 0) { scene.remove(tracers[i].line); tracers.splice(i, 1); }
      }
      for (let i = shells.length - 1; i >= 0; i -= 1) {
        const s = shells[i]; s.life -= dt; s.vy -= 9 * dt;
        s.m.position.x += s.vx * dt; s.m.position.y += s.vy * dt; s.m.position.z += s.vz * dt;
        if (s.m.position.y < 0.05) { s.m.position.y = 0.05; s.vy = 0; s.vx = 0; s.vz = 0; }
        if (s.life <= 0) { scene.remove(s.m); shells.splice(i, 1); }
      }
      if (flash) { flash.scale.multiplyScalar(0.8); if (flash.scale.x < 0.05) { scene.remove(flash); flash = null; } }
      for (const f of fires) {
        f.t += dt;
        f.flame.scale.set(1 + Math.sin(f.t * 9) * 0.25, 1 + Math.sin(f.t * 13) * 0.3, 1);
        f.smoke.position.y += dt * 1.4;
        if (f.smoke.position.y > 12) f.smoke.position.y = 4.5;
      }
      // Health bars follow their fighters.
      for (const e of enemies) placeBar(e.bar, e.g.position.x, 2.6, e.g.position.z, e.hp, e.maxHp);
      for (const a of allies) placeBar(a.bar, a.g.position.x, 2.6, a.g.position.z, a.hp, a.maxHp);
      // Boss bar (Razor) when set.
      const boss = ctx.missions.boss;
      if (boss) {
        const el = document.getElementById('boss-bar');
        el.style.display = 'block';
        el.querySelector('.boss-name').textContent = `RAZOR — BOSS | LV 20`;
        document.getElementById('boss-fill').style.width = Math.max(0, (boss.hp / boss.maxHp) * 100) + '%';
      }
    },
  };
}

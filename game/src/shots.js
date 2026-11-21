// shots.js — the four ?shot= scenes. Each one drives the REAL systems forward
// (quests complete, batik collected, cells visited, mission stages set) so the
// HUD numbers are the game's own numbers, never hardcoded labels.
import * as THREE from '../vendor/three.module.min.js';
import { DISTRICTS } from './config.js';
import { STANDINGS_FINISH as SF } from './missions.js';
import * as A from './assets3d.js';

// Shared staged progress: 2 side quests + 15 batik = Rp 900, 500 XP (LV.2,
// XP 250/500), Batik 15/50, Quest 2/4, Selesai 6%, Terjelajahi 30%, 10:30 Day 1.
function applyProgress(ctx) {
  const q = ctx.quests, p = ctx.progression;
  q.completeQuest('paket');   // +Rp 400 +150 XP
  q.completeQuest('foto');    // +Rp 500 +200 XP
  // 15 batik: Neon 3, Pasar 2, Undercity 3, Spire 0, Candi 2, Skyport 2, Taman 3.
  const want = [3, 2, 3, 0, 2, 2, 3];
  const seen = [0, 0, 0, 0, 0, 0, 0];
  for (const c of ctx.collectibles) {
    if (seen[c.district] < want[c.district]) { q.collectBatik(c); seen[c.district] += 1; }
  }
  // Visited cells per district (40-unit grid) → seen % 43/30/43/0/29/25/40.
  const cells = [13, 9, 13, 0, 9, 4, 8];
  DISTRICTS.forEach((d, di) => {
    let n = 0;
    for (const dx of [-80, -40, 0, 40, 80]) {
      for (const dz of [-80, -40, 0, 40, 80]) {
        if (n >= cells[di]) break;
        if (Math.hypot(dx, dz) < d.r - 8) { p.markVisited(d.cx + dx, d.cz + dz); n += 1; }
      }
      if (n >= cells[di]) break;
    }
  });
  p.hour = 10.5; p.day = 1;
  p.health = 100; p.armor = 50;
}
function confetti(ctx, x, z, n = 120) {
  const cols = [0xff4fa3, 0xffd700, 0x1abc9c, 0xffb300, 0xffffff, 0xc0392b];
  const pieces = [];
  for (let i = 0; i < n; i += 1) {
    const m = A.makeConfettiPiece(cols[i % cols.length]);
    m.scale.setScalar(1.6);
    m.position.set(x + (ctx.rng() - 0.5) * 80, 8 + ctx.rng() * 22, z + (ctx.rng() - 0.5) * 60);
    m.rotation.set(ctx.rng() * 3, ctx.rng() * 3, 0);
    ctx.scene.add(m);
    pieces.push({ m, vy: 1.0 + ctx.rng() * 1.5, rs: (ctx.rng() - 0.5) * 4 });
  }
  ctx.confetti = pieces;
}
function finishLine(ctx, x, z) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 32;
  const g = c.getContext('2d');
  for (let i = 0; i < 8; i += 1) for (let j = 0; j < 2; j += 1) {
    g.fillStyle = (i + j) % 2 ? '#111111' : '#ffffff';
    g.fillRect(i * 16, j * 16, 16, 16);
  }
  const tex = new THREE.CanvasTexture(c);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(22, 5.5), new THREE.MeshBasicMaterial({ map: tex }));
  m.rotation.x = -Math.PI / 2; m.rotation.z = Math.PI / 2;
  m.position.set(x, 0.1, z);
  ctx.scene.add(m);
}
function shellsOnGround(ctx, x, z, n = 22) {
  for (let i = 0; i < n; i += 1) {
    const s = A.box(0.09, 0.09, 0.2, 0xffd700, x + (ctx.rng() - 0.5) * 14, 0.06, z + (ctx.rng() - 0.5) * 10);
    ctx.scene.add(s);
  }
  for (let i = 0; i < 18; i += 1) {
    const s = A.box(0.09, 0.09, 0.2, 0xffd700, x + (ctx.rng() - 0.5) * 10, 1 + ctx.rng() * 2.5, z + (ctx.rng() - 0.5) * 8);
    ctx.scene.add(s);
  }
}
function setPlayerFoot(ctx, x, z, yaw) {
  ctx.player.exitCar();
  ctx.player.x = x; ctx.player.z = z; ctx.player.yaw = yaw; ctx.player.pitch = 0;
  ctx.player.mesh.position.set(x, 0, z);
  ctx.player.weaponIndex = 4; // Rifle
  ctx.combat.syncViewmodel();
}

export function stageShot(name, ctx) {
  applyProgress(ctx);
  ctx.shotMode = name;
  if (name === 'cover') {
    ctx.missions.setMission(0, 4);
    ctx.missions.lap = 3;
    ctx.missions.standings = SF;
    ctx.player.inCar = true;
    ctx.player.mesh.visible = false;
    // Face the hero WEST toward the camera (front 3/4, like the sealed shot):
    // the car has just crossed the finish line and the Spire skyline sits
    // behind it to the east. Heading follows the facing so the speedo stays 79.
    const car = ctx.vehicles.hero;
    car.position.set(-222, 0, -200); car.rotation.y = Math.PI;
    ctx.driving.heading = Math.PI; ctx.driving.speed = 79 / 3.2;
    const komodo = ctx.vehicles.komodo;
    komodo.position.set(-204, 0, -208); komodo.rotation.y = Math.PI;
    finishLine(ctx, -228, -200);
    confetti(ctx, -224, -200, 200);
    confetti(ctx, -232, -198, 80);
    // Crowd: dense on the sidewalks flanking the road (NOT on the road centre,
    // so the hero stays visible) + along both road sides near the car.
    ctx.traffic.addCrowd(-222, -190, 8, 4);
    ctx.traffic.addCrowd(-222, -210, 8, 4);
    ctx.traffic.addCrowd(-218, -192, 8, 6);
    ctx.traffic.addCrowd(-218, -208, 8, 6);
    ctx.traffic.addCrowd(-206, -214, 8, 12);
    const flagman = A.makePerson(0xf5f5f5, 0x222831);
    flagman.position.set(-226, 0, -212); ctx.scene.add(flagman);
    const flag = A.box(1.4, 0.9, 0.05, 0xffd700, -225.2, 2.6, -212);
    ctx.scene.add(flag);
    ctx.traffic.addCar('taxi', -200, -192, 0);
    ctx.traffic.addCar('angkot', -196, -208, 0);
    // Low, close front 3/4 from the south-west (~10 units out): finish line
    // in the foreground, hero big near centre, eastern skyline behind.
    ctx.shotCam = { pos: [-232, 2.0, -196], look: [-216, 1.5, -198] };
    // Sealed shot has no weapon strip while driving; FISTS in the mini wheel.
    ctx.wheel.select(0);
    document.getElementById('weapon-strip').style.display = 'none';
  } else if (name === 'driveby') {
    ctx.missions.setMission(2, 1);
    // On foot ON the avenue (x=-230), facing north up Jl. Raya Barat toward
    // the Gapura Neon — close-quarters gang war (like the sealed shot): the
    // Vipers, allies and burning cars are 8-22 m ahead so the fight reads in
    // the first 2 seconds. Player stays at -160 so TARGET reads 13 m to the
    // stage-1 checkpoint (-230,-173), as in the sealed shot. Slight upward
    // pitch so the avenue's tall rows sit below a strip of sky.
    setPlayerFoot(ctx, -230, -160, Math.PI / 2);
    ctx.player.pitch = 0.07;
    // 6 Vipers, close and spread across the avenue (manual spawn: stageGangWar
    // stages them 25-35 m out, too far for this shot).
    const vipers = [[-246, -174], [-238, -177], [-230, -172], [-222, -177], [-214, -174], [-206, -179]];
    for (const [x, z] of vipers) ctx.combat.spawnEnemy('VIPER', x, z, 100);
    ctx.combat.spawnAlly('Mara', A.makeMara, -244, -168);
    ctx.combat.spawnAlly('Riko', A.makeRiko, -216, -168);
    ctx.combat.spawnAlly('Kiko', A.makeKiko, -230, -170);
    ctx.combat.spawnBurningCar('viper', -240, -178, 0.4);
    ctx.combat.spawnBurningCar('taxi', -220, -180, -0.3);
    ctx.combat.spawnBurningCar('angkot', -238, -190, 0.9);
    ctx.combat.spawnBurningCar('viper', -224, -194, 1.2);
    ctx.combat.spawnBurningCar('taxi', -236, -204, -0.8);
    shellsOnGround(ctx, -230, -166);
    ctx.traffic.addCrowd(-236, -166, 8, 10);
    ctx.traffic.addCrowd(-224, -168, 8, 10);
    ctx.chaosAt = [-230, -168];
    // Big, bright gold rifle viewmodel (like the sealed shot): scale the
    // viewmodel up, light it emissive, and angle the barrel up-left toward
    // the crosshair (diagonal, butt at the bottom-right corner).
    const vm = ctx.combat.viewmodel;
    vm.scale.setScalar(0.75);
    vm.position.set(0.58, -0.52, -1.1);
    vm.rotation.set(0.51, 2.30, 0);
    vm.children[0].material = A.mat(0xffd700, 0xffd700, 0.7);
    ctx.shotCam = null; // FPS camera from the player
  } else if (name === 'fps') {
    ctx.missions.setMission(2, 4);
    ctx.missions.vipersDown = 0;
    // On foot on the Skyport avenue (x=-230), facing north; Menara Kontrol
    // to the east, gang war ahead, wheel open on RIFLE.
    setPlayerFoot(ctx, -230, -26, Math.PI / 2);
    ctx.player.pitch = 0.07;
    ctx.combat.stageGangWar(-230, -40);
    ctx.combat.spawnBurningCar('viper', -242, -42, 0.5);
    ctx.combat.spawnBurningCar('taxi', -218, -46, -0.4);
    ctx.combat.spawnBurningCar('angkot', -238, -70, 1.1);
    shellsOnGround(ctx, -230, -40);
    ctx.traffic.addCrowd(-236, -36, 6, 14);
    ctx.chaosAt = [-230, -40];
    ctx.wheel.open = true;
    ctx.wheel.selected = 4;
    ctx.wheel.select(4);
    ctx.shotWheel = true;
    ctx.shotCam = null;
  } else if (name === 'map') {
    ctx.mapOpen = true;
    ctx.fillMapScreen();
    document.getElementById('map-screen').style.display = 'block';
    document.getElementById('hud').style.display = 'none';
    ctx.shotCam = { pos: [0, 60, 120], look: [0, 0, 0] };
  }
  ctx.hud.update();
  ctx.wheel.render();
  // Staging toasts (quest rewards) must not cover the WINNER banner in shot 1.
  document.getElementById('toast').style.display = 'none';
}

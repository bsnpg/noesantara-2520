// main.js — boot + main loop: title → play → map/pause. ?shot=cover|driveby|fps|map
// stages that scene instead and sets window.__shotReady for the harness.
import * as THREE from '../vendor/three.module.min.js';
import { makeRng } from './random.js';
import { createInput } from './input.js';
import { createRenderer } from './render.js';
import { districtAt, DISTRICTS, periodFor } from './config.js';
import { buildCity } from './city.js';
import { createProgression } from './progression.js';
import { createQuests } from './quests.js';
import { createMissions } from './missions.js';
import { createHud } from './hud.js';
import { createWheel } from './wheel.js';
import { createCombat } from './combat.js';
import { createPlayer } from './player.js';
import { createDriving } from './driving.js';
import { createVehicles } from './vehicles.js';
import { createTraffic } from './traffic.js';
import { createPolice } from './police.js';
import { createAudio } from './audio.js';
import { createReplay } from './replay.js';
import { drawBigMap } from './map.js';
import { makeWowo } from './assets3d.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : 1;
const $ = (id) => document.getElementById(id);

// ---- context: every system shares this object ----
const ctx = {
  THREE, rng: makeRng(seed), time: 0, timeScale: 1,
  mapOpen: false, shotMode: null, shotCam: null, shotWheel: false,
  confetti: null, chaosAt: null, districtAt,
};
ctx.render = createRenderer($('game'));
ctx.scene = ctx.render.scene;
ctx.input = createInput();
ctx.audio = createAudio();
ctx.progression = createProgression(ctx);
ctx.quests = createQuests(ctx);
ctx.missions = createMissions(ctx);
ctx.hud = createHud(ctx);
ctx.wheel = createWheel(ctx);
ctx.combat = createCombat(ctx);
ctx.player = createPlayer(ctx);
ctx.driving = createDriving(ctx);
ctx.vehicles = createVehicles(ctx);
ctx.traffic = createTraffic(ctx);
ctx.police = createPolice(ctx);
ctx.replay = createReplay(ctx);
buildCity(ctx);
// Title Wowo: a big Wowo on the right of the title screen, attached to the
// camera so he stays put while the title camera orbits the city.
const titleWowo = makeWowo();
titleWowo.scale.setScalar(2.5);
titleWowo.position.set(5, -2, -10);
titleWowo.visible = false;
ctx.render.camera.add(titleWowo);
ctx.progression.load();
window.__ctx = ctx; // diagnostics hook (scene inspection from the console)

// ---- pause / map screen (3 columns, real numbers) ----
ctx.fillMapScreen = function () {
  const p = ctx.progression, m = ctx.missions;
  const hh = Math.floor(p.hour), mm = Math.floor((p.hour - hh) * 60);
  $('map-stats').textContent = `💰 Rp ${p.money.toLocaleString('id-ID')} · SELESAI: ${p.completion()}% · TERJELAJAHI: ${p.exploredPct()}% · ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} · DAY ${p.day}`;
  $('map-lv').textContent = 'LV.' + p.level();
  $('mission-list').innerHTML = m.list.map((x, i) => {
    const st = x.status === 'active' ? 'AKTIF' : x.status === 'next' ? 'BERIKUTNYA' : x.status === 'done' ? 'SELESAI' : 'TERKUNCI';
    return `<div class="mission-row"><b>${i + 1}. ${x.name}</b><br><span class="st">${DISTRICTS[x.district].name} • ${st} Rp ${x.reward.toLocaleString('id-ID')} + ${x.xp} XP</span></div>`;
  }).join('');
  $('map-completion').textContent = p.completion() + '%';
  $('completion-list').innerHTML = [
    ['Misi', `${p.missionsDone}/8`], ['Balapan', `${p.racesWon}/3`],
    ['Koleksi Batik', `${p.batik}/50`], ['Distrik dikuasai', `${p.districtsOwned}/7`],
    ['Quest sampingan', `${ctx.quests.doneCount()}/4`],
  ].map(([k, v]) => `<div class="prog-row">${k} ${v}</div>`).join('');
  $('standing-list').innerHTML = DISTRICTS.map((d) =>
    `<div class="prog-row"><b style="color:${d.color}">● ${d.name}</b> — ASING<br><span style="color:#9fd8c8">${d.faction} • ${d.perk}</span></div>`).join('');
  $('district-progress').innerHTML = DISTRICTS.map((d) =>
    `<div class="prog-row"><span style="color:${d.color}">●</span> ${d.name} — ${p.districtProgress(d)}%</div>`).join('') +
    `<div class="prog-row"><b>TOTAL: ${p.completion()}%</b></div>`;
  drawBigMap($('bigmap'), ctx);
};
function openMap() {
  ctx.mapOpen = true;
  ctx.fillMapScreen();
  $('map-screen').style.display = 'block';
  $('hud').style.display = 'none';
}
function closeMap() {
  ctx.mapOpen = false;
  $('map-screen').style.display = 'none';
  $('hud').style.display = 'block';
  drawBigMap($('bigmap'), ctx);
}

// ---- title / start ----
let started = false;
function startGame() {
  if (started) return;
  started = true;
  ctx.audio.unlock();
  titleWowo.visible = false;
  $('title-screen').style.display = 'none';
  $('hud').style.display = 'block';
  ctx.player.inCar = true;
  ctx.player.mesh.visible = false;
  ctx.combat.syncViewmodel();
  ctx.hud.toast('MISI 1 — Balapan Pertama · Menang di sirkuit Neon!');
}
$('btn-start').addEventListener('click', startGame);
$('btn-resume').addEventListener('click', closeMap);
$('btn-settings').addEventListener('click', () => { ctx.hud.toast('SETTINGS — volume & kualitas menyusul di ronde berikut'); });
$('btn-exit').addEventListener('click', () => {
  closeMap();
  started = false;
  $('hud').style.display = 'none';
  $('title-screen').style.display = 'flex';
});

// ---- main loop ----
let last = performance.now();
let frames = 0;
let fireTimer = 0;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  ctx.time += dt;
  const input = ctx.input;
  // Title orbit camera (city showcase behind the title card): wide, high
  // orbit around the Spire so the skyline reads, not a single facade.
  if (!started && !shot) {
    const a = ctx.time * 0.04;
    ctx.render.place(-20 + Math.cos(a) * 175, 48, -20 + Math.sin(a) * 175, 35, 16, 35);
    titleWowo.visible = true;
    ctx.traffic.update(dt, null);
    ctx.render.render();
    return;
  }
  // Map / pause: freeze the world, keep rendering.
  if (ctx.mapOpen && !shot) {
    ctx.render.render();
    if (input.wasPressed('KeyM') || input.wasPressed('Escape')) closeMap();
    input.clearPressed();
    return;
  }
  if (!shot) {
    if (input.wasPressed('KeyM')) openMap();
    if (input.wasPressed('Escape') && !ctx.mapOpen) openMap();
  }
  const ts = ctx.wheel.timeScale();
  const wdt = dt * ts;
  // World updates (slowed while the wheel is open). In ?shot= mode the hero
  // car and player are frozen at their staged poses; traffic/combat stay live.
  if (!ctx.replay.active) {
    if (!shot) {
      if (ctx.player.inCar) ctx.driving.update(wdt);
      else ctx.player.update(wdt);
    }
    ctx.traffic.update(wdt, ctx.chaosAt);
    ctx.combat.update(wdt);
    ctx.police.update(wdt);
    ctx.progression.hour += wdt / 240; // a game hour every 4 real minutes
    if (ctx.progression.hour >= 24) { ctx.progression.hour -= 24; ctx.progression.day += 1; }
  }
  ctx.replay.update(wdt);
  // Camera.
  if (ctx.shotCam) ctx.render.place(...ctx.shotCam.pos, ...ctx.shotCam.look);
  else if (ctx.replay.active) { /* replay sets the camera */ }
  else if (ctx.player.inCar) ctx.driving.camera(dt);
  else ctx.player.camera(dt);
  // Confetti falls.
  if (ctx.confetti) {
    for (const c of ctx.confetti) {
      c.m.position.y -= c.vy * dt;
      c.m.rotation.x += c.rs * dt; c.m.rotation.y += c.rs * dt;
      if (c.m.position.y < 0.2) c.m.position.y = 24 + Math.random() * 6;
    }
  }
  // Batik holograms bob + spin.
  for (const c of ctx.collectibles) {
    if (c.taken) continue;
    c.mesh.rotation.y += dt * 1.5;
    c.mesh.position.y = 2.2 + Math.sin(ctx.time * 2 + c.x) * 0.3;
  }
  // Shot scenes keep firing so tracers / muzzle flash / shells stay live.
  if ((ctx.shotMode === 'driveby' || ctx.shotMode === 'fps') && !ctx.wheel.open) {
    fireTimer += dt;
    if (fireTimer > 0.45) { fireTimer = 0; ctx.combat.shoot(); }
  }
  if (!ctx.shotWheel) ctx.wheel.update();
  ctx.wheel.render();
  ctx.hud.update();
  ctx.render.render();
  input.clearPressed();
  frames += 1;
  if (shot && frames === 3) window.__shotReady = true;
}

// ---- boot ----
if (shot) {
  $('title-screen').style.display = 'none';
  $('hud').style.display = 'block';
  started = true;
  stageShot(shot, ctx);
  // Shot 4's map screen is staged by stageShot; keep HUD hidden there.
  if (shot === 'map') $('hud').style.display = 'none';
  requestAnimationFrame(frame);
} else {
  requestAnimationFrame(frame);
}

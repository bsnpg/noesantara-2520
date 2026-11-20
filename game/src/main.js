// Noesantara 2520 — main loop + integration. Static imports in dependency order;
// every module's per-frame update is called here each fixed step, with the
// wheel's timeScale applied. State (player/car/weapon/wanted) is merged, never
// replaced: aliases are synced every step (see syncAliases).
import * as THREE from '../vendor/three.module.min.js';
import { CONFIG } from './config.js';
import { makeRng } from './random.js';
import { initInput } from './input.js';
import { initRender } from './render.js';
import { initShots } from './shots.js';
import { initCity } from './city.js';
import { initTraffic } from './traffic.js';
import { initVehicles } from './vehicles.js';
import { initDriving } from './driving.js';
import { initPlayer } from './player.js';
import { initCombat } from './combat.js';
import { initWheel } from './wheel.js';
import { initPolice } from './police.js';
import { initMissions } from './missions.js';
import { initQuests } from './quests.js';
import { initMap } from './map.js';
import { initHud } from './hud.js';
import { initProgression } from './progression.js';
import { initAudio } from './audio.js';
import { initReplay } from './replay.js';

const MAX_FRAME = 0.25;
const START = { x: -190, z: -120 }; // Distrik Neon start, Garuda GT + Wowo

const G = {
  THREE, scene: null, camera: null, renderer: null, clock: 0, dt: 0, time: 0,
  keys: {}, mouse: { x: 0, y: 0, dx: 0, dy: 0, down: false, button: -1, locked: false },
  player: {
    pos: new THREE.Vector3(START.x, 0, START.z), yaw: 0, hp: 100, health: 100, armor: 50,
    wanted: 0, weapon: 5, onFoot: false, credits: 0, xp: 0, level: 1,
    speed: 0, boost: 100, inCar: true,
  },
  car: null, districts: CONFIG.districts, traffic: [], peds: [], enemies: [],
  allies: [], missions: { active: null, list: [], done: [] }, hud: {},
  state: 'title', seed: CONFIG.seedDefault, rng: null, stageShot: null,
  timeOfDay: CONFIG.startHour, day: 1, timeScale: 1, onTick: [], shotCam: null,
  fpsCam: null, keyPressed: null, photoMode: false, weaponIndex: 5,
  safehousePos: new THREE.Vector3(-260, 0, 30), _day0: 1, _eToggleT: -9,
};
G.rng = makeRng(G.seed);
window.__G = G; // diagnostics: playtest harness reads live state (car, player, wanted)

const titleEl = document.getElementById('title');
const hudEl = document.getElementById('hud');
const mapEl = document.getElementById('map');
const wheelEl = document.getElementById('wheel');
const statusEl = document.getElementById('status');
const announce = (m) => { if (statusEl) statusEl.textContent = m; };

function setState(s) {
  G.state = s;
  titleEl.classList.toggle('hidden', s !== 'title');
  hudEl.classList.toggle('hidden', s === 'title' || G.photoMode);
  mapEl.classList.toggle('hidden', s !== 'map');
  wheelEl.classList.toggle('hidden', !G.wheelOpen);
}
G.setState = setState;

function startGame() {
  setState('play');
  if (G.missions && !G.missions.active && G.missions.list[0] && !G.missions.list[0].done)
    G.missions.start(0); // Mission 1 starts with the game (no picker UI yet)
  announce('Playing. Noesantara 2520.');
}

function handleKeys() {
  const k = G.keyPressed;
  if (!k) return;
  G.keyPressed = null;
  if (k === CONFIG.keys.map) {
    if (G.state === 'play') { G.map?.openMap(); setState('map'); }
    else if (G.state === 'map') { G.map?.close(); setState('play'); }
  } else if (k === CONFIG.keys.pause) {
    if (G.state === 'map') { G.map?.close(); setState('play'); }
    else if (G.state === 'play') setState('paused');
    else if (G.state === 'paused') setState('play');
  } else if (k === CONFIG.keys.photo && G.state === 'play') {
    G.photoMode = !G.photoMode;
    hudEl.classList.toggle('hidden', G.photoMode);
  } else if ((k === 'Enter' || k === 'Space') && G.state === 'title') startGame();
  else if (k >= 'Digit1' && k <= 'Digit6' && G.state === 'play')
    G.selectWeapon?.(Number(k.slice(5)) - 1); // 1-6 -> weapon index 0-5
}
document.getElementById('startBtn')?.addEventListener('click', startGame);

// Merge, don't replace: one player, one car, one weapon, one Wanted.
function syncAliases() {
  const P = G.player, C = G.car;
  if (P) {
    P.health = P.hp;
    P.inCar = !P.onFoot;
    if (G.weapon) { P.weapon = G.weapon.index; G.weaponIndex = G.weapon.index; }
  }
  if (C) {
    C.pos = C.group.position; // live alias
    C.yaw = C.heading;
    C.speedKmh = Math.abs(C.speed || 0) * 3.6;
  }
}

async function boot() {
  initRender(G);
  initInput(G);
  initShots(G);
  initCity(G);
  initTraffic(G);
  initVehicles(G);
  initDriving(G);
  initPlayer(G);
  initCombat(G);
  initWheel(G);
  initPolice(G);
  initMissions(G);
  initQuests(G);
  initMap(G);
  initHud(G);
  initProgression(G);
  initAudio(G);
  initReplay(G);

  // ---- reconcile: Wowo starts IN the Garuda GT in Distrik Neon ----
  G.onPlayerDown = () => G.progression?.onDeath?.();
  G.showMap = () => G.map?.openMap();
  if (!G.selectWeapon) G.selectWeapon = (i) => G.wheel?.select(i, true);
  if (!G.openWheel) G.openWheel = (i) => G.wheel?.open(i);
  G._day0 = G.day || 1;
  const P = G.player, C = G.car;
  if (C && C.group) {
    C.group.position.set(START.x, 0.55, START.z);
    C.heading = 0; C.yaw = 0; C.speed = 0; C.active = true;
  }
  if (P && P.group) {
    P.group.position.set(START.x, 0, START.z);
    P.group.visible = false; // inside the car
    P.onFoot = false; P.inCar = true; P.yaw = 0;
  }
  syncAliases();
  setState('title'); // hide the HUD layer until Start (index.html leaves it visible)

  if (G.shot) {
    G.stageShot?.(G.shot);
    let painted = 0;
    const paint = () => {
      G.updateCamera?.(1 / 60);
      G.renderer.render(G.scene, G.camera);
      if (++painted < 2) requestAnimationFrame(paint);
      else window.__shotReady = true;
    };
    requestAnimationFrame(paint);
    return;
  }
  let last = performance.now(), acc = 0, prev = last;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && G.state === 'play') setState('paused');
  });
  const frame = (now) => {
    requestAnimationFrame(frame);
    acc += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleKeys();
    if (G.state === 'play' || G.state === 'replay') {
      while (acc >= CONFIG.step) {
        const sdt = CONFIG.step * (G.timeScale ?? 1);
        G.dt = sdt; G.clock += sdt; G.time = G.clock;
        syncAliases();
        G.updateTraffic?.(sdt);
        G.updateVehicles?.(sdt);
        G.updateDriving?.(sdt);
        G.updatePlayer?.(sdt);
        for (const fn of G.updates || []) fn(sdt);
        for (const fn of G.onTick) fn(sdt);
        G.missions?.update?.(sdt);
        G.quests?.update?.(sdt);
        G.map?.update?.(sdt);
        G.hud?.update?.(sdt);
        G.progression?.update?.(sdt);
        G.replay?.update?.(sdt);
        if (G.audio?.engine) {
          const sp = G.car && !G.player.onFoot ? Math.min(1, Math.abs(G.car.speed) / 55) : (G.player.speed || 0) / 11;
          G.audio.engine(sp, G.car && G.car.boost < 100);
        }
        G.timeOfDay = (G.timeOfDay + sdt / CONFIG.dayLength * 24) % 24;
        G.day = G._day0 + Math.floor(G.clock / CONFIG.dayLength);
        G.setTimeOfDay?.(G.timeOfDay);
        G._prevKeys = { ...G.keys }; // edge-triggered pressed() for E/C/Space
        acc -= CONFIG.step;
      }
    } else acc = 0;
    G.updateCamera?.(Math.min(0.05, (now - prev) / 1000 || 0.016));
    prev = now;
    G.renderer.render(G.scene, G.camera);
  };
  announce('Noesantara 2520. Press Enter or click Start Engine.');
  requestAnimationFrame(frame);
}
boot();

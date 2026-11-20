import * as THREE from '../vendor/three.module.min.js';
import { CONFIG } from './config.js';

export function initRender(G) {
  const canvas = document.getElementById('game');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = false; // perf: dossier cap, no shadow pass
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xffd9a0, 180, 620);
  const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 1200);
  camera.position.set(0, 30, 60);
  scene.add(camera); // required: the FPS viewmodel is a child of the camera
  // and only renders when the camera is in the scene graph.

  // The ONE sun + hemisphere set (city.js must not add its own).
  const sunLight = new THREE.DirectionalLight(0xffd9a0, 2.6);
  sunLight.position.set(120, 180, 60);
  scene.add(sunLight);
  const hemi = new THREE.HemisphereLight(0x9fd8e8, 0x8a5a3b, 1.2);
  scene.add(hemi);
  // Procedural environment: without an env map, high-metalness paint/chrome
  // reflects nothing and reads as black. Warm sky gradient + a sun glint.
  const envCv = document.createElement('canvas'); envCv.width = 64; envCv.height = 32;
  const ex = envCv.getContext('2d');
  const eg = ex.createLinearGradient(0, 0, 0, 32);
  eg.addColorStop(0, '#2e6fb0'); eg.addColorStop(0.5, '#f7b267'); eg.addColorStop(1, '#8a5a3b');
  ex.fillStyle = eg; ex.fillRect(0, 0, 64, 32);
  ex.fillStyle = '#ffd700'; ex.fillRect(8, 10, 10, 6);
  const envTex = new THREE.CanvasTexture(envCv);
  envTex.mapping = THREE.EquirectangularReflectionMapping;
  envTex.colorSpace = THREE.SRGBColorSpace;
  scene.environment = envTex;
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(9, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xffdf6b, fog: false }));
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(6, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xe8eef7, fog: false }));
  scene.add(sun, moon);

  const cv = document.createElement('canvas'); cv.width = 4; cv.height = 256;
  const cx = cv.getContext('2d');
  const grad = cx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#2e6fb0'); grad.addColorStop(0.55, '#f7b267');
  grad.addColorStop(0.8, '#ffd9a0'); grad.addColorStop(1, '#ff9e5e');
  cx.fillStyle = grad; cx.fillRect(0, 0, 4, 256);
  const skyTex = new THREE.CanvasTexture(cv);
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(900, 24, 16),
    new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false }));
  scene.add(sky);

  function setTimeOfDay(h) {
    G.timeOfDay = ((h % 24) + 24) % 24;
    const a = (G.timeOfDay / 24) * Math.PI * 2 - Math.PI / 2; // 0h = midnight
    const sx = Math.cos(a) * 700, sy = Math.sin(a) * 500 + 40;
    sun.position.set(sx, sy, -220);
    moon.position.set(-sx, -sy + 80, 220);
    const day = Math.max(0, Math.sin(a));           // 1 at noon, 0 at night
    const warm = 1 - Math.abs(G.timeOfDay - 17) / 6; // golden near 17:00
    sunLight.intensity = 0.25 + day * 2.2;
    sunLight.color.setHSL(0.09 + warm * 0.02, 0.75, 0.55 + day * 0.12);
    hemi.intensity = 0.35 + day * 0.85;
    scene.fog.color.setHSL(0.08, 0.55, 0.45 + day * 0.35);
    sky.material.color.setScalar(0.35 + day * 0.65);
    sun.visible = sy > -20; moon.visible = !sun.visible;
  }

  function updateCamera(dt) {
    if (G.shotCam) { // shots.js owns the camera while staging
      camera.position.copy(G.shotCam.pos);
      camera.lookAt(G.shotCam.look);
      return;
    }
    if (G.fpsCam) {
      camera.position.copy(G.fpsCam.pos);
      camera.rotation.set(G.fpsCam.pitch, G.fpsCam.yaw, 0, 'YXZ');
      return;
    }
    // In play the driving / player / wheel modules own the camera; render only
    // frames the title backdrop (slow orbit around the Spire).
    if (G.state !== 'title') return;
    const a = (G.clock || 0) * 0.05;
    camera.position.set(Math.sin(a) * 170, 48, Math.cos(a) * 170);
    camera.lookAt(0, 14, 0);
  }

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  G.THREE = THREE; G.scene = scene; G.camera = camera; G.renderer = renderer;
  G.sun = sun; G.moon = moon; G.sunLight = sunLight; G.hemi = hemi;
  G.setTimeOfDay = setTimeOfDay; G.updateCamera = updateCamera;
  setTimeOfDay(CONFIG.startHour);
}

// Renderer: three.js setup, blue daytime sky, sun, fog, camera helpers.
import * as THREE from '../vendor/three.module.min.js';
import { COLORS } from './config.js';

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = false;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(COLORS.fog, 260, 620);
  // Sky dome: vertical blue gradient (bright day, warm sun — never beige dusk).
  const skyGeo = new THREE.SphereGeometry(900, 24, 12);
  const top = new THREE.Color(COLORS.skyTop), bot = new THREE.Color(COLORS.skyBot);
  const pos = skyGeo.attributes.position, cols = [];
  for (let i = 0; i < pos.count; i += 1) {
    const t = Math.max(0, Math.min(1, pos.getY(i) / 900 * 1.6 + 0.25));
    const c = bot.clone().lerp(top, t);
    cols.push(c.r, c.g, c.b);
  }
  skyGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  const sky = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false }));
  scene.add(sky);
  // Warm sun disc + glow sprite.
  const sun = new THREE.Mesh(new THREE.CircleGeometry(26, 24), new THREE.MeshBasicMaterial({ color: 0xfff3b0, fog: false }));
  sun.position.set(320, 380, -420); sun.lookAt(0, 0, 0); scene.add(sun);
  const hemi = new THREE.HemisphereLight(0xcfe8ff, 0x8a7a5a, 1.25);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xfff2cc, 1.3);
  dir.position.set(180, 260, -140); scene.add(dir);
  // Fill light from the south-west so south-facing facades (the ones the
  // north-looking FPS shots see) are not left in deep shadow.
  const fill = new THREE.DirectionalLight(0xdceeff, 0.75);
  fill.position.set(-160, 140, 220); scene.add(fill);
  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 40, 120);
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  return {
    renderer, scene, camera,
    render() { renderer.render(scene, camera); },
    // Point the camera at a target from a position (used by shots + replay).
    place(px, py, pz, lx, ly, lz) {
      camera.position.set(px, py, pz);
      camera.lookAt(lx, ly, lz);
    },
  };
}

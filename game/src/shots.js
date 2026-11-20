import { CONFIG } from './config.js';

export function initShots(G) {
  const q = new URLSearchParams(location.search);
  G.shot = q.get('shot');
  const s = parseInt(q.get('seed') || '', 10);
  if (Number.isInteger(s)) G.seed = s;

  function carPos() {
    const c = G.car;
    if (c && c.pos) return c.pos;
    if (c && c.position) return c.position;
    return { x: 0, y: 1, z: 0 };
  }
  function carYaw() { return (G.car && G.car.yaw) || 0; }

  // Pull a few traffic cars + peds into frame around the hero car so no shot
  // ever shows an empty street (shot mode runs no per-frame updates, so the
  // staging places them by hand).
  function crowdScene(px, pz, nCars, nPeds, avoidA, road) {
    const cars = (G.traffic || []).filter((c) => c.loop); // loop cars only
    for (let i = 0; i < Math.min(nCars, cars.length); i++) {
      const c = cars[i];
      if (road) { // avenue chase: cars on the road through (px,pz), NS lane
        c.mesh.position.set(px + (i % 2 ? 4 : -4), 0.4, pz - 18 - i * 13);
        c.mesh.rotation.y = 0;
      } else { // background traffic north of the car (never in the foreground
        // between camera and hero car)
        c.mesh.position.set(px - 20 + i * 11, 0.4, pz - 14 - (i % 2) * 26);
        c.mesh.rotation.y = i % 2 ? Math.PI / 2 : -Math.PI / 2;
      }
    }
    const peds = G.peds || [];
    let placed = 0;
    for (let i = 0; i < peds.length && placed < nPeds; i++) {
      const p = peds[i];
      let a = (placed / Math.max(1, nPeds)) * Math.PI * 2;
      const r = 9 + (placed % 3) * 2.5;
      if (road) { // avenue edges, fleeing down the street
        p.mesh.position.set(px + (placed % 2 ? 12 : -12), 0, pz - 8 - placed * 8);
      } else {
        if (avoidA != null) { // keep the camera-to-car sight line clear
          const d = Math.abs(((a - avoidA + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
          if (d < 0.7) a = avoidA + 0.9;
        }
        p.mesh.position.set(px + Math.cos(a) * r, 0, pz + Math.sin(a) * r);
      }
      p.mesh.rotation.y = Math.atan2(px - p.mesh.position.x, pz - p.mesh.position.z);
      p.state = 'walk';
      placed++;
    }
  }
  function confetti(px, pz, avoid) {
    if (G._confetti || !G.scene || !G.THREE) return;
    const T = G.THREE, cols = [0xf2c94c, 0x2de1c2, 0xff4fa3, 0xffffff, 0xff7a1a];
    const grp = new T.Group();
    const geo = new T.PlaneGeometry(0.22, 0.14);
    for (let i = 0; i < 90; i++) {
      const mx = px + (Math.random() - 0.5) * 26, my = 3 + Math.random() * 8, mz = pz + (Math.random() - 0.5) * 26;
      if (avoid && Math.hypot(mx - avoid.x, my - avoid.y, mz - avoid.z) < 6) continue; // never right in front of the lens
      const m = new T.Mesh(geo, new T.MeshBasicMaterial({ color: cols[i % cols.length], side: T.DoubleSide }));
      m.position.set(mx, my, mz);
      m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      grp.add(m);
    }
    G.scene.add(grp);
    G._confetti = grp;
  }

  G.stageShot = function (name) {
    const T = G.THREE;
    const V = (x, y, z) => new T.Vector3(x, y, z);
    G.state = 'play';
    document.getElementById('title')?.classList.add('hidden');
    const p = carPos(), yaw = carYaw();
    const fwd = { x: -Math.sin(yaw), z: -Math.cos(yaw) }; // car forward
    const side = { x: Math.cos(yaw), z: -Math.sin(yaw) }; // car right side
    if (name === 'cover') {
      // USER ORDER: all 4 shots in DAYTIME (bright warm afternoon sun).
      G.setTimeOfDay?.(15.0);
      // Camera on the far side of the car from the Spire, so the Spire, the
      // Neon gapura and the temple towers stand behind the Garuda GT. The
      // car sits WSW of the Spire, so the camera sits further WSW:
      // (sx,sz) = car position normalised = direction Spire -> car.
      const dl = Math.hypot(p.x, p.z) || 1;
      const sx = p.x / dl, sz = p.z / dl;
      G.shotCam = {
        pos: V(p.x + sx * 7.5 + sz * 3, p.y + 2.2, p.z + sz * 7.5 - sx * 3),
        look: V(p.x, p.y + 1.6, p.z),
      };
      document.getElementById('hud')?.classList.add('hidden'); // photo mode
      if (G.car) { G.car.speed = 0; }
      G.replayCam = 'side'; // replay.js: finish-cam side view if present
      const aCam = Math.atan2(G.shotCam.pos.z - p.z, G.shotCam.pos.x - p.x);
      crowdScene(p.x, p.z, 6, 14, aCam); // cheering crowd + traffic in frame
      confetti(p.x, p.z, G.shotCam.pos);
    } else if (name === 'driveby') {
      G.setTimeOfDay?.(15.5); // daytime: bright afternoon
      // Stage the chase ON the Neon avenue (x=-230) so the road, traffic
      // and fleeing peds read as a street chase, not bare dirt.
      p.x = -230; p.z = -120;
      if (G.car) { G.car.heading = 0; G.car.group.position.set(-230, 0.55, -120); G.car.group.rotation.y = 0; }
      G.shotCam = {
        pos: V(p.x - fwd.x * 18 + side.x * 10, p.y + 11, p.z - fwd.z * 18 + side.z * 10),
        look: V(p.x + fwd.x * 12, p.y + 1, p.z + fwd.z * 12),
      };
      document.getElementById('hud')?.classList.add('hidden');
      if (G.car) G.car.speed = 18;
      // Kiko half out of the passenger window, SMG firing (built onto the car).
      if (G.car && G.car.group && !G._kiko) {
        const k = new T.Group();
        const dark = new T.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6 });
        const gold = new T.MeshStandardMaterial({ color: 0xf2c94c, metalness: 0.7, roughness: 0.3 });
        const skin = new T.MeshStandardMaterial({ color: 0xc98d5f, roughness: 0.7 });
        const bx = (w, h, d, m, x, y, z) => { const q = new T.Mesh(new T.BoxGeometry(w, h, d), m); q.position.set(x, y, z); k.add(q); return q; };
        bx(0.5, 0.55, 0.3, dark, 0, 0.3, 0); // torso, dark tactical
        bx(0.52, 0.08, 0.32, gold, 0, 0.55, 0); // gold trim
        const head = new T.Mesh(new T.SphereGeometry(0.18, 10, 8), skin);
        head.position.y = 0.72; k.add(head);
        bx(0.09, 0.09, 0.6, dark, 0.1, 0.45, -0.35); // SMG forward
        bx(0.1, 0.1, 0.1, gold, 0.1, 0.45, -0.68); // muzzle
        k.position.set(1.3, 0.95, 0.35); // leaning further out, toward camera
        k.scale.setScalar(1.35); // read clearly from the high chase camera
        k.rotation.z = -0.55; // leaning out of the window
        k.rotation.x = -0.15;
        G.car.group.add(k);
        G._kiko = k;
      }
      // Two NPD interceptors chasing close behind (in frame, not behind the
      // camera) + traffic scattering ahead on the avenue.
      if (G.spawnVehicle) {
        G.spawnVehicle('npd', p.x + 7, p.z + 8, yaw);
        G.spawnVehicle('npd', p.x - 7, p.z + 13, yaw);
      }
      crowdScene(p.x, p.z, 6, 10, null, true);
      // Park the other loop cars behind the camera so none of them looms
      // in a frame corner.
      (G.traffic || []).filter((c) => c.loop).forEach((c, i) => {
        if (i >= 6) c.mesh.position.set(p.x + (i % 2 ? 4 : -4), 0.4, p.z + 30 + (i - 6) * 8);
      });
      if (G.setChaos) G.setChaos(true); // peds flee
    } else if (name === 'fps') {
      G.setTimeOfDay?.(14.5); // daytime: bright afternoon, sun high
      G.player.onFoot = true; G.player.weapon = 3; // Rifle
      const pp = G.player.pos || G.player.position || V(0, 0, 0);
      G.fpsCam = { pos: V(pp.x, pp.y + 1.7, pp.z), yaw: G.player.yaw || 0, pitch: -0.02 };
      G.shotCam = null;
      // Aim the real camera first so the floating bars project correctly.
      if (G.camera) {
        G.camera.position.copy(G.fpsCam.pos);
        G.camera.rotation.set(G.fpsCam.pitch, G.fpsCam.yaw, 0, 'YXZ');
      }
      G.openWheel?.(3); // wheel.js: open wheel with Rifle (index 3) selected
      G.combat?.stageFps(); // gang war: 4 Vipers ahead, allies beside
      if (G.player.group) G.player.group.visible = false; // FPS: body hidden
      G.combat?.update?.(1 / 60); // one tick: viewmodel visible, bars projected
      crowdScene(pp.x, pp.z, 4, 12); // peds fleeing down the market street
      document.getElementById('hud')?.classList.add('hidden');
    } else if (name === 'map') {
      G.setTimeOfDay?.(15.0); // daytime: bright afternoon on the map clock
      G.state = 'map';
      document.getElementById('map')?.classList.remove('hidden');
      G.showMap?.();
    }
    G.shotStaged = true;
  };
}

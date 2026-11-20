import { CONFIG } from './config.js';
import * as A from './assets3d.js';

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
      // USER ORDER: all 4 shots in DAYTIME. Morning (~10:30): higher sun,
      // cooler light, blue sky reads above the warm horizon band.
      G.setTimeOfDay?.(10.5);
      // Stage ON the z=0 east-west avenue, facing the Spire down a
      // straight street corridor: the spawn plaza was a bare dirt field
      // (huge empty foreground, Spire hidden behind low rows). Car at
      // (-120,0) facing east (yaw -PI/2) down the avenue; camera WSW,
      // low (y 3.5) so the car reads large in the lower frame and the
      // 38 m Spire towers behind it at the end of the street, framed by
      // tight buildings on both sides. Rear 3/4: roof + south wing +
      // flank read as 3D, not a flat gold slab.
      p.x = -120; p.z = 0;
      if (G.car) {
        G.car.heading = -Math.PI / 2; G.car.yaw = -Math.PI / 2;
        G.car.group.position.set(-120, 0.55, 0);
        G.car.group.rotation.y = -Math.PI / 2;
      }
      // Low camera wins: high camera flattened the car to a toy, cut the
      // Spire off at the top edge, and the strips still slashed the
      // frame. Low + near-side keeps the car big and 3D and the Spire
      // tall; the strip stays a diagonal in the upper right only.
      G.shotCam = {
        pos: V(-133, p.y + 3.5, -6.5),
        look: V(p.x, p.y + 2.2, p.z),
      };
      document.getElementById('hud')?.classList.add('hidden'); // photo mode
      if (G.car) { G.car.speed = 0; }
      G.replayCam = 'side'; // replay.js: finish-cam side view if present
      const aCam = Math.atan2(G.shotCam.pos.z - p.z, G.shotCam.pos.x - p.x);
      crowdScene(p.x, p.z, 6, 14, aCam); // cheering crowd + traffic in frame
      confetti(p.x, p.z, G.shotCam.pos);
    } else if (name === 'driveby') {
      G.setTimeOfDay?.(11.0); // daytime: late morning, bluer sky
      // Stage the chase ON the Neon avenue (x=-230) so the road, traffic
      // and fleeing peds read as a street chase, not bare dirt.
      p.x = -230; p.z = -120;
      if (G.car) { G.car.heading = 0; G.car.group.position.set(-230, 0.55, -120); G.car.group.rotation.y = 0; }
      // Camera WEST of the avenue, LOW (y 4.5, below the teal neon strip
      // at y=7 on the east side) so the strip stays a thin line near the
      // top of frame instead of slashing diagonally through it; narrower
      // FOV (50) so the hero car reads large instead of a speck.
      G.shotCam = {
        pos: V(-240, p.y + 4.5, -106),
        look: V(p.x, p.y + 1.5, p.z - 12),
      };
      if (G.camera) { G.camera.fov = 50; G.camera.updateProjectionMatrix(); }
      document.getElementById('hud')?.classList.add('hidden');
      if (G.car) G.car.speed = 18;
      // Kiko half out of the passenger window, SMG firing (library ped + SMG).
      // WEST side this time (x -1.3): the camera is west, so she leans
      // toward the lens.
      if (G.car && G.car.group && !G._kiko) {
        const k = A.makePed({ style: 'street', shirt: 0x1f2937, pants: 0x111827, skin: 0xc98d5f });
        const smg = new T.Mesh(new T.BoxGeometry(0.09, 0.09, 0.6), new T.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6 }));
        smg.position.set(-0.1, 1.05, -0.35); k.add(smg);
        k.position.set(-1.2, 1.35, 0.35); // torso ABOVE the gold wing (y 1.08), leaning out toward camera
        k.scale.setScalar(0.8);
        k.rotation.z = 0.3; // slight lean: a 0.55 lean read as lying flat on the roof
        k.rotation.x = -0.1;
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
      G.setTimeOfDay?.(10.0); // daytime: morning, bluer sky
      G.player.onFoot = true; G.player.weapon = 3; // Rifle
      // Move the player OFF the car spawn and onto the Neon avenue
      // (x=-230, facing north down the road): at the spawn the FPS camera
      // sat inside the Garuda GT and the whole frame was flat gold.
      // Avenue is clear for ~20 m ahead, where stageFps puts the Vipers.
      // West lane (x -236): 12 m clear of the teal neon strip (x -224),
      // so it stays a thin line at the top of frame, not a diagonal slash.
      G.player.pos.set(-236, 0, -60); G.player.yaw = 0;
      const pp = G.player.pos || G.player.position || V(0, 0, 0);
      G.fpsCam = { pos: V(pp.x, pp.y + 1.7, pp.z), yaw: G.player.yaw || 0, pitch: 0.02 };
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
      crowdScene(pp.x, pp.z, 4, 12, -Math.PI / 2); // peds fleeing down the market street; keep the north sight line clear
      document.getElementById('hud')?.classList.add('hidden');
    } else if (name === 'map') {
      G.setTimeOfDay?.(10.5); // daytime: morning on the map clock
      G.state = 'map';
      document.getElementById('map')?.classList.remove('hidden');
      G.showMap?.();
    }
    G.shotStaged = true;
  };
}

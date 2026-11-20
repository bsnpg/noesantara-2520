// Player: Wowo on foot (gold/teal jacket, batik trim, helmet under arm).
// initPlayer(G) sets G.player + G.updatePlayer(dt) (main calls it each frame).
// WASD move, mouse dx turns, Space jump, Shift sprint, F interact (G.interactables),
// E enter car when near (prompt via G.hud.showPrompt or G.hud.prompt). Third-person;
// FPS + body hidden when G.weaponIndex is set and !==5 (Fists).
// Spawns beside the Garuda GT in Distrik Neon (-190, -120).
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function initPlayer(G) {
  const T = G.THREE;
  const gold = new T.MeshStandardMaterial({ color: 0xd4a017, metalness: 0.5, roughness: 0.5 });
  const teal = new T.MeshStandardMaterial({ color: 0x0e7c7b, metalness: 0.4, roughness: 0.5 });
  const dark = new T.MeshStandardMaterial({ color: 0x1c2733, roughness: 0.6 });
  const skin = new T.MeshStandardMaterial({ color: 0xc98d5f, roughness: 0.7 });
  const batik = new T.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.5, emissive: 0x701a10, emissiveIntensity: 0.6 });
  const g = new T.Group();
  const bx = (w, h, d, m, x, y, z, parent = g) => {
    const q = new T.Mesh(new T.BoxGeometry(w, h, d), m);
    q.position.set(x, y, z); parent.add(q); return q;
  };
  const legL = bx(0.2, 0.8, 0.22, dark, -0.13, 0.4, 0);
  const legR = bx(0.2, 0.8, 0.22, dark, 0.13, 0.4, 0);
  bx(0.56, 0.62, 0.32, gold, 0, 1.12, 0);
  bx(0.58, 0.1, 0.34, batik, 0, 0.84, 0);
  bx(0.58, 0.08, 0.34, teal, 0, 1.38, 0);
  const armL = bx(0.16, 0.6, 0.18, teal, -0.38, 1.1, 0);
  const armR = bx(0.16, 0.6, 0.18, teal, 0.38, 1.1, 0);
  const head = new T.Mesh(new T.SphereGeometry(0.19, 10, 8), skin);
  head.position.y = 1.62; g.add(head);
  bx(0.4, 0.1, 0.4, dark, 0, 1.78, 0);
  const helm = new T.Mesh(new T.SphereGeometry(0.2, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.6), gold);
  helm.position.set(-0.52, 0.82, 0.1); helm.rotation.z = 0.5; g.add(helm);
  const cx = (G.car && G.car.group) ? G.car.group.position.x : -190;
  const cz = (G.car && G.car.group) ? G.car.group.position.z : -120;
  g.position.set(cx + 2.5, 0, cz + 2);
  if (G.scene) G.scene.add(g);
  const P = {
    group: g, hp: 100, maxHp: 100, armor: 50, maxArmor: 100, pos: g.position,
    onFoot: true, yaw: 0, speed: 0, velY: 0, grounded: true, sprint: false,
    limbs: { legL, legR, armL, armR }, walkPhase: 0,
  };
  P.health = P.hp; // alias: some modules read health
  P.weapon = 5; P.inCar = false;
  G.player = P;
  G._prevKeys = G._prevKeys || {};
  const pressed = (c) => (G.pressed ? G.pressed.has(c) : G.keys[c] && !G._prevKeys[c]);
  const prompt = (txt) => {
    if (!G.hud) return;
    if (typeof G.hud.showPrompt === 'function') G.hud.showPrompt(txt);
    else G.hud.prompt = txt || '';
  };
  G.updatePlayer = (dt) => {
    const k = G.keys || {};
    if (!P.onFoot || G.state === 'title') { if (P.onFoot) prompt(''); return; }
    const fpsAim = G.weaponIndex !== undefined && G.weaponIndex !== null && G.weaponIndex !== 5;
    // FPS aim is owned by the wheel module (it consumes the mouse deltas);
    // third-person turning is owned here.
    if (!fpsAim && G.mouse && typeof G.mouse.dx === 'number') { P.yaw -= G.mouse.dx * 0.0032; G.mouse.dx = 0; }
    const fwd = { x: -Math.sin(P.yaw), z: -Math.cos(P.yaw) };
    const rgt = { x: Math.cos(P.yaw), z: -Math.sin(P.yaw) };
    let mx = 0, mz = 0;
    if (k.KeyW || k.ArrowUp) { mx += fwd.x; mz += fwd.z; }
    if (k.KeyS || k.ArrowDown) { mx -= fwd.x; mz -= fwd.z; }
    if (k.KeyA || k.ArrowLeft) { mx -= rgt.x; mz -= rgt.z; }
    if (k.KeyD || k.ArrowRight) { mx += rgt.x; mz += rgt.z; }
    const ml = Math.hypot(mx, mz) || 1;
    P.sprint = !!(k.ShiftLeft || k.ShiftRight);
    const spd = P.sprint ? 8 : 4.5;
    P.speed = (mx || mz) ? spd : 0;
    g.position.x += (mx / ml) * P.speed * dt; g.position.z += (mz / ml) * P.speed * dt;
    if (mx || mz) g.rotation.y = Math.atan2(mx, mz) + Math.PI;
    if (pressed('Space') && P.grounded) { P.velY = 7.5; P.grounded = false; }
    if (!P.grounded) {
      P.velY -= 22 * dt; g.position.y += P.velY * dt;
      if (g.position.y <= 0) { g.position.y = 0; P.velY = 0; P.grounded = true; }
    }
    P.walkPhase += P.speed * dt * 2.2;
    const sw = Math.sin(P.walkPhase) * (P.speed ? 0.5 : 0);
    P.limbs.legL.rotation.x = sw; P.limbs.legR.rotation.x = -sw;
    P.limbs.armL.rotation.x = -sw * 0.8; P.limbs.armR.rotation.x = sw * 0.8;
    const R = G.worldRadius || 420;
    const rr = Math.hypot(g.position.x, g.position.z);
    if (rr > R) { g.position.x *= R / rr; g.position.z *= R / rr; }
    const car = G.car;
    const nearCar = car && car.group && Math.hypot(g.position.x - car.group.position.x, g.position.z - car.group.position.z) < 4;
    if (nearCar) {
      prompt('E — Masuk Mobil');
      if (pressed('KeyE') && (G.time - (G._eToggleT || -9)) > 0.5) {
        G._eToggleT = G.time;
        P.onFoot = false; g.visible = false; car.active = true;
        car.heading = P.yaw; car.group.rotation.y = P.yaw; car.speed = 0;
        prompt('');
      }
    } else prompt('');
    if (pressed('KeyF') && Array.isArray(G.interactables)) {
      let best = null, bd = 2.5;
      for (const it of G.interactables) {
        const p = it.group ? it.group.position : it.position; if (!p) continue;
        const d = Math.hypot(g.position.x - p.x, g.position.z - p.z);
        if (d < bd) { bd = d; best = it; }
      }
      if (best && typeof best.onInteract === 'function') best.onInteract(G);
    }
    const fps = fpsAim;
    g.visible = fps ? false : P.onFoot;
    if (G.camera) {
      const hy = 1.6, dist = fps ? 0 : 5.2;
      const cx2 = g.position.x - fwd.x * dist, cz2 = g.position.z - fwd.z * dist;
      const cy = hy + (fps ? 0.05 : 1.6);
      if (fps) { G.camera.position.set(g.position.x, hy, g.position.z); }
      else {
        G.camera.position.x += (cx2 - G.camera.position.x) * Math.min(1, dt * 8);
        G.camera.position.y += (cy - G.camera.position.y) * Math.min(1, dt * 8);
        G.camera.position.z += (cz2 - G.camera.position.z) * Math.min(1, dt * 8);
      }
      G.camera.lookAt(g.position.x + fwd.x * 4, hy, g.position.z + fwd.z * 4);
      if (G.mouse && typeof G.mouse.dy === 'number') G.mouse.dy = 0;
    }
    if (G.hud) {
      if (typeof G.hud.setHealth === 'function') G.hud.setHealth(P.hp, P.armor);
      else { G.hud.hp = P.hp; G.hud.armor = P.armor; }
    }
  };
  return P;
}

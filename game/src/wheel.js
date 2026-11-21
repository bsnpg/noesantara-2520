// wheel.js — weapon wheel, written fresh for round 8 (GTA V wedge wheel).
// 6 wedges clockwise from top: FISTS, PISTOL, SMG, SHOTGUN, RIFLE, BAZOOKA.
// Hold Q/Tab to open, mouse or arrows to pick, release to confirm; 1-6 direct.
// Time slows while open. A persistent 150px mini wheel lives in the HUD.
import { WEAPONS } from './config.js';

const TAU = Math.PI * 2;
function wedgeCenter(i) { return -Math.PI / 2 + (i * TAU) / 6; }
function angleToWedge(a) {
  let deg = ((a * 180) / Math.PI + 90) % 360;
  if (deg < 0) deg += 360;
  return Math.floor(deg / 60) % 6;
}
// Small gold silhouette per weapon, drawn inside its wedge. The caller has
// already rotated the context so local +x points radially outward.
function drawSilhouette(x, i, r) {
  const s = r * 0.11;
  x.save();
  x.translate(r * 0.62, 0);
  x.fillStyle = '#ffd700';
  x.strokeStyle = '#ffd700'; x.lineWidth = s * 0.18;
  x.beginPath();
  if (i === 0) { // fists: two rounded gloves
    x.roundRect(-s * 0.9, -s * 0.4, s * 0.8, s * 0.9, s * 0.3);
    x.roundRect(s * 0.1, -s * 0.4, s * 0.8, s * 0.9, s * 0.3);
  } else if (i === 1) { // pistol
    x.fillRect(-s * 0.7, -s * 0.5, s * 1.5, s * 0.35);
    x.fillRect(-s * 0.4, -s * 0.15, s * 0.35, s * 0.8);
  } else if (i === 2) { // smg
    x.fillRect(-s * 0.8, -s * 0.35, s * 1.7, s * 0.3);
    x.fillRect(-s * 0.1, 0, s * 0.3, s * 0.7);
    x.fillRect(s * 0.7, -s * 0.55, s * 0.25, s * 0.5);
  } else if (i === 3) { // shotgun
    x.fillRect(-s * 1.1, -s * 0.3, s * 2.2, s * 0.28);
    x.fillRect(-s * 0.9, 0, s * 0.35, s * 0.6);
    x.fillRect(s * 0.2, -s * 0.45, s * 0.5, s * 0.2);
  } else if (i === 4) { // rifle
    x.fillRect(-s * 1.1, -s * 0.3, s * 2.2, s * 0.3);
    x.fillRect(-s * 0.7, 0, s * 0.3, s * 0.65);
    x.fillRect(s * 0.5, -s * 0.3, s * 0.25, s * 0.5);
    x.fillRect(-s * 0.2, -s * 0.55, s * 0.6, s * 0.2);
  } else { // bazooka
    x.fillRect(-s * 1.2, -s * 0.35, s * 2.4, s * 0.55);
    x.fillRect(-s * 0.3, 0.2, s * 0.4, s * 0.55);
    x.fillRect(s * 0.9, -s * 0.5, s * 0.35, s * 0.8);
  }
  x.fill();
  x.restore();
}

export function createWheel(ctx) {
  const big = document.getElementById('wheel');
  const mini = document.getElementById('mini-wheel');
  const bx = big.getContext('2d');
  const mx = mini.getContext('2d');
  const w = {
    open: false, selected: 4, held: false,
    timeScale() { return w.open ? 0.3 : 1; },
    select(i) {
      w.selected = ((i % 6) + 6) % 6;
      ctx.player.weaponIndex = w.selected;
      ctx.combat.syncViewmodel();
    },
    update() {
      const input = ctx.input;
      const held = input.isDown('KeyQ') || input.isDown('Tab');
      if (held && !ctx.player.inCar && !ctx.mapOpen) { w.open = true; w.held = true; }
      else if (w.held && !held) { w.open = false; w.held = false; }
      if (w.open) {
        if (input.wasPressed('ArrowRight') || input.wasPressed('ArrowDown')) w.select(w.selected + 1);
        if (input.wasPressed('ArrowLeft') || input.wasPressed('ArrowUp')) w.select(w.selected - 1);
        const dx = input.mouseX - window.innerWidth / 2, dy = input.mouseY - window.innerHeight / 2;
        if (Math.hypot(dx, dy) > 70) w.select(angleToWedge(Math.atan2(dy, dx)));
      }
      big.style.display = w.open ? 'block' : 'none';
    },
    drawWheel(x, size, withCenter) {
      const c = size / 2, R = c - 6, rC = R * 0.52;
      x.clearRect(0, 0, size, size);
      x.save(); x.translate(c, c);
      for (let i = 0; i < 6; i += 1) {
        const a0 = wedgeCenter(i) - TAU / 12, a1 = wedgeCenter(i) + TAU / 12;
        const sel = i === w.selected;
        x.beginPath();
        x.moveTo(0, 0); x.arc(0, 0, R, a0, a1); x.closePath();
        if (sel) {
          const g = x.createRadialGradient(0, 0, rC, 0, 0, R);
          g.addColorStop(0, 'rgba(255,215,0,0.95)'); g.addColorStop(1, 'rgba(255,180,0,0.85)');
          x.fillStyle = g;
        } else x.fillStyle = 'rgba(10,24,30,0.88)';
        x.fill();
        x.strokeStyle = sel ? '#ffe9a8' : 'rgba(255,215,0,0.45)'; x.lineWidth = sel ? 2.5 : 1;
        x.stroke();
        // Label + ammo along the wedge (text rotated tangentially, as on the
        // GTA V wheel: FISTS reads horizontal at the top). A label that would
        // end up upside down (near the bottom) is flipped upright in place.
        const ang = wedgeCenter(i) + Math.PI / 2;
        const aNorm = ((ang % TAU) + TAU) % TAU;
        const flip = aNorm > (Math.PI * 3) / 4 && aNorm < (Math.PI * 5) / 4;
        x.save(); x.rotate(ang);
        x.translate(0, -R * 0.82);
        if (flip) x.rotate(Math.PI);
        x.fillStyle = sel ? '#1a1400' : '#ffd700';
        x.font = `bold ${Math.round(size * 0.032)}px system-ui, sans-serif`;
        x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText(WEAPONS[i].name, 0, 0);
        x.font = `${Math.round(size * 0.026)}px system-ui, sans-serif`;
        x.fillStyle = sel ? '#3a2f00' : '#cfe8ff';
        x.fillText(WEAPONS[i].ammo, 0, flip ? -R * 0.14 : R * 0.14);
        x.restore();
        x.save(); x.rotate(wedgeCenter(i));
        drawSilhouette(x, i, R);
        x.restore();
      }
      // Batik ring: alternating gold/teal dashes around the centre.
      for (let i = 0; i < 36; i += 1) {
        const a = (i / 36) * TAU;
        x.beginPath();
        x.arc(0, 0, rC + 5, a, a + 0.09);
        x.strokeStyle = i % 2 ? '#1abc9c' : '#ffd700'; x.lineWidth = 3; x.stroke();
      }
      // Centre disc: weapon name + ammo + hint.
      x.beginPath(); x.arc(0, 0, rC, 0, TAU);
      x.fillStyle = 'rgba(8,18,22,0.95)'; x.fill();
      x.strokeStyle = '#ffd700'; x.lineWidth = 2; x.stroke();
      if (withCenter) {
        const cur = WEAPONS[w.selected];
        x.fillStyle = '#ffd700'; x.textAlign = 'center';
        x.font = `bold ${Math.round(size * 0.062)}px system-ui, sans-serif`;
        x.fillText(cur.name, 0, -rC * 0.18);
        x.fillStyle = '#ffffff';
        x.font = `${Math.round(size * 0.05)}px system-ui, sans-serif`;
        x.fillText(cur.ammo, 0, rC * 0.28);
        x.fillStyle = '#9fb8c4';
        x.font = `${Math.round(size * 0.026)}px system-ui, sans-serif`;
        x.fillText('Q / TAB — TUTUP', 0, rC * 0.62);
      } else {
        const cur = WEAPONS[w.selected];
        x.fillStyle = '#ffd700'; x.textAlign = 'center';
        x.font = `bold ${Math.round(size * 0.09)}px system-ui, sans-serif`;
        x.fillText(cur.name, 0, -2);
        x.fillStyle = '#fff';
        x.font = `${Math.round(size * 0.07)}px system-ui, sans-serif`;
        x.fillText(cur.ammo, 0, size * 0.09);
      }
      x.restore();
    },
    render() {
      big.style.display = w.open ? 'block' : 'none';
      if (w.open) w.drawWheel(bx, 520, true);
      w.drawWheel(mx, 150, false);
    },
  };
  return w;
}

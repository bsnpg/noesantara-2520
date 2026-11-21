// map.js — the SAME grid street map in 3D world, minimap and pause screen.
// No pie anywhere: avenues, connectors, ring, alleys, district blocks, names,
// mission markers, collectibles, waypoint route, player arrow.
import { DISTRICTS, AVE_NS, AVE_EW, CON_NS, CON_EW, ALLEYS, ROAD_NAMES } from './config.js';

function project(w, h, x, z) {
  const s = Math.min(w / 660, h / 620);
  return [(x + 330) * s + (w - 660 * s) / 2, (z + 310) * s + (h - 620 * s) / 2, s];
}
function drawBase(x, w, h, ctx, big) {
  const [, , s] = project(w, h, 0, 0);
  x.fillStyle = '#0e2a33'; x.fillRect(0, 0, w, h);
  // District blocks (soft colour wash).
  for (const d of DISTRICTS) {
    const [px, py] = project(w, h, d.cx - d.r, d.cz - d.r);
    x.fillStyle = d.color + '55';
    x.fillRect(px, py, d.r * 2 * s, d.r * 2 * s);
    x.strokeStyle = d.color; x.lineWidth = big ? 2 : 1;
    x.strokeRect(px, py, d.r * 2 * s, d.r * 2 * s);
  }
  // Roads: ring, avenues, connectors, alleys.
  const road = (x0, z0, x1, z1, wd, col) => {
    const [ax, ay] = project(w, h, x0, z0); const [bx, by] = project(w, h, x1, z1);
    x.strokeStyle = col; x.lineWidth = Math.max(1, wd * s); x.lineCap = 'round';
    x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke();
  };
  road(-320, -300, 320, -300, 14, '#3a3f4a'); road(-320, 300, 320, 300, 14, '#3a3f4a');
  road(-320, -300, -320, 300, 14, '#3a3f4a'); road(320, -300, 320, 300, 14, '#3a3f4a');
  for (const ax of AVE_NS) road(ax, -300, ax, 300, 22, '#2b2f38');
  for (const az of AVE_EW) road(-320, az, 320, az, 22, '#2b2f38');
  for (const cx of CON_NS) road(cx, -300, cx, 300, 12, '#3a3f4a');
  for (const cz of CON_EW) road(-320, cz, 320, cz, 12, '#3a3f4a');
  for (const a of ALLEYS) {
    const d = DISTRICTS[a.d];
    road(a.ns, d.cz - 85, a.ns, d.cz + 85, 5, '#4a5058');
    road(d.cx - 85, a.ew, d.cx + 85, a.ew, 5, '#4a5058');
  }
  // Gold centre lines on avenues.
  for (const ax of AVE_NS) road(ax, -300, ax, 300, 1.5, '#ffd700');
  for (const az of AVE_EW) road(-320, az, 320, az, 1.5, '#ffd700');
  return s;
}
export function drawMinimap(canvas, ctx) {
  const x = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const s = drawBase(x, w, h, ctx, false);
  // Batik dots + mission markers.
  for (const c of ctx.collectibles) {
    if (c.taken) continue;
    const [px, py] = project(w, h, c.x, c.z);
    x.fillStyle = '#1abc9c'; x.fillRect(px - 1.5, py - 1.5, 3, 3);
  }
  const m = ctx.missions.active();
  const d = DISTRICTS[m.district];
  const [mx, my] = project(w, h, d.cx, d.cz);
  x.fillStyle = '#ffd700'; x.font = `bold ${Math.round(13)}px system-ui, sans-serif`; x.textAlign = 'center';
  x.fillText('M', mx, my + 4);
  // Player arrow (gold triangle, rotated by heading).
  const px = ctx.player.inCar ? ctx.vehicles.hero.position.x : ctx.player.x;
  const pz = ctx.player.inCar ? ctx.vehicles.hero.position.z : ctx.player.z;
  const [ax, ay] = project(w, h, px, pz);
  const hd = ctx.player.inCar ? ctx.driving.heading : ctx.player.yaw;
  x.save(); x.translate(ax, ay); x.rotate(Math.PI / 2 + (ctx.player.inCar ? -hd : hd));
  x.fillStyle = '#ffd700';
  x.beginPath(); x.moveTo(0, -7); x.lineTo(5, 6); x.lineTo(-5, 6); x.closePath(); x.fill();
  x.restore();
  return s;
}
export function drawBigMap(canvas, ctx) {
  const x = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const s = drawBase(x, w, h, ctx, true);
  x.textAlign = 'center';
  // Road names.
  x.fillStyle = '#e8e4d8'; x.font = `bold ${Math.round(11 * s + 6)}px system-ui, sans-serif`;
  for (const ax of AVE_NS) { const [px] = project(w, h, ax, -292); x.fillText(ROAD_NAMES.ns[String(ax)], px, 18); }
  for (const az of AVE_EW) { const [, py] = project(w, h, 312, az); x.save(); x.translate(w - 8, py); x.rotate(-Math.PI / 2); x.fillText(ROAD_NAMES.ew[String(az)], 0, 0); x.restore(); }
  // District names + seen %.
  for (const d of DISTRICTS) {
    const [px, py] = project(w, h, d.cx, d.cz);
    x.fillStyle = '#ffffff'; x.font = `bold ${Math.round(13 * s + 7)}px system-ui, sans-serif`;
    x.fillText(d.name.toUpperCase(), px, py - 4);
    x.fillStyle = '#cfe8ff'; x.font = `${Math.round(10 * s + 5)}px system-ui, sans-serif`;
    x.fillText(`ASING • ${ctx.progression.seenPct(d)}% DILIHAT`, px, py + 14);
  }
  // Mission markers.
  x.fillStyle = '#ffd700'; x.font = `bold ${Math.round(12 * s + 8)}px system-ui, sans-serif`;
  for (const mm of ctx.missions.list) {
    if (mm.status === 'locked') continue;
    const d = DISTRICTS[mm.district];
    const [px, py] = project(w, h, d.cx + (mm.status === 'active' ? 0 : 24), d.cz - 30);
    x.fillText('M', px, py);
  }
  // Waypoint dashed gold route: player → Spire.
  const px = ctx.player.inCar ? ctx.vehicles.hero.position.x : ctx.player.x;
  const pz = ctx.player.inCar ? ctx.vehicles.hero.position.z : ctx.player.z;
  const [ax, ay] = project(w, h, px, pz);
  const [bx, by] = project(w, h, 35, 35);
  x.strokeStyle = '#ffd700'; x.lineWidth = 3; x.setLineDash([8, 7]);
  x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke(); x.setLineDash([]);
  // Spire marker.
  x.fillStyle = '#ffd700';
  x.beginPath(); x.arc(bx, by, 10, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#1a1400'; x.font = 'bold 12px system-ui, sans-serif'; x.fillText('S', bx, by + 4);
  // Player arrow.
  const hd = ctx.player.inCar ? ctx.driving.heading : ctx.player.yaw;
  x.save(); x.translate(ax, ay); x.rotate(Math.PI / 2 + (ctx.player.inCar ? -hd : hd));
  x.fillStyle = '#ffd700';
  x.beginPath(); x.moveTo(0, -11); x.lineTo(8, 9); x.lineTo(-8, 9); x.closePath(); x.fill();
  x.restore();
}

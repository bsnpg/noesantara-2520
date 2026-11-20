// Full map (pause menu, div#map) + circular minimap drawing.
// World coords: x,z in [-300,300]; Spire at centre. Click = waypoint (gold GPS route
// on map + minimap; world beacon is drawn by the world builder from G.map.waypoint).
// M toggles (handled by main.js — this module owns no key listener).
// Minimap is drawn by hud.js via G.map.drawMinimap(canvas).
// District positions use the unified city grid (Spire 0,0).
export const DISTRICTS = [
  { name: 'Distrik Neon', color: '#ff5fa2', x: -230, z: -200, faction: 'Neon Wolves', gapura: 'Gapura Neon', missions: [0, 2, 3] },
  { name: 'Pasar Nusantara', color: '#ffb020', x: 230, z: -200, faction: 'Netral', gapura: 'Gapura Pasar + Menara Jam', missions: [2] },
  { name: 'Undercity', color: '#c0392b', x: -230, z: 200, faction: 'Chrome Vipers', gapura: 'Gerbang Undercity', missions: [4, 5] },
  { name: 'Spire', color: '#f2c94c', x: 0, z: 0, faction: 'Syndicate', gapura: 'Menara Spire', missions: [7] },
  { name: 'Distrik Candi', color: '#1abc9c', x: 230, z: 200, faction: 'Netral', gapura: 'Candi Agung', missions: [] },
  { name: 'Skyport', color: '#3498db', x: -230, z: 0, faction: 'Neon Wolves', gapura: 'Menara Kontrol', missions: [6] },
  { name: 'Taman Gantung', color: '#27ae60', x: 230, z: 0, faction: 'Netral', gapura: 'Pohon Raksasa', missions: [] },
];
const WORLD = 320; // half-extent of world coords
function el(tag, css, txt) { const e = document.createElement(tag); e.style.cssText = css; if (txt != null) e.textContent = txt; return e; }
export function initMap(G) {
  // Reuse the #map layer from index.html (never a second #map in the DOM).
  let root = document.getElementById('map');
  if (!root) {
    root = el('div', 'position:fixed;inset:0;z-index:40;display:none;background:rgba(8,12,16,.92);font-family:system-ui,sans-serif;color:#f5e6b8;');
    root.id = 'map';
    document.body.appendChild(root);
  }
  root.style.cssText = 'position:fixed;inset:0;z-index:40;display:none;background:rgba(8,12,16,.92);font-family:system-ui,sans-serif;color:#f5e6b8;';
  root.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 18px;border-bottom:3px solid #c9a227;background:#0e2a2a;">' +
    '<b style="font-size:26px;color:#f2c94c;letter-spacing:2px">⏸ PAUSED — MAP</b>' +
    '<div id="mapStats" style="font-size:15px;color:#7fe7d2"></div>' +
    '<span style="border:2px solid #c9a227;border-radius:8px;padding:2px 10px;color:#f2c94c">LV.<b id="mapLvl">1</b></span></div>' +
    '<div style="display:flex;gap:12px;padding:12px;height:calc(100% - 130px)">' +
    '<div style="flex:1;position:relative;border:3px solid #c9a227;border-radius:12px;overflow:hidden;background:#efe6c8"><canvas id="mapCanvas" width="860" height="560" style="width:100%;height:100%;cursor:crosshair"></canvas>' +
    '<div id="mapInfo" style="position:absolute;left:10px;bottom:10px;right:10px;background:rgba(10,30,30,.92);border:2px solid #c9a227;border-radius:8px;padding:8px 12px;font-size:14px">Klik distrik untuk info • Klik di mana saja untuk waypoint</div></div>' +
    '<div style="width:250px;display:flex;flex-direction:column;gap:10px">' +
    '<div style="background:#e8c96a;color:#222;border-radius:10px;padding:10px;font-size:14px"><b>LEGEND</b><br>◆ M — Misi<br>⌂ — Properti / Safehouse<br>🔧 — Garage Riko<br>✦ — Koleksi Batik (50)<br>✈ — Fast Travel<br>💾 — Save<br><span style="color:#2456ff">●</span> NPD &nbsp; <span style="color:#d21f1f">●</span> Viper &nbsp; <span style="color:#b8860b">➤</span> Kamu</div>' +
    '<div id="mapProg" style="background:#e8c96a;color:#222;border-radius:10px;padding:10px;font-size:14px"></div>' +
    '</div></div>' +
    '<div style="display:flex;gap:12px;justify-content:center;padding:8px">' +
    '<button id="mapResume" style="padding:10px 34px;font-size:18px;background:#1abc9c;color:#fff;border:2px solid #c9a227;border-radius:8px;cursor:pointer">▶ RESUME</button>' +
    '<button id="mapSettings" style="padding:10px 34px;font-size:18px;background:#e8c96a;border:2px solid #c9a227;border-radius:8px;cursor:pointer">⚙ SETTINGS</button>' +
    '<button id="mapExit" style="padding:10px 34px;font-size:18px;background:#c0392b;color:#fff;border:2px solid #c9a227;border-radius:8px;cursor:pointer">🚪 EXIT TO MENU</button></div>';
  const cv = root.querySelector('#mapCanvas'), ctx = cv.getContext('2d');
  const info = root.querySelector('#mapInfo'), prog = root.querySelector('#mapProg');
  const M = {
    open: false, waypoint: null, selected: null,
    progress: DISTRICTS.map(() => 20),
    toggle() { M.open ? M.close() : M.openMap(); },
    openMap() { M.open = true; root.classList.remove('hidden'); root.style.display = 'block'; if (G.state) G.state = 'map'; M.render(); },
    close() { M.open = false; root.style.display = 'none'; root.classList.add('hidden'); if (G.state === 'map') G.state = 'play'; },
    setWaypoint(x, z) { M.waypoint = { x, z }; if (G.hud) G.hud.toast('Waypoint ditandai', 'sub'); M.render(); },
    districtAt(x, z) { let best = null, bd = 1e9; for (const d of DISTRICTS) { const dd = (x - d.x) ** 2 + (z - d.z) ** 2; if (dd < bd) { bd = dd; best = d; } } return bd < 120 * 120 ? best : null; },
    update() { // district progress: missions done + collectibles
      DISTRICTS.forEach((d, i) => {
        let p = 20;
        if (G.missions) p += d.missions.filter(mi => G.missions.list[mi] && G.missions.list[mi].done).length * 30;
        if (G.quests) p += Math.round(G.quests.found / 50 * 20);
        M.progress[i] = Math.min(100, p);
      });
    },
    render() {
      const cr = (G.progression && G.progression.credits) || G.credits || 0;
      const xp = (G.progression && G.progression.xp) || 0, lv = (G.progression && G.progression.level) || 1;
      const comp = Math.round(M.progress.reduce((a, b) => a + b, 0) / 7);
      const h = G.timeOfDay != null ? G.timeOfDay : 16.5;
      const hh = Math.floor(h), mm = Math.floor((h % 1) * 60);
      root.querySelector('#mapStats').textContent = '💰 Rp ' + cr.toLocaleString('id-ID') + '   •   COMPLETION: ' + comp + '%   •   TIME: ' + String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0') + ' • DAY ' + (G.day || 1);
      root.querySelector('#mapLvl').textContent = lv;
      prog.innerHTML = '<b>DISTRICT PROGRESS</b><br>' + DISTRICTS.map((d, i) => '<span style="color:' + d.color + '">●</span> ' + d.name + ' — <b>' + M.progress[i] + '%</b>').join('<br>') + '<br><b>TOTAL: 7/7 DISTRICTS</b>';
      M.draw(ctx, cv.width, cv.height, false);
    },
    draw(c, Wpx, Hpx, mini) {
      const s = Math.min(Wpx, Hpx) / (WORLD * 2 + 40), cx = Wpx / 2, cy = Hpx / 2;
      const X = x => cx + x * s, Y = z => cy + z * s;
      c.clearRect(0, 0, Wpx, Hpx);
      c.fillStyle = mini ? '#0b2b33' : '#efe6c8'; c.fillRect(0, 0, Wpx, Hpx);
      // hover lanes: ring + spokes
      c.strokeStyle = mini ? '#2e7f8f' : '#0e7d8c'; c.lineWidth = mini ? 3 : 7;
      c.beginPath(); c.arc(cx, cy, 150 * s, 0, 7); c.stroke();
      for (const d of DISTRICTS) { c.beginPath(); c.moveTo(cx, cy); c.lineTo(X(d.x), Y(d.z)); c.stroke(); }
      // districts as coloured sectors: each wedge centred on the district's
      // true map angle and spanning halfway to its neighbours (the Spire is
      // the centre temple, not a wedge), so wedge colour always matches the
      // district sitting on it.
      const wrapPi = (a) => ((a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
      const angs = DISTRICTS.filter((d) => d.name !== 'Spire')
        .map((d) => ({ d, a: Math.atan2(d.z, d.x) })).sort((p, q) => p.a - q.a);
      angs.forEach((cur, i) => {
        const d = cur.d;
        const prev = angs[(i + angs.length - 1) % angs.length].a;
        const next = angs[(i + 1) % angs.length].a;
        const a0 = cur.a + wrapPi(prev - cur.a) / 2, a1 = cur.a + wrapPi(next - cur.a) / 2;
        c.fillStyle = d.color; c.globalAlpha = mini ? 0.85 : 0.55;
        c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, 300 * s, a0 + 0.03, a1 - 0.03); c.closePath(); c.fill(); c.globalAlpha = 1;
        c.fillStyle = mini ? '#fff' : '#222'; c.font = 'bold ' + (mini ? 9 : 15) + 'px system-ui'; c.textAlign = 'center';
        if (!mini) c.fillText(d.name.toUpperCase(), X(d.x * 0.82), Y(d.z * 0.82));
      });
      // Spire temple at centre
      c.fillStyle = '#f2c94c'; c.beginPath(); c.arc(cx, cy, (mini ? 10 : 22), 0, 7); c.fill();
      c.fillStyle = '#7a5c00'; c.font = 'bold ' + (mini ? 10 : 16) + 'px system-ui'; c.textAlign = 'center'; c.fillText('⛩', cx, cy + (mini ? 4 : 6));
      const mark = (x, z, txt, col, size) => { c.fillStyle = col; c.font = 'bold ' + size + 'px system-ui'; c.textAlign = 'center'; c.fillText(txt, X(x), Y(z)); };
      // markers: missions gold M, garage, safehouse, collectibles, NPD, Viper
      if (G.missions) G.missions.list.forEach(m => { if (!m.done) { const d = DISTRICTS.find(q => q.name === m.district); if (d) mark(d.x - 30, d.z - 20, 'M', '#b8860b', mini ? 12 : 22); } });
      mark(-200, -20, '🔧', '#222', mini ? 10 : 18); // Riko's garage, Skyport
      mark(-260, 30, '⌂', '#1a5c2e', mini ? 10 : 18); // safehouse (respawn point)
      if (G.quests) G.quests.collectibles.forEach(col => { if (!col.found && !mini) mark(col.x, col.z, '✦', '#0e7d8c', 12); });
      if (G.enemies) G.enemies.forEach(e => { const p = e.group ? e.group.position : e.pos || e; mark(p.x, p.z, '●', '#d21f1f', mini ? 7 : 12); });
      if (G.police) G.police.units.forEach(u => { const p = u.group ? u.group.position : u; mark(p.x, p.z, '●', '#2456ff', mini ? 7 : 12); });
      // waypoint + gold GPS route from player
      const pp = G.player ? (G.player.pos || { x: G.player.x || 0, z: G.player.z || 0 }) : { x: 0, z: 0 };
      if (M.waypoint) {
        c.strokeStyle = '#f2c94c'; c.setLineDash([6, 5]); c.lineWidth = mini ? 2 : 4;
        c.beginPath(); c.moveTo(X(pp.x), Y(pp.z)); c.lineTo(X(M.waypoint.x), Y(M.waypoint.z)); c.stroke(); c.setLineDash([]);
        mark(M.waypoint.x, M.waypoint.z, '◆', '#f2c94c', mini ? 12 : 22);
      }
      // player gold arrow
      c.save(); c.translate(X(pp.x), Y(pp.z)); c.rotate((G.player && (G.player.yaw ?? G.player.heading)) || 0);
      c.fillStyle = '#f2c94c'; c.beginPath(); c.moveTo(0, mini ? -8 : -14); c.lineTo(mini ? 6 : 10, mini ? 6 : 10); c.lineTo(mini ? -6 : -10, mini ? 6 : 10); c.closePath(); c.fill(); c.restore();
      if (!mini) { c.strokeStyle = '#c9a227'; c.lineWidth = 4; c.strokeRect(2, 2, Wpx - 4, Hpx - 4); }
    },
    drawMinimap(canvas) {
      if (!canvas) return;
      const c = canvas.getContext('2d'); if (!c) return;
      c.save(); c.beginPath(); c.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, 7); c.clip();
      M.draw(c, canvas.width, canvas.height, true); c.restore();
      c.strokeStyle = '#c9a227'; c.lineWidth = 4; c.beginPath(); c.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 2, 0, 7); c.stroke();
    },
  };
  cv.addEventListener('click', (e) => {
    const r = cv.getBoundingClientRect();
    const wx = ((e.clientX - r.left) / r.width * cv.width - cv.width / 2) / (Math.min(cv.width, cv.height) / (WORLD * 2 + 40));
    const wz = ((e.clientY - r.top) / r.height * cv.height - cv.height / 2) / (Math.min(cv.width, cv.height) / (WORLD * 2 + 40));
    const d = M.districtAt(wx, wz);
    if (d) {
      const i = DISTRICTS.indexOf(d);
      const got = G.quests ? G.quests.collectibles.filter(c => { const dd = (c.x - d.x) ** 2 + (c.z - d.z) ** 2; return dd < 120 * 120 && c.found; }).length : 0;
      const tot = G.quests ? G.quests.collectibles.filter(c => (c.x - d.x) ** 2 + (c.z - d.z) ** 2 < 120 * 120).length : 0;
      info.innerHTML = '<b style="color:#f2c94c">⛩ ' + d.name + '</b> — ' + d.gapura + ' • Faksi: ' + d.faction + ' • Misi: ' + (d.missions.map(mi => G.missions && G.missions.list[mi] ? G.missions.list[mi].name : '').join(', ') || '—') + ' • Koleksi: ' + got + '/' + tot + ' • Wilayah: ' + M.progress[i] + '%';
    } else { M.setWaypoint(Math.round(wx), Math.round(wz)); info.textContent = 'Waypoint: (' + Math.round(wx) + ', ' + Math.round(wz) + ') — rute GPS emas ditandai.'; }
    M.render();
  });
  root.querySelector('#mapResume').onclick = () => M.close();
  root.querySelector('#mapSettings').onclick = () => { if (G.audio) G.audio.toggleMute && G.audio.toggleMute(); if (G.hud) G.hud.toast('Settings: suara ' + (G.audio && G.audio.muted ? 'mati' : 'hidup'), 'sub'); };
  root.querySelector('#mapExit').onclick = () => { M.close(); if (G.state) G.state = 'title'; };
  G.map = M;
}

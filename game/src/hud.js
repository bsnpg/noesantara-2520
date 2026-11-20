// HUD (DOM in div#hud, gold + teal, batik trim). All updates go through G.hud methods;
// update(dt) polls G each frame (minimap redraw, clock, quest list, speed).
// Weapons: 0 Pistol, 1 SMG, 2 Shotgun, 3 Rifle, 4 Bazooka, 5 Fists (wheel order from top).
// NOTE: the weapon wheel lives ONLY in wheel.js — this file has no wheel, no Q/Tab
// handling and no POV switching; wheel.js calls H.setWeapon to update the label.
const WEAPONS = ['Pistol', 'SMG', 'Shotgun', 'Rifle', 'Bazooka', 'Fists'];
const PERIODS = [[5, 'Morning', '🌅'], [11, 'Afternoon', '☀️'], [17, 'Evening', '🌇'], [19, 'Night', '🌙']];
function el(tag, css, html) { const e = document.createElement(tag); e.style.cssText = css; if (html != null) e.innerHTML = html; return e; }
const BOX = 'background:rgba(8,32,32,.82);border:2px solid #c9a227;border-radius:10px;color:#f5e6b8;padding:8px 12px;';
const BAR = 'height:10px;border-radius:5px;background:#123;overflow:hidden;';
export function initHud(G) {
  // Reuse the #hud layer from index.html (never a second #hud in the DOM).
  let root = document.getElementById('hud');
  if (!root) {
    root = el('div', 'position:fixed;inset:0;pointer-events:none;z-index:30;font-family:system-ui,sans-serif;');
    root.id = 'hud';
    document.body.appendChild(root);
  }
  root.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:30;font-family:system-ui,sans-serif;';
  const tl = el('div', 'position:absolute;top:12px;left:12px;' + BOX + 'width:230px', '<b style="color:#f2c94c">HEALTH</b> <span id="hudHpT" style="float:right">100%</span><div style="' + BAR + '"><div id="hudHp" style="height:100%;width:100%;background:linear-gradient(90deg,#f2c94c,#ffe98a)"></div></div><b style="color:#4dd8c3">ARMOR</b> <span id="hudArT" style="float:right">0%</span><div style="' + BAR + '"><div id="hudAr" style="height:100%;width:0%;background:#2ec4b6"></div></div><div id="hudWanted" style="margin-top:4px;font-size:18px;letter-spacing:3px">☆☆☆☆☆</div>');
  const banner = el('div', 'position:absolute;top:10px;left:50%;transform:translateX(-50%);text-align:center;' + BOX + 'border-width:3px;min-width:400px;max-width:640px', '<div id="hudMission" style="font-size:22px;font-weight:900;color:#f2c94c">NOESANTARA 2520</div><div id="hudObj" style="font-size:14px;color:#7fe7d2">Jelajahi kota — tekan M untuk peta</div><div id="hudBoss" style="display:none;margin-top:4px"><b id="hudBossN" style="color:#ff6b6b">RAZOR — BOSS</b><div style="' + BAR + '"><div id="hudBossHp" style="height:100%;width:100%;background:#d21f1f"></div></div></div><div id="hudTruck" style="display:none;margin-top:4px"><b style="color:#f2c94c">🚚 GAJAH</b><div style="' + BAR + '"><div id="hudTruckHp" style="height:100%;width:100%;background:#f2c94c"></div></div></div>');
  const tr = el('div', 'position:absolute;top:12px;right:12px;text-align:right', '<canvas id="hudMini" width="170" height="170" style="border:3px solid #c9a227;border-radius:50%;background:#0b2b33"></canvas><div style="' + BOX + 'margin-top:6px;font-size:15px"><span id="hudClock">14:00</span> • <span id="hudPeriod">Afternoon ☀️</span><br><span style="color:#7fe7d2">DAY <span id="hudDay">1</span></span></div>');
  const br = el('div', 'position:absolute;bottom:12px;right:12px;text-align:right;' + BOX, '<div style="font-size:44px;font-weight:900;color:#f2c94c;line-height:1"><span id="hudSpeed">0</span><span style="font-size:16px;color:#7fe7d2"> km/h</span></div><div style="font-size:12px;color:#7fe7d2">BOOST <span id="hudBoostT">0%</span> • <span id="hudLane">LOWER LANE</span></div><div style="' + BAR + 'width:170px"><div id="hudBoost" style="height:100%;width:0%;background:#2ec4b6"></div></div><div id="hudCar" style="margin-top:4px;font-size:12px">GARUDA GT <span id="hudCarHp">100%</span><div style="' + BAR + '"><div id="hudCarBar" style="height:100%;width:100%;background:#f2c94c"></div></div></div>');
  const bl = el('div', 'position:absolute;bottom:12px;left:12px;' + BOX, '<div style="font-size:18px"><b id="hudWeapon">Fists</b> <span id="hudAmmo" style="color:#7fe7d2"></span></div><div style="font-size:12px;color:#bfae7a">Tahan Q / Tab — weapon wheel • 1–6 pilih cepat</div>');
  const cross = el('div', 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;display:none', '<div style="width:14px;height:14px;border:2px solid #f2c94c;border-radius:50%;margin:0 auto;box-shadow:0 0 6px #f2c94c"></div><div id="hudPrompt" style="margin-top:10px;font-size:15px;color:#fff;text-shadow:0 1px 4px #000"></div>');
  const dist = el('div', 'position:absolute;top:22%;left:50%;transform:translateX(-50%);text-align:center;display:none;' + BOX + 'border-width:3px', '<div id="hudDistN" style="font-size:30px;font-weight:900;color:#f2c94c">⛩ DISTRIK NEON</div><div id="hudDistT" style="color:#7fe7d2">Wilayah Neon Wolves</div>');
  const quests = el('div', 'position:absolute;top:170px;left:12px;width:250px;' + BOX + 'font-size:13px', '<b style="color:#f2c94c">QUEST TRACKER</b><div id="hudQuests" style="margin-top:4px">—</div>');
  const xpbar = el('div', 'position:absolute;bottom:0;left:0;right:0;height:8px;background:#123', '<div id="hudXp" style="height:100%;width:0%;background:linear-gradient(90deg,#c9a227,#f2c94c)"></div>');
  const toasts = el('div', 'position:absolute;top:120px;left:50%;transform:translateX(-50%);text-align:center;pointer-events:none');
  [tl, banner, tr, br, bl, cross, dist, quests, xpbar, toasts].forEach(e => root.appendChild(e));
  const $ = id => root.querySelector('#' + id);
  const H = {
    weapon: 5, ammo: { 0: 42, 1: 90, 2: 24, 3: 60, 4: 3, 5: Infinity },
    setHealth(h, m) { const p = Math.max(0, Math.round(h / (m || 100) * 100)); $('hudHp').style.width = p + '%'; $('hudHpT').textContent = p + '%'; },
    setArmor(a, m) { const p = Math.max(0, Math.round(a / (m || 100) * 100)); $('hudAr').style.width = p + '%'; $('hudArT').textContent = p + '%'; },
    setWanted(n) { const s = '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n); const e = $('hudWanted'); e.textContent = s; e.style.color = n >= 4 ? '#ff5252' : n >= 2 ? '#ffb020' : '#f2c94c'; },
    banner(t, s) { $('hudMission').textContent = t; if (s) $('hudObj').textContent = s; },
    setObjective(o, en) { $('hudObj').textContent = o + (en ? ' • ' + en : ''); },
    setSpeed(kmh, boost, lane, integ) { $('hudSpeed').textContent = Math.round(kmh); $('hudBoost').style.width = Math.round(boost * 100) + '%'; $('hudBoostT').textContent = Math.round(boost * 100) + '%'; $('hudLane').textContent = lane || 'LOWER LANE'; if (integ != null) { $('hudCarHp').textContent = Math.round(integ) + '%'; $('hudCarBar').style.width = Math.round(integ) + '%'; } },
    setWeapon(i, ammo) { H.weapon = i; $('hudWeapon').textContent = WEAPONS[i]; $('hudAmmo').textContent = i === 5 ? '' : '• ' + (ammo != null ? ammo : H.ammo[i]) + ' ammo'; if (ammo != null) H.ammo[i] = ammo; },
    setClock(h, day) { const hh = Math.floor(h), mm = Math.floor((h % 1) * 60); $('hudClock').textContent = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0'); let p = PERIODS[3]; for (const q of PERIODS) if (h >= q[0]) p = q; $('hudPeriod').textContent = p[1] + ' ' + p[2]; $('hudDay').textContent = day || 1; },
    setXp(xp, level, need) { $('hudXp').style.width = Math.min(100, xp / (need || 1000) * 100) + '%'; },
    districtBanner(name, tag) { $('hudDistN').textContent = '⛩ ' + name.toUpperCase(); $('hudDistT').textContent = tag || ''; dist.style.display = 'block'; clearTimeout(H._dt); H._dt = setTimeout(() => dist.style.display = 'none', 2600); },
    bossBar(name, hp) { $('hudBoss').style.display = hp == null ? 'none' : 'block'; if (hp != null) { $('hudBossN').textContent = name + ' — BOSS'; $('hudBossHp').style.width = Math.max(0, hp) + '%'; } },
    setTruckHp(hp) { $('hudTruck').style.display = hp == null ? 'none' : 'block'; if (hp != null) $('hudTruckHp').style.width = Math.max(0, hp) + '%'; },
    prompt(t) { cross.style.display = t ? 'block' : 'none'; $('hudPrompt').textContent = t || ''; },
    showPrompt(t) { H.prompt(t); },
    toast(text, kind) {
      const t = el('div', 'margin-top:6px;padding:10px 22px;font-size:18px;font-weight:800;border-radius:10px;border:2px solid #c9a227;' + (kind === 'reward' ? 'background:linear-gradient(90deg,#8a6d00,#c9a227);color:#fff;box-shadow:0 0 24px #f2c94c' : kind === 'bad' ? 'background:rgba(120,20,20,.9);color:#ffb3b3' : 'background:rgba(8,32,32,.9);color:#f5e6b8'), text);
      toasts.appendChild(t); setTimeout(() => t.remove(), kind === 'reward' ? 4200 : 2800);
    },
    update() {
      if (G.map) G.map.drawMinimap($('hudMini'));
      if (G.timeOfDay != null) H.setClock(G.timeOfDay, G.day);
      if (G.progression) { H.setWanted(G.progression.wanted); H.setXp(G.progression.xp, G.progression.level, G.progression.xpNeed); }
      if (G.player) { H.setHealth(G.player.hp != null ? G.player.hp : (G.player.health != null ? G.player.health : 100)); H.setArmor(G.player.armor || 0); if (G.player.inCar && G.car) H.setSpeed(G.car.speedKmh || 0, (G.car.boost || 0) / 100, G.car.lane, G.car.integrity); }
      if (G.quests) { // quest list: max 3 active + progress
        const act = G.quests.list.filter(q => q.active).slice(0, 3);
        $('hudQuests').innerHTML = act.length ? act.map(q => '<div style="margin-top:4px">◆ <b>' + q.name + '</b> — ' + q.progress + '/' + q.goal + '<br><span style="color:#7fe7d2">' + q.en + '</span></div>').join('') : '—';
      }
      const d = G.player && G.districts && G.districts.length ? G.districts.find(dd => {
        const p = G.player.pos || G.player;
        const dx = dd.centre ? dd.centre.x : (dd.cx != null ? dd.cx : (dd.x || 0));
        const dz = dd.centre ? dd.centre.z : (dd.cz != null ? dd.cz : (dd.z || 0));
        return Math.hypot((p.x || 0) - dx, (p.z || 0) - dz) < 90;
      }) : null;
      if (d && H._lastDist !== d.name) { H._lastDist = d.name; H.districtBanner(d.name, d.faction ? 'Wilayah ' + d.faction : ''); }
    },
  };
  G.hud = H;
}

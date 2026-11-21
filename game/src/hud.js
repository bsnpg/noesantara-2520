// hud.js — all DOM HUD: mission card, status cluster, district banner + minimap,
// weapon strip / speedometer / ON FOOT card, dialog, toast, crosshair, NPD panel,
// boss bar, finish standings + WINNER banner.
import { DISTRICTS, WEAPONS, periodFor } from './config.js';
import { drawMinimap } from './map.js';

const $ = (id) => document.getElementById(id);
const SUN = { Morning: '🌅', Afternoon: '☀️', Evening: '🌇', Night: '🌙' };
const fmtRp = (n) => 'Rp ' + n.toLocaleString('id-ID');

export function createHud(ctx) {
  let toastTimer = null;
  const h = {
    prompt: '',
    toast(msg) {
      const t = $('toast');
      t.textContent = msg; t.style.display = 'block';
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { t.style.display = 'none'; }, 3200);
    },
    setDialog(name, role, line) {
      $('dialog-avatar').textContent = name[0];
      $('dialog-name').textContent = name + ' · ' + role;
      $('dialog-line').textContent = line;
    },
    missionTarget() {
      const m = ctx.missions;
      if (m.index === 0 || m.index === 3 || m.index === 6) return `LAP ${m.lap}/${m.lapsTotal}`;
      if (m.index === 2) {
        if (m.stage >= 4) return `VIPER ${m.vipersDown}/${m.vipersTotal}`;
        const px = ctx.player.inCar ? ctx.vehicles.hero.position.x : ctx.player.x;
        const pz = ctx.player.inCar ? ctx.vehicles.hero.position.z : ctx.player.z;
        const cps = [[-230, -173], [-230, -200], [-182, -250]];
        const cp = cps[Math.min(m.stage - 1, 2)];
        return `TARGET ${Math.max(1, Math.round(Math.hypot(cp[0] - px, cp[1] - pz)))} m`;
      }
      if (m.index === 4) return `TRUK ${Math.round(m.truckHp)}%`;
      if (m.index === 5) return `VIPER ${m.vipersDown}/8`;
      return `STAGE ${m.stage}/4`;
    },
    update() {
      const p = ctx.progression, m = ctx.missions;
      const a = m.active();
      const d = DISTRICTS[a.district];
      $('mission-code').textContent = `MISI ${m.index + 1}/8 · ${d.name.toUpperCase()}`;
      $('mission-stage').textContent = `STAGE ${m.stage}/4`;
      $('mission-name').textContent = a.name;
      $('mission-obj').textContent = m.stageText();
      $('mission-target').textContent = h.missionTarget();
      $('mission-next').textContent = 'BERIKUTNYA: ' + m.nextText();
      // Status cluster.
      $('money').textContent = fmtRp(p.money);
      const stars = $('wanted').children;
      for (let i = 0; i < 5; i += 1) stars[i].classList.toggle('off', i >= p.wanted);
      $('wanted-label').textContent = p.wanted === 0 ? 'AMAN' : 'WANTED ' + p.wanted;
      const hh = Math.floor(p.hour), mm = Math.floor((p.hour - hh) * 60);
      const period = periodFor(p.hour);
      $('clock').textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} · ${period} ${SUN[period]} · DAY ${p.day}`;
      $('health-fill').style.width = p.health + '%';
      $('health-num').textContent = Math.round(p.health) + '%';
      $('armor-fill').style.width = p.armor + '%';
      $('armor-num').textContent = Math.round(p.armor) + '%';
      $('level-label').textContent = 'LV.' + p.level();
      $('xp-fill').style.width = (p.xpInLevel() / p.xpNeedNow()) * 100 + '%';
      $('xp-num').textContent = `XP ${p.xpInLevel()}/${p.xpNeedNow()}`;
      // District banner + minimap.
      const here = ctx.districtAt(ctx.player.inCar ? ctx.vehicles.hero.position.x : ctx.player.x, ctx.player.inCar ? ctx.vehicles.hero.position.z : ctx.player.z);
      $('district-name').innerHTML = `${here.name.toUpperCase()} · <span>Wilayah ${here.faction}</span>`;
      drawMinimap($('minimap'), ctx);
      // Dialog from the active mission crew line.
      const [dn, dl] = a.dialog;
      h.setDialog(dn, dn === 'Mara' ? 'Navigator Wolves' : dn === 'Riko' ? 'Mekanik' : dn === 'Kiko' ? 'Shooter Wolves' : 'Chrome Vipers', dl);
      // Weapon strip + speedo / ON FOOT.
      const strip = $('weapon-strip');
      strip.innerHTML = WEAPONS.map((w, i) =>
        `<div class="wslot${i === ctx.player.weaponIndex ? ' sel' : ''}"><b>${w.name}</b><span>${w.ammo}</span></div>`).join('');
      const inCar = ctx.player.inCar;
      $('speedo').style.display = inCar ? 'block' : 'none';
      $('onfoot-card').style.display = inCar ? 'none' : 'block';
      if (inCar) {
        $('speed').textContent = ctx.driving.kmh();
        $('boost-fill').style.width = ctx.driving.boost + '%';
        $('boost-label').textContent = `BOOST ${Math.round(ctx.driving.boost)}% · LOWER LANE`;
        $('integrity-fill').style.width = ctx.driving.integrity + '%';
        $('integrity-label').textContent = 'GARUDA GT ' + Math.round(ctx.driving.integrity) + '%';
        $('vehicle-name').textContent = 'GARUDA GT';
      } else {
        const w = ctx.player.weapon();
        $('onfoot-weapon').innerHTML = `${w.name} <span>${w.ammo}</span>`;
      }
      // Crosshair + prompt.
      const fps = ctx.player.isFps();
      $('crosshair').style.display = fps && !ctx.wheel.open && !ctx.mapOpen ? 'block' : 'none';
      $('prompt').style.display = h.prompt && !ctx.mapOpen ? 'block' : 'none';
      $('prompt').textContent = h.prompt;
      // NPD panel.
      const npd = $('npd-panel');
      if (p.wanted > 0) {
        npd.style.display = 'block';
        $('npd-list').innerHTML = ctx.police.units.map((u) =>
          `<div>NPD ${u.kind} · ${u.mode} · ${u.dist || 0} m</div>`).join('');
        $('npd-count').textContent = `NPD ×${ctx.police.units.length}`;
      } else npd.style.display = 'none';
      // Finish standings + WINNER banner.
      const fin = $('finish-panel'), win = $('winner-banner');
      if (m.standings) {
        fin.style.display = 'block'; win.style.display = 'block';
        $('standings-list').innerHTML = m.standings.map((s) => {
          if (s.pos === 1) return `<div class="first">🏆 WINNER — ${s.name}</div><div class="first">1st · ${s.name} · ${s.car} · FINISH</div>`;
          const suf = s.pos === 2 ? 'nd' : s.pos === 3 ? 'rd' : 'th';
          return `<div>${s.pos}${suf} · ${s.name} · ${s.car} · ${s.gap}</div>`;
        }).join('');
      } else { fin.style.display = 'none'; win.style.display = 'none'; }
      // Boss bar hidden unless a boss is set (combat.js shows it).
      if (!m.boss) $('boss-bar').style.display = 'none';
      // Truck bar during convoy.
      const tb = $('truck-bar');
      if (m.index === 4) { tb.style.display = 'block'; document.getElementById('truck-fill').style.width = m.truckHp + '%'; }
      else tb.style.display = 'none';
    },
  };
  return h;
}

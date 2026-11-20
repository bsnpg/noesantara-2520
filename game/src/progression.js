// Progression: Credits (Rp), XP + Level (cap 50), garage (2 tracks x 5 tiers),
// weapon shop, properties + territory income, save/checkpoint/fail states.
// Time of day / day count are owned by main.js (G.timeOfDay from G.clock);
// this module only pays territory income on day rollover and mirrors Wanted
// from police.js (G.wanted is the police {stars, heat} object — never clobbered).
// Persists to localStorage 'noesantara2520.save'. Wanted lives in police.js.
const SAVE_KEY = 'noesantara2520.save';
const GARAGE_COST = [0, 800, 1800, 3200, 5000]; // tier 1..5 (tier 0 = stock)
const WEAPONS = [
  { name: 'Pistol', cost: 0 }, { name: 'SMG', cost: 600 }, { name: 'Shotgun', cost: 1200 },
  { name: 'Rifle', cost: 2000 }, { name: 'Bazooka', cost: 4000 },
];
const WANTED_DESC = ['', 'Patrol', 'Interceptor chase', 'Roadblock', 'Helikopter', 'Lockdown'];
export function initProgression(G) {
  const P = {
    credits: 0, xp: 0, level: 1, xpNeed: 400, wanted: 0,
    garage: { engine: 0, armor: 0 }, ownedWeapons: [0], properties: { safehouse: true, shops: 0 },
    checkpointPhase: 0, dayIncome: 0, _lastDay: 1,
    addCredits(n) { P.credits += n; if (G) { G.credits = P.credits; } },
    addXp(n) {
      P.xp += n;
      while (P.xp >= P.xpNeed && P.level < 50) { P.xp -= P.xpNeed; P.level += 1; P.xpNeed = Math.round(P.xpNeed * 1.25); if (G.hud) G.hud.toast('LEVEL UP! Level ' + P.level + ' — gear baru terbuka', 'reward'); if (G.audio) G.audio.chime(); }
      if (G) { G.xp = P.xp; G.level = P.level; }
    },
    buyUpgrade(track) {
      const t = P.garage[track]; if (t >= 5) return false;
      const cost = GARAGE_COST[t]; if (P.credits < cost) { if (G.hud) G.hud.toast('Credits kurang (butuh Rp ' + cost + ')', 'bad'); return false; }
      P.credits -= cost; P.garage[track] += 1;
      if (G.car) { if (track === 'engine') G.car.topSpeed = (G.car.topSpeed || 200) + 12; else G.car.integrity = 100; }
      if (G.hud) G.hud.toast(track + ' → tier ' + P.garage[track] + ' (cat + underglow batik baru)', 'reward');
      return true;
    },
    buyWeapon(i) {
      const w = WEAPONS[i]; if (!w || P.ownedWeapons.includes(i)) return false;
      if (P.credits < w.cost) { if (G.hud) G.hud.toast('Credits kurang (butuh Rp ' + w.cost + ')', 'bad'); return false; }
      P.credits -= w.cost; P.ownedWeapons.push(i);
      if (G.hud) { G.hud.toast(w.name + ' dibeli di Pasar Nusantara', 'reward'); G.hud.setWeapon(i, 999); }
      return true;
    },
    buyShop() { // shops pay territory income per day
      if (P.credits < 1500) { if (G.hud) G.hud.toast('Toko butuh Rp 1500', 'bad'); return false; }
      P.credits -= 1500; P.properties.shops += 1; if (G.hud) G.hud.toast('Toko dibeli — pemasukan wilayah naik', 'reward'); return true;
    },
    addWanted(n) { if (G.police) G.police.addHeat(n * 20); P.wanted = (G.wanted && G.wanted.stars) || 0; if (G.hud) G.hud.setWanted(P.wanted); if (P.wanted >= 3 && G.audio) G.audio.siren(); },
    clearWanted() { if (G.police) G.police.clear(); P.wanted = 0; if (G.hud) G.hud.setWanted(0); },
    checkpoint() { P.checkpointPhase = G.missions && G.missions.active ? G.missions.active.phase : 0; P.autosave(); },
    autosave() { P.saveGame(true); },
    saveGame(silent) {
      try { window.localStorage.setItem(SAVE_KEY, JSON.stringify({ credits: P.credits, xp: P.xp, level: P.level, garage: P.garage, ownedWeapons: P.ownedWeapons, shops: P.properties.shops, day: G.day || 1, time: G.timeOfDay || 16.5 })); if (!silent && G.hud) G.hud.toast('Game tersimpan 💾', 'sub'); } catch (e) { /* storage off */ }
    },
    loadGame() {
      try { const s = JSON.parse(window.localStorage.getItem(SAVE_KEY) || 'null'); if (!s) return false; Object.assign(P, { credits: s.credits || 0, xp: s.xp || 0, level: s.level || 1, garage: s.garage || P.garage, ownedWeapons: s.ownedWeapons || [0] }); P.properties.shops = s.shops || 0; if (G) { G.day = s.day || 1; G.timeOfDay = s.time || 16.5; G.credits = P.credits; G.xp = P.xp; G.level = P.level; } return true; } catch (e) { return false; }
    },
    sleep() { // manual save at safehouse: heal + clear Wanted
      if (G.player) { G.player.hp = 100; G.player.health = 100; G.player.armor = 100; }
      P.clearWanted(); P.saveGame(); if (G.hud) { G.hud.toast('Tidur di safehouse — HP penuh, Wanted 0, tersimpan', 'reward'); G.hud.setHealth(100); }
    },
    onDeath() { // respawn nearest safehouse, -10% credits, Wanted 0, resume checkpoint
      const loss = Math.floor(P.credits * 0.1); P.credits -= loss; P.clearWanted();
      if (G.player) { G.player.hp = 100; G.player.health = 100; if (G.player.pos) { G.player.pos.x = -260; G.player.pos.z = 30; } }
      if (G.missions && G.missions.active) G.missions.active.phase = P.checkpointPhase;
      if (G.hud) G.hud.toast('Kamu tumbang — respawn di safehouse, -Rp ' + loss.toLocaleString('id-ID'), 'bad');
      P.autosave();
    },
    onBusted() { // Wanted 5 + surrounded
      const fine = Math.floor(P.credits * 0.1); P.credits -= fine; P.clearWanted();
      if (G.hud) G.hud.toast('BUSTED! Denda Rp ' + fine.toLocaleString('id-ID'), 'bad');
    },
    carDestroyed() { // Garuda GT respawns at Riko's garage (Skyport), small fee
      const fee = 200; P.credits = Math.max(0, P.credits - fee);
      if (G.car && G.car.group) { G.car.integrity = 100; G.car.group.position.set(-210, 0.55, -20); G.car.heading = 0; }
      if (G.hud) G.hud.toast('Garuda GT diperbaiki di garage Riko — Rp ' + fee, 'sub');
    },
    update(dt) {
      // Day rollover (day is owned by main.js): pay territory income once.
      const day = G.day || 1;
      if (day !== P._lastDay) {
        P._lastDay = day;
        const wolves = G.missions ? G.missions.list.filter(m => m.done).length : 0;
        const income = P.properties.shops * 300 + wolves * 150;
        if (income > 0) { P.addCredits(income); if (G.hud) G.hud.toast('Pemasukan wilayah hari ' + day + ': +Rp ' + income.toLocaleString('id-ID'), 'reward'); }
        P.autosave();
      }
      // Mirror Wanted stars from police.js (G.wanted is the police object).
      if (G.wanted && typeof G.wanted.stars === 'number') P.wanted = G.wanted.stars;
      if (G) { G.credits = P.credits; G.xp = P.xp; G.level = P.level; }
    },
  };
  P.loadGame();
  G.progression = P;
}

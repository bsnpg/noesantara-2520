





const SAVE_KEY = 'noesantara2520.save';
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
 addWanted(n) { if (G.police) G.police.addHeat(n * 20); P.wanted = (G.wanted && G.wanted.stars) || 0; if (G.hud) G.hud.setWanted(P.wanted); if (P.wanted >= 3 && G.audio) G.audio.siren(); },
 clearWanted() { if (G.police) G.police.clear(); P.wanted = 0; if (G.hud) G.hud.setWanted(0); },
 checkpoint() { P.checkpointPhase = G.missions && G.missions.active ? G.missions.active.phase : 0; P.autosave(); },
 autosave() { P.saveGame(true); },
 saveGame(silent) {
 try { window.localStorage.setItem(SAVE_KEY, JSON.stringify({ credits: P.credits, xp: P.xp, level: P.level, garage: P.garage, ownedWeapons: P.ownedWeapons, shops: P.properties.shops, day: G.day || 1, time: G.timeOfDay || 16.5 })); if (!silent && G.hud) G.hud.toast('Game tersimpan 💾', 'sub'); } catch (e) {  }
 },
 loadGame() {
 try { const s = JSON.parse(window.localStorage.getItem(SAVE_KEY) || 'null'); if (!s) return false; Object.assign(P, { credits: s.credits || 0, xp: s.xp || 0, level: s.level || 1, garage: s.garage || P.garage, ownedWeapons: s.ownedWeapons || [0] }); P.properties.shops = s.shops || 0; if (G) { G.day = s.day || 1; G.timeOfDay = s.time || 16.5; G.credits = P.credits; G.xp = P.xp; G.level = P.level; } return true; } catch (e) { return false; }
 },
 onDeath() { 
 const loss = Math.floor(P.credits * 0.1); P.credits -= loss; P.clearWanted();
 if (G.player) { G.player.hp = 100; G.player.health = 100; if (G.player.pos) { G.player.pos.x = -260; G.player.pos.z = 30; } }
 if (G.missions && G.missions.active) G.missions.active.phase = P.checkpointPhase;
 if (G.hud) G.hud.toast('Kamu tumbang — respawn di safehouse, -Rp ' + loss.toLocaleString('id-ID'), 'bad');
 P.autosave();
 },
 onBusted() { 
 const fine = Math.floor(P.credits * 0.1); P.credits -= fine; P.clearWanted();
 if (G.hud) G.hud.toast('BUSTED! Denda Rp ' + fine.toLocaleString('id-ID'), 'bad');
 },
 update(dt) {
 
 const day = G.day || 1;
 if (day !== P._lastDay) {
 P._lastDay = day;
 const wolves = G.missions ? G.missions.list.filter(m => m.done).length : 0;
 const income = P.properties.shops * 300 + wolves * 150;
 if (income > 0) { P.addCredits(income); if (G.hud) G.hud.toast('Pemasukan wilayah hari ' + day + ': +Rp ' + income.toLocaleString('id-ID'), 'reward'); }
 P.autosave();
 }
 
 if (G.wanted && typeof G.wanted.stars === 'number') P.wanted = G.wanted.stars;
 if (G) { G.credits = P.credits; G.xp = P.xp; G.level = P.level; }
 },
 };
 P.loadGame();
 G.progression = P;
}

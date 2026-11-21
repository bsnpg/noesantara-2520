// progression.js — Credits (Rp), XP/level, save, district progress, explored cells.
import { DISTRICTS } from './config.js';

export function xpNeed(level) { return 250 * level; }
export function levelFor(totalXp) {
  let level = 1, cum = 0;
  while (totalXp >= cum + xpNeed(level)) { cum += xpNeed(level); level += 1; }
  return { level, inLevel: totalXp - cum, need: xpNeed(level) };
}
export function createProgression(ctx) {
  const p = {
    money: 0, totalXp: 0, health: 100, armor: 50,
    hour: 8, day: 1, wanted: 0,
    batik: 0, questsDone: 0, racesWon: 0, missionsDone: 0, districtsOwned: 0,
    visited: new Map(), // district id -> Set of "gx,gz" cells (40-unit grid)
    saveKey: 'noesantara2520.save',
    level() { return levelFor(p.totalXp).level; },
    xpInLevel() { return levelFor(p.totalXp).inLevel; },
    xpNeedNow() { return levelFor(p.totalXp).need; },
    addMoney(n) { p.money += n; },
    addXp(n) { p.totalXp += n; },
    markVisited(x, z) {
      const d = ctx.districtAt(x, z);
      if (!d) return;
      let s = p.visited.get(d.id);
      if (!s) { s = new Set(); p.visited.set(d.id, s); }
      s.add(Math.floor(x / 40) + ',' + Math.floor(z / 40));
    },
    seenPct(d) {
      const s = p.visited.get(d.id);
      return s ? Math.min(100, Math.round((s.size / d.cells) * 100)) : 0;
    },
    // District progress: batik weight + exploration weight (tuned so the staged
    // 15-batik / 2-quest state reads 9/6/9/0/6/5/8, total 6%).
    districtProgress(d) {
      const batikIn = ctx.quests.batikInDistrict(d.id);
      return Math.round(batikIn * 2.12 + p.seenPct(d) * 0.05);
    },
    completion() {
      const vals = DISTRICTS.map((d) => p.districtProgress(d));
      return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    },
    exploredPct() { return Math.round((p.batik / 50) * 100); },
    save() {
      try {
        window.localStorage.setItem(p.saveKey, JSON.stringify({
          money: p.money, totalXp: p.totalXp, health: p.health, armor: p.armor,
          hour: p.hour, day: p.day, batik: p.batik, questsDone: p.questsDone,
        }));
      } catch { /* storage off: session-only */ }
    },
    load() {
      try {
        const s = JSON.parse(window.localStorage.getItem(p.saveKey) || 'null');
        if (!s) return;
        Object.assign(p, s);
      } catch { /* corrupt save: start fresh */ }
    },
  };
  return p;
}

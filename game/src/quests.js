// quests.js — 4 side quests + 50 batik hologram collectibles.
// Rewards flow through the real progression system (money + XP).
import { SIDE_QUESTS } from './config.js';

export function createQuests(ctx) {
  const q = {
    side: SIDE_QUESTS.map((s) => ({ ...s, done: false })),
    batikFound: 0,
    batikByDistrict: [0, 0, 0, 0, 0, 0, 0],
    batikInDistrict(id) { return q.batikByDistrict[id] || 0; },
    collectBatik(c) {
      if (!c || c.taken) return false;
      c.taken = true;
      if (c.mesh) c.mesh.visible = false;
      q.batikFound += 1; q.batikByDistrict[c.district] += 1;
      ctx.progression.batik += 1;
      ctx.progression.addXp(10);
      return true;
    },
    collectNearest(x, z, maxD = 4) {
      let best = null, bd = maxD;
      for (const c of ctx.collectibles) {
        if (c.taken) continue;
        const d = Math.hypot(c.x - x, c.z - z);
        if (d < bd) { bd = d; best = c; }
      }
      return best ? q.collectBatik(best) : false;
    },
    completeQuest(id) {
      const s = q.side.find((x) => x.id === id);
      if (!s || s.done) return false;
      s.done = true;
      ctx.progression.questsDone += 1;
      ctx.progression.addMoney(s.reward);
      ctx.progression.addXp(s.xp);
      ctx.hud.toast(`QUEST SELESAI — ${s.name} · +Rp ${s.reward} + ${s.xp} XP`);
      return true;
    },
    doneCount() { return q.side.filter((s) => s.done).length; },
  };
  return q;
}

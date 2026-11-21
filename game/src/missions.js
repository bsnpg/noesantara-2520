// missions.js — 8 missions, 3 acts. Stage machine, race laps on the illegal
// circuit, gang-war checkpoints, convoy HP, boss bar data.
import { MISSIONS, DISTRICTS } from './config.js';

// Illegal circuit (map plan §5): Gapura Neon → east Jl Raya Utara → Pasar →
// south ring east → west Jl Raya Selatan → Candi → Undercity → north Jl Raya Barat.
export const CIRCUIT = [
  [-230, -200], [230, -200], [320, -200], [320, 200], [230, 200], [-230, 200], [-230, -200],
];
export const STANDINGS_FINISH = [
  { pos: 1, name: 'WOWO "GHOST"', car: 'Garuda GT', gap: 'FINISH' },
  { pos: 2, name: 'RAZOR', car: 'Komodo R', gap: '+45 m' },
  { pos: 3, name: 'KOBRA', car: 'Viper', gap: '+120 m' },
  { pos: 4, name: 'SANCA', car: 'Viper', gap: '+210 m' },
  { pos: 5, name: 'WELING', car: 'Viper', gap: '+340 m' },
];

export function createMissions(ctx) {
  const m = {
    list: MISSIONS.map((x, i) => ({ ...x, status: i === 0 ? 'active' : i === 1 ? 'next' : 'locked' })),
    index: 0, stage: 1, lap: 1, lapsTotal: 3,
    vipersDown: 0, vipersTotal: 6, truckHp: 100, boss: null,
    standings: null, raceWp: 0, raceDist: 0,
    active() { return m.list[m.index]; },
    stageText() { return m.active().stages[Math.min(m.stage, 4) - 1]; },
    nextText() {
      const a = m.active();
      if (m.stage >= 4) return `Selesaikan — Rp ${a.reward.toLocaleString('id-ID')} + ${a.xp} XP`;
      return a.stages[m.stage];
    },
    setStage(s) { m.stage = Math.max(1, Math.min(4, s)); },
    setMission(i, stage = 1) { m.index = i; m.stage = stage; m.lap = 1; m.vipersDown = 0; m.truckHp = 100; m.boss = null; m.standings = null; },
    complete() {
      const a = m.active();
      a.status = 'done';
      ctx.progression.missionsDone += 1;
      ctx.progression.addMoney(a.reward);
      ctx.progression.addXp(a.xp);
      ctx.hud.toast(`MISI SELESAI — ${a.name} · +Rp ${a.reward.toLocaleString('id-ID')} + ${a.xp} XP`);
      if (a.name === 'Balapan Pertama' || a.name === 'Balapan Maut') ctx.progression.racesWon += 1;
      if (m.index + 1 < m.list.length) { m.list[m.index + 1].status = 'active'; m.index += 1; m.stage = 1; m.lap = 1; }
      ctx.progression.save();
    },
    // Race progress along the circuit from the hero car position.
    updateRace(x, z) {
      const wp = CIRCUIT[m.raceWp];
      const d = Math.hypot(wp[0] - x, wp[1] - z);
      if (d < 26) {
        m.raceWp += 1;
        if (m.raceWp >= CIRCUIT.length) { m.raceWp = 0; m.lap = Math.min(m.lapsTotal, m.lap + 1); }
      }
      m.raceDist = d;
      return d;
    },
    // Gang war: a checkpoint is held when the player stands inside it.
    checkpointAt(x, z) {
      const cps = [[-230, -173], [-230, -200], [-182, -250]];
      for (let i = 0; i < cps.length; i += 1) if (Math.hypot(cps[i][0] - x, cps[i][1] - z) < 18) return i;
      return -1;
    },
  };
  return m;
}

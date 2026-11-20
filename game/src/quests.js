// Side quests (blue) + 50 batik-hologram collectibles. Max 3 active side quests.
// Completing pays via G.progression and shows the gold reward toast via G.hud.toast.
// Collectible spots are deterministic (hash of index) so every run agrees with the map.
// Locations use the unified city grid (Spire 0,0; Skyport -230,0; Pasar 230,-200).
const SIDES = [
  { id: 'paket', name: 'Antar Paket', en: 'Deliver a package Skyport → Pasar', from: { x: -200, z: -20 }, to: { x: 200, z: -170 }, reward: { credits: 400, xp: 150, item: 'Kupon Toko' } },
  { id: 'jalanan', name: 'Balapan Jalanan', en: 'Win 1 street race', reward: { credits: 600, xp: 200, item: 'Ban Balap' } },
  { id: 'selamatkan', name: 'Selamatkan Anggota Wolves', en: 'Rescue 3 Wolves members', reward: { credits: 800, xp: 250, item: 'Jaket Wolves' } },
  { id: 'foto', name: 'Foto Spot', en: 'Photograph 5 scenic spots', reward: { credits: 500, xp: 200, item: 'Kamera Holo' } },
];
const SPOTS = [{ x: -170, z: -140, n: 'Gapura Neon' }, { x: 230, z: -160, n: 'Menara Jam' }, { x: 0, z: 0, n: 'Menara Spire' }, { x: -200, z: 0, n: 'Menara Kontrol' }, { x: 230, z: 0, n: 'Pohon Raksasa' }];
function hash(i) { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
export function initQuests(G) {
  const collectibles = [];
  for (let i = 0; i < 50; i++) collectibles.push({ id: i, x: Math.round((hash(i) - 0.5) * 560), z: Math.round((hash(i + 50) - 0.5) * 560), found: false });
  const Q = {
    list: SIDES.map(s => Object.assign({}, s, { active: false, done: false, progress: 0, goal: s.id === 'foto' ? 5 : s.id === 'selamatkan' ? 3 : 1 })),
    collectibles, found: 0, photoSpots: SPOTS.map(s => Object.assign({}, s, { done: false })),
    start(id) {
      const q = Q.list.find(x => x.id === id); if (!q || q.done || q.active) return false;
      if (Q.list.filter(x => x.active).length >= 3) { if (G.hud) G.hud.toast('Maks 3 quest aktif — selesaikan satu dulu', 'bad'); return false; }
      q.active = true; q.progress = 0;
      if (G.hud) { G.hud.toast('Quest dimulai: ' + q.name, 'sub'); G.hud.setObjective && G.hud.setObjective(q.name, q.en); }
      return true;
    },
    bump(id, n) { const q = Q.list.find(x => x.id === id); if (q && q.active) { q.progress += n || 1; if (q.progress >= q.goal) Q.complete(q); } },
    complete(q) {
      q.active = false; q.done = true;
      if (G.progression) { G.progression.addCredits(q.reward.credits); G.progression.addXp(q.reward.xp); }
      if (G.hud) G.hud.toast('+' + q.reward.credits + ' Credits  •  +' + q.reward.xp + ' XP  •  ' + q.reward.item, 'reward');
      if (G.audio) G.audio.cheer && G.audio.cheer();
    },
    update() {
      if (!G.player) return;
      const pos = G.player.pos || { x: G.player.x || 0, z: G.player.z || 0 };
      const near = (t, r) => { const dx = pos.x - t.x, dz = pos.z - t.z; return dx * dx + dz * dz < r * r; };
      for (const c of collectibles) if (!c.found && near(c, 4)) {
        c.found = true; Q.found += 1;
        if (G.progression) G.progression.addXp(20);
        if (G.hud) G.hud.toast('Hologram Batik ' + Q.found + '/50  •  +20 XP', 'sub');
        if (G.audio) G.audio.chime && G.audio.chime();
        if (Q.found === 50 && G.hud) G.hud.toast('+2000 Credits  •  Koleksi Batik lengkap!', 'reward');
        if (Q.found === 50 && G.progression) G.progression.addCredits(2000);
      }
      for (const s of Q.photoSpots) if (!s.done && near(s, 8)) { s.done = true; Q.bump('foto', 1); if (G.hud) G.hud.toast('Foto Spot: ' + s.n, 'sub'); }
      const pk = Q.list[0]; // Antar Paket: pick up at Skyport, deliver at Pasar
      if (pk.active && !pk.picked && near(pk.from, 10)) { pk.picked = true; if (G.hud) G.hud.toast('Paket diambil — antar ke Pasar Nusantara', 'sub'); }
      else if (pk.active && pk.picked && near(pk.to, 10)) Q.complete(pk);
      const jr = Q.list[1];
      if (jr.active && G.missions && G.missions.list.some(m => m.race && m.done)) Q.complete(jr);
    },
  };
  G.quests = Q;
}

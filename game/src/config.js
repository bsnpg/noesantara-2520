// Noesantara 2520 — config: constants, districts, roads, weapons, missions.
// Written fresh for round 8 from SPEC.md + map-plan.md (prose only).
export const WORLD = 640, HALF = 320;
export const COLORS = {
  gold: 0xffd700, goldCss: '#ffd700', teal: 0x1abc9c, tealCss: '#1abc9c',
  pink: 0xff4fa3, brick: 0xc0392b, blue: 0x3498db, green: 0x27ae60,
  yellow: 0xffb300, asphalt: 0x2b2f38, sidewalk: 0x9aa3a7, plaza: 0xc9b896,
  grass: 0x5da24a, skyTop: 0x3f8fe0, skyBot: 0xbfe3f5, fog: 0xa8d4ea,
};
export const DISTRICTS = [
  { id: 0, name: 'Distrik Neon', short: 'NEON', cx: -230, cz: -200, r: 95, color: '#ff4fa3', hex: 0xff4fa3, faction: 'Wolves', landmark: 'Gapura Neon', perk: 'Toko senjata −10%', cells: 30 },
  { id: 1, name: 'Pasar Nusantara', short: 'PASAR', cx: 230, cz: -200, r: 90, color: '#ffb300', hex: 0xffb300, faction: 'Neutral', landmark: 'Gapura Pasar + Menara Jam', perk: 'Harga jual +15%', cells: 30 },
  { id: 2, name: 'Undercity', short: 'UNDERCITY', cx: -230, cz: 200, r: 95, color: '#c0392b', hex: 0xc0392b, faction: 'Vipers', landmark: 'Gerbang Undercity', perk: 'Pasar gelap — barang langka', cells: 30 },
  { id: 3, name: 'Spire', short: 'SPIRE', cx: 0, cz: 0, r: 85, color: '#ffd700', hex: 0xffd700, faction: 'Syndicate', landmark: 'Menara Spire', perk: 'Hadiah misi +20%', cells: 30 },
  { id: 4, name: 'Distrik Candi', short: 'CANDI', cx: 230, cz: 200, r: 90, color: '#1abc9c', hex: 0x1abc9c, faction: 'Neutral', landmark: 'Candi Agung', perk: 'XP foto spot +50', cells: 31 },
  { id: 5, name: 'Skyport', short: 'SKYPORT', cx: -230, cz: 0, r: 80, color: '#3498db', hex: 0x3498db, faction: 'Wolves', landmark: 'Menara Kontrol', perk: 'Bengkel Riko −15%', cells: 16 },
  { id: 6, name: 'Taman Gantung', short: 'TAMAN', cx: 230, cz: 0, r: 85, color: '#27ae60', hex: 0x27ae60, faction: 'Neutral', landmark: 'Pohon Raksasa', perk: 'HP pulih lebih cepat', cells: 20 },
];
// Zoning per block (NW, NE, SW, SE) — zone, min/max height. From map plan §8.
export const ZONES = [
  [['PP', 8, 16], ['PK', 24, 32], ['PR', 6, 12], ['PP', 8, 16]],   // Neon
  [['PS', 4, 10], ['PS', 4, 10], ['PS', 4, 10], ['PP', 8, 16]],   // Pasar
  [['PR', 6, 12], ['PS', 4, 10], ['PR', 10, 16], ['PP', 8, 16]], // Undercity
  [['PK', 40, 44], ['PK', 24, 36], ['PR', 6, 14], ['TM', 0, 8]],  // Spire
  [['TM', 0, 8], ['TM', 0, 8], ['TM', 0, 8], ['PP', 8, 16]],     // Candi
  [['PK', 24, 32], ['PK', 24, 32], ['PP', 8, 16], ['PP', 8, 16]],// Skyport
  [['TM', 0, 8], ['PR', 6, 10], ['TM', 0, 8], ['PR', 6, 12]],    // Taman
];
// Avenue lines: NS x, EW z. Connectors x=±115, z=±100. Ring x=±320, z=±300.
export const AVE_NS = [-230, 0, 230], AVE_EW = [-200, 0, 200];
export const CON_NS = [-115, 115], CON_EW = [-100, 100];
export const RING = 320, RING_Z = 300;
export const ALLEYS = [
  { d: 0, ns: -280, ew: -150 }, { d: 1, ns: 280, ew: -150 }, { d: 2, ns: -280, ew: 150 },
  { d: 3, ns: 50, ew: 50 }, { d: 4, ns: 280, ew: 150 }, { d: 5, ns: -280, ew: -50 },
  { d: 6, ns: 280, ew: 50 },
];
export const ROAD_NAMES = { ns: { '-230': 'JL. RAYA BARAT', '0': 'JL. RAYA TENGAH', '230': 'JL. RAYA TIMUR' }, ew: { '-200': 'JL. RAYA UTARA', '0': 'JL. RAYA TENGAH', '200': 'JL. RAYA SELATAN' } };
// Weapon wheel order, clockwise from top. Ammo display matches the sealed wheel.
export const WEAPONS = [
  { name: 'FISTS', ammo: '∞', mag: Infinity, reserve: Infinity, dmg: 12, auto: false },
  { name: 'PISTOL', ammo: '72', mag: 12, reserve: 72, dmg: 18, auto: false },
  { name: 'SMG', ammo: '60', mag: 30, reserve: 60, dmg: 10, auto: true },
  { name: 'SHOTGUN', ammo: '30', mag: 6, reserve: 30, dmg: 45, auto: false },
  { name: 'RIFLE', ammo: '30 / 150', mag: 30, reserve: 150, dmg: 26, auto: true },
  { name: 'BAZOOKA', ammo: '12', mag: 1, reserve: 12, dmg: 120, auto: false },
];
export const MISSIONS = [
  { name: 'Balapan Pertama', district: 0, reward: 1200, xp: 300, obj: 'Lap 3 — finis di bawah gapura', stages: ['Lap 1 — kejar garis start', 'Lap 2 — potong di Pasar', 'Lap 3 — finis di bawah gapura', 'Lap 3 — finis di bawah gapura'], dialog: ['Mara', 'Gas, Ghost! Menang di sini, nama kita bersih lagi.'] },
  { name: 'Tembak dari Mobil', district: 0, reward: 1500, xp: 350, obj: 'Hancurkan 3 truk konvoi Syndicate', stages: ['Kejar konvoi di Jl. Raya Barat', 'Hancurkan truk 1/3', 'Hancurkan truk 3/3', 'Lolos dari NPD'], dialog: ['Kiko', 'Kiri, Ghost! Truknya di kiri — aku yang urus sisanya.'] },
  { name: 'Perang Geng: Distrik Neon', district: 0, reward: 2000, xp: 500, obj: 'Rebut pos pasar', stages: ['Rebut pos pasar', 'Rebut pos gapura', 'Rebut pos menara parkir', 'Tahan wilayah sampai bersih'], dialog: ['Mara', 'Rebut posnya satu-satu, Ghost. Viper takkan diam.'] },
  { name: 'Balapan Maut', district: 0, reward: 2500, xp: 600, obj: 'Menang 3 lap di atas 180 km/jam', stages: ['Lap 1 — tembak sambil balapan', 'Lap 2 — Viper menabrak dari samping', 'Lap 3 — finis hidup-hidup', 'Finis — klaim hadiah'], dialog: ['Riko', 'Mesin udah kupoles, Ghost. Jangan rem di tikungan Pasar.'] },
  { name: 'Konvoi', district: 2, reward: 2200, xp: 550, obj: 'Kawal truk Gajah ke Skyport', stages: ['Ambil truk di Undercity', 'Lewat Gang Gudang saat blokade', 'Tahan serangan Viper', 'Truk sampai Skyport'], dialog: ['Mara', 'Bukti itu di dalam truk. Kalau truk jatuh, nama kita ikut jatuh.'] },
  { name: 'Perang Geng: Undercity', district: 2, reward: 3000, xp: 800, obj: 'Serbu jalanan Undercity', stages: ['Masuk lewat Gang Viper', 'Kalahkan Viper di pasar gelap', 'Duel Wowo vs Razor di tengah asap', 'Undercity direbut'], dialog: ['Razor', 'Ghost… akhirnya kau datang juga. Selesaikan di sini.'] },
  { name: 'Balapan Terakhir', district: 0, reward: 3500, xp: 900, obj: 'Duel 1v1 vs Razor — 5 lap', stages: ['Lap 1 — tanpa senjata', 'Lap 3 — Razor memimpin', 'Lap 5 — finis', 'Razor kalah'], dialog: ['Mara', 'Lima lap, tanpa senjata. Ini soal siapa yang lebih cepat, Ghost.'] },
  { name: 'Rebut Kota', district: 3, reward: 5000, xp: 1500, obj: 'Naik spiral Spire, serbu lobi', stages: ['Balapan naik jalur spiral Spire', 'Serbu lobi bersama NPD', 'Hadapi bos Syndicate di atap', 'Nama Wowo bersih'], dialog: ['Mara', 'Di atas sana semuanya berakhir. Naik, Ghost.'] },
];
export const SIDE_QUESTS = [
  { id: 'paket', name: 'Antar Paket', desc: 'Antar paket ke bengkel Riko di Skyport', reward: 400, xp: 150 },
  { id: 'balap-jalanan', name: 'Balapan Jalanan', desc: 'Menangkan balapan jalanan di Pasar', reward: 350, xp: 120 },
  { id: 'selamatkan', name: 'Selamatkan Anggota Wolves', desc: 'Selamatkan anggota Wolves di Undercity', reward: 600, xp: 200 },
  { id: 'foto', name: 'Foto Spot', desc: 'Foto Candi Agung dari plaza', reward: 500, xp: 200 },
];
export const PERIODS = [[5, 11, 'Morning'], [11, 15, 'Afternoon'], [15, 19, 'Evening'], [19, 24, 'Night'], [0, 5, 'Night']];
export function periodFor(hour) { for (const [a, b, p] of PERIODS) if (hour >= a && hour < b) return p; return 'Night'; }
export function districtAt(x, z) {
  let best = null, bd = 1e9;
  for (const d of DISTRICTS) { const dd = Math.hypot(x - d.cx, z - d.cz); if (dd < bd) { bd = dd; best = d; } }
  return best;
}

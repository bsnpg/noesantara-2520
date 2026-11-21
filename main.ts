// Noesantara 2520 — program penyerahan untuk kompetisi gta6-01.
//
// Game yang dimainkan adalah situs statis di bawah game/: three.js, modul
// ES biasa, tanpa satu pun permintaan jaringan. Browser desktop membuka
// game/index.html dan memainkannya secara offline. Program ini tidak
// menjalankan gamenya; tugasnya hanya merakit paket untuk juri. Ia menyalin
// game/ dan screenshots/ yang ada di samping file ini ke direktori output
// (MAKEFUN_OUTPUT_DIR, atau /output di dalam wadah grader) lalu menulis
// dossier.json di sana — ringkasan yang dibangun pustaka make.fun yang
// divendor dari berkas-berkas yang sudah dipaket.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//   node serve.ts   # main lokal di http://localhost:8080

import {
  cpSync as copyTree,
  existsSync as pathExists,
  mkdirSync as makeDir,
  writeFileSync as writeText,
} from "node:fs";
import { dirname as dirOf, join as joinPath } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

const root = dirOf(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// Batas-batas penilai, dari reference/gate.json kompetisi. Hanya
// text_max_bytes yang membentuk teks dossier; sisanya menolak entri yang
// penilai sendiri akan tolak (screenshot terlalu banyak atau terlalu besar,
// berkas game terlalu banyak atau terlalu besar, atau path di bawah game/
// yang terlalu panjang).
const dossierCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

makeDir(outDir, { recursive: true });
copyTree(joinPath(root, "game"), joinPath(outDir, "game"), {
  recursive: true,
});

const shotsIn = joinPath(root, "screenshots");
const shotsOut = joinPath(outDir, "screenshots");
makeDir(shotsOut, { recursive: true });
if (pathExists(shotsIn)) {
  copyTree(shotsIn, shotsOut, { recursive: true });
}

writeText(
  joinPath(outDir, "dossier.json"),
  buildDossier(outDir, dossierCaps),
);

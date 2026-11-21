// Noesantara 2520 — gta6-01 entry plumbing (Node 22, stdlib only).
// Menyalin game/ + screenshots/ ke direktori output lalu menulis
// dossier.json lewat library make.fun yang di-vendor.
//   node serve.ts            -> main lokal di http://localhost:8080
//   MAKEFUN_OUTPUT_DIR=out node main.ts   -> dossier di out/
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(src, dst) {
  mkdirSync(dst, { recursive: true });
  cpSync(src, dst, { recursive: true });
}

copyTree(join(rootDir, 'game'), join(outDir, 'game'));
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(rootDir, 'screenshots'))) {
  copyTree(join(rootDir, 'screenshots'), join(outDir, 'screenshots'));
}

// Batas scorer (lihat reference/gate.json): text_max_bytes membentuk
// byte dossier; sisanya menolak entry yang akan ditolak scorer.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);









import * as THREE from '../vendor/three.module.min.js';


export const PAL = {
 gold: 0xd4af37, goldDark: 0x9a7b1e, teal: 0x0e7c7b, tealLight: 0x14b8a6,
 brick: 0xa63a2a, cream: 0xf2e6c9, dark: 0x23282e, glass: 0x7fb3d5,
 glassTeal: 0x5ec8c0, pink: 0xff4fa3, yellow: 0xffb300, blue: 0x3498db,
 green: 0x27ae60, white: 0xf5f2ea, asphalt: 0x2e3138, sidewalk: 0xcbb98a,
 skin: 0xc68e5e, leaf: 0x2f9e44, leafDark: 0x1e7a34, trunk: 0x7a4a21,
};


function ctx2d(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c, rx = 1, ry = 1) {
 const t = new THREE.CanvasTexture(c);
 t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
 t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

function batikParang(bg = '#0e7c7b', fg = '#d4af37') {
 const [c, g] = ctx2d(256, 256);
 g.fillStyle = bg; g.fillRect(0, 0, 256, 256);
 g.strokeStyle = fg; g.lineWidth = 5;
 for (let i = -256; i < 512; i += 32) {
 g.beginPath(); g.moveTo(i, -8);
 g.bezierCurveTo(i + 44, 64, i - 44, 128, i + 16, 192); g.lineTo(i + 16, 264); g.stroke();
 }
 g.fillStyle = fg;
 for (let x = 16; x < 256; x += 32) for (let y = 16; y < 256; y += 32) { g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }
 return tex(c);
}

function batikMega(bg = '#f2e6c9', fg = '#0e7c7b') {
 const [c, g] = ctx2d(256, 256);
 g.fillStyle = bg; g.fillRect(0, 0, 256, 256);
 g.strokeStyle = fg; g.lineWidth = 5; g.fillStyle = '#5ec8c0';
 for (let y = 0; y < 4; y++) for (let x = -1; x < 5; x++) {
 const cx = x * 64 + (y % 2 ? 32 : 0), cy = y * 64 + 32;
 g.beginPath(); g.arc(cx, cy, 26, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
 }
 return tex(c);
}

function winTex(cols, rows, base = '#7fb3d5', win = '#1d3557') {
 const [c, g] = ctx2d(256, 256);
 g.fillStyle = base; g.fillRect(0, 0, 256, 256);
 const cw = 256 / cols, ch = 256 / rows;
 g.fillStyle = win;
 for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) g.fillRect(i * cw + cw * 0.22, j * ch + ch * 0.22, cw * 0.56, ch * 0.56);
 g.strokeStyle = 'rgba(212,175,55,0.95)'; g.lineWidth = 3;
 for (let i = 0; i <= cols; i++) { g.beginPath(); g.moveTo(i * cw, 0); g.lineTo(i * cw, 256); g.stroke(); }
 return tex(c);
}

function brickTex() {
 const [c, g] = ctx2d(256, 256);
 g.fillStyle = '#a63a2a'; g.fillRect(0, 0, 256, 256);
 g.fillStyle = '#c65a45';
 for (let y = 0; y < 8; y++) for (let x = -1; x < 5; x++) g.fillRect(x * 64 + (y % 2 ? 32 : 0) + 3, y * 32 + 3, 58, 26);
 return tex(c);
}

function stripeTex(a = '#ff4fa3', b = '#f2e6c9') {
 const [c, g] = ctx2d(128, 128);
 for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? a : b; g.fillRect(i * 16, 0, 16, 128); }
 return tex(c);
}

function textTex(txt, bg = '#23282e', fg = '#d4af37', sub = '') {
 const [c, g] = ctx2d(512, 256);
 g.fillStyle = bg; g.fillRect(0, 0, 512, 256);
 g.strokeStyle = fg; g.lineWidth = 10; g.strokeRect(10, 10, 492, 236);
 g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
 g.font = 'bold ' + (txt.length > 12 ? 46 : txt.length > 8 ? 56 : 68) + 'px sans-serif';
 g.fillText(txt, 256, sub ? 104 : 128);
 if (sub) { g.font = 'bold 34px sans-serif'; g.fillStyle = '#f2e6c9'; g.fillText(sub, 256, 188); }
 return tex(c);
}


function memo(fn) { const c = new Map(); return (...a) => { const k = JSON.stringify(a); let v = c.get(k); if (!v) { v = fn(...a); c.set(k, v); } return v; }; }
batikParang = memo(batikParang); batikMega = memo(batikMega);
winTex = memo(winTex); brickTex = memo(brickTex); stripeTex = memo(stripeTex); textTex = memo(textTex);
const _mc = new Map();
export function mat(color, o = {}) {
 const k = color + '|' + (o.rough ?? 0.8) + '|' + (o.metal ?? 0) + '|' + (o.emi ?? 0) + '|' + (o.map ? o.map.uuid : '');
 let m = _mc.get(k);
 if (!m) {
 m = new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? 0.8, metalness: o.metal ?? 0 });
 if (o.map) m.map = o.map;
 if (o.emi) { m.emissive = new THREE.Color(o.emi); m.emissiveIntensity = o.ei ?? 1; }
 if (o.flat) m.flatShading = true;
 _mc.set(k, m);
 }
 return m;
}
function B(w, h, d, mt, x = 0, y = 0, z = 0, ry = 0) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mt); m.position.set(x, y, z); if (ry) m.rotation.y = ry; return m; }
function CY(rt, rb, h, mt, x = 0, y = 0, z = 0, s = 14) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s), mt); m.position.set(x, y, z); return m; }
function CO(r, h, mt, x = 0, y = 0, z = 0, s = 4) { const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, s), mt); m.position.set(x, y, z); return m; }
function SP(r, mt, x = 0, y = 0, z = 0, ws = 12, hs = 8) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), mt); m.position.set(x, y, z); return m; }
function G(...ch) { const g = new THREE.Group(); for (const c of ch) g.add(c); return g; }

function facadeBox(w, h, d, side, top) {
 return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [side, side, top, top, side, side]);
}

function wedge(len, h, w, mt) {
 const s = new THREE.Shape();
 s.moveTo(0, 0); s.lineTo(len, 0); s.lineTo(len, h * 0.55); s.lineTo(len * 0.7, h);
 s.lineTo(len * 0.28, h); s.lineTo(0, h * 0.5); s.closePath();
 const geo = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false });
 geo.translate(0, 0, -w / 2);
 return new THREE.Mesh(geo, mt);
}

function canopy(w, d, y, trim) {
 return G(B(w, 0.25, d, trim, 0, y, d / 2 + 0.4), CY(0.09, 0.09, y, trim, -w / 2 + 0.3, y / 2, d + 0.6), CY(0.09, 0.09, y, trim, w / 2 - 0.3, y / 2, d + 0.6));
}


const GOLD = () => mat(PAL.gold, { rough: 0.45, metal: 0.55 });
const TEAL = () => mat(PAL.teal, { rough: 0.6 });
const BRICK = () => mat(PAL.brick, { rough: 0.85 });
const CREAM = () => mat(PAL.cream, { rough: 0.85 });
const DARK = () => mat(PAL.dark, { rough: 0.7 });
const WIN = (c, r, base, win) => mat(0xffffff, { map: winTex(c, r, base, win), rough: 0.35, metal: 0.15 });
function signPanel(w, h, txt, bg = '#23282e', fg = '#d4af37', sub = '') {
 const face = mat(0xffffff, { map: textTex(txt, bg, fg, sub), rough: 0.5 });
 const edge = mat(PAL.goldDark, { rough: 0.6, metal: 0.4 });
 return new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.25), [edge, edge, edge, edge, face, edge]);
}
function pyramid(r, h, mt, x, y, z) { const m = CO(r, h, mt, x, y, z, 4); m.rotation.y = Math.PI / 4; return m; }


export function makeOfficeTower() {
 const win = WIN(6, 10, '#7fb3d5'), gold = GOLD(), dark = DARK();
 const base = facadeBox(12, 22, 12, win, gold); base.position.y = 12;
 const tier = facadeBox(9, 7, 9, WIN(4, 4, '#5ec8c0'), gold); tier.position.y = 25.5;
 const roof = pyramid(7.2, 3.2, gold, 0, 30.6, 0);
 const finRod = CY(0.18, 0.18, 2.2, gold, 0, 33, 0);
 const finBall = SP(0.45, mat(PAL.teal, { emi: PAL.tealLight, ei: 1.2 }), 0, 34.2, 0);
 const sign = signPanel(7, 1.8, 'SPIRE'); sign.position.set(0, 20.5, 6.1);
 const plinth = B(13.5, 1, 13.5, mat(PAL.sidewalk, { rough: 0.9 }), 0, 0.5, 0);
 const door = B(3.2, 3.4, 0.3, dark, 0, 2.7, 6.05);
 const balc = G(B(4, 0.3, 1.2, gold, -3, 12, 6.4), B(4, 0.3, 1.2, gold, 3, 16, 6.4));
 const can = canopy(5, 2, 4.2, gold); can.position.set(0, 0, 6);
 return G(plinth, base, tier, roof, finRod, finBall, sign, door, can, balc);
}

export function makeShophouse() {
 const gold = GOLD(), brick = BRICK(), cream = CREAM();
 const body = facadeBox(8, 8, 8, WIN(4, 3, '#f2e6c9', '#3a2a1a'), gold); body.position.y = 5;
 const shop = B(8, 3, 0.4, mat(0xffffff, { map: winTex(4, 1, '#1d3557', '#7fb3d5'), rough: 0.3, metal: 0.2 }), 0, 2.5, 4.05);
 const awn = B(8.4, 0.18, 2.2, mat(0xffffff, { map: stripeTex('#ff4fa3', '#f2e6c9'), rough: 0.7 }), 0, 4.4, 4.9);
 awn.rotation.x = 0.25;
 const sign = signPanel(5.5, 1.3, 'TOKO BATIK'); sign.position.set(0, 6.8, 4.15);
 const roof = pyramid(6.4, 2.4, gold, 0, 10.2, 0);
 const balc = G(B(8.4, 0.25, 1, gold, 0, 6.2, 4.4), B(0.12, 1, 1, gold, -4, 6.8, 4.4), B(0.12, 1, 1, gold, 4, 6.8, 4.4));
 return G(body, shop, awn, sign, roof, balc, B(9, 0.8, 9, mat(PAL.sidewalk, { rough: 0.9 }), 0, 0.4, 0));
}

export function makeMall() {
 const gold = GOLD();
 const body = facadeBox(20, 7, 14, WIN(10, 3, '#7fb3d5'), gold); body.position.y = 4.5;
 const band = B(20.4, 0.8, 14.4, gold, 0, 8, 0);
 const sign = signPanel(11, 2, 'MALL NEON', '#ff4fa3', '#f2e6c9'); sign.position.set(0, 6.2, 7.15);
 const door = B(5, 3.6, 0.3, DARK(), 0, 2.8, 7.05);
 const roofGarden = G(B(20, 0.4, 14, mat(PAL.leafDark, { rough: 0.9 }), 0, 8.4, 0));
 const palm1 = makePalm(); palm1.position.set(-6, 8.6, -3); palm1.scale.setScalar(0.7);
 const palm2 = makePalm(); palm2.position.set(6, 8.6, 3); palm2.scale.setScalar(0.7);
 const can = canopy(7, 2.4, 4.6, gold); can.position.set(0, 0, 7);
 return G(body, band, sign, door, roofGarden, palm1, palm2, can);
}

export function makeMarketHall() {
 const brick = BRICK(), gold = GOLD(), cream = CREAM();
 const body = facadeBox(16, 6, 12, mat(0xffffff, { map: brickTex(), rough: 0.85 }), gold); body.position.y = 4;
 const arch = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.35, 8, 20, Math.PI), gold);
 arch.position.set(0, 3.6, 6.05);
 const door = B(3.6, 3.6, 0.3, DARK(), 0, 2.8, 6.05);
 const roof1 = B(17, 0.7, 13, gold, 0, 7.3, 0);
 const roof2 = B(13, 0.7, 9.5, TEAL(), 0, 8.4, 0);
 const roof3 = pyramid(6, 2.2, gold, 0, 9.9, 0);
 const sign = signPanel(9, 1.8, 'PASAR NUSANTARA', '#a63a2a', '#f2e6c9'); sign.position.set(0, 5.6, 6.15);
 const stall1 = makeMarketStall(); stall1.position.set(-10, 0, 8); stall1.rotation.y = 0.5;
 const stall2 = makeMarketStall(); stall2.position.set(10, 0, 8); stall2.rotation.y = -0.5;
 return G(body, arch, door, roof1, roof2, roof3, sign, stall1, stall2);
}

export function makeMarketStall() {
 const stripe = mat(0xffffff, { map: stripeTex('#ffb300', '#f2e6c9'), rough: 0.7 });
 const wood = mat(0x7a4a21, { rough: 0.9 });
 const parts = [B(3, 1, 1.6, wood, 0, 0.5, 0), B(3.4, 0.16, 2.6, stripe, 0, 2.5, 0)];
 for (const [px, pz] of [[-1.5, -1.1], [1.5, -1.1], [-1.5, 1.1], [1.5, 1.1]]) parts.push(CY(0.07, 0.07, 2.5, wood, px, 1.25, pz));
 parts.push(B(0.7, 0.5, 0.6, mat(PAL.green, { rough: 0.8 }), -0.9, 1.25, 0));
 parts.push(B(0.7, 0.5, 0.6, mat(PAL.yellow, { rough: 0.8 }), 0, 1.25, 0));
 parts.push(B(0.7, 0.5, 0.6, mat(PAL.brick, { rough: 0.8 }), 0.9, 1.25, 0));
 parts.push(B(0.9, 0.9, 0.9, wood, 2.1, 0.45, 0.4));
 return G(...parts);
}

export function makeHouse() {
 const cream = CREAM(), brick = BRICK();
 const body = B(7, 4, 7, cream, 0, 2.5, 0);
 const winM = mat(0xffffff, { map: winTex(3, 1, '#f2e6c9', '#1d3557'), rough: 0.4 });
 const winF = B(7.05, 1.6, 0.1, winM, 0, 3, 3.51);
 const roof = pyramid(5.8, 2.4, brick, 0, 5.7, 0);
 const porch = G(B(4, 0.3, 2, mat(PAL.sidewalk, { rough: 0.9 }), 0, 0.65, 4.2), CY(0.1, 0.1, 2.2, brick, -1.7, 1.7, 5), CY(0.1, 0.1, 2.2, brick, 1.7, 1.7, 5), B(4.2, 0.2, 2.2, brick, 0, 2.9, 4.2));
 const door = B(1.2, 2.4, 0.2, DARK(), 0, 1.7, 3.55);
 const fence = G(B(7.4, 0.9, 0.15, cream, 0, 0.45, 6.4), B(0.15, 0.9, 3, cream, -3.7, 0.45, 5), B(0.15, 0.9, 3, cream, 3.7, 0.45, 5));
 return G(body, winF, roof, porch, door, fence);
}

export function makeTemple() {
 const teal = TEAL(), gold = GOLD(), stone = mat(0x8a7d6b, { rough: 0.9 });
 const tiers = [];
 const sizes = [10, 8, 6, 4];
 sizes.forEach((s, i) => {
 const t = B(s, 2, s, i % 2 ? teal : stone, 0, 1 + i * 2, 0); tiers.push(t);
 tiers.push(B(s + 0.5, 0.35, s + 0.5, gold, 0, 2 + i * 2, 0));
 });
 const top = pyramid(3.4, 3, teal, 0, 9.5, 0);
 const spires = [];
 for (const [sx, sz] of [[-4.4, -4.4], [4.4, -4.4], [-4.4, 4.4], [4.4, 4.4]]) spires.push(CO(0.5, 2.2, gold, sx, 3.1, sz, 6));
 spires.push(CO(0.6, 3, gold, 0, 12.4, 0, 6));
 const niche = B(2.2, 3, 0.5, DARK(), 0, 3, 5.05);
 const statue = G(CY(0.35, 0.5, 1.4, gold, 0, 2.4, 5.2), SP(0.45, gold, 0, 3.5, 5.2), CO(0.5, 0.9, gold, 0, 4.2, 5.2, 6));
 const steps = G(B(12, 0.4, 12, stone, 0, 0.2, 0), B(11, 0.4, 11, stone, 0, 0.6, 0));
 return G(steps, ...tiers, top, ...spires, niche, statue);
}

export function makeWarehouse() {
 const blue = mat(0x7ba0c4, { rough: 0.75 });
 const body = B(14, 5, 10, blue, 0, 3, 0);
 const band = B(14.3, 0.5, 10.3, GOLD(), 0, 5.2, 0);
 const ribs = [];
 for (let i = -3; i <= 3; i++) ribs.push(B(0.18, 5, 0.18, DARK(), i * 2, 3, 5.05));
 const door = B(4.5, 3.8, 0.3, DARK(), -3, 2.4, 5.05);
 const frame = B(5, 0.4, 0.4, GOLD(), -3, 4.5, 5.1);
 const roof = B(14.6, 0.5, 10.6, mat(PAL.dark, { rough: 0.7 }), 0, 5.7, 0);
 const vent1 = CY(0.7, 0.9, 1.2, GOLD(), -4, 6.4, -2);
 const vent2 = CY(0.7, 0.9, 1.2, GOLD(), 4, 6.4, 2);
 const sign = signPanel(6, 1.4, 'GUDANG SKYPORT', '#3498db', '#f2e6c9'); sign.position.set(3.5, 4.6, 5.15);
 const crates = G(B(1.2, 1.2, 1.2, mat(0x7a4a21, { rough: 0.9 }), 6, 0.6, 6.5), B(1, 1, 1, mat(0x7a4a21, { rough: 0.9 }), 6, 1.7, 6.5), B(1.2, 1.2, 1.2, mat(0x7a4a21, { rough: 0.9 }), -7.5, 0.6, 6.2));
 return G(body, band, ...ribs, door, frame, roof, vent1, vent2, sign, crates);
}

export function makeHotel() {
 const gold = GOLD();
 const body = facadeBox(12, 14, 10, WIN(6, 6, '#f2e6c9', '#1d3557'), gold); body.position.y = 8;
 const balcs = [];
 for (let f = 0; f < 4; f++) {
 const y = 5 + f * 3;
 balcs.push(B(12.4, 0.25, 1.1, gold, 0, y, 5.4));
 balcs.push(B(12.4, 0.9, 0.12, gold, 0, y + 0.55, 5.9));
 }
 const band = B(12.4, 0.7, 10.4, gold, 0, 15, 0);
 const pool = B(8, 0.4, 6, mat(0x2fa8c9, { rough: 0.2, metal: 0.1 }), 0, 15.5, 0);
 const poolEdge = B(8.6, 0.5, 6.6, CREAM(), 0, 15.4, 0);
 const sign = signPanel(7, 1.6, 'HOTEL VANTARA'); sign.position.set(0, 13.2, 5.15);
 return G(body, ...balcs, band, poolEdge, pool, B(13, 1, 11, mat(PAL.sidewalk, { rough: 0.9 }), 0, 0.5, 0));
}

export function makeGapura() {
 const brick = BRICK(), gold = GOLD();
 const batik = mat(0xffffff, { map: batikParang(), rough: 0.7 });
 const parts = [];
 for (const sx of [-6, 6]) {
 parts.push(B(1.8, 7, 1.8, brick, sx, 3.5, 0));
 parts.push(B(2.3, 0.5, 2.3, gold, sx, 7.2, 0));
 parts.push(pyramid(1.9, 1.4, gold, sx, 8.2, 0));
 parts.push(B(2.6, 0.8, 2.6, mat(PAL.sidewalk, { rough: 0.9 }), sx, 0.4, 0));
 }
 parts.push(B(14.2, 1.8, 1.4, batik, 0, 7.6, 0));
 parts.push(B(14.6, 0.4, 1.8, gold, 0, 8.7, 0));
 parts.push(B(10, 0.7, 1.8, gold, 0, 9.4, 0));
 parts.push(B(6.5, 0.7, 1.8, TEAL(), 0, 10.1, 0));
 parts.push(pyramid(3.4, 1.6, gold, 0, 11.2, 0));
 const sign = signPanel(5, 1.2, 'GAPURA NEON', '#ff4fa3', '#f2e6c9'); sign.position.set(0, 7.6, 0.85);
 return G(...parts, sign);
}

export function makeSpireTower() {
 const gold = GOLD(), tealGlow = mat(PAL.teal, { emi: PAL.tealLight, ei: 1.4, rough: 0.5 });
 const parts = [B(12, 1, 12, mat(PAL.sidewalk, { rough: 0.9 }), 0, 0.5, 0)];
 const tiers = [[10, 8], [8, 8], [6.5, 8], [5, 6]];
 let y = 1;
 tiers.forEach(([s, h], i) => {
 const t = facadeBox(s, h, s, WIN(5, 4, '#ffd700', '#7a5c00'), gold); t.position.y = y + h / 2; parts.push(t);
 parts.push(B(s + 0.6, 0.5, s + 0.6, i % 2 ? tealGlow : gold, 0, y + h, 0));
 y += h;
 });
 parts.push(pyramid(4.6, 4.5, gold, 0, y + 2.2, 0));
 parts.push(CY(0.2, 0.2, 2.4, gold, 0, y + 5.4, 0));
 parts.push(SP(0.55, tealGlow, 0, y + 6.6, 0));
 const sign = signPanel(6, 1.6, 'MENARA SPIRE'); sign.position.set(0, 5, 5.15);
 return G(...parts, sign);
}

export function makeClockTower() {
 const cream = CREAM(), gold = GOLD();
 const shaft = B(3.5, 12, 3.5, cream, 0, 6.5, 0);
 const trim = B(4, 0.5, 4, gold, 0, 12.4, 0);
 const roof = pyramid(3.2, 2, gold, 0, 13.6, 0);
 const faces = [];
 const faceM = mat(0xffffff, { rough: 0.4 });
 
 for (const [fx, fz, axis] of [[0, 1.82, 'x'], [0, -1.82, 'x'], [1.82, 0, 'z'], [-1.82, 0, 'z']]) {
 const f = CY(1.1, 1.1, 0.16, faceM, fx, 11, fz, 20);
 if (axis === 'x') f.rotation.x = Math.PI / 2; else f.rotation.z = Math.PI / 2;
 faces.push(f);
 const hx = axis === 'z' ? fx + Math.sign(fx) * 0.12 : fx;
 const hz = axis === 'x' ? fz + Math.sign(fz) * 0.12 : fz;
 faces.push(B(0.09, 0.9, 0.09, DARK(), hx, 11.3, hz));
 }
 const base = B(5, 1, 5, mat(PAL.sidewalk, { rough: 0.9 }), 0, 0.5, 0);
 return G(shaft, trim, roof, ...faces, base);
}


function frameBars(w, h, mt) {
 return G(B(w + 0.3, 0.18, 0.3, mt, 0, h / 2 + 0.08, 0), B(w + 0.3, 0.18, 0.3, mt, 0, -h / 2 - 0.08, 0),
 B(0.18, h + 0.3, 0.3, mt, -w / 2 - 0.08, 0, 0), B(0.18, h + 0.3, 0.3, mt, w / 2 + 0.08, 0, 0));
}
function billboardScreen(w, h, d, frontTxt, frontBg, frontFg, backMat) {
 const face = mat(0xffffff, { map: textTex(frontTxt, frontBg, frontFg), rough: 0.45 });
 const edge = mat(PAL.dark, { rough: 0.6 });
 return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [edge, edge, edge, edge, face, backMat || edge]);
}

export function makeBillboardPylon() {
 const gold = GOLD();
 const screen = billboardScreen(8, 5, 0.6, 'NOESANTARA', '#0e7c7b', '#d4af37', mat(0xffffff, { map: batikParang(), rough: 0.6 }));
 screen.position.y = 9;
 const fr = frameBars(8, 5, gold); fr.position.y = 9;
 const pylon = B(1.4, 6.5, 1.4, mat(0x8a7d6b, { rough: 0.9 }), 0, 3.25, 0);
 const base = B(3, 0.8, 3, mat(PAL.sidewalk, { rough: 0.9 }), 0, 0.4, 0);
 const cap = B(1.8, 0.4, 1.8, gold, 0, 6.7, 0);
 return G(screen, fr, pylon, base, cap);
}

export function makeBillboardPole() {
 const gold = GOLD();
 const screen = billboardScreen(5, 3, 0.5, 'GARUDA GT', '#23282e', '#d4af37', mat(0xffffff, { map: batikMega(), rough: 0.6 }));
 screen.position.y = 6.8;
 const fr = frameBars(5, 3, gold); fr.position.y = 6.8;
 const pole = CY(0.22, 0.3, 5.4, gold, 0, 2.7, 0);
 const base = B(1.6, 0.6, 1.6, mat(PAL.sidewalk, { rough: 0.9 }), 0, 0.3, 0);
 return G(screen, fr, pole, base);
}



export function makePalm() {
 const trunkM = mat(PAL.trunk, { rough: 0.95 });
 const leafM = mat(PAL.leaf, { rough: 0.85, flat: true });
 const parts = [];
 let x = 0;
 for (let i = 0; i < 3; i++) { const seg = CY(0.16, 0.22, 1.6, trunkM, x, 0.8 + i * 1.5, 0, 8); seg.rotation.z = 0.06 * (i - 1); parts.push(seg); x += 0.08 * (i - 1); }
 const topY = 4.6;
 for (let k = 0; k < 7; k++) {
 const a = k / 7 * Math.PI * 2;
 const frond = B(0.22, 0.06, 2.2, leafM, Math.cos(a) * 1.05, topY + 0.1, Math.sin(a) * 1.05);
 frond.rotation.y = -a; frond.rotation.x = 0.75;
 parts.push(frond);
 }
 parts.push(SP(0.45, leafM, 0, topY + 0.3, 0, 10, 6));
 parts.push(SP(0.2, mat(0x8a5a2b, { rough: 0.9 }), 0.3, topY - 0.1, 0.2));
 parts.push(SP(0.2, mat(0x8a5a2b, { rough: 0.9 }), -0.25, topY - 0.1, -0.15));
 return G(...parts);
}

export function makeShadeTree() {
 const leafM = mat(PAL.leaf, { rough: 0.85, flat: true });
 const leafD = mat(PAL.leafDark, { rough: 0.85, flat: true });
 const parts = [
 CY(0.28, 0.4, 2.4, mat(PAL.trunk, { rough: 0.95 }), 0, 1.2, 0, 10),
 SP(1.7, leafM, 0, 3.6, 0, 12, 9),
 SP(1.15, leafD, -1.3, 3, 0.4, 10, 8), SP(1.15, leafD, 1.3, 3, -0.4, 10, 8),
 SP(1.05, leafM, 0, 3.1, 1.2, 10, 8), SP(1.05, leafD, 0, 3.1, -1.2, 10, 8),
 CO(0.9, 1.4, leafD, -0.7, 4.9, 0.3, 8), CO(0.9, 1.4, leafM, 0.8, 4.9, -0.3, 8),
 ];
 return G(...parts);
}

export function makeGardenTree() {
 const leafM = mat(PAL.leaf, { rough: 0.85, flat: true });
 const vineM = mat(PAL.green, { rough: 0.9 });
 const parts = [CY(0.3, 0.45, 3, mat(PAL.trunk, { rough: 0.95 }), 0, 1.5, 0, 10)];
 const balls = [[1.5, 3.6, 0], [1.15, 4.7, 0.3], [0.85, 5.6, -0.2]];
 balls.forEach(([r, y, off]) => parts.push(SP(r, leafM, off, y, 0, 12, 9)));
 for (let k = 0; k < 5; k++) {
 const a = k / 5 * Math.PI * 2;
 const vx = Math.cos(a) * 1.3, vz = Math.sin(a) * 1.3;
 parts.push(CY(0.05, 0.05, 1.4, vineM, vx, 3.1, vz, 6));
 parts.push(SP(0.22, leafM, vx, 2.35, vz, 8, 6));
 }
 return G(...parts);
}


function poleSign(w, h, txt, bg, fg, sub = '') {
 const panel = signPanel(w, h, txt, bg, fg, sub);
 panel.position.y = 3.4;
 const fr = frameBars(w, h, GOLD()); fr.position.y = 3.4;
 const p1 = CY(0.12, 0.12, 3.4, GOLD(), -w / 2 + 0.4, 1.7, 0);
 const p2 = CY(0.12, 0.12, 3.4, GOLD(), w / 2 - 0.4, 1.7, 0);
 const base = B(w * 0.7, 0.5, 1, mat(PAL.sidewalk, { rough: 0.9 }), 0, 0.25, 0);
 return G(panel, fr, p1, p2, base);
}
export function makeSignOffice() { return poleSign(6, 1.8, 'KANTOR SPIRE'); }
export function makeSignMarket() {
 const g = poleSign(8, 2, 'PASAR NUSANTARA', '#a63a2a', '#f2e6c9');
 const arch = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.28, 8, 24, Math.PI), GOLD());
 arch.position.y = 4.4; g.add(arch);
 return g;
}

export function makeSignGarage() { return poleSign(6, 1.6, 'GARASI RIKO', '#0e7c7b', '#d4af37', 'BENGKEL HOVER'); }
export function makeSignNPD() { return poleSign(6, 1.8, 'MARKAS NPD', '#1d3557', '#f2e6c9'); }
export function makeStreetLamp() {
 const gold = GOLD(), dark = DARK();
 const glow = mat(0xffd97a, { emi: 0xffc94d, ei: 2, rough: 0.4 });
 const parts = [
  CY(0.3, 0.4, 0.5, gold, 0, 0.25, 0, 10),
  CY(0.1, 0.16, 5, dark, 0, 2.75, 0, 10),
  B(1.7, 0.12, 0.12, dark, 0.8, 5.25, 0),
  B(0.55, 0.16, 0.32, dark, 1.6, 5.2, 0),
  SP(0.17, glow, 1.6, 5.05, 0, 10, 8),
  B(0.6, 0.08, 0.36, gold, 1.6, 5.32, 0),
 ];
 return G(...parts);
}
export function makeTrafficLight() {
 const dark = DARK();
 const lamp = (color, lit, y) => {
 const m = CY(0.21, 0.21, 0.12, lit ? mat(color, { emi: color, ei: 2.2, rough: 0.4 }) : mat(color, { rough: 0.5 }), 0, y, 0.26, 14);
 m.rotation.x = Math.PI / 2; return m;
 };
 const head = B(0.7, 1.9, 0.5, dark, 0, 4.6, 0);
 const cap = B(0.8, 0.15, 0.6, GOLD(), 0, 5.6, 0);
 const pole = CY(0.11, 0.15, 4.4, dark, 0, 2.2, 0, 10);
 const base = B(0.7, 0.5, 0.7, GOLD(), 0, 0.25, 0);
 const arm = B(1.2, 0.14, 0.14, dark, 0.5, 5.5, 0);
 return G(pole, base, arm, head, cap, lamp(0xaa2211, false, 5.15), lamp(0xcc9900, false, 4.6), lamp(0x22cc44, true, 4.05));
}

export function makeBench() {
 const wood = mat(0x7a4a21, { rough: 0.9 }), iron = DARK();
 return G(
 B(1.8, 0.12, 0.55, wood, 0, 0.55, 0), B(1.8, 0.5, 0.1, wood, 0, 0.95, -0.26),
 B(0.1, 0.5, 0.5, iron, -0.8, 0.28, 0), B(0.1, 0.5, 0.5, iron, 0.8, 0.28, 0),
 B(0.08, 0.25, 0.5, iron, -0.85, 0.7, 0), B(0.08, 0.25, 0.5, iron, 0.85, 0.7, 0)
 );
}

export function makePlanter() {
 const leafM = mat(PAL.leaf, { rough: 0.85, flat: true });
 return G(
 B(1.4, 0.7, 1.4, BRICK(), 0, 0.35, 0), B(1.5, 0.12, 1.5, GOLD(), 0, 0.75, 0),
 B(1.3, 0.1, 1.3, mat(0x3a2a1a, { rough: 1 }), 0, 0.72, 0),
 SP(0.45, leafM, -0.3, 1.1, 0.1, 10, 8), SP(0.4, leafM, 0.35, 1.05, -0.2, 10, 8), SP(0.35, leafM, 0, 1.3, 0.25, 10, 8)
 );
}

export function makeFountain() {
 const stone = mat(0x8a7d6b, { rough: 0.9 });
 const water = mat(0x2fa8c9, { rough: 0.15, metal: 0.1, emi: 0x1a7a99, ei: 0.5 });
 const rim = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.14, 10, 28), GOLD());
 rim.rotation.x = Math.PI / 2; rim.position.y = 0.85;
 const jets = [];
 for (let k = 0; k < 4; k++) {
 const a = k * Math.PI / 2 + Math.PI / 4;
 const j = CO(0.09, 0.9, water, Math.cos(a) * 0.9, 1.5, Math.sin(a) * 0.9, 6);
 j.rotation.z = Math.cos(a) * 0.5; j.rotation.x = -Math.sin(a) * 0.5; jets.push(j);
 }
 return G(
 CY(2.2, 2.45, 0.85, stone, 0, 0.42, 0, 24), CY(2.05, 2.05, 0.14, water, 0, 0.78, 0, 24),
 rim, CY(0.28, 0.4, 1.7, stone, 0, 1.6, 0, 12), SP(0.55, GOLD(), 0, 2.7, 0),
 CY(1, 1.15, 0.3, stone, 0, 1, 0, 16), ...jets
 );
}

export function makeBusStop() {
 const gold = GOLD(), glass = mat(0x7fb3d5, { rough: 0.25, metal: 0.2 });
 const sign = signPanel(1.7, 0.9, 'HALTE', '#3498db', '#f2e6c9'); sign.position.set(0, 3.1, 0);
 return G(
 B(3.4, 0.18, 1.8, TEAL(), 0, 3, 0), B(3.6, 0.12, 2, gold, 0, 3.15, 0),
 CY(0.09, 0.09, 3, gold, -1.5, 1.5, -0.7), CY(0.09, 0.09, 3, gold, 1.5, 1.5, -0.7),
 CY(0.09, 0.09, 3, gold, -1.5, 1.5, 0.7), CY(0.09, 0.09, 3, gold, 1.5, 1.5, 0.7),
 B(0.12, 2.6, 1.6, glass, 0, 1.5, -0.85),
 B(1.8, 0.12, 0.5, mat(0x7a4a21, { rough: 0.9 }), 0, 0.55, -0.4),
 B(0.1, 0.5, 0.45, DARK(), -0.8, 0.28, -0.4), B(0.1, 0.5, 0.45, DARK(), 0.8, 0.28, -0.4), sign
 );
}

export function makeKiosk() {
 const stripe = mat(0xffffff, { map: stripeTex('#14b8a6', '#f2e6c9'), rough: 0.7 });
 const sign = signPanel(2.2, 0.9, 'KIOS', '#0e7c7b', '#d4af37'); sign.position.set(0, 2.6, 1.05);
 return G(
 B(2.6, 2.4, 2, mat(PAL.cream, { rough: 0.85 }), 0, 1.2, 0),
 B(2.8, 0.2, 2.2, TEAL(), 0, 2.5, 0),
 B(3, 0.14, 1.4, stripe, 0, 2.1, 1.4),
 B(2.6, 0.12, 0.7, mat(0x7a4a21, { rough: 0.9 }), 0, 1.1, 1.2),
 B(0.5, 0.4, 0.4, mat(PAL.green, { rough: 0.8 }), -0.7, 1.35, 1.2),
 B(0.5, 0.4, 0.4, mat(PAL.yellow, { rough: 0.8 }), 0.7, 1.35, 1.2), sign
 );
}

export function makeFlagPole() {
 const flag = mat(0xffffff, { map: batikMega(), rough: 0.7 });
 return G(
 CY(0.08, 0.13, 6, GOLD(), 0, 3, 0, 10), SP(0.16, GOLD(), 0, 6.1, 0),
 B(1.3, 0.75, 0.06, flag, 0.7, 5.5, 0), B(1.35, 0.08, 0.08, GOLD(), 0.68, 5.9, 0),
 B(0.7, 0.4, 0.7, mat(PAL.sidewalk, { rough: 0.9 }), 0, 0.2, 0)
 );
}


export function hoverBase(color, len = 4.2) {
 const bodyM = mat(color, { rough: 0.35, metal: 0.35 });
 const glassM = mat(0xbfe3f0, { rough: 0.15, metal: 0.1 });
 const dark = DARK();
 const body = wedge(len, 1.05, 1.9, bodyM); body.position.y = 0.55;
 const can = wedge(1.9, 0.55, 1.5, glassM); can.position.set(-0.3, 1.6, 0);
 const glow = B(len - 0.7, 0.09, 1.6, mat(PAL.tealLight, { emi: PAL.tealLight, ei: 1.6, rough: 0.4 }), 0, 0.14, 0);
 const pods = [];
 for (const [px, pz] of [[-1.5, -0.85], [1.5, -0.85], [-1.5, 0.85], [1.5, 0.85]])
 pods.push(CY(0.26, 0.32, 0.28, dark, px, 0.32, pz, 10));
 const bar = B(0.12, 0.14, 1.5, mat(0xffffff, { emi: 0xffffff, ei: 1.8, rough: 0.3 }), len / 2 - 0.05, 0.95, 0);
 const thr = [CY(0.14, 0.18, 0.3, mat(0xff7733, { emi: 0xff7733, ei: 2 }), -len / 2 - 0.05, 0.85, -0.5, 8), CY(0.14, 0.18, 0.3, mat(0xff7733, { emi: 0xff7733, ei: 2 }), -len / 2 - 0.05, 0.85, 0.5, 8)];
 thr.forEach(t => { t.rotation.z = Math.PI / 2; });
 return { body, can, glow, pods, bar, thr };
}

export function makeHoverCar(color = 0x2f6fb2) {
 const h = hoverBase(color);
 return G(h.body, h.can, h.glow, ...h.pods, h.bar, ...h.thr);
}

export function makeTaxi() {
 const h = hoverBase(0xffb300);
 const sign = signPanel(1, 0.4, 'TAXI', '#23282e', '#ffb300'); sign.position.set(0.1, 2.25, 0);
 const stripe = B(4.25, 0.18, 1.92, DARK(), 0, 0.95, 0);
 return G(h.body, h.can, h.glow, ...h.pods, h.bar, ...h.thr, stripe, sign);
}

export function makeAngkot() {
 const teal = mat(0x14b8a6, { rough: 0.4, metal: 0.3 });
 const glassM = mat(0x1d3557, { rough: 0.25, metal: 0.2 });
 const body = B(4.4, 1.5, 2, teal, 0, 1.35, 0);
 const nose = wedge(1.1, 1.1, 2, teal); nose.position.set(2.2, 0.6, 0);
 const win = B(3.6, 0.55, 2.04, glassM, -0.2, 1.75, 0);
 const stripe = B(4.45, 0.22, 2.04, GOLD(), 0, 0.95, 0);
 const sign = signPanel(1.4, 0.42, 'ANGKOT', '#0e7c7b', '#f2e6c9'); sign.position.set(-0.2, 2.35, 0);
 const glow = B(4.6, 0.09, 1.7, mat(PAL.tealLight, { emi: PAL.tealLight, ei: 1.6, rough: 0.4 }), 0, 0.14, 0);
 const pods = [];
 for (const [px, pz] of [[-1.7, -0.9], [1.7, -0.9], [-1.7, 0.9], [1.7, 0.9]]) pods.push(CY(0.26, 0.32, 0.28, DARK(), px, 0.32, pz, 10));
 return G(body, nose, win, stripe, sign, glow, ...pods);
}

export function makeNPDInterceptor() {
 const h = hoverBase(0xf5f2ea);
 const stripe = B(4.25, 0.22, 1.92, mat(0x1d4ed8, { rough: 0.4, metal: 0.3 }), 0, 0.9, 0);
 const goldNose = B(0.3, 0.5, 1.9, GOLD(), 2.05, 0.85, 0);
 const barBase = B(1.1, 0.14, 0.5, DARK(), -0.3, 2.2, 0);
 const red = B(0.45, 0.22, 0.5, mat(0xcc1122, { emi: 0xcc1122, ei: 2.4 }), -0.55, 2.32, 0);
 const blue = B(0.45, 0.22, 0.5, mat(0x2266ff, { emi: 0x2266ff, ei: 2.4 }), -0.05, 2.32, 0);
 const sign = signPanel(1, 0.4, 'NPD', '#1d3557', '#f2e6c9'); sign.position.set(0.6, 1.9, 0.95); sign.rotation.y = Math.PI / 2;
 return G(h.body, h.can, h.glow, ...h.pods, h.bar, ...h.thr, stripe, goldNose, barBase, red, blue, sign);
}



export function makePed(o = {}) {
 const shirt = o.shirt ?? 0xff4fa3, pants = o.pants ?? 0x23282e, skin = o.skin ?? PAL.skin;
 const style = o.style ?? 'street', s = o.scale ?? 1;
 const shirtM = style === 'batik' ? mat(0xffffff, { map: batikParang(), rough: 0.8 }) : mat(shirt, { rough: 0.85 });
 const parts = [
 B(0.22, 0.75, 0.22, mat(pants, { rough: 0.9 }), -0.14, 0.38, 0),
 B(0.22, 0.75, 0.22, mat(pants, { rough: 0.9 }), 0.14, 0.38, 0),
 B(0.62, 0.7, 0.34, shirtM, 0, 1.1, 0),
 B(0.14, 0.6, 0.14, mat(skin, { rough: 0.8 }), -0.4, 1.05, 0),
 B(0.14, 0.6, 0.14, mat(skin, { rough: 0.8 }), 0.4, 1.05, 0),
 SP(0.24, mat(skin, { rough: 0.75 }), 0, 1.68, 0, 12, 10),
 ];
 if (style === 'kebaya') {
 parts.push(CY(0.2, 0.42, 0.8, mat(0x14b8a6, { rough: 0.85 }), 0, 0.4, 0, 10));
 parts.push(SP(0.25, mat(0x1a1a1a, { rough: 0.9 }), 0, 1.78, -0.03, 10, 8));
 } else if (style === 'street') {
 parts.push(CY(0.26, 0.26, 0.1, mat(shirt, { rough: 0.85 }), 0, 1.88, 0, 12));
 parts.push(B(0.3, 0.06, 0.3, mat(shirt, { rough: 0.85 }), 0, 1.84, 0.24));
 } else if (style === 'kid') {
 parts.push(SP(0.26, mat(0x1a1a1a, { rough: 0.9 }), 0, 1.8, 0, 10, 8));
 } else {
 parts.push(SP(0.25, mat(0x1a1a1a, { rough: 0.9 }), 0, 1.8, -0.02, 10, 8));
 }
 const g = G(...parts); g.scale.setScalar(s);
 return g;
}

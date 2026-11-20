



import * as THREE from '../vendor/three.module.min.js';
import { WEAPONS } from './combat.js'; 


const WEDGE = [5, 0, 1, 2, 3, 4];
const KEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'];
const GOLD = '#f2c94c', TEAL = '#2ec4b6';

const ICONS = {
 5: '<path d="M-13,-4 h26 v10 h-26 z M-9,-11 a5,5 0 0 1 5,5 h-10 a5,5 0 0 1 5,-5 M3,-11 a5,5 0 0 1 5,5 h-10 a5,5 0 0 1 5,-5" fill="#f2c94c"/>',
 0: '<path d="M-16,-6 h28 v7 h-9 v9 h-6 v-9 h-13 z" fill="#f2c94c"/>',
 1: '<path d="M-17,-5 h30 v6 h-6 v9 h-5 v-9 h-8 v6 h-5 v-6 h-6 z" fill="#f2c94c"/>',
 2: '<path d="M-19,-4 h38 v5 h-38 z M-6,1 h8 v7 h-8 z" fill="#f2c94c"/>',
 3: '<path d="M-19,-3 h38 v5 h-38 z M-4,-9 h10 v4 h-10 z M2,2 h5 v8 h-5 z" fill="#f2c94c"/>',
 4: '<path d="M-19,-6 h38 v12 h-38 z M14,-9 l8,6 -8,6 z" fill="#f2c94c"/>',
};
function keyDown(G, c) { const k = G.keys; return k ? (typeof k.has === 'function' ? k.has(c) : !!k[c]) : false; }

export function initWheel(G) {
 G.weapon = G.weapon || { index: 5, name: 'FISTS', ammo: Infinity, mag: Infinity };
 G.pov = G.pov || 'third';
 G.povBlend = G.pov === 'fps' ? 1 : 0;
 G.view = G.view || { yaw: 0, pitch: 0 };
 let open = false, sel = WEDGE.indexOf(G.weapon.index);

 
 let el = document.getElementById('wheel');
 if (!el) {
 el = document.createElement('div');
 el.id = 'wheel';
 el.style.cssText = 'position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:30;pointer-events:none';
 document.body.appendChild(el);
 }
 const R = 185, r = 92, C = 200;
 const pt = (ang, rad) => [C + rad * Math.cos(ang * Math.PI / 180), C + rad * Math.sin(ang * Math.PI / 180)];
 let wedges = '';
 for (let i = 0; i < 6; i++) {
 const a0 = -90 + i * 60, a1 = a0 + 60, mid = a0 + 30;
 const [x0, y0] = pt(a0, R), [x1, y1] = pt(a1, R), [x2, y2] = pt(a1, r), [x3, y3] = pt(a0, r);
 const [lx, ly] = pt(mid, 158), [ix, iy] = pt(mid, 128), [ax, ay] = pt(mid, 108);
 const wi = WEDGE[i], w = WEAPONS[wi];
 wedges += `<path class="wedge" data-i="${i}" d="M${x0.toFixed(1)},${y0.toFixed(1)} A${R},${R} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)} A${r},${r} 0 0 0 ${x3.toFixed(1)},${y3.toFixed(1)} Z" fill="rgba(10,12,18,0.82)" stroke="${GOLD}" stroke-opacity="0.45" stroke-width="1.5"/>`
 + `<g transform="translate(${ix.toFixed(1)},${iy.toFixed(1)}) rotate(${mid + 90}) scale(0.9)">${ICONS[wi]}</g>`
 + `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" fill="${GOLD}" font-size="13" font-weight="700" font-family="system-ui" text-anchor="middle" transform="rotate(${mid + 90} ${lx.toFixed(1)} ${ly.toFixed(1)})">${w.name}</text>`
 + `<text class="wammo" data-i="${i}" x="${ax.toFixed(1)}" y="${ay.toFixed(1)}" fill="#e8e4d8" font-size="12" font-family="system-ui" text-anchor="middle">${wi === 5 ? '∞' : WEAPONS[wi].reserve}</text>`;
 }
 
 let ring = '';
 for (let i = 0; i < 28; i++) {
 const [x, y] = pt(i * (360 / 28), 100);
 ring += `<rect x="${(x - 3).toFixed(1)}" y="${(y - 3).toFixed(1)}" width="6" height="6" fill="${i % 2 ? TEAL : GOLD}" opacity="0.85" transform="rotate(${i * (360 / 28)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
 }
 el.innerHTML = `<svg width="min(460px,86vmin)" height="min(460px,86vmin)" viewBox="0 0 400 400" style="filter:drop-shadow(0 0 24px rgba(0,0,0,0.6))">${wedges}<circle cx="200" cy="200" r="96" fill="rgba(8,10,14,0.92)" stroke="${GOLD}" stroke-width="2"/>${ring}<text id="wname" x="200" y="196" fill="${GOLD}" font-size="30" font-weight="800" font-family="system-ui" text-anchor="middle">FISTS</text><text id="wammo" x="200" y="228" fill="#e8e4d8" font-size="22" font-family="system-ui" text-anchor="middle">∞</text><text x="200" y="252" fill="#8b93a3" font-size="11" font-family="system-ui" text-anchor="middle">Q / TAB — TUTUP</text></svg>`;
 const wedgeEls = [...el.querySelectorAll('.wedge')];
 const nameEl = el.querySelector('#wname'), ammoEl = el.querySelector('#wammo');

 function ammoText(i) {
 const w = WEAPONS[i];
 return i === 5 ? '∞' : `${G.weapon.index === i && G.weapon.mag != null ? G.weapon.mag : w.mag} / ${G.weapon.index === i && G.weapon.ammo != null ? Math.floor(G.weapon.ammo) : w.reserve}`;
 }
 function paint() {
 wedgeEls.forEach((p, i) => {
 const on = i === sel;
 p.setAttribute('fill', on ? GOLD : 'rgba(10,12,18,0.82)');
 p.setAttribute('fill-opacity', on ? '0.92' : '1');
 p.style.filter = on ? 'drop-shadow(0 0 10px rgba(242,201,76,0.9))' : 'none';
 });
 const wi = WEDGE[sel];
 nameEl.textContent = WEAPONS[wi].name;
 ammoEl.textContent = ammoText(wi);
 }
 function select(i, confirmNow) { 
 sel = WEDGE.indexOf(i);
 G.weapon.index = i; G.weapon.name = WEAPONS[i].name;
 G.weapon.mag = WEAPONS[i].mag; G.weapon.ammo = WEAPONS[i].reserve;
 G.weaponIndex = i;
 if (G.player) G.player.weapon = i;
 G.pov = i === 5 ? 'third' : 'fps';
 if (G.combat) G.combat.setViewmodel(i);
 if (G.hud && typeof G.hud.setWeapon === 'function') G.hud.setWeapon(i);
 paint();
 if (confirmNow) close();
 }
 function openWheel() {
 if (open || G.state !== 'play') return;
 open = true; G.wheelOpen = true; G.timeScale = 0.25; 
 sel = WEDGE.indexOf(G.weapon.index);
 el.classList.remove('hidden');
 el.style.display = 'flex';
 paint();
 }
 function close() {
 if (!open) return;
 open = false; G.wheelOpen = false; G.timeScale = 1;
 el.style.display = 'none';
 el.classList.add('hidden');
 select(WEDGE[sel], false);
 }
 
 el.addEventListener('pointermove', (e) => {
 const svg = el.querySelector('svg').getBoundingClientRect();
 const dx = e.clientX - (svg.left + svg.width / 2), dy = e.clientY - (svg.top + svg.height / 2);
 if (Math.hypot(dx, dy) < 60) return;
 const ang = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360;
 sel = Math.min(5, Math.floor(ang / 60));
 paint();
 });
 window.addEventListener('keydown', (e) => {
 if (e.code === 'Tab') e.preventDefault();
 if (e.repeat) return;
 if (e.code === 'KeyQ' || e.code === 'Tab') openWheel();
 else if (open && (e.code === 'ArrowRight' || e.code === 'ArrowDown')) { sel = (sel + 1) % 6; paint(); }
 else if (open && (e.code === 'ArrowLeft' || e.code === 'ArrowUp')) { sel = (sel + 5) % 6; paint(); }
 else if (!open) {
 const k = KEYS.indexOf(e.code);
 if (k >= 0) select(k, true); 
 }
 });
 window.addEventListener('keyup', (e) => {
 if (e.code === 'KeyQ' || e.code === 'Tab') close(); 
 });
 window.addEventListener('blur', () => { if (open) close(); });

 
 const v = new THREE.Vector3(), fwd = new THREE.Vector3();
 function update(dt) {
 
 if (G.mouse && typeof G.mouse.dx === 'number') {
 G.view.yaw -= G.mouse.dx * 0.0025;
 G.view.pitch = Math.max(-1.2, Math.min(1.2, G.view.pitch - G.mouse.dy * 0.0025));
 G.mouse.dx = 0; G.mouse.dy = 0;
 }
 const tgt = G.pov === 'fps' ? 1 : 0;
 if (Math.abs(G.povBlend - tgt) > 0.001) G.povBlend += Math.sign(tgt - G.povBlend) * Math.min(Math.abs(tgt - G.povBlend), dt * 6);
 const cam = G.camera, p = G.player;
 
 if (!cam || !p || G.state !== 'play' || p.inCar || G.shotCam || G.fpsCam) return;
 const pp = p.pos || p.group?.position;
 if (!pp) return;
 const b = G.povBlend * G.povBlend * (3 - 2 * G.povBlend); 
 fwd.set(-Math.sin(G.view.yaw), 0, -Math.cos(G.view.yaw));
 
 const tx = pp.x - fwd.x * 7 * (1 - b), tz = pp.z - fwd.z * 7 * (1 - b);
 const ty = pp.y + 2.8 * (1 - b) + 1.62 * b;
 cam.position.set(tx, ty, tz);
 const dx = -Math.sin(G.view.yaw) * Math.cos(G.view.pitch);
 const dy = Math.sin(G.view.pitch);
 const dz = -Math.cos(G.view.yaw) * Math.cos(G.view.pitch);
 
 v.set(
 pp.x + (cam.position.x + dx * 10 - pp.x) * b,
 pp.y + 1.5 + (cam.position.y + dy * 10 - pp.y - 1.5) * b,
 pp.z + (cam.position.z + dz * 10 - pp.z) * b
 );
 cam.lookAt(v);
 if (p.group) p.group.rotation.y = G.view.yaw;
 }

 G.wheel = { open: openWheel, close, select, isOpen: () => open, update };
 
 G.openWheel = (i) => { openWheel(); if (i != null && i >= 0 && i <= 5) select(i, false); };
 G.selectWeapon = (i) => select(i, true);
 G.updates = G.updates || []; G.updates.push(update);
 return G.wheel;
}

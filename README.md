# Noesantara 2520

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/bsnpg/noesantara-2520/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/bsnpg/noesantara-2520/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

**Noesantara 2520: 8 Jobs to Own the Streets** is a playable open-world
crime game built as plain static files — three.js in the browser, no
network, no build step. It is our entry for the make.fun competition
**gta6-01** ("Make GTA 6").

## The city and the story

The year is 2520. **Noesantara**, capital of the **Republik Vantara**, is a
vertical mega-city of seven districts: neon racing streets, a giant market,
the gang-run Undercity, the golden corporate Spire, temple towers, the
Skyport docks and the hanging gardens. Temple-tiered chrome towers, batik
holograms, gapura gates and hover traffic fill the streets, and the crowds
run for cover when a fight breaks out.

**Wowo "Ghost"** is an ex-NPD interceptor pilot, framed by the Chrome
Vipers for a theft he never committed and thrown out of the force. The
**Neon Wolves** — navigator Mara, mechanic Riko and shooter Kiko — took
him in. Eight jobs stand between him and a clean name: street races, a
drive-by, two gang wars, a convoy escort, a one-on-one duel with the Viper
boss **Razor**, and a final assault on the Spire to expose the Syndicate
that set him up.

## What is in the game

- **Open world on foot and by car** — drive the gold-and-teal hover-coupe
  **Garuda GT**, or get out and fight on foot. Civilian traffic and
  pedestrians fill the streets; the city feels alive.
- **Wanted system (1–5 stars)** — the NPD responds to what you do, from
  patrol cars up to roadblocks and helicopters. Hide unseen for 15 seconds
  or finish a mission to cool off.
- **8 missions** with Indonesian names and English objectives, plus side
  quests, 50 batik-hologram collectibles, and a 7-district map with
  territory standings, perks and rewards.
- **GTA V-style weapon wheel** — six wedges (Fists, Pistol, SMG, Shotgun,
  Rifle, Bazooka), hold Q/Tab, keys 1–6 for a direct pick. Fists play in
  third person; any gun switches to first person.
- **Progression** — Credits (Rp) and XP up to level 50, car upgrades at
  Riko's garage in Skyport, weapons at the Pasar Nusantara shops, and
  territory income from districts the Wolves control.
- **Finish-line replay** — the last 15 seconds of a race win replay with
  camera angles and slow motion, plus a photo mode.

## Play it

```sh
node serve.ts
# then open http://localhost:8080 — or open game/index.html directly
```

No install step: the game is static files under `game/`.

## Controls

| Keys | What they do |
| --- | --- |
| W/S, A/D, Space, Shift | Drive: throttle/brake, steer, handbrake/drift, boost |
| E | Enter or exit the car |
| WASD, mouse, Space, Shift | On foot: move, look/aim, jump/dodge, sprint |
| LMB, RMB, R, F, V | Shoot/punch, aim, reload, interact, melee |
| Q/Tab (hold), 1–6 | Weapon wheel, or pick a weapon directly |
| M, Esc, P, R (in car) | Full map, pause, photo mode, finish-cam replay |
| C | Switch camera |

## How the entry is built

`main.ts` (Node 22, standard library only) copies `game/` and
`screenshots/` into the output directory and writes `dossier.json` with
the vendored make.fun library. The game source is split into files with
one clear job each: `game/src/city.js` builds the districts, `game/src/car.js`
and `game/src/vehicles.js` the cars, `game/src/combat.js` the on-foot
fighting, `game/src/wheel.js` the weapon wheel, `game/src/map.js` the full
map, and `game/src/hud.js` the HUD.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards</sub>

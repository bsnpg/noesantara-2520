export const CONFIG = {
  citySize: 640,            // world is citySize x citySize, Spire at (0,0)
  groundY: 0,
  seedDefault: 1,
  step: 1 / 60,             // fixed-step seconds
  dayLength: 600,           // in-game seconds per full day (clock only)
  startHour: 16.5,          // golden afternoon
  playerSpeed: 7,           // m/s on foot
  playerSprint: 11,
  carTopSpeed: 62,          // m/s ~ 220 km/h
  carAccel: 26,
  carBrake: 40,
  carSteer: 1.9,
  boostMul: 1.45,
  boostDrain: 30,           // per second
  camDist: 11, camHeight: 4.5,
  weapons: [
    { name: 'Pistol',  ammo: 12,  dmg: 12, rate: 0.28, auto: false },
    { name: 'SMG',     ammo: 32,  dmg: 8,  rate: 0.09, auto: true  },
    { name: 'Shotgun', ammo: 6,   dmg: 34, rate: 0.9,  auto: false },
    { name: 'Rifle',   ammo: 30,  dmg: 22, rate: 0.13, auto: true  },
    { name: 'Bazooka', ammo: 3,   dmg: 90, rate: 1.4,  auto: false },
    { name: 'Fists',   ammo: Infinity, dmg: 15, rate: 0.4, auto: false },
  ],
  wheelOrder: [5, 0, 1, 2, 3, 4], // wedge 0 (top) = Fists ... wedge 5 = Bazooka
  gold: 0xf5c542, teal: 0x2ec4b6, brick: 0xc0392b, cream: 0xffe9a8,
  // District centres unified to the city builder's grid (Spire 0,0).
  districts: [
    { name: 'Distrik Neon',    color: 0xff4fa3, cx: -230, cz: -200, r: 95, faction: 'Wolves',    missions: [1, 3] },
    { name: 'Pasar Nusantara', color: 0xffb300, cx: 230,  cz: -200, r: 90, faction: 'Neutral',   missions: [3] },
    { name: 'Undercity',       color: 0xc0392b, cx: -230, cz: 200,  r: 95, faction: 'Vipers',    missions: [5, 6] },
    { name: 'Spire',           color: 0xffd700, cx: 0,    cz: 0,    r: 85, faction: 'Syndicate', missions: [8] },
    { name: 'Distrik Candi',   color: 0x1abc9c, cx: 230,  cz: 200,  r: 90, faction: 'Neutral',   missions: [] },
    { name: 'Skyport',         color: 0x3498db, cx: -230, cz: 0,    r: 80, faction: 'Wolves',    missions: [] },
    { name: 'Taman Gantung',   color: 0x27ae60, cx: 230,  cz: 0,    r: 85, faction: 'Neutral',   missions: [] },
  ],
  keys: {
    map: 'KeyM', pause: 'Escape', photo: 'KeyP', wheel: 'KeyQ', wheelAlt: 'Tab',
    enterCar: 'KeyE', interact: 'KeyF', reload: 'KeyR', melee: 'KeyV',
    jump: 'Space', boost: 'ShiftLeft', handbrake: 'Space', camera: 'KeyC', replay: 'KeyR',
  },
};

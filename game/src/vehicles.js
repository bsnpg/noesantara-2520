// vehicles.js — vehicle factory: hero Garuda GT, Razor's Komodo R, enemy/NPD cars.
import * as A from './assets3d.js';

export function createVehicles(ctx) {
  const { scene } = ctx;
  const hero = A.makeGarudaGT();
  hero.position.set(-215, 0, -185);
  hero.rotation.y = 0; // facing east (+x) along Jl. Raya Utara
  scene.add(hero);
  const komodo = A.makeKomodoR();
  komodo.position.set(-180, 0, -185); komodo.rotation.y = 0;
  scene.add(komodo);
  return {
    hero, komodo,
    spawn(kind, x, z, heading) {
      const g = kind === 'komodo' ? A.makeKomodoR() : kind === 'npd' ? A.makeNpdCar() : kind === 'truck' ? A.makeTruck() : A.makeViperCar();
      g.position.set(x, 0, z); g.rotation.y = heading; scene.add(g);
      return g;
    },
  };
}

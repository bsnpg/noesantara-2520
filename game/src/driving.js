// driving.js — hover-car physics + chase camera (third person behind the car).
export function createDriving(ctx) {
  const d = {
    speed: 0, // units/s; displayed as km/h = speed * 3.2
    heading: 0, steer: 0, boost: 100, integrity: 100,
    kmh() { return Math.round(Math.abs(d.speed) * 3.2); },
    update(dt) {
      const input = ctx.input;
      if (input.wasPressed('KeyE')) { ctx.player.exitCar(); return; }
      const accel = input.isDown('KeyW') || input.isDown('ArrowUp');
      const brake = input.isDown('KeyS') || input.isDown('ArrowDown');
      const left = input.isDown('KeyA') || input.isDown('ArrowLeft');
      const right = input.isDown('KeyD') || input.isDown('ArrowRight');
      const boosting = input.isDown('ShiftLeft') && d.boost > 0 && accel;
      const top = boosting ? 62 : 46;
      if (accel) d.speed = Math.min(top, d.speed + (boosting ? 26 : 16) * dt);
      else if (brake) d.speed = Math.max(-12, d.speed - 22 * dt);
      else d.speed *= Math.max(0, 1 - 0.7 * dt);
      if (boosting) d.boost = Math.max(0, d.boost - 14 * dt);
      else d.boost = Math.min(100, d.boost + 4 * dt);
      const steerTarget = (left ? 1 : 0) - (right ? 1 : 0);
      d.steer += (steerTarget - d.steer) * Math.min(1, 8 * dt);
      if (Math.abs(d.speed) > 0.5) d.heading += d.steer * 1.5 * dt * Math.sign(d.speed);
      const car = ctx.vehicles.hero;
      car.position.x += Math.cos(d.heading) * d.speed * dt;
      car.position.z += -Math.sin(d.heading) * d.speed * dt;
      car.position.x = Math.max(-330, Math.min(330, car.position.x));
      car.position.z = Math.max(-310, Math.min(310, car.position.z));
      car.rotation.y = d.heading;
      car.position.y = 0.25 + Math.sin(ctx.time * 2.4) * 0.07;
      ctx.progression.markVisited(car.position.x, car.position.z);
      if (ctx.missions.index === 0 || ctx.missions.index === 3 || ctx.missions.index === 6) {
        ctx.missions.updateRace(car.position.x, car.position.z);
      }
    },
    // Chase camera: behind + above the car, looking forward.
    camera(dt) {
      const car = ctx.vehicles.hero;
      const back = 11, up = 4.5;
      const cx = car.position.x - Math.cos(d.heading) * back;
      const cz = car.position.z + Math.sin(d.heading) * back;
      const cam = ctx.render.camera;
      cam.position.x += (cx - cam.position.x) * Math.min(1, 6 * dt);
      cam.position.y += (up - cam.position.y) * Math.min(1, 6 * dt);
      cam.position.z += (cz - cam.position.z) * Math.min(1, 6 * dt);
      cam.lookAt(car.position.x + Math.cos(d.heading) * 14, 2.2, car.position.z - Math.sin(d.heading) * 14);
    },
  };
  return d;
}

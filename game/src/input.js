export function initInput(G) {
  const keys = G.keys, mouse = G.mouse;
  const gameKeys = ['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  addEventListener('keydown', (e) => {
    if (gameKeys.includes(e.code)) e.preventDefault();
    if (!e.repeat) keys[e.code] = true;
    G.keyPressed = e.code; // consumed by main loop each step
  });
  addEventListener('keyup', (e) => { keys[e.code] = false; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  const cv = G.renderer.domElement;
  addEventListener('mousemove', (e) => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    mouse.dx += e.movementX || 0; mouse.dy += e.movementY || 0;
  });
  cv.addEventListener('mousedown', (e) => { mouse.down = true; mouse.button = e.button; });
  addEventListener('mouseup', () => { mouse.down = false; mouse.button = -1; });
  cv.addEventListener('click', () => {
    if (G.state === 'play' && G.player.onFoot && G.player.weapon !== 5)
      cv.requestPointerLock?.();
  });
  document.addEventListener('pointerlockchange', () => {
    mouse.locked = document.pointerLockElement === cv;
  });
}

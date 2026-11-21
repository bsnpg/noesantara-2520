// Keyboard + mouse input state.
export function createInput() {
  const keys = new Set();
  const st = {
    keys, mouseDX: 0, mouseDY: 0, mouseX: 0, mouseY: 0, mouseDown: false,
    pressed: new Set(),
    isDown(c) { return keys.has(c); },
    wasPressed(c) { return st.pressed.has(c); },
    clearPressed() { st.pressed.clear(); st.mouseDX = 0; st.mouseDY = 0; },
  };
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Tab') e.preventDefault();
    if (!e.repeat) st.pressed.add(e.code);
    keys.add(e.code);
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());
  window.addEventListener('mousemove', (e) => { st.mouseDX += e.movementX || 0; st.mouseDY += e.movementY || 0; st.mouseX = e.clientX; st.mouseY = e.clientY; });
  window.addEventListener('mousedown', (e) => { if (e.button === 0) st.mouseDown = true; });
  window.addEventListener('mouseup', (e) => { if (e.button === 0) st.mouseDown = false; });
  window.addEventListener('contextmenu', (e) => e.preventDefault());
  return st;
}

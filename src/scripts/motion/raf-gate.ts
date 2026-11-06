// "No requestAnimationFrame loops while idle."
// ScrollTrigger keeps an empty rAF loop alive forever (a repaint workaround
// for Firefox). We let that keep-alive run only while the page is actually
// moving: during scroll / input / resize and for one second after. GSAP's own
// ticker already sleeps by itself when no tween is active.
const native = window.requestAnimationFrame.bind(window);
let capturing = false;
let keepAlive: FrameRequestCallback | null = null;
let parked = false;
let activeUntil = 0;

window.requestAnimationFrame = (cb: FrameRequestCallback) => {
  if (capturing && !keepAlive) {
    const src = String(cb);
    if (src.length < 160 && src.includes('requestAnimationFrame')) keepAlive = cb;
  }
  if (cb === keepAlive && performance.now() > activeUntil) {
    parked = true;
    return 0;
  }
  return native(cb);
};

function wake() {
  activeUntil = performance.now() + 1000;
  if (parked && keepAlive) {
    parked = false;
    native(keepAlive);
  }
}
for (const type of ['scroll', 'wheel', 'touchmove', 'pointerdown', 'keydown', 'resize']) {
  addEventListener(type, wake, { passive: true, capture: true });
}

/** Run `register` while watching for the keep-alive loop it starts. */
export function captureKeepAlive(register: () => void) {
  capturing = true;
  try {
    register();
  } finally {
    capturing = false;
  }
}

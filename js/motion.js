// Tiny motion toolkit: easing, springs, scroll progress, one shared animation loop.

export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, t) => a + (b - a) * t;

export const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// A spring that chases `target`. Damping is set for a small overshoot, never a bounce.
export class Spring {
  constructor(value = 0, { stiffness = 170, damping = 22 } = {}) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.stiffness = stiffness;
    this.damping = damping;
  }

  update(dt) {
    // Small sub-steps keep the spring stable when a frame takes long.
    const steps = Math.ceil(dt / (1 / 120));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const force = (this.target - this.value) * this.stiffness - this.velocity * this.damping;
      this.velocity += force * h;
      this.value += this.velocity * h;
    }
    return this.value;
  }

  snap(value) {
    this.value = this.target = value;
    this.velocity = 0;
  }
}

// False when the element sits on a hidden page (display: none), so loops can skip it.
export const isShown = (el) => el.getClientRects().length > 0;

// 0 when a tall "sticky" section starts, 1 when its last screen is reached.
export function stickyProgress(el) {
  const r = el.getBoundingClientRect();
  return clamp(-r.top / Math.max(1, r.height - innerHeight));
}

// 0 when the element's top enters the bottom of the screen, 1 when its bottom leaves the top.
export function viewProgress(el) {
  const r = el.getBoundingClientRect();
  return clamp((innerHeight - r.top) / (r.height + innerHeight));
}

// Smoothed pointer position, shared by the parallax, deck tilt and particle force field.
export const pointer = { x: innerWidth / 2, y: innerHeight / 2, sx: innerWidth / 2, sy: innerHeight / 2, active: false };

addEventListener('pointermove', (e) => {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  pointer.active = true;
}, { passive: true });
document.addEventListener('pointerleave', () => { pointer.active = false; });

// One requestAnimationFrame loop for the whole site.
const tasks = new Set();
export function onFrame(fn) {
  tasks.add(fn);
  return () => tasks.delete(fn);
}

let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 1 / 20);
  last = now;
  pointer.sx = lerp(pointer.sx, pointer.x, 0.08);
  pointer.sy = lerp(pointer.sy, pointer.y, 0.08);
  for (const fn of tasks) fn(now / 1000, dt);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

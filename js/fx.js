// Canvas effects: glowing embers and tiny hearts drift up the screen and get pushed away by the cursor.
// burst() draws a heart out of light; smoke() is for blowing out the candle.

import { onFrame, pointer, reducedMotion, easeOutExpo, clamp } from './motion.js';

const COLORS = ['#E8913C', '#F2B36B', '#E9767A', '#EDE7DC'];
const FORCE_RADIUS = 170;

let ctx, canvas, dpr = 1;
const particles = [];
const sprites = {};

// Pre-render each glow once, then just stamp it. Much faster than canvas shadowBlur.
function glowSprite(color) {
  const s = 64;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grad.addColorStop(0, '#fff');
  grad.addColorStop(0.12, color);
  grad.addColorStop(0.4, color + '55');
  grad.addColorStop(1, color + '00');
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  return c;
}

function heartSprite(color) {
  const s = 64;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  g.shadowColor = color;
  g.shadowBlur = 14;
  g.fillStyle = color;
  g.translate(s / 2, s / 2 + 4);
  g.beginPath();
  g.moveTo(0, 10);
  g.bezierCurveTo(-18, -2, -10, -18, 0, -8);
  g.bezierCurveTo(10, -18, 18, -2, 0, 10);
  g.fill();
  return c;
}

// The classic heart curve. t goes 0..2π.
const heartPoint = (t) => ({
  x: 16 * Math.pow(Math.sin(t), 3),
  y: -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)),
});

function ember(y = Math.random() * innerHeight) {
  const isHeart = Math.random() < 0.12;
  return {
    kind: isHeart ? 'heart' : 'ember',
    x: Math.random() * innerWidth,
    y,
    vx: 0,
    vy: -(8 + Math.random() * 22),
    push: { x: 0, y: 0 },
    size: isHeart ? 10 + Math.random() * 8 : 6 + Math.random() * 14,
    color: isHeart ? '#E9767A' : COLORS[Math.floor(Math.random() * COLORS.length)],
    alpha: 0.25 + Math.random() * 0.5,
    sway: Math.random() * Math.PI * 2,
    rot: Math.random() * 0.6 - 0.3,
    ambient: true,
  };
}

function resize() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

export function initFx(el) {
  canvas = el;
  ctx = canvas.getContext('2d');
  for (const c of COLORS) sprites[c] = glowSprite(c);
  sprites.heart = heartSprite('#E9767A');
  sprites.heartAmber = heartSprite('#E8913C');
  sprites.smoke = glowSprite('#9EA5A8');
  resize();
  addEventListener('resize', resize);

  if (reducedMotion) return;
  const count = innerWidth < 700 ? 26 : 54;
  for (let i = 0; i < count; i++) particles.push(ember());

  onFrame((t, dt) => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.globalCompositeOperation = 'lighter';

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      if (p.ambient) updateAmbient(p, t, dt);
      else if (!updateEffect(p, t, dt)) { particles.splice(i, 1); continue; }
      draw(p, t);
    }
  });
}

function updateAmbient(p, t, dt) {
  // Soda-style force field: the cursor pushes things away, and they drift back.
  if (pointer.active) {
    const dx = p.x - pointer.x;
    const dy = p.y - pointer.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d < FORCE_RADIUS) {
      const force = (1 - d / FORCE_RADIUS) * 260;
      p.push.x += (dx / d) * force * dt;
      p.push.y += (dy / d) * force * dt;
    }
  }
  p.push.x *= 0.94;
  p.push.y *= 0.94;
  p.x += (Math.sin(t * 0.6 + p.sway) * 6 + p.push.x) * dt;
  p.y += (p.vy + p.push.y) * dt;
  if (p.y < -30) Object.assign(p, ember(innerHeight + 20));
  if (p.x < -30) p.x = innerWidth + 20;
  if (p.x > innerWidth + 30) p.x = -20;
}

// Burst / smoke particles. Returns false when the particle is done.
function updateEffect(p, t, dt) {
  p.age += dt;
  if (p.kind === 'smoke') {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.size += 26 * dt;
    p.alpha = 0.22 * (1 - p.age / p.life);
    return p.age < p.life;
  }
  if (p.fall) {
    // heart rain: drift down, sway, fade at the end
    p.x += (p.vx + Math.sin(t * 2 + p.rot * 10) * 30) * dt;
    p.y += p.vy * dt;
    p.alpha = 0.9 * (1 - clamp((p.age - p.life * 0.7) / (p.life * 0.3)));
    return p.age < p.life;
  }
  if (p.kiss) {
    // tap hearts: pop outwards, then float up while they fade
    p.vx *= 0.96;
    p.vy -= 60 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.alpha = 0.95 * (1 - clamp(p.age / p.life));
    return p.age < p.life;
  }
  // heart burst: fly from the centre onto the heart shape, hold, then float up and fade
  const form = easeOutExpo(clamp((p.age - p.delay) / 0.9));
  p.x = p.ox + (p.tx - p.ox) * form;
  p.y = p.oy + (p.ty - p.oy) * form - Math.max(0, p.age - 1.6) * 40 * p.rise;
  p.alpha = p.age < 1.6 ? 0.95 * form : 0.95 * (1 - clamp((p.age - 1.6) / 1.6));
  return p.age < 3.2;
}

function draw(p, t) {
  const twinkle = p.ambient ? 0.75 + Math.sin(t * 2 + p.sway) * 0.25 : 1;
  ctx.globalAlpha = clamp(p.alpha * twinkle);
  let img;
  if (p.kind === 'heart') img = p.amber ? sprites.heartAmber : sprites.heart;
  else if (p.kind === 'smoke') img = sprites.smoke;
  else img = sprites[p.color];
  const s = p.size;
  const y = p.ambient ? p.y : p.y - (scrollY - p.scroll0);
  if (p.kind === 'heart') {
    ctx.save();
    ctx.translate(p.x, y);
    ctx.rotate(p.rot + (p.ambient ? Math.sin(t + p.sway) * 0.3 : 0));
    ctx.drawImage(img, -s / 2, -s / 2, s, s);
    ctx.restore();
  } else {
    ctx.drawImage(img, p.x - s / 2, y - s / 2, s, s);
  }
}

// Draw a heart made of light, centred on (x, y) in screen pixels.
export function burst(x, y, scale = Math.min(9, innerWidth / 70)) {
  if (reducedMotion || !ctx) return;
  const n = 90;
  for (let i = 0; i < n; i++) {
    const h = heartPoint((i / n) * Math.PI * 2);
    const isHeart = i % 6 === 0;
    particles.push({
      kind: isHeart ? 'heart' : 'ember',
      amber: i % 12 === 0,
      color: COLORS[i % 3],
      ox: x, oy: y,
      x, y,
      tx: x + h.x * scale + (Math.random() - 0.5) * 6,
      ty: y + h.y * scale + (Math.random() - 0.5) * 6,
      size: isHeart ? 14 : 10 + Math.random() * 12,
      rot: Math.random() * 0.6 - 0.3,
      rise: 0.6 + Math.random(),
      delay: Math.random() * 0.12,
      age: 0,
      alpha: 0,
      scroll0: scrollY,
    });
  }
}

export function smoke(x, y) {
  if (reducedMotion || !ctx) return;
  for (let i = 0; i < 16; i++) {
    particles.push({
      kind: 'smoke', x, y,
      vx: (Math.random() - 0.5) * 14,
      vy: -(30 + Math.random() * 40),
      size: 8 + Math.random() * 8,
      age: -i * 0.04, life: 1.8, alpha: 0, scroll0: scrollY,
    });
  }
}

// A few small hearts floating up from where someone tapped. Like a kiss.
export function kiss(x, y) {
  if (reducedMotion || !ctx) return;
  for (let i = 0; i < 7; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
    const speed = 60 + Math.random() * 90;
    particles.push({
      kind: 'heart', kiss: true, amber: Math.random() < 0.35,
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 16 + Math.random() * 14,
      rot: (Math.random() - 0.5) * 0.8,
      age: 0, life: 1 + Math.random() * 0.5, alpha: 0,
      scroll0: scrollY,
    });
  }
}

// Hearts raining down the whole screen, for the end of the wish.
export function rain(count = innerWidth < 700 ? 40 : 70) {
  if (reducedMotion || !ctx) return;
  for (let i = 0; i < count; i++) {
    particles.push({
      kind: 'heart', fall: true, amber: Math.random() < 0.4,
      x: Math.random() * innerWidth,
      y: -20 - Math.random() * innerHeight * 0.6,
      vx: (Math.random() - 0.5) * 20,
      vy: 90 + Math.random() * 110,
      size: 14 + Math.random() * 18,
      rot: (Math.random() - 0.5) * 0.8,
      age: 0, life: 4 + Math.random() * 1.5, alpha: 0.9,
      scroll0: scrollY,
    });
  }
}

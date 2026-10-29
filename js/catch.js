// Round two of the love meter: Catch the hearts. A canvas mini-game.
// Move the basket with the mouse, a finger or the arrow keys. Hearts are +1, golden hearts +3,
// broken hearts -2. It speeds up as the 20 seconds run out.

import { audio } from './audio.js';

const DURATION = 20;
const HEART = new Path2D('M16 28.5C6 21 0 15.5 0 9 0 4 3.8 0 8.5 0c3.1 0 5.9 1.7 7.5 4.3C17.6 1.7 20.4 0 23.5 0 28.2 0 32 4 32 9c0 6.5-6 12-16 19.5z');

const KINDS = {
  heart: { points: 1, color: '#E9767A', size: 30 },
  amber: { points: 1, color: '#E8913C', size: 30 },
  gold: { points: 3, color: '#FFD27A', size: 40 },
  broken: { points: -2, color: '#6B7378', size: 30 },
};

function pickKind() {
  const r = Math.random();
  if (r < 0.06) return 'gold';
  if (r < 0.22) return 'broken';
  return r < 0.6 ? 'heart' : 'amber';
}

function drawHeart(ctx, x, y, size, color, rot, broken) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const s = size / 32;
  ctx.scale(s, s);
  ctx.translate(-16, -14.5);
  ctx.shadowColor = color;
  ctx.shadowBlur = broken ? 0 : 18;
  ctx.fillStyle = color;
  if (broken) {
    // two halves pulled apart by a zigzag crack
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(side * 2.5, 0);
      ctx.beginPath();
      if (side < 0) ctx.rect(-4, -4, 20, 40);
      else ctx.rect(16, -4, 20, 40);
      ctx.clip();
      ctx.fill(HEART);
      ctx.restore();
    }
    ctx.strokeStyle = '#0A0C0E';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(16, 4); ctx.lineTo(13, 11); ctx.lineTo(19, 17); ctx.lineTo(15, 28);
    ctx.stroke();
  } else {
    ctx.fill(HEART);
  }
  ctx.restore();
}

export function initCatch() {
  const canvas = document.getElementById('catch-canvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('catch-score');
  const timeEl = document.getElementById('catch-time');
  let w = 0;
  let h = 0;
  let running = false;
  let raf = 0;
  let state = null;

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    w = r.width;
    h = r.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const toLocalX = (clientX) => clientX - canvas.getBoundingClientRect().left;
  canvas.addEventListener('pointermove', (e) => { if (state) state.targetX = toLocalX(e.clientX); });
  canvas.addEventListener('pointerdown', (e) => {
    if (!state) return;
    canvas.setPointerCapture(e.pointerId);
    state.targetX = toLocalX(e.clientX);
  });
  addEventListener('keydown', (e) => {
    if (!state || !running) return;
    if (e.key === 'ArrowLeft') { state.keys = -1; e.preventDefault(); }
    if (e.key === 'ArrowRight') { state.keys = 1; e.preventDefault(); }
  });
  addEventListener('keyup', (e) => {
    if (state && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) state.keys = 0;
  });

  function spawn() {
    const kind = pickKind();
    state.items.push({
      kind,
      x: 30 + Math.random() * (w - 60),
      y: -30,
      vy: 150 + state.elapsed * 9 + Math.random() * 60,
      sway: Math.random() * Math.PI * 2,
      rot: (Math.random() - 0.5) * 0.6,
    });
  }

  function popText(x, y, label, color) {
    state.pops.push({ x, y, label, color, age: 0 });
  }

  function frame(now) {
    if (!running) return;
    const dt = Math.min((now - state.last) / 1000, 1 / 20);
    state.last = now;
    state.elapsed += dt;
    // the countdown uses the real clock; movement uses the capped step so nothing tunnels
    const left = Math.max(0, DURATION - (now - state.startedAt) / 1000);
    timeEl.textContent = Math.ceil(left);

    // basket follows the pointer (smoothly) or the arrow keys
    if (state.keys) state.targetX += state.keys * 520 * dt;
    state.targetX = Math.max(40, Math.min(w - 40, state.targetX));
    state.bx += (state.targetX - state.bx) * Math.min(1, dt * 14);
    state.shake *= 0.9;

    // spawn faster as time goes on
    state.spawnIn -= dt;
    if (state.spawnIn <= 0) {
      spawn();
      state.spawnIn = Math.max(0.28, 0.62 - state.elapsed * 0.017);
    }

    const basketY = h - 46;
    const half = 46;
    for (let i = state.items.length - 1; i >= 0; i--) {
      const it = state.items[i];
      it.y += it.vy * dt;
      it.x += Math.sin(state.elapsed * 3 + it.sway) * 30 * dt;
      const kind = KINDS[it.kind];
      if (it.y > basketY - 10 && it.y < basketY + 16 && Math.abs(it.x - state.bx) < half) {
        state.items.splice(i, 1);
        state.score = Math.max(0, state.score + kind.points);
        if (kind.points > 0) {
          state.combo++;
          audio.blip(state.combo);
          popText(it.x, basketY - 30, `+${kind.points}`, kind.color);
          state.flash = 1;
        } else {
          state.combo = 0;
          state.shake = 12;
          audio.thud();
          popText(it.x, basketY - 30, `${kind.points}`, '#9EA5A8');
        }
        scoreEl.textContent = state.score;
        scoreEl.classList.remove('is-bump');
        void scoreEl.offsetWidth;
        scoreEl.classList.add('is-bump');
      } else if (it.y > h + 40) {
        state.items.splice(i, 1);
        if (kind.points > 0) state.combo = 0;
      }
    }

    // draw
    ctx.clearRect(0, 0, w, h);
    for (const it of state.items) {
      const kind = KINDS[it.kind];
      drawHeart(ctx, it.x, it.y, kind.size, kind.color, it.rot + Math.sin(state.elapsed * 4 + it.sway) * 0.15, it.kind === 'broken');
    }

    // the basket: a soft glowing cradle with a tiny heart on it
    const bx = state.bx + (Math.random() - 0.5) * state.shake;
    ctx.save();
    ctx.shadowColor = '#E8913C';
    ctx.shadowBlur = 20 + state.flash * 30;
    ctx.strokeStyle = '#E8913C';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(bx - half, basketY - 6);
    ctx.quadraticCurveTo(bx - half + 4, basketY + 24, bx, basketY + 24);
    ctx.quadraticCurveTo(bx + half - 4, basketY + 24, bx + half, basketY - 6);
    ctx.stroke();
    ctx.restore();
    drawHeart(ctx, bx, basketY + 10, 14, '#E8913C', 0, false);
    state.flash *= 0.88;

    // floating +1 / -2 labels
    ctx.font = '700 18px Syne, sans-serif';
    ctx.textAlign = 'center';
    for (let i = state.pops.length - 1; i >= 0; i--) {
      const p = state.pops[i];
      p.age += dt;
      ctx.globalAlpha = Math.max(0, 1 - p.age / 0.8);
      ctx.fillStyle = p.color;
      ctx.fillText(p.label, p.x, p.y - p.age * 60);
      if (p.age > 0.8) state.pops.splice(i, 1);
    }
    ctx.globalAlpha = 1;

    if (left <= 0) {
      running = false;
      const done = state.done;
      const score = state.score;
      setTimeout(() => done(score), 400);
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  return {
    start(done) {
      resize();
      state = {
        items: [], pops: [], score: 0, combo: 0, elapsed: 0, spawnIn: 0.3,
        bx: w / 2, targetX: w / 2, keys: 0, shake: 0, flash: 0,
        last: performance.now(), startedAt: performance.now(), done,
      };
      scoreEl.textContent = '0';
      timeEl.textContent = DURATION;
      running = true;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
  };
}

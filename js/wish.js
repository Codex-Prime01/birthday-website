// The birthday cake. Hold the button: every flame grows (the middle one is the glowing dot).
// When the ring is full the candles go out one by one, smoke curls up, a heart of light appears
// and hearts rain down. The candles relight after a while so you can wish again.

import { onFrame, clamp, reducedMotion } from './motion.js';
import { audio } from './audio.js';
import { burst, smoke, rain } from './fx.js';
import { flare } from './thread.js';

const HOLD_SECONDS = 1.6;
const RING = 2 * Math.PI * 46; // circumference of the SVG ring (r = 46)
const CANDLES = 5;

export function initWish(name) {
  const btn = document.getElementById('wish-btn');
  const ring = btn.querySelector('.wish-ring-fill');
  const label = btn.querySelector('.wish-label');
  const holder = document.getElementById('candles');
  const done = document.getElementById('wish-done');
  let holding = false;
  let progress = 0;
  let blown = false;

  // five striped candles; the middle flame is where the travelling dot lands
  holder.replaceChildren(...Array.from({ length: CANDLES }, (_, i) => {
    const c = document.createElement('span');
    c.className = 'candle';
    c.style.setProperty('--i', i);
    const mid = i === Math.floor(CANDLES / 2);
    c.innerHTML = `<span class="flame${mid ? '' : ' flame--css'}"${mid ? ' data-thread="flame"' : ''}></span><span class="wick"></span><span class="stick"></span>`;
    return c;
  }));
  const candles = [...holder.children];
  const mainFlame = holder.querySelector('[data-thread]');

  const start = (e) => {
    if (blown) return;
    if (e.type === 'keydown' && e.key !== ' ' && e.key !== 'Enter') return;
    if (e.type === 'keydown') { e.preventDefault(); if (e.repeat) return; }
    holding = true;
    btn.classList.add('is-holding');
  };
  const stop = () => {
    holding = false;
    btn.classList.remove('is-holding');
  };
  btn.addEventListener('pointerdown', start);
  btn.addEventListener('keydown', start);
  ['pointerup', 'pointerleave', 'pointercancel', 'keyup', 'blur'].forEach((ev) => btn.addEventListener(ev, stop));
  btn.addEventListener('contextmenu', (e) => e.preventDefault()); // long-press menu on phones

  function blowOut() {
    blown = true;
    stop();
    // out they go, from the outside in, the middle one last
    const order = [0, 4, 1, 3, 2];
    order.forEach((ci, k) => {
      setTimeout(() => {
        const candle = candles[ci];
        const flame = candle.querySelector('.flame');
        const r = flame.getBoundingClientRect();
        candle.classList.add('is-out');
        if (flame === mainFlame) flame.setAttribute('data-thread-off', '');
        smoke(r.left + r.width / 2, r.top);
      }, reducedMotion ? 0 : k * 130);
    });
    setTimeout(() => {
      const r = document.getElementById('cake').getBoundingClientRect();
      burst(r.left + r.width / 2, r.top - Math.min(60, innerHeight * 0.06));
      rain();
      flare(2);
      audio.wish();
      label.textContent = 'Wish made';
      done.textContent = `I hope every bit of it comes true, ${name}. Happy birthday.`;
      done.classList.add('is-in');
    }, reducedMotion ? 0 : 750);

    setTimeout(() => {
      blown = false;
      progress = 0;
      candles.forEach((c) => c.classList.remove('is-out'));
      mainFlame.removeAttribute('data-thread-off');
      label.textContent = 'Hold to make another';
    }, 8000);
  }

  // Uses real elapsed time (not the capped frame step) so a slow phone still fills in 1.6s.
  let last = performance.now();
  onFrame(() => {
    const now = performance.now();
    const dt = (now - last) / 1000;
    last = now;
    if (blown) return;
    progress = clamp(progress + (holding ? dt / HOLD_SECONDS : -dt * 1.5));
    ring.style.strokeDashoffset = RING * (1 - progress);
    // the flames swell and brighten while you hold
    holder.style.setProperty('--grow', 1 + progress * 0.9);
    if (progress >= 1) blowOut();
  });
}

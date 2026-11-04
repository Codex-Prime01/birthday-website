// The "through-line": one glowing amber dot that travels through the whole page.
// Any element with data-thread="dot|bar|flame" is a place it can land. Each frame it picks
// the landing spot closest to the middle of the screen, measures it, and springs there.
// It stretches in the direction it moves (a cheap motion blur) and beats like a heart with the music.

import { onFrame, Spring, reducedMotion, clamp } from './motion.js';
import { audio } from './audio.js';

let glow = null;

// Make the glow swell for a big moment (opening the portal, the wish, the quiz result).
export function flare(amount = 1) {
  if (glow) glow.velocity += 14 * amount;
}

function pickAnchor() {
  const anchors = document.querySelectorAll('[data-thread]');
  let best = null;
  let bestScore = Infinity;
  for (const a of anchors) {
    const r = a.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const priority = a.hasAttribute('data-thread-priority');
    const dist = Math.abs(r.top + r.height / 2 - innerHeight * 0.5);
    const score = priority ? -1 : dist;
    if (score < bestScore) {
      bestScore = score;
      best = { el: a, r };
    }
  }
  return best;
}

// Two quick pulses every two beats: lub-dub.
function heartbeat() {
  const { beats } = audio.beat();
  const p = (beats % 2) / 2; // 0..1 over one second at 120 BPM
  const pulse = (x) => (x >= 0 ? Math.exp(-x * 26) : 0);
  return 1 + 0.22 * pulse(p) + 0.13 * pulse(p - 0.11);
}

export function initThread(el) {
  const x = new Spring(innerWidth / 2, { stiffness: 120, damping: 19 });
  const y = new Spring(innerHeight / 2, { stiffness: 120, damping: 19 });
  const w = new Spring(14, { stiffness: 160, damping: 22 });
  const h = new Spring(14, { stiffness: 160, damping: 22 });
  const visible = new Spring(0, { stiffness: 90, damping: 18 }); // grows in on load
  glow = new Spring(0, { stiffness: 40, damping: 9 });
  let first = true;

  onFrame((t, dt) => {
    const anchor = pickAnchor();
    if (!anchor) return;
    const { r } = anchor;
    x.target = r.left + r.width / 2;
    y.target = r.top + r.height / 2;
    w.target = Math.max(r.width, 4);
    h.target = Math.max(r.height, 4);
    visible.target = anchor.el.hasAttribute('data-thread-off') ? 0 : 1;
    el.dataset.shape = anchor.el.dataset.thread;

    if (first || reducedMotion) {
      [x, y, w, h].forEach((s) => s.snap(s.target));
      first = false;
    }
    [x, y, w, h, visible, glow].forEach((s) => s.update(dt));

    // stretch along the direction of travel, like motion blur
    const speed = Math.hypot(x.velocity, y.velocity);
    const stretch = 1 + clamp(speed / 900, 0, 1.6);
    const angle = Math.atan2(y.velocity, x.velocity);
    const beat = reducedMotion ? 1 : heartbeat();
    const show = clamp(visible.value);

    el.style.width = `${w.value}px`;
    el.style.height = `${h.value}px`;
    el.style.transform =
      `translate3d(${x.value - w.value / 2}px, ${y.value - h.value / 2}px, 0) ` +
      `rotate(${angle}rad) scale(${stretch}, ${1 / Math.sqrt(stretch)}) rotate(${-angle}rad) ` +
      `scale(${beat * (0.4 + 0.6 * show)})`;
    el.style.opacity = show;
    el.style.filter = speed > 500 ? `blur(${clamp((speed - 500) / 400, 0, 3)}px)` : '';
    el.style.setProperty('--glow', (1 + clamp(glow.value, 0, 3) + (beat - 1) * 2).toFixed(3));
  });
}

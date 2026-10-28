// Two endless bands of "I love you" in many languages, moving in opposite directions.
// Scrolling fast pushes them faster and leans them in the direction of travel.

import { onFrame, reducedMotion, lerp, isShown } from './motion.js';

const HEART = '<svg class="band-heart" viewBox="0 0 32 29" aria-hidden="true"><path d="M16 28.5C6 21 0 15.5 0 9 0 4 3.8 0 8.5 0c3.1 0 5.9 1.7 7.5 4.3C17.6 1.7 20.4 0 23.5 0 28.2 0 32 4 32 9c0 6.5-6 12-16 19.5z"/></svg>';

function fill(track, words) {
  const group = document.createElement('div');
  group.className = 'band-group';
  for (const [phrase, lang] of words) {
    const item = document.createElement('span');
    item.className = 'band-item';
    item.innerHTML = '<span class="band-word"></span><span class="band-lang"></span>';
    item.firstChild.textContent = phrase;
    item.lastChild.textContent = lang;
    group.append(item);
    group.insertAdjacentHTML('beforeend', HEART);
  }
  // two copies side by side, so when one slides out the other is already in place
  const copy = group.cloneNode(true);
  copy.setAttribute('aria-hidden', 'true');
  track.replaceChildren(group, copy);
}

export function initBand(words) {
  const rows = [...document.querySelectorAll('.band-row')];
  rows.forEach((row, i) => {
    // the second row starts halfway through the list so the two rows never line up
    const shifted = [...words.slice(i * 6), ...words.slice(0, i * 6)];
    fill(row.querySelector('.band-track'), shifted);
  });
  if (reducedMotion) return;

  const band = document.querySelector('.band');
  const offsets = rows.map(() => 0);
  let lastScroll = scrollY;
  let velocity = 0;

  onFrame((t, dt) => {
    const delta = scrollY - lastScroll;
    lastScroll = scrollY;
    velocity = lerp(velocity, delta / Math.max(dt, 1 / 120), 0.12);
    if (!isShown(band)) return;
    const r = band.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;

    rows.forEach((row, i) => {
      const track = row.firstElementChild;
      const dir = Number(row.dataset.dir);
      const half = track.scrollWidth / 2;
      if (!half) return;
      const speed = 40 + Math.abs(velocity) * 0.25;
      offsets[i] = (offsets[i] + speed * dt) % half;
      const skew = Math.max(-12, Math.min(12, velocity * -0.01)) * dir;
      const x = dir > 0 ? -offsets[i] : offsets[i] - half;
      track.style.transform = `translate3d(${x}px, 0, 0) skewX(${skew}deg)`;
    });
  });
}

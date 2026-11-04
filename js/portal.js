// The hero "portal". Everything here is tied to scroll position, so scrolling back reverses it.
// Panels slide apart, the wordmark splits and tightens, the photo settles,
// a duotone wash rises and a warm light leak blooms while it opens.

import { onFrame, stickyProgress, clamp, easeInOutCubic, pointer, reducedMotion, isShown } from './motion.js';

export function initPortal(section) {
  const $ = (s) => section.querySelector(s);
  const panelL = $('.portal-panel--l');
  const panelR = $('.portal-panel--r');
  const word = $('.portal-word');
  const w1 = $('.pw1');
  const w2 = $('.pw2');
  const media = $('.portal-media');
  const duo = $('.portal-duo');
  const leak = $('.portal-leak');
  const sparkA = $('.portal-spark--a');
  const sparkB = $('.portal-spark--b');
  const cue = $('.portal-cue');

  onFrame(() => {
    if (!isShown(section)) return;
    const p = stickyProgress(section);
    if (p >= 1 && section.getBoundingClientRect().bottom < 0) return; // off screen, skip work
    const e = easeInOutCubic(clamp(p / 0.62));
    const spread = innerWidth < 700 ? 0.1 : 0.15;

    panelL.style.transform = `translate3d(${-e * 101}%, 0, 0)`;
    panelR.style.transform = `translate3d(${e * 101}%, 0, 0)`;

    word.style.transform = `translate(-50%, -50%) scale(${1 + 0.14 * e})`;
    word.style.letterSpacing = `${-0.02 - 0.03 * e}em`;
    w1.style.transform = `translateX(${-e * spread * 100}%)`;
    w2.style.transform = `translateX(${e * spread * 100}%)`;

    const px = reducedMotion ? 0 : (pointer.sx / innerWidth - 0.5) * -18;
    const py = reducedMotion ? 0 : (pointer.sy / innerHeight - 0.5) * -12;
    media.style.transform = `translate3d(${px}px, ${py}px, 0) scale(${1.14 - 0.12 * e})`;

    duo.style.opacity = (0.2 * e).toFixed(3);
    leak.style.opacity = (Math.sin(Math.PI * clamp(p / 0.7)) * 0.85).toFixed(3);

    // two sparks start together in the middle and fly to opposite corners
    const sparkOpacity = e < 0.01 ? 0 : 1 - clamp((e - 0.8) / 0.2);
    sparkA.style.transform = `translate(${-e * 44}vw, ${-e * 40}vh)`;
    sparkB.style.transform = `translate(${e * 44}vw, ${e * 40}vh)`;
    sparkA.style.opacity = sparkB.style.opacity = sparkOpacity;

    cue.style.opacity = 1 - clamp(p * 4);
  });
}

// Slow "camera push": each [data-push] block scales 1 → 1.04 while its section crosses the screen.
// [data-drift] elements float upward and turn slowly on scroll (the round photo in the story).
export function initPush() {
  if (reducedMotion) return;
  const blocks = [...document.querySelectorAll('[data-push]')];
  const drifters = [...document.querySelectorAll('[data-drift]')];
  const progressOf = (el) => {
    if (!isShown(el)) return null;
    const r = el.parentElement.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return null;
    return clamp((innerHeight - r.top) / (r.height + innerHeight));
  };
  onFrame(() => {
    for (const el of blocks) {
      const p = progressOf(el);
      if (p !== null) el.style.transform = `scale(${1 + 0.04 * p})`;
    }
    for (const el of drifters) {
      const p = progressOf(el);
      if (p !== null) el.style.transform = `translate3d(0, calc(-50% + ${(0.5 - p) * 160}px), 0) rotate(${p * 40 - 20}deg)`;
    }
  });
}

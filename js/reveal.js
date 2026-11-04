// Entry reveals that fire once: masked letters for headlines ([data-split])
// and a wipe-up for blocks ([data-reveal]).

import { reducedMotion } from './motion.js';

// Wrap every letter in a span, keeping inner elements like <em> intact.
// Screen readers get the plain text from a hidden copy.
export function splitText(el) {
  const plain = el.textContent;
  let i = 0;

  const splitNode = (node) => {
    const out = document.createDocumentFragment();
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) {
        for (const part of child.textContent.split(/(\s+)/)) {
          if (!part) continue;
          if (/^\s+$/.test(part)) { out.append(' '); continue; }
          const word = document.createElement('span');
          word.className = 'word';
          for (const ch of part) {
            const c = document.createElement('span');
            c.className = 'char';
            c.textContent = ch;
            c.style.setProperty('--i', i++);
            word.append(c);
          }
          out.append(word);
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const copy = child.cloneNode(false);
        copy.append(splitNode(child));
        out.append(copy);
      }
    }
    return out;
  };

  const visual = document.createElement('span');
  visual.setAttribute('aria-hidden', 'true');
  visual.append(splitNode(el));
  const sr = document.createElement('span');
  sr.className = 'sr-only';
  sr.textContent = plain;
  el.replaceChildren(sr, visual);
  el.style.setProperty('--chars', i);
}

let splitIO = null;
let blockIO = null;

export function initReveal() {
  const targets = document.querySelectorAll('[data-split], [data-reveal]');
  document.querySelectorAll('[data-split]').forEach(splitText);

  if (reducedMotion || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const reveal = (entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    }
  };
  // Headlines wait until a fifth is on screen. Clipped blocks only expose a thin strip,
  // so they fire as soon as that strip passes the bottom 12% of the screen.
  splitIO = new IntersectionObserver(reveal, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
  blockIO = new IntersectionObserver(reveal, { threshold: 0, rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll('[data-split]').forEach((el) => splitIO.observe(el));
  document.querySelectorAll('[data-reveal]').forEach((el) => blockIO.observe(el));
}

// Reset a page's reveals so they play again on every visit.
// Called while the page is hidden behind the transition curtain.
export function replay(root) {
  if (!splitIO) return;
  const els = root.querySelectorAll('[data-split], [data-reveal]');
  root.classList.add('no-transition');
  els.forEach((el) => el.classList.remove('is-in'));
  root.getBoundingClientRect(); // apply the hidden state instantly
  root.classList.remove('no-transition');
  els.forEach((el) => {
    const io = el.hasAttribute('data-split') ? splitIO : blockIO;
    io.unobserve(el);
    io.observe(el);
  });
}

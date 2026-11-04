// Full-screen memories. The photo grows out of the card you tapped (a clip-path mask that starts
// at the card's exact rectangle), slowly drifts and zooms, and the caption writes itself in.
// Swipe, arrow keys or the buttons move between photos; each new one is wiped in by a mask.

import { reducedMotion } from './motion.js';
import { audio } from './audio.js';
import { kiss } from './fx.js';

const pad = (n) => String(n).padStart(2, '0');

export function initViewer(memories, { onClose }) {
  const viewer = document.getElementById('viewer');
  const frame = document.getElementById('viewer-frame');
  const count = document.getElementById('viewer-count');
  const cap = document.getElementById('viewer-cap');
  const meta = document.getElementById('viewer-meta');
  const dot = viewer.querySelector('.viewer-dot');
  const html = document.documentElement;
  let index = 0;
  let open = false;
  let swipe = null;

  // inset() values that make the frame look exactly like `rect`
  const insetFrom = (r) =>
    `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round 18px)`;

  function writeCaption(text) {
    cap.replaceChildren(...[...text].map((ch, i) => {
      const s = document.createElement('span');
      s.className = 'vchar';
      s.textContent = ch;
      s.style.setProperty('--i', i);
      return s;
    }));
  }

  function setText() {
    const m = memories[index];
    count.textContent = `${pad(index + 1)} / ${pad(memories.length)}`;
    meta.textContent = m.meta;
    writeCaption(m.caption);
  }

  // a new photo layer; `from` says which side its mask wipes in from
  function addPhoto(from) {
    // a blurred copy fills the screen behind the sharp photo, so portrait shots never look boxed in
    const img = document.createElement('div');
    img.className = 'viewer-photo';
    img.innerHTML = '<img class="vp-bg" alt="" draggable="false"><img class="vp-fg" draggable="false">';
    img.firstChild.src = memories[index].src;
    img.lastChild.src = memories[index].src;
    img.lastChild.alt = memories[index].caption;
    if (from && !reducedMotion) {
      img.style.clipPath = from > 0 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)';
      frame.append(img);
      img.getBoundingClientRect();
      img.style.clipPath = 'inset(0 0 0 0)';
      // drop the old photo once the new one has covered it
      setTimeout(() => { while (frame.children.length > 1) frame.firstElementChild.remove(); }, 900);
    } else {
      frame.replaceChildren(img);
    }
  }

  function show(i, from) {
    index = (i + memories.length) % memories.length;
    addPhoto(from);
    setText();
    audio.whoosh();
  }

  function openAt(i, fromRect) {
    index = i;
    open = true;
    viewer.hidden = false;
    html.classList.add('is-locked');
    dot.setAttribute('data-thread', 'dot');
    dot.setAttribute('data-thread-priority', '');
    addPhoto(0);
    setText();
    audio.chime(true);
    if (!reducedMotion && fromRect) {
      frame.style.transition = 'none';
      frame.style.clipPath = insetFrom(fromRect);
      frame.getBoundingClientRect();
      frame.style.transition = '';
    }
    requestAnimationFrame(() => {
      viewer.classList.add('is-open');
      frame.style.clipPath = 'inset(0 0 0 0 round 0px)';
    });
    document.getElementById('viewer-close').focus({ preventScroll: true });
  }

  function close() {
    if (!open) return;
    open = false;
    viewer.classList.remove('is-open');
    dot.removeAttribute('data-thread-priority');
    dot.removeAttribute('data-thread');
    const rect = onClose(index); // the deck brings this photo to the top and tells us where it is
    if (!reducedMotion && rect) frame.style.clipPath = insetFrom(rect);
    setTimeout(() => {
      viewer.hidden = true;
      html.classList.remove('is-locked');
      document.getElementById('deck').focus({ preventScroll: true });
    }, reducedMotion ? 0 : 750);
  }

  document.getElementById('viewer-next').addEventListener('click', () => show(index + 1, 1));
  document.getElementById('viewer-prev').addEventListener('click', () => show(index - 1, -1));
  document.getElementById('viewer-close').addEventListener('click', close);

  addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') show(index + 1, 1);
    if (e.key === 'ArrowLeft') show(index - 1, -1);
  });

  // swipe left / right; a double-tap sends a kiss
  let lastTap = 0;
  frame.addEventListener('pointerdown', (e) => { swipe = { x: e.clientX, y: e.clientY }; });
  frame.addEventListener('pointerup', (e) => {
    if (!swipe) return;
    const dx = e.clientX - swipe.x;
    swipe = null;
    if (Math.abs(dx) > 60) { show(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); return; }
    const now = performance.now();
    if (now - lastTap < 320) { kiss(e.clientX, e.clientY); audio.kiss(); }
    lastTap = now;
  });

  return { openAt };
}

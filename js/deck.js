// A physical-feeling deck of photos. Drag the top card past 10% of the deck width to throw it,
// tap to open it full screen, or use the arrow keys. Thrown cards slide back in at the bottom.

import { onFrame, pointer, reducedMotion, lerp, isShown } from './motion.js';
import { audio } from './audio.js';
import { kiss } from './fx.js';

const VISIBLE = 5;
const THROW_MS = 430;
const pad = (n) => String(n).padStart(2, '0');

export function initDeck(memories, { onOpen }) {
  const deck = document.getElementById('deck');
  const caption = document.getElementById('deck-caption');
  const count = document.getElementById('deck-count');
  const dot = document.getElementById('deck-dot');
  let order = memories.map((_, i) => i); // order[0] is the top card
  let busy = false;
  let drag = null;

  const cards = memories.map((m, i) => {
    const card = document.createElement('figure');
    card.className = 'card';
    // a fixed "random" tilt per card so the stack looks hand-placed
    card.tilt = ((i * 137) % 9) - 4;
    const img = document.createElement('img');
    img.src = m.src;
    img.alt = m.caption;
    img.draggable = false;
    img.loading = i < VISIBLE ? 'eager' : 'lazy';
    const cap = document.createElement('figcaption');
    cap.innerHTML = '<span class="card-cap"></span><span class="card-meta"></span>';
    cap.firstChild.textContent = m.caption;
    cap.lastChild.textContent = m.meta;
    card.append(img, cap);
    deck.append(card);
    return card;
  });

  function setCaption(text) {
    caption.classList.add('is-swapping');
    setTimeout(() => {
      caption.textContent = text;
      caption.classList.remove('is-swapping');
    }, 180);
  }

  function layout() {
    order.forEach((ci, depth) => {
      const card = cards[ci];
      card.style.zIndex = cards.length - depth;
      card.style.opacity = depth < VISIBLE ? 1 : 0;
      card.style.transform =
        `translate3d(0, ${depth * 7}px, 0) rotate(${depth === 0 ? 0 : card.tilt}deg) scale(${1 - depth * 0.016})`;
      card.classList.toggle('is-top', depth === 0);
    });
    const current = order[0];
    count.textContent = `${pad(current + 1)} / ${pad(cards.length)}`;
    dot.style.left = `${(current / (cards.length - 1)) * 100}%`;
    setCaption(memories[current].caption);
  }

  function next(dir = 1) {
    if (busy) return;
    busy = true;
    const card = cards[order[0]];
    const w = deck.offsetWidth;
    card.classList.remove('is-dragging');
    card.classList.add('is-thrown');
    card.style.transform = `translate3d(${dir * w * 1.15}px, -40px, 0) rotate(${dir * 24}deg) scale(1.02)`;
    audio.whoosh();
    setTimeout(() => {
      order.push(order.shift());
      card.classList.remove('is-thrown');
      layout();
      busy = false;
    }, reducedMotion ? 0 : THROW_MS);
  }

  function prev() {
    if (busy) return;
    busy = true;
    order.unshift(order.pop());
    const card = cards[order[0]];
    const w = deck.offsetWidth;
    // start the card off to the left with no transition, then let it fly back on top
    card.style.transition = 'none';
    card.style.zIndex = cards.length + 1;
    card.style.transform = `translate3d(${-w * 1.15}px, -40px, 0) rotate(-24deg)`;
    card.getBoundingClientRect(); // force the browser to apply the start position
    card.style.transition = '';
    audio.whoosh();
    layout();
    setTimeout(() => { busy = false; }, reducedMotion ? 0 : THROW_MS);
  }

  deck.addEventListener('pointerdown', (e) => {
    const top = cards[order[0]];
    if (busy || !top.contains(e.target)) return;
    drag = { x: e.clientX, y: e.clientY, dx: 0, dy: 0, el: top, id: e.pointerId };
    top.setPointerCapture(e.pointerId);
    top.classList.add('is-dragging');
  });

  deck.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag.dx = e.clientX - drag.x;
    drag.dy = e.clientY - drag.y;
    drag.el.style.transform = `translate3d(${drag.dx}px, ${drag.dy}px, 0) rotate(${drag.dx * 0.06}deg) scale(1.04)`;
  });

  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { dx, dy, el } = drag;
    drag = null;
    el.classList.remove('is-dragging');
    if (Math.abs(dx) > deck.offsetWidth * 0.1) {
      kiss(e.clientX, e.clientY);
      next(Math.sign(dx));
    }
    else if (Math.hypot(dx, dy) < 6 && e.type === 'pointerup') { layout(); onOpen(order[0], el.getBoundingClientRect()); } // a tap
    else layout(); // not far enough: spring back
  };
  deck.addEventListener('pointerup', endDrag);
  deck.addEventListener('pointercancel', endDrag);

  deck.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    if (e.key === 'Enter') { e.preventDefault(); onOpen(order[0], cards[order[0]].getBoundingClientRect()); }
  });
  document.getElementById('deck-next').addEventListener('click', () => next(1));
  document.getElementById('deck-prev').addEventListener('click', () => prev());
  document.getElementById('deck-open').addEventListener('click', () => onOpen(order[0], cards[order[0]].getBoundingClientRect()));

  // gentle 3D tilt of the whole stack toward the cursor
  if (!reducedMotion) {
    let rx = 0;
    let ry = 0;
    onFrame(() => {
      if (!isShown(deck)) return;
      const r = deck.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const tx = drag ? 0 : ((pointer.sy - (r.top + r.height / 2)) / innerHeight) * -10;
      const ty = drag ? 0 : ((pointer.sx - (r.left + r.width / 2)) / innerWidth) * 14;
      rx = lerp(rx, tx, 0.08);
      ry = lerp(ry, ty, 0.08);
      deck.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
  }

  // when the full-screen viewer closes on a different photo, bring that card to the top
  function showCard(index) {
    while (order[0] !== index) order.push(order.shift());
    layout();
  }

  layout();
  return { showCard, topRect: () => cards[order[0]].getBoundingClientRect() };
}

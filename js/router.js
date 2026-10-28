// Turns one HTML file into chapters. The URL hash picks the page (#/memories, #/meter ...).
// Because we never reload, the music keeps playing and the glowing heart flies between pages.
// Changing page: a warm curtain grows out of the tap point, the heart beats in the middle,
// then a hole opens from the centre onto the new page.

import { onFrame, clamp, easeInOutCubic, easeOutExpo, reducedMotion } from './motion.js';
import { audio } from './audio.js';

const COVER_MS = 650;
const OPEN_MS = 900;

const TITLES = {
  home: 'Happy Birthday',
  memories: 'Memories',
  story: 'Our story',
  notes: 'Love notes',
  meter: 'Love meter',
  wish: 'Make a wish',
};

// Run fn(t) every frame for `ms`, with t going 0 → 1. Resolves when done.
function tween(ms, fn) {
  return new Promise((resolve) => {
    const start = performance.now();
    const stop = onFrame(() => {
      const t = clamp((performance.now() - start) / ms);
      fn(t);
      if (t >= 1) { stop(); resolve(); }
    });
  });
}

export function initRouter({ name, onEnter }) {
  const pages = new Map([...document.querySelectorAll('[data-page]')].map((p) => [p.dataset.page, p]));
  const wipe = document.getElementById('wipe');
  const layers = [wipe.querySelector('.wipe-a'), wipe.querySelector('.wipe-b')];
  const heart = wipe.querySelector('.wipe-heart');
  const links = document.querySelectorAll('[data-route]');
  let current = null;
  let busy = false;
  let queued = null;
  let origin = { x: innerWidth / 2, y: innerHeight / 2 };

  // remember where the visitor tapped, so the curtain grows from their finger
  addEventListener('pointerdown', (e) => { origin = { x: e.clientX, y: e.clientY }; }, { capture: true });

  const parse = () => {
    const route = location.hash.replace(/^#\/?/, '');
    return pages.has(route) ? route : 'home';
  };

  function show(route) {
    pages.forEach((el, key) => { el.hidden = key !== route; });
    current = route;
    scrollTo(0, 0);
    document.title = route === 'home' ? `Happy Birthday, ${name}` : `${TITLES[route]} · for ${name}`;
    links.forEach((a) => {
      if (a.dataset.route === route) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    onEnter(route, pages.get(route));
  }

  async function cover() {
    const { x, y } = origin;
    const maxR = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 20;
    wipe.classList.add('is-active');
    wipe.style.removeProperty('--hole');
    heart.setAttribute('data-thread-priority', '');
    audio.whoosh();
    await tween(COVER_MS, (t) => {
      layers.forEach((layer, i) => {
        // the second layer chases the first, so a warm rim leads the dark curtain
        const lt = easeInOutCubic(clamp((t - i * 0.14) / (1 - i * 0.14)));
        layer.style.clipPath = `circle(${lt * maxR}px at ${x}px ${y}px)`;
      });
    });
  }

  async function uncover() {
    const maxR = Math.hypot(innerWidth, innerHeight) / 2 + 40;
    heart.removeAttribute('data-thread-priority');
    audio.chime(true);
    await tween(OPEN_MS, (t) => {
      wipe.style.setProperty('--hole', `${easeOutExpo(t) * maxR}px`);
    });
    wipe.classList.remove('is-active');
    layers.forEach((layer) => { layer.style.clipPath = 'circle(0 at 50% 50%)'; });
  }

  async function go(route) {
    if (route === current) return;
    if (busy) { queued = route; return; }
    if (reducedMotion) { show(route); return; }
    busy = true;
    await cover();
    show(route);
    await new Promise((r) => setTimeout(r, 120)); // a short beat with the heart alone on screen
    await uncover();
    busy = false;
    if (queued) {
      const next = queued;
      queued = null;
      go(next);
    }
  }

  addEventListener('hashchange', () => {
    // plain in-page anchors like #main aren't routes
    if (location.hash && !location.hash.startsWith('#/')) return;
    go(parse());
  });

  show(parse());
  return { go, get current() { return current; } };
}

// Boot: put the content from config.js into the page, then start every module and the router.

import { config } from './config.js';
import { onFrame, easeOutExpo, clamp, reducedMotion, lerp } from './motion.js';
import { audio } from './audio.js';
import { initFx, kiss } from './fx.js';
import { initThread, flare } from './thread.js';
import { initReveal, replay } from './reveal.js';
import { initPortal, initPush } from './portal.js';
import { initDeck } from './deck.js';
import { initViewer } from './viewer.js';
import { initTimeline } from './timeline.js';
import { initNotes } from './notes.js';
import { initMeter } from './meter.js';
import { initWish } from './wish.js';
import { initBand } from './band.js';
import { initRouter } from './router.js';

const $ = (s) => document.querySelector(s);
const fillName = (text) => text.replaceAll('{name}', config.name);
const pad = (n) => String(n).padStart(2, '0');

function renderContent() {
  document.querySelectorAll('[data-bind]').forEach((el) => {
    el.textContent = config[el.dataset.bind] ?? '';
  });
  document.querySelectorAll('[data-bind-href]').forEach((el) => { el.href = config.contact.href; });
  $('#source-link').href = config.source;
  $('#year').textContent = new Date().getFullYear();
  $('#hero-img').src = config.heroPhoto;
  $('#story-img').src = config.storyPhoto;

  const { before, accent, after } = config.statement;
  const text = $('#statement-text');
  const em = document.createElement('em');
  em.className = 'accent';
  em.textContent = accent;
  text.replaceChildren(before, em, after);

  $('#things-body').replaceChildren(...config.littleThings.map((row, i) => {
    const tr = document.createElement('tr');
    tr.dataset.reveal = '';
    tr.style.setProperty('--d', `${i * 70}ms`);
    for (const [key, head] of [['thing', 'The little thing'], ['answer', 'Answer'], ['note', 'Why it matters']]) {
      const td = document.createElement('td');
      td.dataset.head = head;
      td.textContent = row[key];
      tr.append(td);
    }
    return tr;
  }));
}

// The chapter doors on the home page. Each card tilts toward the cursor.
function renderChapters() {
  const grid = $('#chapter-grid');
  grid.replaceChildren(...config.chapters.map((c, i) => {
    const a = document.createElement('a');
    a.className = 'chapter';
    a.href = `#/${c.route}`;
    a.dataset.reveal = '';
    a.style.setProperty('--d', `${i * 90}ms`);
    // the inner wrapper tilts; the link itself does the reveal (both need `transform`)
    a.innerHTML = `
      <span class="chapter-tilt">
        <span class="chapter-media"><img alt="" loading="lazy"></span>
        <span class="chapter-num outline-num">${pad(i + 1)}</span>
        <span class="chapter-body">
          <span class="chapter-title"></span>
          <span class="chapter-line"></span>
        </span>
        <span class="chapter-arrow" aria-hidden="true">&rarr;</span>
      </span>`;
    a.querySelector('img').src = c.photo;
    a.querySelector('.chapter-title').textContent = c.title;
    a.querySelector('.chapter-line').textContent = c.line;
    return a;
  }));

  if (reducedMotion) return;
  for (const card of grid.children) {
    let tx = 0;
    let ty = 0;
    let rx = 0;
    let ry = 0;
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      tx = ((e.clientY - r.top) / r.height - 0.5) * -10;
      ty = ((e.clientX - r.left) / r.width - 0.5) * 12;
    });
    card.addEventListener('pointerleave', () => { tx = 0; ty = 0; });
    onFrame(() => {
      if (!card.matches(':hover') && Math.abs(rx) + Math.abs(ry) < 0.01) return;
      rx = lerp(rx, tx, 0.12);
      ry = lerp(ry, ty, 0.12);
      card.style.setProperty('--rx', `${rx}deg`);
      card.style.setProperty('--ry', `${ry}deg`);
    });
  }
}

// The opening screen. Tapping it starts the sound (browsers need a tap first)
// and a circular mask grows from the heart to reveal the site.
function initGate() {
  const gate = $('#gate');
  const html = document.documentElement;
  html.classList.add('is-locked');
  history.scrollRestoration = 'manual';
  scrollTo(0, 0);

  // the two lights meet at ~1.8s; that's when the heart appears
  const heart = gate.querySelector('.gate-dot');
  setTimeout(() => heart.removeAttribute('data-thread-off'), reducedMotion ? 0 : 1750);

  $('#gate-open').addEventListener('click', () => {
    heart.removeAttribute('data-thread-off');
    audio.start(config.music.song);
    audio.chime();
    flare(1.5);
    heart.removeAttribute('data-thread-priority');
    html.classList.remove('is-locked');
    gate.classList.add('is-opening');

    const start = performance.now();
    const maxR = Math.hypot(innerWidth, innerHeight) / 2 + 40;
    const stop = onFrame(() => {
      const t = clamp((performance.now() - start) / (reducedMotion ? 1 : 1400));
      gate.style.setProperty('--r', `${easeOutExpo(t) * maxR}px`);
      if (t >= 1) {
        stop();
        gate.remove();
      }
    });
  }, { once: true });
}

function initSoundButton() {
  const btn = $('#sound-btn');
  const sync = () => {
    btn.setAttribute('aria-pressed', String(!audio.muted));
    btn.classList.toggle('is-on', !audio.muted);
    btn.setAttribute('aria-label', audio.muted ? 'Turn sound on' : 'Turn sound off');
  };
  btn.addEventListener('click', () => {
    audio.start(config.music.song);
    audio.toggle();
    sync();
  });
  sync();
}

// Phone menu: a full-screen list of chapters.
function initMenu() {
  const btn = $('#menu-btn');
  const menu = $('#menu');
  const setOpen = (open) => {
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close chapters menu' : 'Open chapters menu');
    if (open) {
      menu.hidden = false;
      menu.getBoundingClientRect(); // show it first, so the circle reveal can animate
    } else {
      setTimeout(() => { if (btn.getAttribute('aria-expanded') === 'false') menu.hidden = true; }, 500);
    }
    document.documentElement.classList.toggle('menu-open', open);
  };
  btn.addEventListener('click', () => setOpen(btn.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
}

renderContent();
renderChapters();
initTimeline(config.milestones);
initReveal();
initFx($('#fx'));
initPortal($('.portal'));
initPush();
const deck = initDeck(config.memories, { onOpen: (i, rect) => viewer.openAt(i, rect) });
const viewer = initViewer(config.memories, {
  onClose: (i) => { deck.showCard(i); return deck.topRect(); },
});
const notes = initNotes(config.notes);
const meter = initMeter(config.quiz, fillName);
initWish(config.name);
initBand(config.loveWords);
initSoundButton();
initMenu();

// Tap anywhere that isn't a control and a few little hearts float up.
document.addEventListener('pointerdown', (e) => {
  if (e.target.closest('a, button, input, canvas, .deck, .gate, .viewer, .jar-scene')) return;
  kiss(e.clientX, e.clientY);
  audio.kiss();
});

initThread($('#thread'));

let previous = null;
initRouter({
  name: config.name,
  onEnter(route, page) {
    if (previous === 'meter' && route !== 'meter') meter.onLeave();
    previous = route;
    replay(page);
    if (route === 'notes') notes.onEnter();
    if (route === 'meter') meter.onEnter();
  },
});
initGate();

// skip link: focus the main content without changing the route
$('#skip').addEventListener('click', (e) => {
  e.preventDefault();
  $('#main').focus();
});

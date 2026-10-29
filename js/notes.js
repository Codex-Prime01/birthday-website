// A glass jar full of folded notes. Tap it: the lid pops, one note flies out, unfolds,
// and types itself out. "Fold it back" returns it to the jar; "Another one" keeps it and picks again.
// When the jar is empty, tap it to pour every note back in.

import { reducedMotion } from './motion.js';
import { audio } from './audio.js';

const TYPE_MS = 26;
const PAPER_COLORS = ['#EDE7DC', '#F2D3A8', '#F1B9B5', '#CFE0DC', '#F6E2C4'];

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function initNotes(notes) {
  const jar = document.getElementById('jar');
  const pile = document.getElementById('jar-notes');
  const left = document.getElementById('jar-left');
  const label = document.querySelector('.jar-label');
  const card = document.getElementById('note-card');
  const text = document.getElementById('note-text');
  const num = document.getElementById('note-num');
  const knob = jar.querySelector('.jar-knob');
  const paperDot = card.querySelector('.note-dot');
  let queue = [];
  let read = 0;
  let current = null; // { note, paper }
  let busy = false;
  let run = 0;

  // one folded paper inside the jar, placed in loose rows from the bottom up
  function makePaper(note, i) {
    const p = document.createElement('span');
    p.className = 'paper';
    const row = Math.floor(i / 5);
    const col = i % 5;
    p.style.left = `${8 + col * 17 + (Math.random() - 0.5) * 8}%`;
    p.style.bottom = `${6 + row * 13 + Math.random() * 4}%`;
    p.style.setProperty('--rot', `${(Math.random() - 0.5) * 70}deg`);
    p.style.setProperty('--c', PAPER_COLORS[i % PAPER_COLORS.length]);
    p.style.setProperty('--delay', `${i * 45}ms`);
    p.note = note;
    return p;
  }

  function fill() {
    queue = shuffle(notes).slice(0, 25);
    pile.replaceChildren(...queue.map(makePaper));
    // papers drop into the jar one after another
    pile.classList.remove('is-dropping');
    pile.getBoundingClientRect();
    pile.classList.add('is-dropping');
    updateCount();
  }

  function updateCount() {
    const n = pile.children.length;
    left.textContent = n;
    label.lastChild.textContent = n ? ' notes left · tap the jar' : ' · empty. Tap to pour them back in';
  }

  function type(note) {
    const myRun = ++run;
    text.textContent = '';
    if (reducedMotion) { text.textContent = note; return; }
    let i = 0;
    const step = () => {
      if (myRun !== run || i >= note.length) return;
      const ch = document.createElement('span');
      ch.className = 'tchar';
      ch.textContent = note[i++];
      text.append(ch);
      const last = note[i - 1];
      setTimeout(step, last === ',' || last === '.' ? TYPE_MS * 6 : TYPE_MS);
    };
    setTimeout(step, 650);
  }

  // Fly the card out of a paper's spot in the jar (FLIP: start at the paper, animate to rest).
  function flyFrom(paper) {
    const pr = paper.getBoundingClientRect();
    card.hidden = false;
    card.classList.remove('is-open');
    const cr = card.getBoundingClientRect();
    const dx = pr.left + pr.width / 2 - (cr.left + cr.width / 2);
    const dy = pr.top + pr.height / 2 - (cr.top + cr.height / 2);
    card.style.transition = 'none';
    card.style.transform = `translate(${dx}px, ${dy}px) scale(0.12) rotate(${paper.style.getPropertyValue('--rot')})`;
    card.getBoundingClientRect();
    card.style.transition = '';
    card.style.transform = '';
    requestAnimationFrame(() => card.classList.add('is-open'));
  }

  // Shrink the card back down into the jar's mouth.
  function flyBack(done) {
    const jr = jar.querySelector('.jar-glass').getBoundingClientRect();
    const cr = card.getBoundingClientRect();
    card.classList.remove('is-open');
    card.style.transform =
      `translate(${jr.left + jr.width / 2 - (cr.left + cr.width / 2)}px, ${jr.top + 20 - (cr.top + cr.height / 2)}px) scale(0.1) rotate(20deg)`;
    setTimeout(() => {
      card.hidden = true;
      card.style.transform = '';
      done();
    }, reducedMotion ? 0 : 650);
  }

  function pick() {
    if (busy) return;
    if (!pile.children.length) { fill(); audio.chime(true); return; }
    busy = true;
    const papers = [...pile.children];
    const paper = papers[Math.floor(Math.random() * papers.length)];
    jar.classList.remove('is-picking');
    jar.getBoundingClientRect();
    jar.classList.add('is-picking'); // lid pops, jar wobbles
    read++;
    num.textContent = String(read).padStart(2, '0');
    current = { note: paper.note, paper };
    flyFrom(paper);
    paper.remove();
    updateCount();
    knob.removeAttribute('data-thread');
    paperDot.setAttribute('data-thread', 'dot');
    audio.chime();
    type(paper.note);
    setTimeout(() => { busy = false; }, 700);
  }

  function putBack() {
    if (!current || busy) return;
    busy = true;
    run++;
    const { paper } = current;
    current = null;
    paperDot.removeAttribute('data-thread');
    knob.setAttribute('data-thread', 'dot');
    audio.whoosh();
    flyBack(() => {
      pile.append(paper);
      updateCount();
      busy = false;
    });
  }

  function another() {
    if (!current || busy) return;
    run++;
    current = null;
    // keep this note: it floats up and away, then a new one comes out
    card.classList.add('is-kept');
    setTimeout(() => {
      card.hidden = true;
      card.classList.remove('is-kept');
      pick();
    }, reducedMotion ? 0 : 500);
  }

  jar.addEventListener('click', () => (current ? another() : pick()));
  document.getElementById('note-back').addEventListener('click', putBack);
  document.getElementById('note-another').addEventListener('click', another);

  fill();
  // pour the papers in again each time the page is visited
  return { onEnter: () => { if (!current) fill(); } };
}

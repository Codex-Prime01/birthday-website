// Round one of the love meter: the quiz. Answers implode into the centre, swap, and burst
// back out (the transition trick from the Soda brief). A row of hearts fills as you go,
// and the glowing dot sits on the next empty heart.

import { reducedMotion } from './motion.js';
import { audio } from './audio.js';
import { kiss } from './fx.js';

const OUT_MS = 420;
const HEART = '<svg viewBox="0 0 32 29"><path d="M16 28.5C6 21 0 15.5 0 9 0 4 3.8 0 8.5 0c3.1 0 5.9 1.7 7.5 4.3C17.6 1.7 20.4 0 23.5 0 28.2 0 32 4 32 9c0 6.5-6 12-16 19.5z"/></svg>';

export function initQuiz(questions, fillName) {
  const box = document.getElementById('quiz');
  const hearts = document.getElementById('quiz-hearts');
  const step = document.getElementById('quiz-step');
  const q = document.getElementById('quiz-q');
  const options = document.getElementById('quiz-options');
  const max = questions.reduce((sum, item) => sum + Math.max(...item.answers.map((a) => a[1])), 0);
  let index = 0;
  let score = 0;
  let onDone = () => {};

  hearts.innerHTML = questions.map(() => `<span class="qheart">${HEART}</span>`).join('');
  const heartEls = [...hearts.children];

  function markHearts() {
    heartEls.forEach((h, i) => {
      h.classList.toggle('is-full', i < index);
      if (i === index) h.setAttribute('data-thread', 'heart');
      else h.removeAttribute('data-thread');
    });
  }

  // Move each answer into the middle of the box (implode) or back out (explode).
  function collapse(collapsed, animate = true) {
    const b = options.getBoundingClientRect();
    const cx = b.left + b.width / 2;
    const cy = b.top + b.height / 2;
    [...options.children].forEach((el, i) => {
      el.style.transition = animate ? '' : 'none';
      el.style.setProperty('--i', i);
      if (collapsed) {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${cx - (r.left + r.width / 2)}px, ${cy - (r.top + r.height / 2)}px) scale(0.15) rotate(${(i - 1) * 20}deg)`;
        el.style.opacity = 0;
      } else {
        el.style.transform = '';
        el.style.opacity = '';
      }
    });
  }

  function render() {
    const item = questions[index];
    step.textContent = `Question ${index + 1} / ${questions.length}`;
    q.textContent = fillName(item.q);
    options.replaceChildren(...item.answers.map(([label, points]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'quiz-option';
      b.innerHTML = '<span class="opt-dot"></span><span></span>';
      b.lastChild.textContent = label;
      b.addEventListener('click', (e) => pick(b, points, e));
      return b;
    }));
    markHearts();
  }

  function transition(update) {
    if (reducedMotion) { update(); return; }
    box.classList.add('is-swapping');
    collapse(true);
    setTimeout(() => {
      update();
      if (!options.children.length) { box.classList.remove('is-swapping'); return; }
      collapse(true, false); // new answers start packed in the centre...
      options.getBoundingClientRect();
      box.classList.remove('is-swapping');
      collapse(false); // ...and burst out into place
    }, OUT_MS);
  }

  function pick(button, points, e) {
    if (box.classList.contains('is-swapping')) return;
    button.classList.add('is-picked');
    audio.pop();
    // the heart you just earned pops with little hearts
    const r = heartEls[index].getBoundingClientRect();
    kiss(r.left + r.width / 2, r.top + r.height / 2);
    score += points;
    index++;
    markHearts();
    if (index < questions.length) setTimeout(() => transition(render), 240);
    else setTimeout(() => onDone({ score, max }), 500);
  }

  return {
    start(done) {
      onDone = done;
      index = 0;
      score = 0;
      render();
      if (!reducedMotion) {
        collapse(true, false);
        options.getBoundingClientRect();
        collapse(false);
      }
    },
  };
}

// The love meter game: intro → quiz → countdown → catch the hearts → result.
// The result is a heart that fills with liquid (a moving wave inside a heart-shaped clip)
// up to the final score.

import { onFrame, Spring, reducedMotion, clamp } from './motion.js';
import { audio } from './audio.js';
import { burst } from './fx.js';
import { flare } from './thread.js';
import { initQuiz } from './quiz.js';
import { initCatch } from './catch.js';

const CATCH_TARGET = 24; // hearts needed for a "full" round two
const W = 320;
const H = 290;

const TIERS = [
  [85, 'Soulmates, officially.', 'The meter is overflowing. Nothing left to prove, only more to share.'],
  [65, 'Deeply, madly in love.', 'Almost to the brim. A few more lazy Sundays should do it.'],
  [45, 'Falling more every day.', 'Half full and rising. The best part is the filling up.'],
  [0, "Love is a practice.", "Lucky us. We've got all the time in the world to practise."],
];

// A wavy liquid surface at height `level` (0..1), drawn as a closed SVG path.
function wavePath(level, t, amp, speed, phase) {
  const y0 = H - level * H;
  let d = `M0 ${H} L0 ${y0}`;
  for (let x = 0; x <= W; x += 16) {
    const y = y0 + Math.sin(x / 38 + t * speed + phase) * amp + Math.sin(x / 17 + t * speed * 1.7) * amp * 0.35;
    d += ` L${x} ${y.toFixed(1)}`;
  }
  return `${d} L${W} ${H} Z`;
}

export function initMeter(questions, fillName) {
  const screens = new Map([...document.querySelectorAll('[data-screen]')].map((s) => [s.dataset.screen, s]));
  const quiz = initQuiz(questions, fillName);
  const game = initCatch();
  const count = document.getElementById('ready-count');
  const waveFront = document.getElementById('wave-front');
  const waveBack = document.getElementById('wave-back');
  const bubbleGroup = document.getElementById('bubbles');
  const pctEl = document.getElementById('result-pct');
  const level = new Spring(0, { stiffness: 14, damping: 7 });
  let quizResult = { score: 0, max: 16 };
  let screen = 'intro';

  // a few bubbles rising inside the liquid
  const bubbles = Array.from({ length: 9 }, (_, i) => {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('r', 2 + (i % 3) * 1.5);
    c.setAttribute('class', 'bubble');
    bubbleGroup.append(c);
    return { el: c, x: 40 + Math.random() * 240, y: H, speed: 20 + Math.random() * 30 };
  });

  function show(name) {
    screen = name;
    screens.forEach((el, key) => { el.hidden = key !== name; });
    const el = screens.get(name);
    el.classList.remove('is-entering');
    el.getBoundingClientRect();
    el.classList.add('is-entering');
  }

  function countdown(done) {
    show('ready');
    let n = 3;
    const tickDown = () => {
      if (screen !== 'ready') return;
      if (n === 0) { done(); return; }
      count.textContent = n;
      count.classList.remove('is-tick');
      void count.offsetWidth;
      count.classList.add('is-tick');
      audio.blip(n === 1 ? 8 : 1);
      n--;
      setTimeout(tickDown, reducedMotion ? 300 : 800);
    };
    tickDown();
  }

  function finish(caught) {
    const quizPart = quizResult.score / quizResult.max;
    const catchPart = clamp(caught / CATCH_TARGET);
    const pct = Math.round((quizPart * 0.6 + catchPart * 0.4) * 100);
    const [, title, msg] = TIERS.find(([min]) => pct >= min);
    document.getElementById('result-title').textContent = title;
    document.getElementById('result-msg').textContent = msg;
    document.getElementById('result-quiz').textContent = `${quizResult.score} / ${quizResult.max}`;
    document.getElementById('result-catch').textContent = caught;
    show('result');
    level.snap(0);
    level.target = pct / 100;
    setTimeout(() => {
      const r = document.querySelector('.liquid').getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height * 0.45);
      flare(2);
      audio.wish();
    }, 900);
  }

  function start() {
    audio.chime(true);
    show('quiz');
    quiz.start((result) => {
      quizResult = result;
      countdown(() => {
        show('catch');
        requestAnimationFrame(() => game.start(finish));
      });
    });
  }

  document.getElementById('game-start').addEventListener('click', start);
  document.getElementById('game-again').addEventListener('click', start);

  // animate the liquid only while the result is on screen
  onFrame((t, dt) => {
    if (screen !== 'result' || !screens.get('result').getClientRects().length) return;
    level.update(dt);
    const lv = clamp(level.value, 0, 1.02);
    waveBack.setAttribute('d', wavePath(lv, t, 7, 1.6, 2));
    waveFront.setAttribute('d', wavePath(lv, t, 6, 2.3, 0));
    pctEl.textContent = Math.round(clamp(level.value) * 100);
    const surface = H - lv * H;
    for (const b of bubbles) {
      b.y -= b.speed * dt;
      if (b.y < surface + 6) { b.y = H + Math.random() * 40; b.x = 40 + Math.random() * 240; }
      b.el.setAttribute('cx', b.x + Math.sin(t * 2 + b.speed) * 4);
      b.el.setAttribute('cy', b.y);
    }
  });

  return {
    onEnter() { if (screen === 'intro') show('intro'); },
    onLeave() {
      game.stop();
      if (screen !== 'result') show('intro');
    },
  };
}

// Timeline rows plus a marker that slides down the rail as you scroll.
// The marker is a landing spot for the glowing dot.

import { onFrame, clamp, isShown } from './motion.js';

export function initTimeline(milestones) {
  const list = document.getElementById('tl-rows');
  const marker = document.getElementById('tl-marker');
  const fill = document.getElementById('tl-fill');

  list.replaceChildren(...milestones.map((m, i) => {
    const li = document.createElement('li');
    li.className = 'tl-row';
    li.dataset.reveal = '';
    li.style.setProperty('--d', `${i * 90}ms`);
    li.innerHTML = '<p class="tl-label"></p><h3 class="tl-title"></h3><p class="tl-date"></p><p class="tl-detail"></p>';
    li.querySelector('.tl-label').textContent = m.label;
    li.querySelector('.tl-title').textContent = m.title;
    li.querySelector('.tl-date').textContent = m.date;
    li.querySelector('.tl-detail').textContent = m.detail;
    return li;
  }));

  const rows = [...list.children];
  onFrame(() => {
    if (!isShown(list)) return;
    const r = list.getBoundingClientRect();
    if (r.bottom < -200 || r.top > innerHeight + 200) return;
    const p = clamp((innerHeight * 0.55 - r.top) / r.height);
    marker.style.top = `${p * 100}%`;
    fill.style.transform = `scaleY(${p})`; // the rail "draws" itself down behind the marker
    const markerY = r.top + p * r.height;
    for (const row of rows) {
      const rr = row.getBoundingClientRect();
      row.classList.toggle('is-active', markerY >= rr.top + 8);
    }
  });
}

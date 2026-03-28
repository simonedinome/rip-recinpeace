import { TRACKS } from '../config.js';
import * as trackPlayer from '../audio/trackPlayer.js';

let currentRow = null;

export function initTrackPanel() {
  const list = document.getElementById('track-list');
  if (!list) return;

  if (TRACKS.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'track-row--empty';
    empty.textContent = 'Nessuna traccia — aggiungi file in /public/tracks/ e aggiorna TRACKS in config.js';
    list.appendChild(empty);
    return;
  }

  trackPlayer.onTimeUpdate(pct => {
    if (currentRow) {
      currentRow.querySelector('progress').value = pct;
    }
  });

  trackPlayer.onEnded(() => {
    if (currentRow) {
      currentRow.querySelector('.btn-toggle').textContent = '▶';
      currentRow = null;
    }
  });

  TRACKS.forEach(({ title, src }) => {
    const row = document.createElement('div');
    row.className = 'track-row glass-card';

    const btn = document.createElement('button');
    btn.className = 'btn-toggle';
    btn.textContent = '▶';
    btn.setAttribute('aria-label', `Play ${title}`);

    const name = document.createElement('span');
    name.className = 'track-row__name';
    name.textContent = title;

    const progress = document.createElement('progress');
    progress.value = 0;
    progress.max = 1;
    progress.setAttribute('aria-label', `Progresso ${title}`);
    progress.addEventListener('click', e => {
      const pct = e.offsetX / progress.offsetWidth;
      trackPlayer.seek(pct);
    });

    btn.addEventListener('click', async () => {
      if (currentRow && currentRow !== row) {
        currentRow.querySelector('.btn-toggle').textContent = '▶';
        trackPlayer.pause();
      }
      if (currentRow === row && trackPlayer.isPlaying()) {
        trackPlayer.pause();
        btn.textContent = '▶';
        currentRow = null;
        return;
      }
      try {
        currentRow = row;
        btn.textContent = '■';
        row.classList.remove('track-row--error');
        await trackPlayer.play(src);
      } catch {
        row.classList.add('track-row--error');
        btn.textContent = '▶';
        currentRow = null;
      }
    });

    row.appendChild(btn);
    row.appendChild(name);
    row.appendChild(progress);
    list.appendChild(row);
  });
}

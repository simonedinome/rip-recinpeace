import * as audioMixer from '../audio/audioMixer.js';
import { BINAURAL_PRESETS } from '../config.js';

const CARDS = [
  { id: 'white',    label: 'White Noise', emoji: '🌊' },
  { id: 'brown',    label: 'Brown Noise', emoji: '🟤' },
  { id: 'pink',     label: 'Pink Noise',  emoji: '🌸' },
  { id: 'rain',     label: 'Pioggia',     emoji: '🌧' },
  { id: 'tone432',  label: '432 Hz',      emoji: '🔔' },
  { id: 'binaural', label: 'Binaural',    emoji: '🧠' },
];

function updateSliderFill(slider) {
  const pct = (slider.value - slider.min) / (slider.max - slider.min) * 100;
  slider.style.setProperty('--val', `${pct}%`);
}

export function initFrequencyPanel() {
  const grid = document.getElementById('frequency-grid');
  if (!grid) return;

  CARDS.forEach(({ id, label, emoji }) => {
    const card = document.createElement('div');
    card.className = 'frequency-card glass-card';
    card.dataset.id = id;

    const header = document.createElement('div');
    header.className = 'frequency-card__header';

    const emojiEl = document.createElement('span');
    emojiEl.className = 'frequency-card__emoji';
    emojiEl.textContent = emoji;
    emojiEl.setAttribute('aria-hidden', 'true');

    const name = document.createElement('div');
    name.className = 'frequency-card__name';
    name.textContent = label;

    header.appendChild(emojiEl);
    header.appendChild(name);

    const controls = document.createElement('div');
    controls.className = 'frequency-card__controls';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'btn-toggle';
    toggleBtn.textContent = '▶';
    toggleBtn.setAttribute('aria-label', `Toggle ${label}`);
    toggleBtn.addEventListener('click', () => {
      const isActive = audioMixer.toggle(id);
      card.classList.toggle('active', isActive);
      toggleBtn.textContent = isActive ? '■' : '▶';
    });

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 0;
    slider.max = 1;
    slider.step = 0.01;
    slider.value = 0.8;
    slider.className = 'slider';
    slider.setAttribute('aria-label', `Volume ${label}`);
    updateSliderFill(slider);
    slider.addEventListener('input', () => {
      audioMixer.setVolume(id, slider.value);
      updateSliderFill(slider);
    });

    controls.appendChild(toggleBtn);
    controls.appendChild(slider);
    card.appendChild(header);
    card.appendChild(controls);

    if (id === 'binaural') {
      const select = document.createElement('select');
      select.className = 'binaural-preset';
      select.setAttribute('aria-label', 'Preset binaural');
      Object.keys(BINAURAL_PRESETS).forEach(key => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = key.charAt(0).toUpperCase() + key.slice(1) +
          ` (${BINAURAL_PRESETS[key]} Hz)`;
        select.appendChild(opt);
      });
      select.addEventListener('change', () => {
        audioMixer.setBinauralPreset(select.value);
      });
      card.appendChild(select);
    }

    grid.appendChild(card);
  });
}

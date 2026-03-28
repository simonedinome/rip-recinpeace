import * as audioMixer from '../audio/audioMixer.js';
import { BINAURAL_PRESETS } from '../config.js';

const CARDS = [
  { id: 'white',   label: 'White Noise' },
  { id: 'brown',   label: 'Brown Noise' },
  { id: 'pink',    label: 'Pink Noise' },
  { id: 'rain',    label: 'Pioggia' },
  { id: 'tone432', label: '432 Hz' },
  { id: 'binaural',label: 'Binaural' },
];

export function initFrequencyPanel() {
  const grid = document.getElementById('frequency-grid');
  if (!grid) return;

  CARDS.forEach(({ id, label }) => {
    const card = document.createElement('div');
    card.className = 'frequency-card glass-card';
    card.dataset.id = id;

    const name = document.createElement('div');
    name.className = 'frequency-card__name';
    name.textContent = label;

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
    slider.addEventListener('input', () => {
      audioMixer.setVolume(id, slider.value);
    });

    controls.appendChild(toggleBtn);
    controls.appendChild(slider);
    card.appendChild(name);
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

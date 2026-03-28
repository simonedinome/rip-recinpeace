import { initFrequencyPanel } from './components/frequencyPanel.js';
import { initTrackPanel } from './components/trackPanel.js';
import { initSettingsPanel } from './components/settingsPanel.js';
import { initPomodoroTimer, reloadPomodoroSettings } from './components/pomodoroTimer.js';
import { initAuth } from './secret/auth.js';
import { initSecretUI } from './secret/secretUI.js';
import * as audioMixer from './audio/audioMixer.js';

// ── SERVICE WORKER ────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/public/sw.js').catch(() => {});
}

// ── TAB SWITCHER ─────────────────────────────────────────
function initTabSwitcher() {
  const buttons = document.querySelectorAll('[data-tab-btn]');
  const panels = document.querySelectorAll('[data-tab-panel]');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tabBtn;
      buttons.forEach(b => b.classList.toggle('active', b === btn));
      panels.forEach(p => p.classList.toggle('active', p.dataset.tabPanel === target));
    });
  });
}

// ── MASTER VOLUME ─────────────────────────────────────────
function initMasterVolume() {
  const slider = document.getElementById('master-vol');
  if (!slider) return;
  slider.addEventListener('input', () => {
    audioMixer.setMasterVolume(slider.value);
  });
}

// ── VU METER ──────────────────────────────────────────────
function initVuMeter() {
  const canvas = document.getElementById('vu-meter');
  if (!canvas) return;
  const ctx2d = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  function draw() {
    requestAnimationFrame(draw);
    const analyser = audioMixer.getAnalyser();
    if (!analyser) {
      ctx2d.clearRect(0, 0, W, H);
      return;
    }
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
    const pct = avg / 255;

    ctx2d.clearRect(0, 0, W, H);
    const grad = ctx2d.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0,   '#4fc3f7');
    grad.addColorStop(0.6, '#7c6af7');
    grad.addColorStop(1,   '#f87171');
    ctx2d.fillStyle = grad;
    ctx2d.fillRect(0, 0, W * pct, H);
  }
  draw();
}

// ── ENTRY POINT ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTabSwitcher();
  initFrequencyPanel();
  initTrackPanel();
  initMasterVolume();
  initVuMeter();
  initPomodoroTimer();
  initSettingsPanel(reloadPomodoroSettings);
  initAuth(initSecretUI);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) audioMixer.suspend();
    else audioMixer.resumeContext();
  });
});

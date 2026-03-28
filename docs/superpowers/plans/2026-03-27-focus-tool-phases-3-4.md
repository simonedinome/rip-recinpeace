# Focus Tool Phases 3–4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a fully working Pomodoro timer (work/break state machine, SVG ring, session dots, browser notifications, notification sounds, session log) and a Settings panel (configurable durations, auto-start, sound preset, localStorage persistence, reset).

**Architecture:** `settingsPanel.js` owns all settings state (localStorage key `focustool_settings`); `pomodoroTimer.js` reads settings via `getSettings()` and owns the tick loop, SVG ring, session state, and log. Notification sounds are routed through a new `playNotificationSound(preset)` export on `audioMixer.js` so the single-AudioContext rule is preserved. `index.html` is updated to wire the existing pomodoro placeholder and add the settings panel markup.

**Tech Stack:** Vanilla JS ES6+ (native modules), Web Audio API (OscillatorNode for sounds), Web Notifications API, localStorage for persistence and session log, CSS custom properties.

---

## File Map

| File | Change |
|------|--------|
| `src/config.js` | Add `POMODORO_DEFAULTS` object |
| `index.html` | Wire pomodoro section (ids, remove disabled); add settings panel markup and gear button |
| `src/style.css` | Add: session dots, session log, settings panel, gear button |
| `src/components/settingsPanel.js` | Create: settings form, localStorage read/write, reset |
| `src/components/pomodoroTimer.js` | Create: state machine, tick, ring, dots, notifications, log |
| `src/audio/audioMixer.js` | Add `playNotificationSound(preset)` export |
| `src/app.js` | Import and call `initSettingsPanel`, `initPomodoroTimer` |

---

## Task 1: Update config.js — Pomodoro defaults

**Files:**
- Modify: `src/config.js`

- [ ] **Step 1: Append POMODORO_DEFAULTS to src/config.js**

Add after the last existing line:

```js
export const POMODORO_DEFAULTS = {
  work: 25,           // minutes
  shortBreak: 5,      // minutes
  longBreak: 15,      // minutes
  sessions: 4,        // work sessions before long break
  autoStart: false,   // auto-start next phase
  sound: 'bell',      // 'none' | 'beep' | 'bell' | 'chime'
};
```

- [ ] **Step 2: Commit**

```bash
git add src/config.js
git commit -m "feat: add POMODORO_DEFAULTS to config.js"
```

---

## Task 2: Update index.html — wire pomodoro + settings panel

**Files:**
- Modify: `index.html`

Note: `index.html` is a protected file per CLAUDE.md — this modification is part of planned Phase 3 implementation.

- [ ] **Step 1: Replace index.html with the fully updated version**

```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="Focus Tool — audio generativo e timer pomodoro per la concentrazione" />
  <title>Focus Tool</title>
  <link rel="stylesheet" href="src/style.css" />
</head>
<body>
  <div class="app">

    <!-- HEADER -->
    <header class="header">
      <div id="logo" class="logo" title="Focus Tool">◈</div>
      <div class="header-controls">
        <div class="master-volume">
          <label class="sr-only" for="master-vol">Volume</label>
          <input id="master-vol" type="range" min="0" max="1" step="0.01" value="0.8" class="slider slider--master" />
        </div>
        <canvas id="vu-meter" class="vu-meter" width="120" height="20"></canvas>
        <button id="settings-btn" class="btn-icon" aria-label="Impostazioni">⚙</button>
      </div>
    </header>

    <!-- MAIN PLAYER -->
    <main class="main">

      <!-- TAB NAV -->
      <nav class="tabs">
        <button class="tab-btn active" data-tab-btn="frequencies">Frequenze</button>
        <button class="tab-btn" data-tab-btn="tracks">Tracce</button>
      </nav>

      <!-- FREQUENCIES TAB -->
      <section class="tab-panel active" data-tab-panel="frequencies">
        <div id="frequency-grid" class="frequency-grid"></div>
      </section>

      <!-- TRACKS TAB -->
      <section class="tab-panel" data-tab-panel="tracks">
        <div id="track-list" class="track-list"></div>
      </section>

    </main>

    <!-- POMODORO -->
    <aside class="pomodoro-section">
      <div class="pomodoro-card glass-card">
        <div class="pomodoro-ring-wrap">
          <svg class="pomodoro-ring" viewBox="0 0 100 100" width="140" height="140">
            <circle class="ring-bg" cx="50" cy="50" r="44" />
            <circle id="ring-progress" class="ring-progress" cx="50" cy="50" r="44" />
          </svg>
          <div id="pomodoro-time" class="pomodoro-time">25:00</div>
          <div id="pomodoro-phase" class="pomodoro-phase">Lavoro</div>
        </div>
        <div id="session-dots" class="session-dots"></div>
        <div class="pomodoro-actions">
          <button id="pomodoro-btn" class="btn btn--primary">▶ Start</button>
        </div>
        <details class="session-log-wrap">
          <summary class="session-log-toggle">Storico sessioni</summary>
          <div id="session-log" class="session-log"></div>
        </details>
      </div>
    </aside>

    <!-- SETTINGS PANEL (hidden by default) -->
    <section id="settings-panel" class="settings-panel glass-card" hidden>
      <h2 class="settings-title">Impostazioni</h2>
      <form id="settings-form" class="settings-form">

        <div class="settings-group">
          <h3 class="settings-group-title">Pomodoro</h3>

          <label class="settings-row">
            <span>Lavoro (min)</span>
            <input type="number" name="work" min="1" max="120" class="settings-input" />
          </label>
          <label class="settings-row">
            <span>Pausa corta (min)</span>
            <input type="number" name="shortBreak" min="1" max="60" class="settings-input" />
          </label>
          <label class="settings-row">
            <span>Pausa lunga (min)</span>
            <input type="number" name="longBreak" min="1" max="60" class="settings-input" />
          </label>
          <label class="settings-row">
            <span>Sessioni prima della pausa lunga</span>
            <input type="number" name="sessions" min="1" max="10" class="settings-input" />
          </label>
          <label class="settings-row">
            <span>Auto-start fase successiva</span>
            <input type="checkbox" name="autoStart" class="settings-checkbox" />
          </label>
          <label class="settings-row">
            <span>Suono notifica</span>
            <select name="sound" class="settings-select">
              <option value="none">Nessuno</option>
              <option value="beep">Beep</option>
              <option value="bell">Campanella</option>
              <option value="chime">Carillon</option>
            </select>
          </label>
        </div>

        <div class="settings-actions">
          <button type="submit" class="btn btn--primary">Salva</button>
          <button type="button" id="settings-reset" class="btn btn--ghost">Ripristina default</button>
        </div>

      </form>
    </section>

  </div>

  <script type="module" src="src/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verify in browser — page loads without errors**

Open `http://localhost:3000`. Expect: same layout as before plus a ⚙ button in the header; pomodoro card now shows phase label and session dots area; no JS errors.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: index.html — wire pomodoro section, add settings panel markup"
```

---

## Task 3: Update style.css — new component styles

**Files:**
- Modify: `src/style.css`

- [ ] **Step 1: Append new styles to the end of src/style.css**

```css
/* ── SETTINGS BUTTON ──────────────────────────────────── */
.btn-icon {
  background: transparent;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-btn);
  color: var(--text-secondary);
  font-size: 1.1rem;
  width: 36px;
  height: 36px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 150ms ease, border-color 150ms ease;
}
.btn-icon:hover { color: var(--text-primary); border-color: var(--accent-primary); }

/* ── POMODORO RING WRAP ────────────────────────────────── */
.pomodoro-ring-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pomodoro-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  min-width: 280px;
}
.pomodoro-phase {
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  position: absolute;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
}
.pomodoro-actions { display: flex; gap: 0.5rem; }

/* ── SESSION DOTS ─────────────────────────────────────── */
.session-dots {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}
.session-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1.5px solid var(--accent-primary);
  background: transparent;
  transition: background 200ms ease;
}
.session-dot.filled { background: var(--accent-primary); }

/* ── SESSION LOG ──────────────────────────────────────── */
.session-log-wrap {
  width: 100%;
  font-size: 0.8rem;
}
.session-log-toggle {
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0.25rem 0;
  user-select: none;
}
.session-log-toggle:hover { color: var(--text-primary); }
.session-log {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 120px;
  overflow-y: auto;
}
.session-log-entry {
  display: flex;
  justify-content: space-between;
  color: var(--text-secondary);
  padding: 0.15rem 0;
  border-bottom: 1px solid var(--glass-border);
}
.session-log-entry .entry-type { color: var(--accent-primary); }

/* ── SETTINGS PANEL ───────────────────────────────────── */
.settings-panel {
  padding: 1.5rem;
  margin: 0 auto;
  max-width: 500px;
  width: 100%;
}
.settings-panel[hidden] { display: none; }
.settings-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
}
.settings-group { margin-bottom: 1.25rem; }
.settings-group-title {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}
.settings-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--glass-border);
  gap: 1rem;
  font-size: 0.9rem;
  color: var(--text-primary);
  cursor: default;
}
.settings-input {
  width: 70px;
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-btn);
  color: var(--text-primary);
  padding: 0.25rem 0.5rem;
  font-size: 0.9rem;
  text-align: center;
}
.settings-select {
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-btn);
  color: var(--text-primary);
  padding: 0.25rem 0.5rem;
  font-size: 0.85rem;
  cursor: pointer;
}
.settings-checkbox { cursor: pointer; width: 16px; height: 16px; accent-color: var(--accent-primary); }
.settings-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.25rem;
}
.btn--ghost {
  background: transparent;
  border: 1px solid var(--glass-border);
  color: var(--text-secondary);
}
.btn--ghost:hover { color: var(--text-primary); border-color: var(--accent-primary); }
```

- [ ] **Step 2: Commit**

```bash
git add src/style.css
git commit -m "feat: style.css — session dots, log, settings panel styles"
```

---

## Task 4: settingsPanel.js — settings UI + localStorage

**Files:**
- Create: `src/components/settingsPanel.js`

- [ ] **Step 1: Create src/components/settingsPanel.js**

```js
import { POMODORO_DEFAULTS } from '../config.js';

const STORAGE_KEY = 'focustool_settings';

export function getSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved ? { ...POMODORO_DEFAULTS, ...saved } : { ...POMODORO_DEFAULTS };
  } catch {
    return { ...POMODORO_DEFAULTS };
  }
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function initSettingsPanel(onSettingsChange) {
  const panel = document.getElementById('settings-panel');
  const form = document.getElementById('settings-form');
  const resetBtn = document.getElementById('settings-reset');
  const settingsBtn = document.getElementById('settings-btn');
  if (!panel || !form || !resetBtn || !settingsBtn) return;

  function populateForm(settings) {
    form.work.value = settings.work;
    form.shortBreak.value = settings.shortBreak;
    form.longBreak.value = settings.longBreak;
    form.sessions.value = settings.sessions;
    form.autoStart.checked = settings.autoStart;
    form.sound.value = settings.sound;
  }

  populateForm(getSettings());

  settingsBtn.addEventListener('click', () => {
    const hidden = panel.hasAttribute('hidden');
    if (hidden) {
      panel.removeAttribute('hidden');
      populateForm(getSettings());
    } else {
      panel.setAttribute('hidden', '');
    }
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const settings = {
      work: Math.max(1, parseInt(form.work.value, 10) || POMODORO_DEFAULTS.work),
      shortBreak: Math.max(1, parseInt(form.shortBreak.value, 10) || POMODORO_DEFAULTS.shortBreak),
      longBreak: Math.max(1, parseInt(form.longBreak.value, 10) || POMODORO_DEFAULTS.longBreak),
      sessions: Math.max(1, parseInt(form.sessions.value, 10) || POMODORO_DEFAULTS.sessions),
      autoStart: form.autoStart.checked,
      sound: form.sound.value,
    };
    saveSettings(settings);
    panel.setAttribute('hidden', '');
    if (onSettingsChange) onSettingsChange(settings);
  });

  resetBtn.addEventListener('click', () => {
    saveSettings({ ...POMODORO_DEFAULTS });
    populateForm(POMODORO_DEFAULTS);
    if (onSettingsChange) onSettingsChange({ ...POMODORO_DEFAULTS });
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/settingsPanel.js
git commit -m "feat: settingsPanel — localStorage settings with save and reset"
```

---

## Task 5: audioMixer.js — add playNotificationSound

**Files:**
- Modify: `src/audio/audioMixer.js`

Add one export function at the end of the file:

- [ ] **Step 1: Append playNotificationSound to src/audio/audioMixer.js**

```js
export function playNotificationSound(preset) {
  if (preset === 'none') return;
  if (!ctx) init();
  if (ctx.state === 'suspended') ctx.resume();

  const now = ctx.currentTime;

  if (preset === 'beep') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);

  } else if (preset === 'bell') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 523.25;
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.5);

  } else if (preset === 'chime') {
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = now + i * 0.3;
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/audio/audioMixer.js
git commit -m "feat: audioMixer — add playNotificationSound for pomodoro alerts"
```

---

## Task 6: pomodoroTimer.js — state machine + tick + ring + log

**Files:**
- Create: `src/components/pomodoroTimer.js`

- [ ] **Step 1: Create src/components/pomodoroTimer.js**

```js
import { getSettings } from './settingsPanel.js';
import { playNotificationSound } from '../audio/audioMixer.js';

const CIRCUMFERENCE = 276.5;  // 2π × r44
const LOG_KEY = 'focustool_log';
const PHASE_LABELS = {
  work: 'Lavoro',
  short_break: 'Pausa corta',
  long_break: 'Pausa lunga',
  idle: 'Pronto',
};

let state = 'idle';
let timeLeft = 0;
let totalTime = 0;
let sessionCount = 0;
let intervalId = null;
let settings = null;

let ringEl, timeEl, phaseEl, startBtn, dotsEl, logEl;

function fmt(s) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

function updateRing() {
  const offset = totalTime > 0 ? CIRCUMFERENCE * (1 - timeLeft / totalTime) : 0;
  ringEl.style.strokeDashoffset = offset;
}

function buildDots() {
  dotsEl.innerHTML = '';
  for (let i = 0; i < settings.sessions; i++) {
    const dot = document.createElement('div');
    dot.className = 'session-dot';
    dotsEl.appendChild(dot);
  }
}

function refreshDots() {
  dotsEl.querySelectorAll('.session-dot').forEach((dot, i) => {
    dot.classList.toggle('filled', i < sessionCount);
  });
}

function setPhase(phase, duration) {
  state = phase;
  totalTime = duration * 60;
  timeLeft = totalTime;
  phaseEl.textContent = PHASE_LABELS[phase] ?? '';
  timeEl.textContent = fmt(timeLeft);
  updateRing();
}

function addLog(type, durationSec) {
  try {
    const log = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    log.push({ type, startedAt: new Date().toISOString(), duration: durationSec });
    if (log.length > 100) log.splice(0, log.length - 100);
    localStorage.setItem(LOG_KEY, JSON.stringify(log));
    renderLog();
  } catch { /* storage unavailable */ }
}

function renderLog() {
  if (!logEl) return;
  try {
    const log = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    logEl.innerHTML = '';
    [...log].reverse().slice(0, 20).forEach(entry => {
      const div = document.createElement('div');
      div.className = 'session-log-entry';
      const mins = Math.round(entry.duration / 60);
      const date = new Date(entry.startedAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      div.innerHTML = `<span class="entry-type">${PHASE_LABELS[entry.type] ?? entry.type}</span><span>${date} · ${mins} min</span>`;
      logEl.appendChild(div);
    });
  } catch { /* storage unavailable */ }
}

function notify(msg) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Focus Tool', { body: msg });
  }
}

function stopInterval() {
  if (intervalId) { clearInterval(intervalId); intervalId = null; }
}

function startInterval() {
  stopInterval();
  intervalId = setInterval(tick, 1000);
}

function tick() {
  timeLeft = Math.max(0, timeLeft - 1);
  timeEl.textContent = fmt(timeLeft);
  updateRing();

  if (timeLeft > 0) return;

  stopInterval();

  if (state === 'work') {
    addLog('work', settings.work * 60);
    sessionCount++;
    refreshDots();

    const isLong = sessionCount >= settings.sessions;
    if (isLong) sessionCount = 0;
    refreshDots();

    playNotificationSound(settings.sound);
    notify(isLong ? 'Pausa lunga! Riposati bene.' : 'Pausa corta! Fai un respiro.');
    setPhase(isLong ? 'long_break' : 'short_break', isLong ? settings.longBreak : settings.shortBreak);

  } else {
    addLog(state, totalTime);
    playNotificationSound(settings.sound);
    notify('Pausa finita! Torna al lavoro.');
    setPhase('work', settings.work);
  }

  startBtn.textContent = settings.autoStart ? '■ Stop' : '▶ Start';
  if (settings.autoStart) startInterval();
}

export function initPomodoroTimer() {
  ringEl  = document.getElementById('ring-progress');
  timeEl  = document.getElementById('pomodoro-time');
  phaseEl = document.getElementById('pomodoro-phase');
  startBtn = document.getElementById('pomodoro-btn');
  dotsEl  = document.getElementById('session-dots');
  logEl   = document.getElementById('session-log');

  if (!ringEl || !timeEl || !startBtn || !dotsEl) return;

  settings = getSettings();
  buildDots();
  setPhase('idle', settings.work);
  phaseEl.textContent = PHASE_LABELS.idle;
  renderLog();

  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  startBtn.addEventListener('click', () => {
    if (intervalId) {
      stopInterval();
      sessionCount = 0;
      settings = getSettings();
      buildDots();
      setPhase('idle', settings.work);
      phaseEl.textContent = PHASE_LABELS.idle;
      startBtn.textContent = '▶ Start';
    } else {
      settings = getSettings();
      setPhase('work', settings.work);
      startBtn.textContent = '■ Stop';
      startInterval();
    }
  });
}

export function reloadPomodoroSettings() {
  if (intervalId) return; // don't reset a running timer
  settings = getSettings();
  buildDots();
  setPhase('idle', settings.work);
  phaseEl.textContent = PHASE_LABELS.idle;
  startBtn.textContent = '▶ Start';
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/pomodoroTimer.js
git commit -m "feat: pomodoroTimer — state machine, SVG ring, session log, notifications"
```

---

## Task 7: Update app.js — wire timer + settings

**Files:**
- Modify: `src/app.js`

- [ ] **Step 1: Replace src/app.js**

```js
import { initFrequencyPanel } from './components/frequencyPanel.js';
import { initTrackPanel } from './components/trackPanel.js';
import { initSettingsPanel } from './components/settingsPanel.js';
import { initPomodoroTimer, reloadPomodoroSettings } from './components/pomodoroTimer.js';
import * as audioMixer from './audio/audioMixer.js';

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
});
```

- [ ] **Step 2: Verify full integration in browser**

Open `http://localhost:3000`. Run through:
- Pomodoro card shows "25:00", "Lavoro" phase label, 4 session dots, ▶ Start button
- ⚙ button opens settings panel; values match defaults (25/5/15/4 min, no auto-start, bell sound)
- Saving settings closes the panel; reset restores defaults
- Clicking ▶ Start changes to ■ Stop, timer counts down, ring shrinks
- Clicking ■ Stop resets to idle
- No console errors

- [ ] **Step 3: Commit**

```bash
git add src/app.js
git commit -m "feat: app.js — wire pomodoroTimer and settingsPanel"
```

---

## End-to-End Verification

- [ ] Page loads — pomodoro section shows 25:00, idle label, 4 dots, ▶ Start, ⚙ in header
- [ ] ⚙ opens settings; fields populated from defaults; Save closes panel; Reset restores defaults
- [ ] Start → timer counts down, ring sweeps, time display updates every second
- [ ] Stop → timer resets to idle, dots clear
- [ ] Let timer reach 0 → notification sound plays, phase flips to break, session dot fills
- [ ] After N sessions → long break triggers, dots reset
- [ ] Storico sessioni expands to show completed session log
- [ ] Set short work time (e.g. 1 min) in settings → timer counts to 0 correctly with sound
- [ ] No console errors throughout

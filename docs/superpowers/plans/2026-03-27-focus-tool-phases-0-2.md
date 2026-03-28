# Focus Tool Phases 0–2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully styled, functional public-area focus tool: glassmorphism UI shell + generative audio player (white/brown/pink noise, rain, 432Hz, binaural beats) + local track player.

**Architecture:** UI shell first — `index.html` + `style.css` are built and browser-verifiable before any audio logic. Audio engine (`noiseGenerator`, `trackPlayer`, `audioMixer`) is added next. UI panels (`frequencyPanel`, `trackPanel`) wire the two together. Single `AudioContext` owned by `audioMixer.js`; all constants in `config.js`.

**Tech Stack:** Vanilla JS ES6+ (native modules, `type="module"`), Web Audio API, HTML5 `<audio>`, CSS3 custom properties + glassmorphism, Vercel serverless (Node 18, not used in these phases).

---

## File Map

| File | Responsibility |
|------|---------------|
| `vercel.json` | Routing rewrites + Node 18 runtime declaration |
| `.env.example` | Documents all env vars (no real values) |
| `src/config.js` | All tunable constants — single source of truth |
| `index.html` | Entry point, full HTML structure, loads `src/app.js` |
| `src/style.css` | CSS variables, glassmorphism components, animations |
| `src/app.js` | Module orchestrator: imports all panels, owns tab switcher + VU meter loop + lazy init trigger |
| `src/audio/noiseGenerator.js` | Creates audio sources: white/brown/pink/rain/432hz/binaural |
| `src/audio/trackPlayer.js` | Wraps HTMLAudioElement for local track playback |
| `src/audio/audioMixer.js` | Single AudioContext, master gain, analyser, toggle/volume routing |
| `src/components/frequencyPanel.js` | Renders 6 frequency cards, wires toggles/sliders to audioMixer |
| `src/components/trackPanel.js` | Renders track list from config.TRACKS, wires to trackPlayer |
| `public/tracks/README.md` | Instructions for adding local audio files |

---

## Task 1: Scaffold — directory structure, vercel.json, .env.example

**Files:**
- Create: `vercel.json`
- Create: `.env.example`
- Create: `public/tracks/.gitkeep`
- Create: `public/sounds/.gitkeep`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p src/audio src/components public/tracks public/sounds api
touch public/tracks/.gitkeep public/sounds/.gitkeep
```

- [ ] **Step 2: Create vercel.json**

```json
{
  "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }],
  "functions": {
    "api/*.js": { "runtime": "nodejs18.x" }
  }
}
```

- [ ] **Step 3: Create .env.example**

```
OPENROUTER_API_KEY=        # chiave OpenRouter per riassunto + trascrizione Gemini
OPENAI_API_KEY=             # chiave OpenAI per trascrizione Whisper (opzionale)
NOTION_API_KEY=             # integration token Notion
NOTION_DATABASE_ID=         # ID del database Notion dove salvare le trascrizioni
APP_PASSWORD_HASH=          # SHA-256 della password per la sezione segreta
SUMMARY_MODEL=google/gemini-2.5-flash  # modello OpenRouter per i riassunti
```

- [ ] **Step 4: Commit**

```bash
git init
git add vercel.json .env.example public/tracks/.gitkeep public/sounds/.gitkeep
git commit -m "feat: scaffold — directory structure, vercel config, env example"
```

---

## Task 2: config.js + app.js skeleton

**Files:**
- Create: `src/config.js`
- Create: `src/app.js`

- [ ] **Step 1: Create src/config.js**

```js
export const NOISE_BUFFER_SIZE = 2;        // seconds of noise buffer

export const BINAURAL_BASE_FREQ = 200;     // Hz, carrier frequency
export const BINAURAL_PRESETS = {
  alpha: 10,
  theta: 6,
  delta: 2,
};

export const VU_FFT_SIZE = 256;

export const TRACKS = [];                  // { title: string, src: string }
```

- [ ] **Step 2: Create src/app.js skeleton**

```js
import { initFrequencyPanel } from './components/frequencyPanel.js';
import { initTrackPanel } from './components/trackPanel.js';

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

document.addEventListener('DOMContentLoaded', () => {
  initTabSwitcher();
  initFrequencyPanel();
  initTrackPanel();
});
```

- [ ] **Step 3: Commit**

```bash
git add src/config.js src/app.js
git commit -m "feat: config constants and app.js skeleton"
```

---

## Task 3: index.html — full HTML structure

**Files:**
- Create: `index.html`

- [ ] **Step 1: Create index.html**

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

    <!-- POMODORO (placeholder — not wired) -->
    <aside class="pomodoro-section">
      <div class="pomodoro-card glass-card">
        <svg class="pomodoro-ring" viewBox="0 0 100 100" width="120" height="120">
          <circle class="ring-bg" cx="50" cy="50" r="44" />
          <circle class="ring-progress" cx="50" cy="50" r="44" />
        </svg>
        <div class="pomodoro-time">25:00</div>
        <button class="btn btn--primary" disabled>▶ Start</button>
      </div>
    </aside>

  </div>

  <script type="module" src="src/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verify structure**

Open `index.html` in a browser. Expect: unstyled page (CSS not created yet), correct HTML structure in DevTools, no JS errors in console.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: index.html full HTML structure with placeholders"
```

---

## Task 4: style.css — design system + glassmorphism

**Files:**
- Create: `src/style.css`

- [ ] **Step 1: Create src/style.css**

```css
/* ── RESET & ROOT ─────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg-primary: #0a0a12;
  --bg-secondary: #111122;
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-blur: blur(16px);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  --accent-primary: #7c6af7;
  --accent-secondary: #4fc3f7;
  --text-primary: rgba(255, 255, 255, 0.92);
  --text-secondary: rgba(255, 255, 255, 0.55);
  --radius-card: 16px;
  --radius-btn: 8px;
  --secret-tint: rgba(60, 0, 80, 0.15);
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: system-ui, -apple-system, sans-serif;
  min-height: 100dvh;
}

/* ── GLASS CARD ───────────────────────────────────────── */
.glass-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-radius: var(--radius-card);
  box-shadow: var(--glass-shadow);
}

/* ── LAYOUT ───────────────────────────────────────────── */
.app {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 1.5rem;
  min-height: 100dvh;
}

/* ── HEADER ───────────────────────────────────────────── */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
}

.logo {
  font-size: 1.75rem;
  color: var(--accent-primary);
  cursor: pointer;
  user-select: none;
  transition: opacity 150ms ease;
}
.logo:hover { opacity: 0.7; }

.header-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* ── SLIDERS ──────────────────────────────────────────── */
.slider {
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 2px;
  background: var(--glass-border);
  outline: none;
  cursor: pointer;
}
.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--accent-primary);
  cursor: pointer;
}
.slider--master { width: 120px; }

/* ── VU METER ─────────────────────────────────────────── */
.vu-meter {
  border-radius: 4px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
}

/* ── TABS ─────────────────────────────────────────────── */
.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tab-btn {
  padding: 0.5rem 1.25rem;
  border-radius: var(--radius-btn);
  border: 1px solid var(--glass-border);
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease, border-color 150ms ease;
}
.tab-btn.active,
.tab-btn:hover {
  background: var(--glass-bg);
  color: var(--text-primary);
  border-color: var(--accent-primary);
}

.tab-panel {
  opacity: 0;
  transform: translateY(8px);
  pointer-events: none;
  transition: opacity 200ms ease, transform 200ms ease;
  position: absolute;
  width: 100%;
}
.tab-panel.active {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
  position: static;
}

/* ── FREQUENCY GRID ───────────────────────────────────── */
.frequency-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.frequency-card {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.frequency-card__name {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-primary);
}

.frequency-card__controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.frequency-card .slider { flex: 1; }

.btn-toggle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--glass-border);
  background: transparent;
  color: var(--text-secondary);
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 150ms ease, border-color 150ms ease, color 150ms ease;
}
.btn-toggle:hover { background: var(--glass-bg); color: var(--text-primary); }
.frequency-card.active .btn-toggle {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: #fff;
}

/* ── ACTIVE PULSE ANIMATION ───────────────────────────── */
@keyframes pulse-glow {
  0%, 100% { box-shadow: var(--glass-shadow); }
  50%       { box-shadow: var(--glass-shadow), 0 0 24px rgba(124, 106, 247, 0.5); }
}
.frequency-card.active {
  animation: pulse-glow 2s ease-in-out infinite;
}

/* ── BINAURAL PRESET SELECT ───────────────────────────── */
.binaural-preset {
  width: 100%;
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-btn);
  color: var(--text-primary);
  padding: 0.25rem 0.5rem;
  font-size: 0.85rem;
  cursor: pointer;
}

/* ── TRACK LIST ───────────────────────────────────────── */
.track-list { display: flex; flex-direction: column; gap: 0.5rem; }

.track-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
}

.track-row__name {
  flex: 1;
  font-size: 0.9rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-row progress {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  cursor: pointer;
  accent-color: var(--accent-primary);
}

.track-row--empty {
  color: var(--text-secondary);
  font-size: 0.9rem;
  padding: 1.5rem;
  text-align: center;
}

.track-row--error .track-row__name { color: #f87171; }

/* ── POMODORO PLACEHOLDER ─────────────────────────────── */
.pomodoro-section { display: flex; justify-content: center; }

.pomodoro-card {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.ring-bg {
  fill: none;
  stroke: var(--glass-border);
  stroke-width: 6;
}
.ring-progress {
  fill: none;
  stroke: var(--accent-primary);
  stroke-width: 6;
  stroke-linecap: round;
  stroke-dasharray: 276.5;
  stroke-dashoffset: 0;
  transform: rotate(-90deg);
  transform-origin: center;
  transition: stroke-dashoffset 1s linear;
}

.pomodoro-time {
  font-size: 2.5rem;
  font-variant-numeric: tabular-nums;
  font-weight: 300;
  letter-spacing: 0.05em;
  color: var(--text-primary);
  margin-top: -5rem;
  position: relative;
  z-index: 1;
}

/* ── BUTTONS ──────────────────────────────────────────── */
.btn {
  padding: 0.5rem 1.5rem;
  border-radius: var(--radius-btn);
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  transition: opacity 150ms ease;
}
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn--primary {
  background: var(--accent-primary);
  color: #fff;
}

/* ── ACCESSIBILITY ────────────────────────────────────── */
.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}

/* ── RESPONSIVE ───────────────────────────────────────── */
@media (max-width: 600px) {
  .frequency-grid { grid-template-columns: 1fr 1fr; }
  .slider--master { width: 80px; }
  .pomodoro-time { font-size: 2rem; }
}
```

- [ ] **Step 2: Verify visual shell**

Open `index.html` in a browser (file:// is fine). Expect:
- Dark purple-black background
- Glassmorphism header with slider + canvas
- Two tabs "Frequenze" / "Tracce" — clicking switches panels (content is empty, that's expected)
- Pomodoro placeholder card at bottom with SVG ring
- No console errors

- [ ] **Step 3: Commit**

```bash
git add src/style.css
git commit -m "feat: style.css — full glassmorphism design system"
```

---

## Task 5: noiseGenerator.js — all 6 audio sources

**Files:**
- Create: `src/audio/noiseGenerator.js`

- [ ] **Step 1: Create src/audio/noiseGenerator.js**

```js
import { NOISE_BUFFER_SIZE, BINAURAL_BASE_FREQ, BINAURAL_PRESETS } from '../config.js';

function makeNoiseBuffer(ctx, fillFn) {
  const sampleRate = ctx.sampleRate;
  const frameCount = sampleRate * NOISE_BUFFER_SIZE;
  const buffer = ctx.createBuffer(1, frameCount, sampleRate);
  const data = buffer.getChannelData(0);
  fillFn(data);
  return buffer;
}

export function createWhiteNoise(ctx) {
  const buffer = makeNoiseBuffer(ctx, data => {
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  });
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const gain = ctx.createGain();
  source.connect(gain);
  source.start();
  return gain;
}

export function createBrownNoise(ctx) {
  const buffer = makeNoiseBuffer(ctx, data => {
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = last * 0.99 + white * 0.01;
      data[i] = last;
    }
    // peak-normalise
    let peak = 0;
    for (let i = 0; i < data.length; i++) if (Math.abs(data[i]) > peak) peak = Math.abs(data[i]);
    if (peak > 0) for (let i = 0; i < data.length; i++) data[i] /= peak;
  });
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const gain = ctx.createGain();
  source.connect(gain);
  source.start();
  return gain;
}

export function createPinkNoise(ctx) {
  // Paul Kellet's three-multiply approximation
  const buffer = makeNoiseBuffer(ctx, data => {
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      data[i] = (b0 + b1 + b2 + white * 0.5362) / 3.5;
    }
  });
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const gain = ctx.createGain();
  source.connect(gain);
  source.start();
  return gain;
}

export function createRainNoise(ctx) {
  const buffer = makeNoiseBuffer(ctx, data => {
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  });
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;
  filter.Q.value = 0.5;
  source.connect(filter);
  const gain = ctx.createGain();
  filter.connect(gain);
  source.start();
  return gain;
}

export function createTone432(ctx) {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 432;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  osc.connect(gain);
  osc.start();
  return { gain, osc };
}

export function fadeTone432(ctx, gainNode, active) {
  const now = ctx.currentTime;
  gainNode.gain.cancelScheduledValues(now);
  gainNode.gain.setValueAtTime(gainNode.gain.value, now);
  gainNode.gain.linearRampToValueAtTime(active ? 1 : 0, now + 0.05);
}

export function createBinaural(ctx, presetKey = 'alpha') {
  const beatHz = BINAURAL_PRESETS[presetKey] ?? BINAURAL_PRESETS.alpha;
  const left = ctx.createOscillator();
  const right = ctx.createOscillator();
  left.type = 'sine';
  right.type = 'sine';
  left.frequency.value = BINAURAL_BASE_FREQ - beatHz / 2;
  right.frequency.value = BINAURAL_BASE_FREQ + beatHz / 2;

  const panLeft = ctx.createStereoPanner();
  const panRight = ctx.createStereoPanner();
  panLeft.pan.value = -1;
  panRight.pan.value = 1;

  left.connect(panLeft);
  right.connect(panRight);

  const gain = ctx.createGain();
  panLeft.connect(gain);
  panRight.connect(gain);

  left.start();
  right.start();
  return { gain, left, right, panLeft, panRight };
}

export function updateBinauralPreset(ctx, binauralRef, presetKey) {
  const beatHz = BINAURAL_PRESETS[presetKey] ?? BINAURAL_PRESETS.alpha;
  binauralRef.left.frequency.setTargetAtTime(BINAURAL_BASE_FREQ - beatHz / 2, ctx.currentTime, 0.1);
  binauralRef.right.frequency.setTargetAtTime(BINAURAL_BASE_FREQ + beatHz / 2, ctx.currentTime, 0.1);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/audio/noiseGenerator.js
git commit -m "feat: noiseGenerator — white, brown, pink, rain, 432Hz, binaural"
```

---

## Task 6: trackPlayer.js

**Files:**
- Create: `src/audio/trackPlayer.js`

- [ ] **Step 1: Create src/audio/trackPlayer.js**

```js
const audio = new Audio();
audio.preload = 'metadata';

let _onTimeUpdate = null;
let _onEnded = null;

audio.addEventListener('timeupdate', () => {
  if (_onTimeUpdate && audio.duration) {
    _onTimeUpdate(audio.currentTime / audio.duration);
  }
});

audio.addEventListener('ended', () => {
  if (_onEnded) _onEnded();
});

export async function play(src) {
  if (audio.src !== new URL(src, location.href).href) {
    audio.src = src;
  }
  try {
    await audio.play();
  } catch (err) {
    throw err;
  }
}

export function pause() {
  audio.pause();
}

export function seek(pct) {
  if (audio.duration) audio.currentTime = pct * audio.duration;
}

export function onTimeUpdate(cb) {
  _onTimeUpdate = cb;
}

export function onEnded(cb) {
  _onEnded = cb;
}

export function isPlaying() {
  return !audio.paused;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/audio/trackPlayer.js
git commit -m "feat: trackPlayer — HTMLAudioElement wrapper"
```

---

## Task 7: audioMixer.js

**Files:**
- Create: `src/audio/audioMixer.js`

- [ ] **Step 1: Create src/audio/audioMixer.js**

```js
import { VU_FFT_SIZE } from '../config.js';
import {
  createWhiteNoise, createBrownNoise, createPinkNoise,
  createRainNoise, createTone432, fadeTone432,
  createBinaural, updateBinauralPreset,
} from './noiseGenerator.js';

let ctx = null;
let masterGain = null;
let analyser = null;

const sources = {};   // id → { gain, active, ...extra }

export function init() {
  if (ctx) return;
  ctx = new AudioContext();
  masterGain = ctx.createGain();
  analyser = ctx.createAnalyser();
  analyser.fftSize = VU_FFT_SIZE;
  masterGain.connect(analyser);
  analyser.connect(ctx.destination);

  // pre-create all noise sources (they run silently at gain 0 until toggled)
  sources.white  = { gain: createWhiteNoise(ctx),  active: false };
  sources.brown  = { gain: createBrownNoise(ctx),  active: false };
  sources.pink   = { gain: createPinkNoise(ctx),   active: false };
  sources.rain   = { gain: createRainNoise(ctx),   active: false };

  const toneRef = createTone432(ctx);
  sources.tone432 = { gain: toneRef.gain, osc: toneRef.osc, active: false };

  const binauralRef = createBinaural(ctx, 'alpha');
  sources.binaural = { ...binauralRef, active: false, preset: 'alpha' };

  // connect all source gains to master (start silent)
  for (const id of Object.keys(sources)) {
    sources[id].gain.gain.value = 0;
    sources[id].gain.connect(masterGain);
  }
}

export function toggle(id) {
  if (!ctx) init();
  const src = sources[id];
  if (!src) return false;
  src.active = !src.active;

  if (id === 'tone432') {
    fadeTone432(ctx, src.gain, src.active);
  } else {
    src.gain.gain.setTargetAtTime(src.active ? 0.8 : 0, ctx.currentTime, 0.05);
  }
  return src.active;
}

export function setVolume(id, value) {
  if (!ctx) return;
  const src = sources[id];
  if (!src) return;
  src.gain.gain.setTargetAtTime(Number(value), ctx.currentTime, 0.02);
}

export function setMasterVolume(value) {
  if (!ctx) init();
  masterGain.gain.setTargetAtTime(Number(value), ctx.currentTime, 0.02);
}

export function getActiveIds() {
  return Object.entries(sources)
    .filter(([, s]) => s.active)
    .map(([id]) => id);
}

export function getAnalyser() {
  return analyser;
}

export function setBinauralPreset(presetKey) {
  if (!ctx) return;
  const src = sources.binaural;
  if (!src) return;
  src.preset = presetKey;
  updateBinauralPreset(ctx, src, presetKey);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/audio/audioMixer.js
git commit -m "feat: audioMixer — single AudioContext, toggle/volume/analyser"
```

---

## Task 8: frequencyPanel.js

**Files:**
- Create: `src/components/frequencyPanel.js`

- [ ] **Step 1: Create src/components/frequencyPanel.js**

```js
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
```

- [ ] **Step 2: Verify in browser**

Open `index.html`. In the Frequenze tab, 6 cards should appear. Click a card's toggle — sound plays (first click triggers AudioContext), card gets accent glow pulse. Click again — sound stops.

- [ ] **Step 3: Commit**

```bash
git add src/components/frequencyPanel.js
git commit -m "feat: frequencyPanel — 6 audio cards with toggle and volume"
```

---

## Task 9: trackPanel.js

**Files:**
- Create: `src/components/trackPanel.js`

- [ ] **Step 1: Create src/components/trackPanel.js**

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/trackPanel.js
git commit -m "feat: trackPanel — track list with play/pause and progress bar"
```

---

## Task 10: app.js — master volume, VU meter, lazy init

**Files:**
- Modify: `src/app.js`

- [ ] **Step 1: Replace src/app.js with full implementation**

```js
import { initFrequencyPanel } from './components/frequencyPanel.js';
import { initTrackPanel } from './components/trackPanel.js';
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
});
```

- [ ] **Step 2: Verify full integration in browser**

Open `index.html`. Verify:
- Frequenze tab: 6 cards visible, clicking toggle plays sound, glow pulse appears
- Tracce tab: shows empty state message (no tracks configured yet)
- Master volume slider adjusts all active sources
- VU meter bar animates when a generative source is playing
- Binaural card has preset dropdown; changing preset shifts the beat frequency
- No console errors

- [ ] **Step 3: Commit**

```bash
git add src/app.js
git commit -m "feat: app.js — master volume, VU meter, full wiring"
```

---

## Task 11: public/tracks/README.md

**Files:**
- Create: `public/tracks/README.md`

- [ ] **Step 1: Create public/tracks/README.md**

```markdown
# Aggiungere tracce audio

1. Copia i file MP3 o OGG in questa cartella (`public/tracks/`)
2. Apri `src/config.js` e aggiungi le tracce all'array `TRACKS`:

```js
export const TRACKS = [
  { title: 'Nome traccia', src: '/tracks/nome-file.mp3' },
];
```

3. Ricarica il browser — le tracce appariranno nel tab "Tracce"

**Formati supportati:** MP3, OGG, WAV (dipende dal browser)
**Dimensione consigliata:** file compressi, idealmente sotto i 10 MB per caricamento rapido
```

- [ ] **Step 2: Commit**

```bash
git add public/tracks/README.md
git commit -m "docs: public/tracks/README explaining how to add audio files"
```

---

## End-to-End Verification

Open `index.html` in a modern browser (Chrome/Firefox/Edge). Run through this checklist:

- [ ] Page loads with dark glassmorphism design, no layout breaks
- [ ] Tabs switch between "Frequenze" and "Tracce" with fade transition
- [ ] Clicking a frequency card toggle plays audio; card gets glow pulse; button shows ■
- [ ] Clicking toggle again stops audio; glow disappears; button shows ▶
- [ ] Volume slider on each card adjusts that source's volume while playing
- [ ] Binaural card: changing preset dropdown shifts beat frequency (audible stereo effect)
- [ ] Master volume slider affects all active sources simultaneously
- [ ] VU meter bar animates during generative playback, is flat when nothing plays
- [ ] Tracce tab shows empty state message (no tracks in TRACKS array)
- [ ] Add `{ title: 'Test', src: '/tracks/test.mp3' }` to TRACKS, place a real MP3 in `/public/tracks/`, serve with `npx serve .` (track playback requires a local server — `file://` URLs block audio loading in most browsers) → track row appears, clicking play button plays it, progress bar moves
- [ ] Pomodoro section visible at bottom with SVG ring and disabled button (placeholder)
- [ ] No JS errors in browser console

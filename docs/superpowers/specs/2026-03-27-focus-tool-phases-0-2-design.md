# Focus Tool — Phases 0–2 Design

**Date:** 2026-03-27
**Scope:** Tasks 1–20 (Phase 0: scaffold, Phase 1: audio engine, Phase 2: UI player)
**Approach:** UI shell first (C) — visual shell is previewable before audio logic is wired

---

## Context

Starting from a blank slate (only `CLAUDE.md` exists). Goal is to produce a working, styled audio focus tool covering the public area: generative audio player + local track player. Pomodoro timer (Phase 3+) and secret section (Phase 5+) are out of scope here.

---

## Implementation Order

1. **Scaffold** — `vercel.json`, `.env.example`, `config.js`, `app.js` skeleton
2. **Visual shell** — `index.html` + `style.css`, fully styled static page previewable in browser
3. **Audio engine** — `noiseGenerator.js`, `trackPlayer.js`, `audioMixer.js`
4. **UI wiring** — `frequencyPanel.js`, `trackPanel.js`, tab switcher, master volume, VU meter, active pulse
5. **Track placeholder** — `/public/tracks/README.md` explaining how to add audio files

---

## Architecture

### Module graph

```
index.html
  └── src/app.js  [owns: tab switcher logic, VU meter rAF loop, audioMixer.init() trigger]
        ├── src/config.js
        ├── src/audio/audioMixer.js
        │     ├── src/audio/noiseGenerator.js
        │     └── src/audio/trackPlayer.js
        ├── src/components/frequencyPanel.js
        └── src/components/trackPanel.js
```

### Key constraints (from CLAUDE.md)
- Single `AudioContext` lives exclusively in `audioMixer.js`; all generators receive it as a parameter
- `config.js` is the only place for tunable constants
- Native ES6 modules (`type="module"`), no build step, no npm runtime deps
- No framework — vanilla JS + Web APIs only

---

## `vercel.json` content (Task 2)

```json
{
  "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }],
  "functions": {
    "api/*.js": { "runtime": "nodejs18.x" }
  }
}
```

---

## `config.js` initial exports (Task 6)

All tunable constants live here. Initial set for phases 0–2:

```js
export const NOISE_BUFFER_SIZE = 2;        // seconds of noise buffer
export const BINAURAL_BASE_FREQ = 200;     // Hz, carrier frequency
export const BINAURAL_PRESETS = {
  alpha: 10,   // 10 Hz beat
  theta: 6,    // 6 Hz beat
  delta: 2,    // 2 Hz beat
};
export const VU_FFT_SIZE = 256;
export const TRACKS = [];                  // populate with { title, src } objects
```

---

## Components

### `noiseGenerator.js`
- **White noise**: random float buffer, looping `AudioBufferSourceNode`; buffer size from `NOISE_BUFFER_SIZE` in `config.js`
- **Brown noise**: integrated white noise (each sample = previous × 0.99 + white × 0.01); after filling the buffer, peak-normalise by dividing every sample by the maximum absolute value found in the buffer
- **Pink noise**: Paul Kellet's three-multiply approximation — fast, perceptually accurate for focus audio
- **Rain**: white noise buffer routed through `BiquadFilterNode` (type `lowpass`, cutoff 800Hz, Q 0.5)
- **432Hz tone**: `OscillatorNode` (sine, 432Hz) with linear ramp fade-in/out (50ms) on toggle
- **Binaural beats**: two `OscillatorNode`s at `(BINAURAL_BASE_FREQ ± beatHz/2)`, each panned L/R via `StereoPannerNode`; beatHz from active preset in `config.js`
- All sources connect to an individual `GainNode`; that GainNode is returned to `audioMixer.js` for routing

### `trackPlayer.js`
- Wraps a single `HTMLAudioElement`
- Exposes: `play(src)`, `pause()`, `seek(pct)`, `onTimeUpdate(cb)`, `onEnded(cb)` — `onTimeUpdate` and `onEnded` are single-subscriber setters (replace previous callback, not addEventListener-style)
- Does **not** use Web Audio API (`MediaElementSourceNode`) — intentional trade-off for simplicity
- **Known limitation**: track playback is not captured by the `AnalyserNode`, so the VU meter will not respond to local track audio. This is acceptable for phases 0–2.

### `audioMixer.js`
- Exports: `init()`, `toggle(id)`, `setVolume(id, value)`, `setMasterVolume(value)`, `getActiveIds()`, `getAnalyser()`
- `init()` creates the single `AudioContext`, master `GainNode`, and `AnalyserNode` (`fftSize` from `VU_FFT_SIZE` — consumers use `import { VU_FFT_SIZE } from '../config.js'`)
- Signal chain: `source GainNode → master GainNode → AnalyserNode → destination`
  - `AnalyserNode` sits between master gain and destination — reads post-master signal (intentional)
- `toggle(id)` starts or stops the generator and **returns the new active state as a boolean** (`true` = now playing)
- `setVolume(id, value)` adjusts the source's `GainNode`; `setMasterVolume` adjusts the master `GainNode`

### `frequencyPanel.js`
- Renders 6 cards: white, brown, pink, rain, 432hz, binaural
- Each card: toggle button + volume slider (`<input type="range">`)
- Binaural card: additional `<select>` for preset (alpha/theta/delta)
- On toggle click: calls `audioMixer.toggle(id)`, which returns a boolean; panel applies/removes `.active` class on the card based on the return value — no separate state query needed
- Slider calls `audioMixer.setVolume(id, value)`
- **Active pulse animation (Task 20)**: when a card has `.active`, a continuous CSS `@keyframes` animation pulses the card's `box-shadow` between `--glass-shadow` and a brighter accent glow (`0 0 24px rgba(124, 106, 247, 0.5)`), cycle 2s ease-in-out infinite. Applied via CSS rule `.frequency-card.active { animation: pulse-glow 2s ease-in-out infinite; }`. No JS required after class is set.

### `trackPanel.js`
- Track list sourced from `TRACKS` array in `config.js` (static, no filesystem scan)
- Renders rows: play/pause button, track name, `<progress>` element
- Single `<audio>` element managed by `trackPlayer.js`
- `onTimeUpdate` drives the progress bar; clicking progress bar calls `trackPlayer.seek()`

### Tab switcher
- Two tabs: **Frequencies** / **Tracks**
- CSS: `.tab-panel` hidden (`opacity: 0; transform: translateY(8px); pointer-events: none`); `.tab-panel.active` visible (`opacity: 1; transform: translateY(0); pointer-events: auto`); transition: `opacity 200ms ease, transform 200ms ease`
- `app.js` toggles `active` class on button and panel on click

### Master volume + VU meter
- Master volume: `<input type="range">` calls `audioMixer.setMasterVolume(value)`; slider triggers `audioMixer.init()` on first interaction if not yet initialised
- VU meter: `<canvas>` element; `app.js` runs `requestAnimationFrame` loop calling `audioMixer.getAnalyser()` and drawing a horizontal bar meter using `getByteFrequencyData()`
- **Note**: VU meter reflects generative audio only (not local tracks — see `trackPlayer` limitation above)

### `audioMixer.init()` trigger
- Called lazily on the **first user gesture** that interacts with audio: either a frequency card toggle or the master volume slider
- Before `init()` is called, audio cards render normally but toggle clicks call `init()` first, then proceed
- No special "uninitialised" visual state — the page renders fully; audio simply won't start until the first click (browser autoplay policy is transparent to the user)

---

## Design System (from CLAUDE.md)

All values defined as CSS variables in `:root` in `style.css`:

```css
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
```

No hardcoded color/spacing values outside `:root`.

---

## Static Placeholders (out of scope, in shell only)

The HTML shell includes placeholder markup for:
- **Pomodoro timer** section (SVG circle, start/stop button) — not wired up
- **Settings panel** — not wired up
- **Header logo** — clickable but auth modal not wired up

---

## Error Handling

- `audioMixer.init()` called lazily on first user gesture — required by browser autoplay policy
- `trackPlayer` wraps `audio.play()` in try/catch with a visual error state on the track row
- No API calls in phases 0–2, so no network error handling needed yet

---

## Deliverables Checklist (Tasks 1–20)

| Task | File / output |
|------|--------------|
| 1 | All directory structure created |
| 2 | `vercel.json` with rewrites + Node 18 runtime |
| 3 | `.env.example` with all variables listed |
| 4 | `index.html` with full section structure + meta tags |
| 5 | `style.css` with complete design system + glassmorphism |
| 6 | `src/app.js` entry point with module imports skeleton |
| 7 | White noise in `noiseGenerator.js` |
| 8 | Brown noise in `noiseGenerator.js` |
| 9 | Pink noise (Paul Kellet) in `noiseGenerator.js` |
| 10 | Rain loop in `noiseGenerator.js` |
| 11 | 432Hz tone in `noiseGenerator.js` |
| 12 | Binaural beats in `noiseGenerator.js` |
| 13 | `trackPlayer.js` |
| 14 | `audioMixer.js` |
| 15 | `/public/tracks/README.md` |
| 16 | `frequencyPanel.js` |
| 17 | `trackPanel.js` |
| 18 | Tab switcher (CSS + `app.js`) |
| 19 | Master volume slider + VU meter canvas |
| 20 | Active frequency pulse animation |

---

## Verification

After step 2 (visual shell):
- Open `index.html` directly in browser — page renders with glassmorphism styling, tabs switch, layout is responsive on desktop and mobile

After step 4 (full wiring):
- Click any frequency card → `audioMixer.init()` fires once, sound plays, slider adjusts volume, card pulses
- Click binaural card → select preset, hear stereo beating effect
- Add an MP3 to `/public/tracks/` and add entry to `TRACKS` in `config.js` → track appears, plays, progress bar moves
- Master volume slider affects all active generative sources; VU meter bar animates
- VU meter is silent during local track playback (known, documented trade-off)

import { VU_FFT_SIZE, DEFAULT_SOURCE_GAIN } from '../config.js';
import {
  createWhiteNoise, createBrownNoise, createPinkNoise,
  createRainNoise, createTone432, fadeTone432,
  createBinaural, updateBinauralPreset,
} from './noiseGenerator.js';

let ctx = null;
let masterGain = null;
let analyser = null;

// Intentionally stateful singleton — never reset during the page session.
const sources = {};   // id → { gain, active, volume, ...extra }

export function init() {
  if (ctx) return;
  ctx = new AudioContext();
  masterGain = ctx.createGain();
  analyser = ctx.createAnalyser();
  analyser.fftSize = VU_FFT_SIZE;
  masterGain.connect(analyser);
  analyser.connect(ctx.destination);

  // pre-create all sources running silently (gain 0) to avoid startup latency
  sources.white   = { gain: createWhiteNoise(ctx),  active: false, volume: DEFAULT_SOURCE_GAIN };
  sources.brown   = { gain: createBrownNoise(ctx),  active: false, volume: DEFAULT_SOURCE_GAIN };
  sources.pink    = { gain: createPinkNoise(ctx),   active: false, volume: DEFAULT_SOURCE_GAIN };
  sources.rain    = { gain: createRainNoise(ctx),   active: false, volume: DEFAULT_SOURCE_GAIN };

  const toneRef = createTone432(ctx);
  sources.tone432  = { gain: toneRef.gain, osc: toneRef.osc, active: false, volume: DEFAULT_SOURCE_GAIN };

  const binauralRef = createBinaural(ctx, 'alpha');
  sources.binaural = { ...binauralRef, active: false, volume: DEFAULT_SOURCE_GAIN, preset: 'alpha' };

  for (const id of Object.keys(sources)) {
    sources[id].gain.gain.value = 0;
    sources[id].gain.connect(masterGain);
  }
}

export function toggle(id) {
  if (!ctx) init();
  if (ctx.state === 'suspended') ctx.resume();
  const src = sources[id];
  if (!src) return false;
  src.active = !src.active;

  if (id === 'tone432') {
    fadeTone432(ctx, src.gain, src.active);
  } else {
    src.gain.gain.setTargetAtTime(src.active ? src.volume : 0, ctx.currentTime, 0.05);
  }
  return src.active;
}

export function setVolume(id, value) {
  if (!ctx) return;
  const src = sources[id];
  if (!src) return;
  src.volume = Number(value);
  if (src.active) {
    src.gain.gain.setTargetAtTime(src.volume, ctx.currentTime, 0.02);
  }
}

export function setMasterVolume(value) {
  if (!ctx) return;
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

export function suspend() {
  if (ctx && ctx.state === 'running') ctx.suspend();
}

export function resumeContext() {
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

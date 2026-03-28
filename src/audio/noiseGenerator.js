import { NOISE_BUFFER_SIZE, BINAURAL_BASE_FREQ, BINAURAL_PRESETS, RAIN_FILTER_FREQ, RAIN_FILTER_Q, TONE_FADE_S } from '../config.js';

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
    // warm up filter to avoid seam artifact at loop point
    for (let i = 0; i < 2048; i++) last = last * 0.99 + (Math.random() * 2 - 1) * 0.01;
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
    // warm up filter to avoid seam artifact at loop point
    for (let i = 0; i < 2048; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520;
    }
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
  filter.frequency.value = RAIN_FILTER_FREQ;
  filter.Q.value = RAIN_FILTER_Q;
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
  gainNode.gain.linearRampToValueAtTime(active ? 1 : 0, now + TONE_FADE_S);
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

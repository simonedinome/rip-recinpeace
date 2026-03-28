export const NOISE_BUFFER_SIZE = 2;        // seconds of noise buffer

export const BINAURAL_BASE_FREQ = 200;     // Hz, carrier frequency
export const BINAURAL_PRESETS = {
  alpha: 10,
  theta: 6,
  delta: 2,
};

export const VU_FFT_SIZE = 256;

export const TRACKS = [];                  // { title: string, src: string }

export const RAIN_FILTER_FREQ = 800;       // Hz, rain noise lowpass cutoff
export const RAIN_FILTER_Q = 0.5;          // rain noise filter resonance
export const TONE_FADE_S = 0.05;           // seconds, 432Hz fade in/out ramp
export const DEFAULT_SOURCE_GAIN = 0.8;   // default gain when toggling a source on

export const POMODORO_DEFAULTS = {
  work: 25,           // minutes
  shortBreak: 5,      // minutes
  longBreak: 15,      // minutes
  sessions: 4,        // work sessions before long break
  autoStart: false,   // auto-start next phase
  sound: 'bell',      // 'none' | 'beep' | 'bell' | 'chime'
};

export const TRANSCRIPTION_ENGINE = 'webspeech'; // 'webspeech' | 'whisper' | 'gemini'
export const SUMMARY_MODEL = 'google/gemini-2.5-flash'; // OpenRouter model ID

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

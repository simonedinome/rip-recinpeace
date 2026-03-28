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

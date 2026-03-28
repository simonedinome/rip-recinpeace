const SESSION_KEY = 'focustool_auth';
const CLICKS_NEEDED = 5;
const CLICK_WINDOW_MS = 1500;

let onAuthCallback = null;

export function initAuth(onAuthenticated) {
  onAuthCallback = onAuthenticated;

  if (sessionStorage.getItem(SESSION_KEY) === 'ok') {
    onAuthenticated();
    return;
  }

  const logo = document.getElementById('logo');
  let clicks = 0;
  let resetTimer = null;

  logo.addEventListener('click', () => {
    clicks++;
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => { clicks = 0; }, CLICK_WINDOW_MS);
    if (clicks >= CLICKS_NEEDED) {
      clicks = 0;
      clearTimeout(resetTimer);
      showModal();
    }
  });

  document.getElementById('auth-form').addEventListener('submit', handleSubmit);
  document.getElementById('auth-close').addEventListener('click', hideModal);
  document.getElementById('auth-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('auth-modal')) hideModal();
  });
}

function showModal() {
  const modal = document.getElementById('auth-modal');
  const input = document.getElementById('auth-password');
  document.getElementById('auth-error').hidden = true;
  modal.removeAttribute('hidden');
  input.value = '';
  setTimeout(() => input.focus(), 50);
}

function hideModal() {
  document.getElementById('auth-modal').setAttribute('hidden', '');
}

async function handleSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('auth-password');
  const errorEl = document.getElementById('auth-error');
  errorEl.hidden = true;

  const hash = await sha256(input.value);

  try {
    const res = await fetch('/api/check-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash }),
    });
    const { ok } = await res.json();
    if (ok) {
      sessionStorage.setItem(SESSION_KEY, 'ok');
      hideModal();
      if (onAuthCallback) onAuthCallback();
    } else {
      errorEl.textContent = 'Password errata.';
      errorEl.hidden = false;
      input.value = '';
      input.focus();
    }
  } catch {
    errorEl.textContent = 'Errore di rete. Riprova.';
    errorEl.hidden = false;
  }
}

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}

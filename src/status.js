const PING_INTERVAL = 30_000;
let dotEl = null;

function setStatus(ok) {
  if (!dotEl) return;
  dotEl.classList.toggle('status-dot--ok', ok);
  dotEl.classList.toggle('status-dot--err', !ok);
}

async function ping() {
  try {
    const res = await fetch('/api/check-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash: '' }),
    });
    setStatus(res.status !== 401);
  } catch {
    setStatus(false);
  }
}

export function initStatusDot() {
  dotEl = document.getElementById('system-status');
  ping();
  setInterval(ping, PING_INTERVAL);
}

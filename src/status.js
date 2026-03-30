let dotEl = null;

export function initStatusDot() {
  dotEl = document.getElementById('system-status');
}

export function setRecordingState(active) {
  if (!dotEl) return;
  dotEl.classList.toggle('status-dot--ok', active);
  dotEl.classList.toggle('status-dot--err', false);
}

import { transcriberFactory } from './transcriberFactory.js';
import { logout as authLogout } from './auth.js';
import { setRecordingState } from '../status.js';

let isRecording = false;
let transcriptChunks = [];
let recordingStart = null;
let transcriber = null;
let interimEl = null;

export function initSecretUI() {
  const section = document.getElementById('secret-section');
  section.removeAttribute('hidden');

  transcriber = transcriberFactory();
  document.getElementById('secret-engine-label').textContent = transcriber.name;

  document.getElementById('rec-btn').addEventListener('click', handleRecClick);
  document.getElementById('summarize-btn').addEventListener('click', handleSummarize);
  document.getElementById('copy-all-btn').addEventListener('click', handleCopyAll);
  document.getElementById('save-notion-btn').addEventListener('click', handleSaveNotion);
  document.getElementById('download-btn').addEventListener('click', handleDownload);
  document.getElementById('secret-logout').addEventListener('click', () => {
    authLogout();
    section.setAttribute('hidden', '');
  });
}

async function handleRecClick() {
  const recBtn = document.getElementById('rec-btn');
  const summarizeBtn = document.getElementById('summarize-btn');
  const copyAllBtn = document.getElementById('copy-all-btn');

  if (isRecording) {
    isRecording = false;
    recBtn.textContent = '⏺ REC';
    recBtn.classList.remove('recording');
    setRecordingState(false);
    transcriber.stop();
    const hasContent = transcriptChunks.length > 0;
    summarizeBtn.disabled = !hasContent;
    copyAllBtn.disabled = !hasContent;
  } else {
    transcriptChunks = [];
    interimEl = null;
    document.getElementById('live-transcript').innerHTML = '';
    document.getElementById('summary-card').setAttribute('hidden', '');
    summarizeBtn.disabled = true;
    copyAllBtn.disabled = true;
    recordingStart = Date.now();
    isRecording = true;
    recBtn.textContent = '⏹ Stop';
    recBtn.classList.add('recording');
    setRecordingState(true);
    try {
      await transcriber.start(onChunk);
    } catch (e) {
      isRecording = false;
      recBtn.textContent = '⏺ REC';
      recBtn.classList.remove('recording');
      setRecordingState(false);
      showTranscriptError(e.message);
    }
  }
}

function onChunk({ text, isFinal }) {
  const container = document.getElementById('live-transcript');
  if (isFinal) {
    transcriptChunks.push({ text, ts: Date.now() });
    if (interimEl) { interimEl.remove(); interimEl = null; }
    const p = document.createElement('p');
    p.textContent = text;
    container.appendChild(p);
  } else {
    if (!interimEl) {
      interimEl = document.createElement('p');
      interimEl.className = 'interim';
      container.appendChild(interimEl);
    }
    interimEl.textContent = text;
  }
  container.scrollTop = container.scrollHeight;
}

function showTranscriptError(msg) {
  const container = document.getElementById('live-transcript');
  const p = document.createElement('p');
  p.style.color = '#f87171';
  p.textContent = `Errore: ${msg}`;
  container.appendChild(p);
}

async function handleCopyAll() {
  const btn = document.getElementById('copy-all-btn');
  const container = document.getElementById('live-transcript');
  const text = Array.from(container.querySelectorAll('p:not(.interim)'))
    .map(p => p.textContent)
    .join('\n');

  try {
    await navigator.clipboard.writeText(text);
    const original = btn.textContent;
    btn.textContent = '✓ Copiato';
    setTimeout(() => { btn.textContent = original; }, 2000);
  } catch {
    // clipboard not available — silent fail
  }
}

async function handleSummarize() {
  const summarizeBtn = document.getElementById('summarize-btn');
  const summaryCard = document.getElementById('summary-card');
  const summaryContent = document.getElementById('summary-content');

  summarizeBtn.disabled = true;
  summarizeBtn.textContent = '⏳ Generazione...';

  const transcript = transcriptChunks.map(c => c.text).join(' ');

  try {
    const res = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript }),
    });
    const { summary, error } = await res.json();
    if (error) throw new Error(error);
    summaryContent.textContent = summary;
    summaryCard.removeAttribute('hidden');
  } catch (e) {
    summaryContent.textContent = `Errore: ${e.message}`;
    summaryCard.removeAttribute('hidden');
  } finally {
    summarizeBtn.textContent = '✦ Genera Riassunto';
    summarizeBtn.disabled = false;
  }
}

function handleDownload() {
  const transcript = transcriptChunks.map(c => c.text).join('\n');
  const summary = document.getElementById('summary-content').textContent;

  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const datestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const timestamp = `${pad(now.getHours())}-${pad(now.getMinutes())}`;
  const filename = `sessione-${datestamp}-${timestamp}.txt`;

  const content = [
    `Focus Tool — Sessione del ${datestamp} alle ${pad(now.getHours())}:${pad(now.getMinutes())}`,
    '',
    '──────────────────────────────────────',
    'TRASCRIZIONE',
    '──────────────────────────────────────',
    transcript,
    '',
    '──────────────────────────────────────',
    'RIASSUNTO',
    '──────────────────────────────────────',
    summary,
  ].join('\n');

  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function handleSaveNotion() {
  const saveBtn = document.getElementById('save-notion-btn');
  const saveFeedback = document.getElementById('save-feedback');
  const summaryContent = document.getElementById('summary-content');

  saveBtn.disabled = true;
  saveFeedback.hidden = true;

  const transcript = transcriptChunks.map(c => c.text).join(' ');
  const summary = summaryContent.textContent;
  const duration = recordingStart ? Date.now() - recordingStart : null;

  try {
    const res = await fetch('/api/save-to-notion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, summary, duration }),
    });
    const { ok, error } = await res.json();
    saveFeedback.textContent = ok ? '✓ Salvato su Notion' : `Errore: ${error}`;
    saveFeedback.className = `save-feedback ${ok ? 'save-feedback--ok' : 'save-feedback--err'}`;
    saveFeedback.hidden = false;
  } catch (e) {
    saveFeedback.textContent = `Errore di rete: ${e.message}`;
    saveFeedback.className = 'save-feedback save-feedback--err';
    saveFeedback.hidden = false;
  } finally {
    saveBtn.disabled = false;
  }
}

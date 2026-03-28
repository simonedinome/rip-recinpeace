import { transcriberFactory } from './transcriberFactory.js';
import { logout as authLogout } from './auth.js';

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
  document.getElementById('save-notion-btn').addEventListener('click', handleSaveNotion);
  document.getElementById('secret-logout').addEventListener('click', () => {
    authLogout();
    section.setAttribute('hidden', '');
  });
}

async function handleRecClick() {
  const recBtn = document.getElementById('rec-btn');
  if (isRecording) {
    isRecording = false;
    recBtn.textContent = '⏺ REC';
    recBtn.classList.remove('recording');
    transcriber.stop();
    if (transcriptChunks.length > 0) {
      document.getElementById('summarize-btn').disabled = false;
    }
  } else {
    transcriptChunks = [];
    interimEl = null;
    document.getElementById('live-transcript').innerHTML = '';
    document.getElementById('summary-card').setAttribute('hidden', '');
    document.getElementById('summarize-btn').disabled = true;
    recordingStart = Date.now();
    isRecording = true;
    recBtn.textContent = '⏹ Stop';
    recBtn.classList.add('recording');
    try {
      await transcriber.start(onChunk);
    } catch (e) {
      isRecording = false;
      recBtn.textContent = '⏺ REC';
      recBtn.classList.remove('recording');
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

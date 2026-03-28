# Focus Tool Phases 5–9 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a password-protected secret section with real-time mic transcription, AI-powered summary generation, and Notion save functionality.

**Architecture:** `auth.js` gates access via SHA-256 hash sent to `/api/check-auth.js`; `transcriberFactory.js` picks the active engine (Web Speech API default, Whisper or Gemini as alternatives); `secretUI.js` owns the entire secret section DOM — REC button, live transcript, summary card, Notion save. All sensitive operations (auth check, transcription, summary, Notion) go through Vercel serverless functions in `/api/`.

**Tech Stack:** Web Speech API (primary transcription), MediaRecorder API (for Whisper/Gemini), Web Crypto API (SHA-256), Fetch API, OpenRouter API, OpenAI Whisper API, Notion API, Vercel Serverless Node 18.

---

## File Map

| File | Change |
|------|--------|
| `src/config.js` | Add `TRANSCRIPTION_ENGINE`, `SUMMARY_MODEL` |
| `index.html` | Add auth modal + secret section markup |
| `src/style.css` | Auth modal + secret section styles |
| `src/secret/auth.js` | Logo click gate, SHA-256, `/api/check-auth` call, sessionStorage |
| `src/secret/transcriber.js` | Web Speech API engine with auto-reconnect |
| `src/secret/whisperTranscriber.js` | MediaRecorder + Whisper endpoint |
| `src/secret/geminiTranscriber.js` | MediaRecorder + Gemini endpoint via OpenRouter |
| `src/secret/transcriberFactory.js` | Engine factory |
| `src/secret/secretUI.js` | REC, live transcript, summary, Notion save, logout |
| `api/check-auth.js` | Hash validation against `APP_PASSWORD_HASH` env var |
| `api/transcribe-whisper.js` | Whisper API proxy (base64 audio in, text out) |
| `api/transcribe-gemini.js` | Gemini multimodal proxy via OpenRouter |
| `api/summarize.js` | OpenRouter summary with structured Italian prompt |
| `api/save-to-notion.js` | Notion page creation with 429 retry |
| `src/app.js` | Import `initAuth`, mount secret section on auth success |

---

## Task 1: Update config.js — transcription engine + summary model

**Files:**
- Modify: `src/config.js`

- [ ] **Step 1: Append two constants to src/config.js**

Add after the last existing line:

```js
export const TRANSCRIPTION_ENGINE = 'webspeech'; // 'webspeech' | 'whisper' | 'gemini'
export const SUMMARY_MODEL = 'google/gemini-2.5-flash'; // OpenRouter model ID
```

- [ ] **Step 2: Commit**

```bash
git add src/config.js
git commit -m "feat: config — add TRANSCRIPTION_ENGINE and SUMMARY_MODEL"
```

---

## Task 2: api/check-auth.js — server-side hash validation

**Files:**
- Create: `api/check-auth.js`

The server receives the SHA-256 hash of the password (password itself never leaves the browser) and checks it against `APP_PASSWORD_HASH` env var.

- [ ] **Step 1: Create api/check-auth.js**

```js
export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { hash } = req.body || {};
  if (!hash || typeof hash !== 'string') return res.status(400).json({ ok: false });

  const expected = process.env.APP_PASSWORD_HASH;
  if (!expected) return res.status(500).json({ ok: false, error: 'Auth not configured' });

  res.json({ ok: hash.toLowerCase() === expected.toLowerCase() });
}
```

- [ ] **Step 2: Commit**

```bash
git add api/check-auth.js
git commit -m "feat: api/check-auth — hash validation against APP_PASSWORD_HASH"
```

---

## Task 3: src/secret/auth.js — logo click gate + modal

**Files:**
- Create: `src/secret/auth.js`

Five rapid clicks on the logo within 1.5 seconds opens the auth modal. The form sends the SHA-256 hash to `/api/check-auth`. On success, stores a flag in `sessionStorage` and calls `onAuthenticated()`.

- [ ] **Step 1: Create src/secret/auth.js**

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add src/secret/auth.js
git commit -m "feat: auth — logo click gate, SHA-256 modal, sessionStorage"
```

---

## Task 4: index.html — auth modal + secret section markup

**Files:**
- Modify: `index.html`

Add two new sections inside `.app` before the closing `</div>`: the auth modal overlay and the secret section.

- [ ] **Step 1: Add auth modal and secret section to index.html**

Open `index.html`. Replace the closing `</div>` before `<script` with:

```html
    <!-- AUTH MODAL -->
    <div id="auth-modal" class="auth-modal" hidden>
      <div class="auth-dialog glass-card">
        <button id="auth-close" class="btn-icon auth-close" aria-label="Chiudi">✕</button>
        <h2 class="auth-title">Accesso</h2>
        <form id="auth-form" class="auth-form" autocomplete="off">
          <input id="auth-password" type="password" class="auth-input"
            placeholder="Password" autocomplete="current-password" />
          <p id="auth-error" class="auth-error" hidden></p>
          <button type="submit" class="btn btn--primary">Entra</button>
        </form>
      </div>
    </div>

    <!-- SECRET SECTION (hidden until authenticated) -->
    <section id="secret-section" class="secret-section" hidden>
      <div class="secret-card glass-card glass-card--secret">
        <div class="secret-header">
          <span id="secret-engine-label" class="secret-engine-label">Web Speech</span>
          <button id="secret-logout" class="btn-icon" aria-label="Logout">⏏</button>
        </div>
        <button id="rec-btn" class="btn btn--rec">⏺ REC</button>
        <div id="live-transcript" class="live-transcript" aria-live="polite" aria-label="Trascrizione live"></div>
        <div class="secret-actions">
          <button id="summarize-btn" class="btn btn--primary" disabled>✦ Genera Riassunto</button>
        </div>
        <div id="summary-card" class="summary-card" hidden>
          <h3 class="summary-title">Riassunto</h3>
          <div id="summary-content" class="summary-content" contenteditable="true"
            aria-label="Riassunto editabile"></div>
          <div class="summary-actions">
            <button id="save-notion-btn" class="btn btn--primary">Salva su Notion</button>
            <span id="save-feedback" class="save-feedback" hidden></span>
          </div>
        </div>
      </div>
    </section>

  </div>
```

The full closing structure after secret section is:
```html
  </div>  <!-- .app -->

  <script type="module" src="src/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Verify in browser — page loads without errors, no visible change**

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: index.html — auth modal + secret section markup"
```

---

## Task 5: style.css — auth modal + secret section styles

**Files:**
- Modify: `src/style.css`

Append to the end of `src/style.css`:

- [ ] **Step 1: Append new styles to src/style.css**

```css
/* ── AUTH MODAL ───────────────────────────────────────── */
.auth-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.auth-modal[hidden] { display: none; }
.auth-dialog {
  position: relative;
  padding: 2rem;
  min-width: 280px;
  max-width: 360px;
  width: 90%;
}
.auth-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
}
.auth-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1.25rem;
}
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.auth-input {
  background: var(--bg-secondary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-btn);
  color: var(--text-primary);
  padding: 0.6rem 0.75rem;
  font-size: 1rem;
  outline: none;
  width: 100%;
}
.auth-input:focus { border-color: var(--accent-primary); }
.auth-error {
  font-size: 0.85rem;
  color: #f87171;
  margin: 0;
}

/* ── SECRET SECTION ───────────────────────────────────── */
.secret-section { padding: 0 1rem 1rem; }
.glass-card--secret {
  background: color-mix(in srgb, var(--glass-bg) 85%, var(--secret-tint) 15%);
  border-color: rgba(120, 0, 180, 0.2);
}
.secret-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 680px;
  margin: 0 auto;
}
.secret-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.secret-engine-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  background: rgba(120, 0, 180, 0.15);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

/* ── REC BUTTON ───────────────────────────────────────── */
.btn--rec {
  background: rgba(239, 68, 68, 0.15);
  border: 1.5px solid rgba(239, 68, 68, 0.4);
  color: #f87171;
  font-weight: 600;
  align-self: flex-start;
  transition: background 150ms ease, border-color 150ms ease;
}
.btn--rec:hover { background: rgba(239, 68, 68, 0.25); border-color: #f87171; }
.btn--rec.recording {
  background: #ef4444;
  border-color: #ef4444;
  color: #fff;
  animation: pulse-glow 1.4s ease-in-out infinite;
}

/* ── LIVE TRANSCRIPT ──────────────────────────────────── */
.live-transcript {
  min-height: 80px;
  max-height: 240px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-btn);
  padding: 0.75rem;
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--text-primary);
}
.live-transcript p { margin: 0 0 0.25rem; }
.live-transcript .interim { color: var(--text-secondary); font-style: italic; }

/* ── SUMMARY CARD ─────────────────────────────────────── */
.secret-actions { display: flex; gap: 0.5rem; }
.summary-card {
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-btn);
  padding: 1rem;
  background: rgba(0, 0, 0, 0.15);
}
.summary-title {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}
.summary-content {
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--text-primary);
  min-height: 60px;
  outline: none;
  white-space: pre-wrap;
}
.summary-content:focus { outline: 1px solid var(--accent-primary); border-radius: 4px; }
.summary-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
}
.save-feedback { font-size: 0.85rem; }
.save-feedback[hidden] { display: none; }
.save-feedback--ok { color: #4ade80; }
.save-feedback--err { color: #f87171; }
```

- [ ] **Step 2: Commit**

```bash
git add src/style.css
git commit -m "feat: style.css — auth modal, secret section, REC button, transcript styles"
```

---

## Task 6: src/secret/transcriber.js — Web Speech API engine

**Files:**
- Create: `src/secret/transcriber.js`

Wraps `SpeechRecognition` with continuous mode, interim results, and auto-reconnect on unexpected stop.

- [ ] **Step 1: Create src/secret/transcriber.js**

```js
let recognition = null;
let isRunning = false;
let onChunkCb = null;
let SRClass = null;

export const name = 'Web Speech';

export function start(onChunk) {
  SRClass = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SRClass) throw new Error('SpeechRecognition non supportato in questo browser');
  onChunkCb = onChunk;
  isRunning = true;
  startRecognition();
}

function startRecognition() {
  recognition = new SRClass();
  recognition.lang = 'it-IT';
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = e => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const text = e.results[i][0].transcript.trim();
      if (!text) continue;
      onChunkCb({ text, isFinal: e.results[i].isFinal, ts: Date.now() });
    }
  };

  recognition.onend = () => {
    if (isRunning) setTimeout(startRecognition, 300);
  };

  recognition.start();
}

export function stop() {
  isRunning = false;
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/secret/transcriber.js
git commit -m "feat: transcriber — Web Speech API with auto-reconnect"
```

---

## Task 7: Whisper engine — client + server

**Files:**
- Create: `src/secret/whisperTranscriber.js`
- Create: `api/transcribe-whisper.js`

Records 30-second audio chunks via `MediaRecorder`, sends each as base64 JSON to the serverless function, which proxies to OpenAI Whisper.

- [ ] **Step 1: Create src/secret/whisperTranscriber.js**

```js
let mediaRecorder = null;
let stream = null;
let isRunning = false;
let onChunkCb = null;

export const name = 'Whisper';

export async function start(onChunk) {
  onChunkCb = onChunk;
  isRunning = true;
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  scheduleChunk();
}

function scheduleChunk() {
  if (!isRunning) return;
  const chunks = [];
  const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
  mediaRecorder = new MediaRecorder(stream, { mimeType });
  mediaRecorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
  mediaRecorder.onstop = async () => {
    const blob = new Blob(chunks, { type: mimeType });
    if (blob.size > 500) await transcribeChunk(blob, mimeType);
    if (isRunning) scheduleChunk();
  };
  mediaRecorder.start();
  setTimeout(() => { if (mediaRecorder?.state === 'recording') mediaRecorder.stop(); }, 30000);
}

async function transcribeChunk(blob, mimeType) {
  const base64 = await blobToBase64(blob);
  try {
    const res = await fetch('/api/transcribe-whisper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio: base64, mimeType }),
    });
    const { text } = await res.json();
    if (text && onChunkCb) onChunkCb({ text: text.trim(), isFinal: true, ts: Date.now() });
  } catch { /* discard failed chunk */ }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function stop() {
  isRunning = false;
  if (mediaRecorder?.state === 'recording') mediaRecorder.stop();
  stream?.getTracks().forEach(t => t.stop());
  stream = null;
  mediaRecorder = null;
}
```

- [ ] **Step 2: Create api/transcribe-whisper.js**

```js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { audio, mimeType } = req.body || {};
  if (!audio) return res.status(400).json({ error: 'No audio' });

  const buffer = Buffer.from(audio, 'base64');
  const form = new FormData();
  form.append('file', new File([buffer], 'audio.webm', { type: mimeType || 'audio/webm' }));
  form.append('model', 'whisper-1');
  form.append('language', 'it');

  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: form,
    });
    const data = await response.json();
    res.json({ text: data.text || '' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/secret/whisperTranscriber.js api/transcribe-whisper.js
git commit -m "feat: whisper transcriber — MediaRecorder chunks + OpenAI Whisper endpoint"
```

---

## Task 8: Gemini engine — client + server

**Files:**
- Create: `src/secret/geminiTranscriber.js`
- Create: `api/transcribe-gemini.js`

Same 30-second chunk pattern as Whisper but proxies to Gemini 2.5 Flash via OpenRouter's multimodal API.

- [ ] **Step 1: Create src/secret/geminiTranscriber.js**

```js
let mediaRecorder = null;
let stream = null;
let isRunning = false;
let onChunkCb = null;

export const name = 'Gemini';

export async function start(onChunk) {
  onChunkCb = onChunk;
  isRunning = true;
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  scheduleChunk();
}

function scheduleChunk() {
  if (!isRunning) return;
  const chunks = [];
  const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
  mediaRecorder = new MediaRecorder(stream, { mimeType });
  mediaRecorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
  mediaRecorder.onstop = async () => {
    const blob = new Blob(chunks, { type: mimeType });
    if (blob.size > 500) await transcribeChunk(blob, mimeType);
    if (isRunning) scheduleChunk();
  };
  mediaRecorder.start();
  setTimeout(() => { if (mediaRecorder?.state === 'recording') mediaRecorder.stop(); }, 30000);
}

async function transcribeChunk(blob, mimeType) {
  const base64 = await blobToBase64(blob);
  try {
    const res = await fetch('/api/transcribe-gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio: base64, mimeType }),
    });
    const { text } = await res.json();
    if (text && onChunkCb) onChunkCb({ text: text.trim(), isFinal: true, ts: Date.now() });
  } catch { /* discard failed chunk */ }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function stop() {
  isRunning = false;
  if (mediaRecorder?.state === 'recording') mediaRecorder.stop();
  stream?.getTracks().forEach(t => t.stop());
  stream = null;
  mediaRecorder = null;
}
```

- [ ] **Step 2: Create api/transcribe-gemini.js**

```js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { audio, mimeType } = req.body || {};
  if (!audio) return res.status(400).json({ error: 'No audio' });

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'input_audio',
              input_audio: { data: audio, format: (mimeType || 'audio/webm').split('/')[1] },
            },
            {
              type: 'text',
              text: 'Trascrivi questo audio in italiano. Rispondi solo con la trascrizione, senza commenti o aggiunte.',
            },
          ],
        }],
      }),
    });
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    res.json({ text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/secret/geminiTranscriber.js api/transcribe-gemini.js
git commit -m "feat: gemini transcriber — MediaRecorder chunks + Gemini multimodal via OpenRouter"
```

---

## Task 9: src/secret/transcriberFactory.js — engine selector

**Files:**
- Create: `src/secret/transcriberFactory.js`

- [ ] **Step 1: Create src/secret/transcriberFactory.js**

```js
import { TRANSCRIPTION_ENGINE } from '../config.js';
import * as WebSpeechEngine from './transcriber.js';
import * as WhisperEngine from './whisperTranscriber.js';
import * as GeminiEngine from './geminiTranscriber.js';

export function transcriberFactory() {
  switch (TRANSCRIPTION_ENGINE) {
    case 'whisper': return WhisperEngine;
    case 'gemini':  return GeminiEngine;
    default:        return WebSpeechEngine;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/secret/transcriberFactory.js
git commit -m "feat: transcriberFactory — select engine from TRANSCRIPTION_ENGINE config"
```

---

## Task 10: api/summarize.js — OpenRouter summary endpoint

**Files:**
- Create: `api/summarize.js`

- [ ] **Step 1: Create api/summarize.js**

```js
const SYSTEM_PROMPT = `Sei un assistente che analizza trascrizioni di riunioni e sessioni di lavoro.
Dato il testo, produci un riassunto strutturato in italiano con queste sezioni:
- **Argomenti trattati**: elenco puntato dei temi principali
- **Decisioni prese**: elenco puntato delle decisioni (scrivi "Nessuna" se non ci sono)
- **Action items**: elenco puntato con responsabile se nominato (scrivi "Nessuno" se non ci sono)
- **Domande aperte**: domande emerse ma non risolte (scrivi "Nessuna" se non ci sono)
Rispondi solo con il riassunto in Markdown, senza premesse o testo aggiuntivo.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { transcript } = req.body || {};
  if (!transcript) return res.status(400).json({ error: 'No transcript' });

  const model = process.env.SUMMARY_MODEL || 'google/gemini-2.5-flash';

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: transcript },
        ],
      }),
    });
    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || '';
    res.json({ summary });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add api/summarize.js
git commit -m "feat: api/summarize — OpenRouter structured summary with Italian prompt"
```

---

## Task 11: api/save-to-notion.js — Notion save with 429 retry

**Files:**
- Create: `api/save-to-notion.js`

Notion text blocks have a 2000-character limit — long transcripts are split across multiple paragraph blocks. Rate limit (429) responses trigger exponential backoff up to 3 retries.

- [ ] **Step 1: Create api/save-to-notion.js**

```js
const NOTION_API = 'https://api.notion.com/v1';
const MAX_RETRIES = 3;

async function notionPost(endpoint, body, retries = 0) {
  const res = await fetch(`${NOTION_API}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify(body),
  });

  if (res.status === 429 && retries < MAX_RETRIES) {
    const delay = (parseInt(res.headers.get('retry-after') || '2', 10) + retries) * 1000;
    await new Promise(r => setTimeout(r, delay));
    return notionPost(endpoint, body, retries + 1);
  }

  return res;
}

function splitText(text, maxLen) {
  const chunks = [];
  for (let i = 0; i < text.length; i += maxLen) chunks.push(text.slice(i, i + maxLen));
  return chunks.length ? chunks : [''];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { transcript, summary, duration } = req.body || {};
  if (!transcript) return res.status(400).json({ error: 'No transcript' });

  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!databaseId) return res.status(500).json({ error: 'NOTION_DATABASE_ID not configured' });

  const now = new Date();
  const title = `Sessione ${now.toLocaleDateString('it-IT')} ${now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;

  const children = [
    summary && {
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: [{ type: 'text', text: { content: summary.slice(0, 2000) } }],
        icon: { emoji: '🤖' },
        color: 'purple_background',
      },
    },
    {
      object: 'block',
      type: 'heading_2',
      heading_2: { rich_text: [{ type: 'text', text: { content: 'Trascrizione' } }] },
    },
    ...splitText(transcript, 2000).map(chunk => ({
      object: 'block',
      type: 'paragraph',
      paragraph: { rich_text: [{ type: 'text', text: { content: chunk } }] },
    })),
    duration && {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{
          type: 'text',
          text: { content: `Durata: ${Math.round(duration / 60000)} min` },
          annotations: { color: 'gray' },
        }],
      },
    },
  ].filter(Boolean);

  try {
    const response = await notionPost('/pages', {
      parent: { database_id: databaseId },
      properties: {
        title: { title: [{ type: 'text', text: { content: title } }] },
      },
      children,
    });
    const data = await response.json();
    if (data.object === 'error') return res.status(500).json({ error: data.message });
    res.json({ ok: true, pageId: data.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add api/save-to-notion.js
git commit -m "feat: api/save-to-notion — Notion page creation with 429 retry"
```

---

## Task 12: src/secret/secretUI.js — full secret section UI

**Files:**
- Create: `src/secret/secretUI.js`

Owns all DOM interaction inside `#secret-section`: REC toggle, live transcript rendering (final + interim chunks), summary generation loader, editable summary card, Notion save with feedback.

- [ ] **Step 1: Create src/secret/secretUI.js**

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add src/secret/secretUI.js
git commit -m "feat: secretUI — REC, live transcript, summary generation, Notion save, logout"
```

---

## Task 13: src/app.js — wire auth + secret section

**Files:**
- Modify: `src/app.js`

- [ ] **Step 1: Replace src/app.js**

```js
import { initFrequencyPanel } from './components/frequencyPanel.js';
import { initTrackPanel } from './components/trackPanel.js';
import { initSettingsPanel } from './components/settingsPanel.js';
import { initPomodoroTimer, reloadPomodoroSettings } from './components/pomodoroTimer.js';
import { initAuth } from './secret/auth.js';
import { initSecretUI } from './secret/secretUI.js';
import * as audioMixer from './audio/audioMixer.js';

// ── TAB SWITCHER ─────────────────────────────────────────
function initTabSwitcher() {
  const buttons = document.querySelectorAll('[data-tab-btn]');
  const panels = document.querySelectorAll('[data-tab-panel]');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tabBtn;
      buttons.forEach(b => b.classList.toggle('active', b === btn));
      panels.forEach(p => p.classList.toggle('active', p.dataset.tabPanel === target));
    });
  });
}

// ── MASTER VOLUME ─────────────────────────────────────────
function initMasterVolume() {
  const slider = document.getElementById('master-vol');
  if (!slider) return;
  slider.addEventListener('input', () => {
    audioMixer.setMasterVolume(slider.value);
  });
}

// ── VU METER ──────────────────────────────────────────────
function initVuMeter() {
  const canvas = document.getElementById('vu-meter');
  if (!canvas) return;
  const ctx2d = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  function draw() {
    requestAnimationFrame(draw);
    const analyser = audioMixer.getAnalyser();
    if (!analyser) {
      ctx2d.clearRect(0, 0, W, H);
      return;
    }
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
    const pct = avg / 255;

    ctx2d.clearRect(0, 0, W, H);
    const grad = ctx2d.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0,   '#4fc3f7');
    grad.addColorStop(0.6, '#7c6af7');
    grad.addColorStop(1,   '#f87171');
    ctx2d.fillStyle = grad;
    ctx2d.fillRect(0, 0, W * pct, H);
  }
  draw();
}

// ── ENTRY POINT ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTabSwitcher();
  initFrequencyPanel();
  initTrackPanel();
  initMasterVolume();
  initVuMeter();
  initPomodoroTimer();
  initSettingsPanel(reloadPomodoroSettings);
  initAuth(initSecretUI);
});
```

- [ ] **Step 2: Verify in browser**

Open `http://localhost:3000`. Check:
- Page loads with no JS errors
- Five rapid clicks on the ◈ logo opens the auth modal
- Closing the modal (X or backdrop click) works
- Public section (frequencies, tracks, pomodoro) still fully functional

Note: The auth form submit will fail locally with a network error (no `/api/check-auth` endpoint running). This is expected — the full flow requires Vercel deployment or a local Vercel dev server (`npx vercel dev`).

- [ ] **Step 3: Commit**

```bash
git add src/app.js
git commit -m "feat: app.js — wire initAuth + initSecretUI"
```

---

## End-to-End Verification (requires deployed Vercel environment)

- [ ] Set `APP_PASSWORD_HASH` in Vercel env vars (generate with browser console snippet from CLAUDE.md)
- [ ] Five clicks on logo → modal appears
- [ ] Wrong password → "Password errata." shown
- [ ] Correct password → modal closes, secret section appears with engine label
- [ ] Click REC → button turns red and pulses, transcript starts appearing
- [ ] Click Stop → button resets, "Genera Riassunto" becomes active
- [ ] Click "Genera Riassunto" → loader appears, summary card shows
- [ ] Summary is editable before saving
- [ ] Click "Salva su Notion" → "✓ Salvato su Notion" confirmation
- [ ] Click ⏏ → secret section hidden, session cleared
- [ ] Reload → public section shown, five clicks re-prompts password

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

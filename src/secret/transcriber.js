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

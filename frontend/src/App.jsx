import { useState, useEffect } from 'react';
import Dropzone from './components/Dropzone';
import Options from './components/Options';
import Progress from './components/Progress';
import TranscriptionResult from './components/TranscriptionResult';
import History from './components/History';
import {
  getTranscriptions,
  saveTranscription,
  deleteTranscription,
} from './utils/localStorage';

function App() {
  const [file, setFile] = useState(null);
  const [transcribing, setTranscribing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  const [transcriptions, setTranscriptions] = useState([]);
  const [error, setError] = useState('');

  // Carica trascrizioni all'avvio
  useEffect(() => {
    setTranscriptions(getTranscriptions());
  }, []);

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    setResult(null);
    setError('');
  };

  const handleTranscribe = async (options) => {
    if (!file) return;

    setTranscribing(true);
    setProgress(0);
    setStatus('Caricamento file...');
    setError('');

    try {
      // Prepara FormData
      const formData = new FormData();
      formData.append('audioFile', file);
      formData.append('language', options.language);

      setProgress(10);
      setStatus('Invio a OpenAI Whisper...');

      // Chiamata API
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      setProgress(50);
      setStatus('Elaborazione trascrizione...');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore durante la trascrizione');
      }

      const data = await response.json();

      setProgress(90);
      setStatus('Salvataggio...');

      // Salva in localStorage
      const savedTranscription = saveTranscription({
        filename: file.name,
        text: data.text,
        language: options.language,
        duration: data.duration,
        segments: data.segments,
      });

      setProgress(100);
      setStatus('Completato!');
      setResult(data);

      // Aggiorna lista
      setTranscriptions(getTranscriptions());

      // Reset dopo 1 secondo
      setTimeout(() => {
        setStatus('');
        setProgress(0);
      }, 1000);
    } catch (err) {
      console.error('Errore trascrizione:', err);
      setError(err.message);
      setStatus('');
      setProgress(0);
    } finally {
      setTranscribing(false);
    }
  };

  const handleCopy = () => {
    if (result?.text) {
      navigator.clipboard.writeText(result.text);
      alert('Testo copiato negli appunti!');
    }
  };

  const handleDownload = () => {
    if (result?.text) {
      const blob = new Blob([result.text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace(/\.[^/.]+$/, '')}_trascrizione.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError('');
    setStatus('');
    setProgress(0);
  };

  const handleDelete = (id) => {
    if (confirm('Eliminare questa trascrizione?')) {
      deleteTranscription(id);
      setTranscriptions(getTranscriptions());
    }
  };

  const handleView = (transcription) => {
    setResult({
      text: transcription.text,
      duration: transcription.duration,
      language: transcription.language,
    });
    setFile({ name: transcription.filename });
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🎙️ Whisper Transcription</h1>
        <p className="subtitle">Trascrizione audio con OpenAI Whisper</p>
      </header>

      <main className="main">
        {error && (
          <div className="error-message">
            <strong>Errore:</strong> {error}
          </div>
        )}

        {!result && (
          <>
            <Dropzone onFileSelect={handleFileSelect} disabled={transcribing} />
            <Options
              file={file}
              onTranscribe={handleTranscribe}
              disabled={transcribing}
            />
          </>
        )}

        <Progress status={status} progress={progress} />

        <TranscriptionResult
          text={result?.text}
          onCopy={handleCopy}
          onDownload={handleDownload}
          onReset={handleReset}
        />

        <History
          transcriptions={transcriptions}
          onDelete={handleDelete}
          onView={handleView}
        />
      </main>

      <footer className="footer">
        <p>Powered by OpenAI Whisper-1</p>
      </footer>
    </div>
  );
}

export default App;

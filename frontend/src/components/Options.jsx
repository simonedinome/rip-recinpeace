import { useState, useEffect } from 'react';

const Options = ({ file, onTranscribe, disabled }) => {
  const [language, setLanguage] = useState('it');
  const [includeTiming, setIncludeTiming] = useState(true);

  // Stima costo (esempio: $0.006/minute per Whisper)
  const [estimatedCost, setEstimatedCost] = useState(0);

  useEffect(() => {
    if (file) {
      // Stima durata approssimativa basata su dimensione file
      // (circa 1MB per minuto di audio mp3)
      const estimatedMinutes = file.size / (1024 * 1024);
      setEstimatedCost((estimatedMinutes * 0.006).toFixed(3));
    }
  }, [file]);

  const handleTranscribe = () => {
    onTranscribe({ language, includeTiming });
  };

  if (!file) {
    return null;
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="options">
      <div className="file-info">
        <h3>File selezionato</h3>
        <p className="file-name">{file.name}</p>
        <p className="file-size">{formatFileSize(file.size)}</p>
      </div>

      <div className="options-grid">
        <div className="option-group">
          <label htmlFor="language">Lingua</label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={disabled}
          >
            <option value="it">Italiano</option>
            <option value="en">Inglese</option>
          </select>
        </div>

        <div className="option-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={includeTiming}
              onChange={(e) => setIncludeTiming(e.target.checked)}
              disabled={disabled}
            />
            <span>Aggiungi timing ai paragrafi</span>
          </label>
        </div>

        <div className="option-group">
          <p className="cost-estimate">
            Costo stimato: ${estimatedCost}
          </p>
        </div>
      </div>

      <button
        className="btn-primary"
        onClick={handleTranscribe}
        disabled={disabled}
      >
        {disabled ? 'Trascrizione in corso...' : 'Inizia trascrizione'}
      </button>
    </div>
  );
};

export default Options;

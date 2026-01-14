const TranscriptionResult = ({ text, onCopy, onDownload, onReset }) => {
  if (!text) return null;

  return (
    <div className="result-container">
      <div className="result-header">
        <h3>Trascrizione completata</h3>
        <div className="result-actions">
          <button className="btn-secondary" onClick={onCopy}>
            📋 Copia
          </button>
          <button className="btn-secondary" onClick={onDownload}>
            💾 Scarica TXT
          </button>
          <button className="btn-secondary" onClick={onReset}>
            🔄 Nuova trascrizione
          </button>
        </div>
      </div>
      <div className="result-text">
        <pre>{text}</pre>
      </div>
    </div>
  );
};

export default TranscriptionResult;

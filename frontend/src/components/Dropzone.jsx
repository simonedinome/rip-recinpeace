import { useState } from 'react';

const Dropzone = ({ onFileSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file) => {
    // Validazione tipo file
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/m4a', 'audio/wav', 'audio/x-m4a'];
    const allowedExts = ['.mp3', '.m4a', '.wav'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
      alert('Formato file non supportato. Usa mp3, m4a o wav.');
      return;
    }

    // Validazione dimensione (25MB)
    if (file.size > 25 * 1024 * 1024) {
      alert('File troppo grande. Massimo 25MB.');
      return;
    }

    onFileSelect(file);
  };

  return (
    <div className={`dropzone ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
         onDragOver={handleDragOver}
         onDragLeave={handleDragLeave}
         onDrop={handleDrop}>
      <input
        type="file"
        id="fileInput"
        accept=".mp3,.m4a,.wav,audio/mpeg,audio/mp3,audio/m4a,audio/wav"
        onChange={handleFileInput}
        disabled={disabled}
        style={{ display: 'none' }}
      />
      <label htmlFor="fileInput" className="dropzone-label">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p className="dropzone-title">
          {disabled ? 'Trascrizione in corso...' : 'Trascina un file audio qui'}
        </p>
        <p className="dropzone-subtitle">
          oppure clicca per selezionare
        </p>
        <p className="dropzone-info">
          Formati: mp3, m4a, wav • Max 25MB
        </p>
      </label>
    </div>
  );
};

export default Dropzone;

const History = ({ transcriptions, onDelete, onView }) => {
  if (!transcriptions || transcriptions.length === 0) {
    return null;
  }

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="history-container">
      <h3>Trascrizioni precedenti</h3>
      <div className="history-list">
        {transcriptions.map((t) => (
          <div key={t.id} className="history-item">
            <div className="history-item-content">
              <p className="history-filename">{t.filename}</p>
              <p className="history-meta">
                {formatDate(t.createdAt)} • {t.language.toUpperCase()}
                {t.duration && ` • ${formatDuration(t.duration)}`}
              </p>
            </div>
            <div className="history-item-actions">
              <button
                className="btn-icon"
                onClick={() => onView(t)}
                title="Visualizza"
              >
                👁️
              </button>
              <button
                className="btn-icon"
                onClick={() => onDelete(t.id)}
                title="Elimina"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default History;

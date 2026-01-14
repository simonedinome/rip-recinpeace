const Progress = ({ status, progress }) => {
  if (!status) return null;

  return (
    <div className="progress-container">
      <div className="progress-status">
        <span>{status}</span>
        <span className="progress-percentage">{progress}%</span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default Progress;

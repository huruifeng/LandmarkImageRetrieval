export default function ResultCard({ rank, filename, label, similarity, queryLabel }) {
  const pct     = (similarity * 100).toFixed(1);
  const correct = queryLabel !== undefined && label === queryLabel;

  return (
    <div className={`result-card ${correct ? "result-card--correct" : ""}`}>
      <div className="result-rank">#{rank}</div>
      {correct && <div className="result-match-badge">✓</div>}
      <img
        src={`/images/${filename}`}
        alt={filename}
        className="result-img"
        loading="lazy"
        onError={(e) => { e.target.style.opacity = "0.3"; }}
      />
      <div className="result-info">
        <div className="result-filename" title={filename}>{filename}</div>
        <div className="result-meta">
          <span className="sim-bar-wrap">
            <span className="sim-bar" style={{ width: `${pct}%` }} />
          </span>
          <span className="sim-value">{pct}%</span>
        </div>
        <div className="result-label">Class {label}</div>
      </div>
    </div>
  );
}

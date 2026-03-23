import useRetrievalStore from "../store/useRetrievalStore";
import ResultCard from "./ResultCard";

export default function ResultsPanel() {
  const {
    selected, selectedLabel, selectedClassTotal,
    topN, results, loading, error,
    setTopN, runRetrieval,
  } = useRetrievalStore();

  if (!selected) {
    return (
      <main className="right-panel">
        <div className="empty-state">
          <div className="empty-icon" style={{ fontSize: "200px" }}>
            🗺
          </div>
          <p>Select a validation image on the left to retrieve similar landmarks.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="right-panel">
      <div className="query-section">
        <div className="query-image-wrap">
          <img src={`/images/${selected}`} alt={selected} className="query-image" />
          <p className="query-label">{selected}</p>
          <p className="query-class">Class {selectedLabel}</p>
          <p className="query-class-total">{selectedClassTotal} training images in this class</p>
        </div>

        <div className="controls">
          <label className="control-label">
            Top-N results
            <input
              type="number"
              min={1}
              max={50}
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
              className="topn-input"
            />
          </label>
          <button className="retrieve-btn" onClick={runRetrieval} disabled={loading}>
            {loading ? "Retrieving…" : "Retrieve"}
          </button>
        </div>
      </div>

      {error && <p className="error-msg">{error}</p>}

      {results && (
        <div className="results-section">
          <div className="results-header">
            <h3 className="results-title">Top {results.results.length} matches</h3>
            <div className="match-stats">
              <span className="match-count">
                {results.matched_count} / {results.db_class_total} correct
              </span>
              <span className="match-rate">
                ({(results.match_rate * 100).toFixed(1)}% of class retrieved)
              </span>
            </div>
          </div>
          <div className="results-grid">
            {results.results.map((r) => (
              <ResultCard key={r.rank} queryLabel={selectedLabel} {...r} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

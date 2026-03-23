import { useState, useEffect, useCallback } from "react";
import "./App.css";

const PAGE_SIZE = 30;
const API = "";  // proxied by Vite

export default function App() {
  const [valImages, setValImages]     = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [search, setSearch]           = useState("");
  const [page, setPage]               = useState(0);
  const [selected, setSelected]       = useState(null);
  const [topN, setTopN]               = useState(5);
  const [results, setResults]         = useState(null);
  const [loading, setLoading]         = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError]             = useState(null);

  // Fetch val image list on mount
  useEffect(() => {
    fetch(`${API}/api/val-images`)
      .then((r) => r.json())
      .then((data) => {
        setValImages(data.filenames);
        setFiltered(data.filenames);
      })
      .catch(() => setError("Cannot reach backend. Is the FastAPI server running?"))
      .finally(() => setInitLoading(false));
  }, []);

  // Filter by search
  useEffect(() => {
    const q = search.trim().toLowerCase();
    const f = q ? valImages.filter((fn) => fn.toLowerCase().includes(q)) : valImages;
    setFiltered(f);
    setPage(0);
  }, [search, valImages]);

  const handleSelect = useCallback((filename) => {
    setSelected(filename);
    setResults(null);
  }, []);

  const handleRetrieve = useCallback(async () => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/retrieve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: selected, top_n: topN }),
      });
      if (!res.ok) throw new Error(await res.text());
      setResults(await res.json());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [selected, topN]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="layout">
      {/* ── Left panel ── */}
      <aside className="left-panel">
        <div className="panel-header">
          <h2>Validation Images</h2>
          <span className="badge">{filtered.length}</span>
        </div>

        <input
          className="search-box"
          type="text"
          placeholder="Search filename…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {initLoading && <p className="hint">Loading images…</p>}

        <div className="thumb-grid">
          {pageItems.map((fn) => (
            <button
              key={fn}
              className={`thumb-btn ${selected === fn ? "active" : ""}`}
              onClick={() => handleSelect(fn)}
              title={fn}
            >
              <img
                src={`/images/${fn}`}
                alt={fn}
                loading="lazy"
                onError={(e) => { e.target.style.opacity = "0.3"; }}
              />
              <span className="thumb-label">{fn.slice(0, 12)}…</span>
            </button>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button onClick={() => setPage(0)} disabled={page === 0}>«</button>
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>‹</button>
            <span>{page + 1} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>›</button>
            <button onClick={() => setPage(totalPages - 1)} disabled={page === totalPages - 1}>»</button>
          </div>
        )}
      </aside>

      {/* ── Right panel ── */}
      <main className="right-panel">
        {!selected ? (
          <div className="empty-state">
            <div className="empty-icon">🗺</div>
            <p>Select a validation image on the left to retrieve similar landmarks.</p>
          </div>
        ) : (
          <>
            {/* Query image + controls */}
            <div className="query-section">
              <div className="query-image-wrap">
                <img src={`/images/${selected}`} alt={selected} className="query-image" />
                <p className="query-label">Query: {selected}</p>
              </div>

              <div className="controls">
                <label className="control-label">
                  Top-N results
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={topN}
                    onChange={(e) => setTopN(Math.max(1, Math.min(50, Number(e.target.value))))}
                    className="topn-input"
                  />
                </label>
                <button
                  className="retrieve-btn"
                  onClick={handleRetrieve}
                  disabled={loading}
                >
                  {loading ? "Retrieving…" : "Retrieve"}
                </button>
              </div>
            </div>

            {error && <p className="error-msg">{error}</p>}

            {/* Results */}
            {results && (
              <div className="results-section">
                <h3 className="results-title">Top {results.results.length} matches</h3>
                <div className="results-grid">
                  {results.results.map((r) => (
                    <div key={r.rank} className="result-card">
                      <div className="result-rank">#{r.rank}</div>
                      <img
                        src={`/images/${r.filename}`}
                        alt={r.filename}
                        className="result-img"
                        loading="lazy"
                        onError={(e) => { e.target.style.opacity = "0.3"; }}
                      />
                      <div className="result-info">
                        <div className="result-filename" title={r.filename}>{r.filename}</div>
                        <div className="result-meta">
                          <span className="sim-bar-wrap">
                            <span
                              className="sim-bar"
                              style={{ width: `${(r.similarity * 100).toFixed(0)}%` }}
                            />
                          </span>
                          <span className="sim-value">{(r.similarity * 100).toFixed(1)}%</span>
                        </div>
                        <div className="result-label">Class {r.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

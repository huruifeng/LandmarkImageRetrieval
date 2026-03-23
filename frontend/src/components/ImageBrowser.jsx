import { useEffect } from "react";
import useRetrievalStore from "../store/useRetrievalStore";
import Pagination from "./Pagination";

const PAGE_SIZE = 30;

export default function ImageBrowser() {
  const {
    backendStatus, backendProgress, backendMessage,
    filtered, search, page, selected,
    init, setSearch, setPage, selectImage,
  } = useRetrievalStore();

  useEffect(() => { init(); }, [init]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const isReady    = backendStatus === "ready";

  return (
    <aside className="left-panel">
      <div className="panel-header">
        <h2>Validation Images</h2>
        {isReady && <span className="badge">{filtered.length}</span>}
      </div>

      {!isReady ? (
        <div className="status-box">
          <p className="status-message">{backendMessage}</p>
          {backendProgress > 0 && (
            <>
              <div className="status-bar-wrap">
                <div className="status-bar" style={{ width: `${backendProgress}%` }} />
              </div>
              <p className="status-pct">{backendProgress}%</p>
            </>
          )}
        </div>
      ) : (
        <>
          <input
            className="search-box"
            type="text"
            placeholder="Search filename…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="thumb-grid">
            {pageItems.map(({ filename, label, db_class_total }) => (
              <button
                key={filename}
                className={`thumb-btn ${selected === filename ? "active" : ""}`}
                onClick={() => selectImage(filename, label, db_class_total)}
                title={`${filename}\nClass ${label} · ${db_class_total} training images`}
              >
                <img
                  src={`/images/${filename}`}
                  alt={filename}
                  loading="lazy"
                  onError={(e) => { e.target.style.opacity = "0.3"; }}
                />
                <span className="thumb-label">{filename.slice(0, 12)}…</span>
              </button>
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </>
      )}
    </aside>
  );
}

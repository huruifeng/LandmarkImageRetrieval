export default function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <button onClick={() => onPage(0)} disabled={page === 0}>«</button>
      <button onClick={() => onPage(page - 1)} disabled={page === 0}>‹</button>
      <span>{page + 1} / {totalPages}</span>
      <button onClick={() => onPage(page + 1)} disabled={page === totalPages - 1}>›</button>
      <button onClick={() => onPage(totalPages - 1)} disabled={page === totalPages - 1}>»</button>
    </div>
  );
}

export default function ReportPagination({ pagination, page, onPageChange, itemLabel = "results" }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4 text-sm">
      <span className="text-faint">
        Page {pagination.page} of {pagination.totalPages} · {pagination.total} {itemLabel}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          className="pill !py-1 !px-3 text-xs disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          className="pill !py-1 !px-3 text-xs disabled:opacity-40"
          disabled={page >= pagination.totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

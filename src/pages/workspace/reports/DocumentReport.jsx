import { useCallback, useEffect, useState } from "react";
import { FileStack, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { reportsApi } from "../../../lib";
import { SkeletonList } from "../../../components/workspace/common/Skeleton";
import ErrorState from "../../../components/workspace/common/ErrorState";
import EmptyState from "../../../components/workspace/common/EmptyState";
import { formatTimestamp, formatFileSize } from "../../../utils/date";
import { DOCUMENT_STATUS_BADGE, DOCUMENT_STATUS_LABEL, DOCUMENT_STATUSES, badgeFor, labelFor } from "../../../utils/reportsConstants";
import ReportPageHeader from "./components/ReportPageHeader";
import ReportPagination from "./components/ReportPagination";
import ExportButton from "./components/ExportButton";
import StatCardsGrid from "./components/StatCardsGrid";

export default function DocumentReport() {
  const [documents, setDocuments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [department, setDepartment] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filters = {
    department: department || undefined,
    category: category || undefined,
    status: status || undefined,
    page,
    pageSize: 15,
  };

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    reportsApi
      .getDocumentReport(filters)
      .then((res) => {
        setDocuments(res.documents || []);
        setSummary(res.summary || null);
        setPagination(res.pagination || null);
      })
      .catch((err) => setError(err.response?.data?.error || "Couldn't load the document report."))
      .finally(() => setLoading(false));
  }, [department, category, status, page]);

  useEffect(() => { load(); }, [load]);

  const statCards = summary
    ? [
        { key: "total", icon: FileStack, label: "Total", value: summary.total, tone: "primary" },
        { key: "approved", icon: CheckCircle2, label: "Approved", value: summary.approved, tone: "mint" },
        { key: "pending", icon: Clock3, label: "Pending", value: summary.pending, tone: "amber" },
        { key: "rejected", icon: XCircle, label: "Rejected", value: summary.rejected, tone: "coral" },
      ]
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 space-y-5">
      <ReportPageHeader
        icon={FileStack}
        title="Document Report"
        description="Uploaded documents by category, status, and owner."
        actions={<ExportButton type="documents" filters={filters} />}
      />

      {!loading && !error && <StatCardsGrid cards={statCards} />}

      <div className="card card-pad space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            className="input-field w-40"
            placeholder="Department"
            value={department}
            onChange={(e) => { setPage(1); setDepartment(e.target.value); }}
          />
          <input
            className="input-field w-40"
            placeholder="Category"
            value={category}
            onChange={(e) => { setPage(1); setCategory(e.target.value); }}
          />
          <select className="input-field w-40" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="">All statuses</option>
            {DOCUMENT_STATUSES.map((s) => <option key={s} value={s}>{DOCUMENT_STATUS_LABEL[s]}</option>)}
          </select>
        </div>

        {loading && <SkeletonList rows={8} />}
        {!loading && error && <ErrorState description={error} onRetry={load} />}
        {!loading && !error && documents.length === 0 && (
          <EmptyState icon={FileStack} title="No documents match these filters" />
        )}

        {!loading && !error && documents.length > 0 && (
          <>
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-faint text-xs uppercase tracking-wide">
                    <th className="px-2 py-2 font-medium">Title</th>
                    <th className="px-2 py-2 font-medium">Owner</th>
                    <th className="px-2 py-2 font-medium">Category</th>
                    <th className="px-2 py-2 font-medium">Uploaded</th>
                    <th className="px-2 py-2 font-medium">Size</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((d) => (
                    <tr key={d.id} className="border-t border-line">
                      <td className="px-2 py-3 font-medium text-ink whitespace-nowrap max-w-xs truncate">{d.title}</td>
                      <td className="px-2 py-3 text-muted whitespace-nowrap">{d.employee?.name || "—"}</td>
                      <td className="px-2 py-3 text-muted whitespace-nowrap">{d.category || "—"}</td>
                      <td className="px-2 py-3 text-muted whitespace-nowrap">{formatTimestamp(d.uploadedAt)}</td>
                      <td className="px-2 py-3 text-muted whitespace-nowrap">{d.fileSize ? formatFileSize(d.fileSize) : "—"}</td>
                      <td className="px-2 py-3">
                        <span className={badgeFor(DOCUMENT_STATUS_BADGE, d.status)}>{labelFor(DOCUMENT_STATUS_LABEL, d.status)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ReportPagination pagination={pagination} page={page} onPageChange={setPage} itemLabel="documents" />
          </>
        )}
      </div>
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { SlidersHorizontal, Play } from "lucide-react";
import toast from "react-hot-toast";
import { reportsApi } from "../../../lib";
import { SkeletonList } from "../../../components/workspace/common/Skeleton";
import ErrorState from "../../../components/workspace/common/ErrorState";
import EmptyState from "../../../components/workspace/common/EmptyState";
import ReportPageHeader from "./components/ReportPageHeader";
import DateRangeFilter from "./components/DateRangeFilter";
import ExportButton from "./components/ExportButton";


function getNested(obj, path) {
  return path.split(".").reduce((acc, key) => (acc === null || acc === undefined ? acc : acc[key]), obj);
}

function formatCell(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return getNested(value, "name") ?? "—";
  return String(value);
}

export default function CustomReport() {
  const [categories, setCategories] = useState([]);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState(null);

  const [category, setCategory] = useState("");
  const [selectedFields, setSelectedFields] = useState([]);

  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [range, setRange] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState(null);
  const [hasRun, setHasRun] = useState(false);

  
  useEffect(() => {
    setMetaLoading(true);
    reportsApi
      .getCustomReportMeta()
      .then((res) => {
        setCategories(res.categories || []);
        if (res.categories?.length) {
          setCategory(res.categories[0].key);
          setSelectedFields(res.categories[0].fields.map((f) => f.key));
        }
      })
      .catch((err) => setMetaError(err.response?.data?.error || "Couldn't load report categories."))
      .finally(() => setMetaLoading(false));
  }, []);

  const activeCategory = categories.find((c) => c.key === category);

  function handleCategoryChange(key) {
    setCategory(key);
    const cat = categories.find((c) => c.key === key);
    setSelectedFields(cat ? cat.fields.map((f) => f.key) : []);
    setPage(1);
    setHasRun(false);
    setRows([]);
    setColumns([]);
  }

  function toggleField(key) {
    setSelectedFields((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  const filters = {
    department: department || undefined,
    status: status || undefined,
    range: from || to ? undefined : range || undefined,
    from: from || undefined,
    to: to || undefined,
  };

  const runReport = useCallback((targetPage = page) => {
    if (!category) return;
    setRunning(true);
    setRunError(null);
    reportsApi
      .runCustomReport({ category, fields: selectedFields, filters, page: targetPage, pageSize })
      .then((res) => {
        setColumns(res.columns || []);
        setRows(res.rows || []);
        setHasRun(true);
      })
      .catch((err) => {
        setRunError(err.response?.data?.error || "Couldn't run this report.");
        toast.error(err.response?.data?.error || "Couldn't run this report.");
      })
      .finally(() => setRunning(false));
    
  }, [category, selectedFields, department, status, range, from, to, page]);

  function handleRunClick() {
    setPage(1);
    runReport(1);
  }

  function goToPage(next) {
    setPage(next);
    runReport(next);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 space-y-5">
      <ReportPageHeader
        icon={SlidersHorizontal}
        title="Custom Report"
        description="Pick a category, choose columns, apply filters, and run."
        actions={hasRun && !runError ? <ExportButton type={category} filters={filters} /> : null}
      />

      {metaLoading && <div className="card card-pad"><SkeletonList rows={4} /></div>}
      {!metaLoading && metaError && <ErrorState description={metaError} />}

      {!metaLoading && !metaError && categories.length > 0 && (
        <>
          <div className="card card-pad space-y-4">
            
            <div>
              <label className="field-label">Report category</label>
              <select
                className="input-field mt-1 w-full sm:w-64"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                {categories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>

            
            {activeCategory && (
              <div>
                <label className="field-label">Columns</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {activeCategory.fields.map((f) => (
                    <label
                      key={f.key}
                      className={`inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                        selectedFields.includes(f.key)
                          ? "bg-primary-50 border-primary-200 text-primary-700"
                          : "bg-white border-line text-muted hover:border-primary-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={selectedFields.includes(f.key)}
                        onChange={() => toggleField(f.key)}
                      />
                      {f.label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="field-label">Filters</label>
              <div className="flex flex-wrap gap-3 mt-2 items-center">
                <input
                  className="input-field w-40"
                  placeholder="Department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
                <input
                  className="input-field w-40"
                  placeholder="Status (e.g. APPROVED)"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                />
                <DateRangeFilter range={range} from={from} to={to} onChange={(v) => { setRange(v.range); setFrom(v.from); setTo(v.to); }} />
              </div>
            </div>

            <div>
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={handleRunClick}
                disabled={running || selectedFields.length === 0}
              >
                <Play size={14} /> {running ? "Running…" : "Run report"}
              </button>
            </div>
          </div>

          {running && <div className="card card-pad"><SkeletonList rows={6} /></div>}
          {!running && runError && <div className="card card-pad"><ErrorState description={runError} onRetry={() => runReport(page)} /></div>}

          {!running && !runError && hasRun && rows.length === 0 && (
            <div className="card card-pad"><EmptyState icon={SlidersHorizontal} title="No rows match these filters" /></div>
          )}

          {!running && !runError && hasRun && rows.length > 0 && (
            <div className="card card-pad space-y-4">
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-faint text-xs uppercase tracking-wide">
                      {columns.map((c) => <th key={c.key} className="px-2 py-2 font-medium whitespace-nowrap">{c.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={row.id || i} className="border-t border-line">
                        {columns.map((c) => (
                          <td key={c.key} className="px-2 py-3 text-muted whitespace-nowrap">{formatCell(getNested(row, c.key))}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-faint">Page {page} · {rows.length} rows shown</span>
                <div className="flex gap-2">
                  <button className="pill !py-1 !px-3 text-xs disabled:opacity-40" disabled={page <= 1 || running} onClick={() => goToPage(page - 1)}>
                    Previous
                  </button>
                  <button className="pill !py-1 !px-3 text-xs disabled:opacity-40" disabled={rows.length < pageSize || running} onClick={() => goToPage(page + 1)}>
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {!metaLoading && !metaError && categories.length === 0 && (
        <div className="card card-pad"><EmptyState icon={SlidersHorizontal} title="No report categories available" /></div>
      )}
    </div>
  );
}

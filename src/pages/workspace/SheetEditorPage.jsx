import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, ArrowLeft, RefreshCw, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { sheetsApi } from "../../lib/docsApi";
import ErrorState from "../../components/workspace/common/ErrorState";

const DEFAULT_ROWS = 20;
const DEFAULT_COLS = 8;

function makeGrid(rows = DEFAULT_ROWS, cols = DEFAULT_COLS) {
  return Array.from({ length: rows }, () => Array(cols).fill(""));
}

function parseGrid(cellsJson) {
  if (!cellsJson) return makeGrid();
  try {
    const parsed = JSON.parse(cellsJson);
    if (Array.isArray(parsed?.grid)) return parsed.grid;
  } catch {
  }
  return makeGrid();
}

export default function SheetEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sheet, setSheet] = useState(null);
  const [title, setTitle] = useState("Untitled spreadsheet");
  const [grid, setGrid] = useState(makeGrid());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    sheetsApi.getSheet(id)
      .then((data) => {
        setSheet(data);
        setTitle(data.name || "Untitled spreadsheet");
        setGrid(parseGrid(data.cells));
      })
      .catch(() => {
        setError("Couldn't load this spreadsheet.");
        toast.error("Couldn't load spreadsheet");
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function updateCell(row, col, value) {
    setGrid((prev) => {
      const next = prev.map((r) => [...r]);
      next[row][col] = value;
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const requests = [
        sheetsApi.updateSheetContent(id, { cells: JSON.stringify({ grid }) }),
      ];
      if (title.trim() && title !== sheet?.name) {
        requests.push(sheetsApi.renameSheet(id, title.trim()));
      }
      await Promise.all(requests);
      toast.success("Spreadsheet saved");
    } catch { toast.error("Couldn't save spreadsheet"); }
    finally { setSaving(false); }
  }

  const COLS = Array.from({ length: grid[0]?.length || DEFAULT_COLS }, (_, i) =>
    String.fromCharCode(65 + i)
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-line bg-surface">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-sm">
          <ArrowLeft size={16} /> Back
        </button>
        <input
          className="flex-1 font-display font-bold text-lg text-ink bg-transparent border-none outline-none"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled spreadsheet"
        />
        <button onClick={handleSave} disabled={saving || loading} className="btn-primary btn-sm">
          {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-muted p-6"><RefreshCw size={16} className="animate-spin" /> Loading…</div>
      )}
      {!loading && error && <div className="p-6"><ErrorState description={error} onRetry={load} /></div>}
      {!loading && !error && (
        <div className="flex-1 overflow-auto">
          <table className="border-collapse text-sm min-w-max">
            <thead>
              <tr>
                <th className="w-10 bg-canvas border border-line text-faint text-xs font-medium px-2 py-1.5 sticky top-0 left-0 z-20" />
                {COLS.map((c) => (
                  <th key={c} className="bg-canvas border border-line text-faint text-xs font-semibold px-4 py-1.5 min-w-[120px] sticky top-0 z-10 text-center">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map((row, ri) => (
                <tr key={ri}>
                  <td className="bg-canvas border border-line text-faint text-xs font-medium text-center px-2 py-1 sticky left-0 z-10 w-10">
                    {ri + 1}
                  </td>
                  {row.map((cell, ci) => (
                    <td key={ci} className="border border-line p-0">
                      <input
                        className="w-full h-full px-2 py-1.5 text-sm text-ink bg-transparent outline-none focus:bg-primary-50 focus:ring-1 focus:ring-primary-300"
                        value={cell}
                        onChange={(e) => updateCell(ri, ci, e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
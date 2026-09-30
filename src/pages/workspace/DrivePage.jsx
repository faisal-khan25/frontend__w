import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FolderOpen, FolderPlus, Upload, Search as SearchIcon, Star, Trash2,
  Download, Pencil, Trash, RotateCcw, Grid2X2, List, RefreshCw,
  File, Folder,
} from "lucide-react";
import { driveApi } from "../../lib/driveApi";
import { SkeletonList } from "../../components/workspace/common/Skeleton";
import ErrorState from "../../components/workspace/common/ErrorState";
import EmptyState from "../../components/workspace/common/EmptyState";
import NewFolderModal from "../../components/workspace/drive/NewFolderModal";
import UploadFileModal from "../../components/workspace/drive/UploadFileModal";
import { formatTimestamp, formatFileSize } from "../../utils/date";

export default function DrivePage() {
  const [params] = useSearchParams();
  const isStarred = params.get("starred") === "true";
  const isTrashed = params.get("trashed") === "true";
  const highlightId = params.get("open");

  const [items, setItems] = useState([]);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [parentId, setParentId] = useState(params.get("parentId") || null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [modal, setModal] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const view = isStarred ? "starred" : isTrashed ? "trash" : "all";
    driveApi
      .listItems({ parentId: isStarred || isTrashed ? undefined : parentId, view, search: debouncedSearch || undefined })
      .then((res) => {
        setItems(res.items || []);
        setBreadcrumb(res.breadcrumb || []);
      })
      .catch(() => setError("Couldn't load your Drive."))
      .finally(() => setLoading(false));
  }, [parentId, debouncedSearch, isStarred, isTrashed]);

  useEffect(() => { load(); }, [load]);

  async function handleStar(item) {
    setBusyId(item.id);
    try {
      await driveApi.setFlags(item.id, { isStarred: !item.isStarred });
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, isStarred: !item.isStarred } : i));
    } catch { toast.error("Couldn't update star"); }
    finally { setBusyId(null); }
  }

  async function handleTrashOrDelete(item) {
    if (item.isTrashed && !window.confirm(`Permanently delete "${item.name}"?`)) return;
    setBusyId(item.id);
    try {
      await driveApi.trashOrDelete(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success(item.isTrashed ? "Permanently deleted" : "Moved to trash");
    } catch { toast.error("Couldn't delete"); }
    finally { setBusyId(null); }
  }

  async function handleRestore(item) {
    setBusyId(item.id);
    try {
      await driveApi.restoreFromTrash(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success("Restored");
    } catch { toast.error("Couldn't restore"); }
    finally { setBusyId(null); }
  }

  async function handleDownload(item) {
    setBusyId(item.id);
    try {
      const blob = await driveApi.downloadItem(item.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch { toast.error("Couldn't download"); }
    finally { setBusyId(null); }
  }

  const title = isStarred ? "Starred" : isTrashed ? "Trash" : breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1]?.name : "My Drive";

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold text-ink flex items-center gap-2">
          <FolderOpen size={20} className="text-primary-500" /> {title}
        </h1>
        {!isStarred && !isTrashed && (
          <div className="flex items-center gap-2">
            <button onClick={() => setModal("folder")} className="btn-outline btn-sm">
              <FolderPlus size={14} /> New folder
            </button>
            <button onClick={() => setModal("upload")} className="btn-primary btn-sm">
              <Upload size={14} /> Upload
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files and folders"
            className="w-full rounded-pill border border-line bg-canvas pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary"
          />
        </div>
        <button onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")} className="btn-ghost btn-sm" title="Toggle view">
          {viewMode === "list" ? <Grid2X2 size={16} /> : <List size={16} />}
        </button>
        <button onClick={load} className="btn-ghost btn-sm" title="Refresh">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {breadcrumb.length > 0 && (
        <nav className="flex items-center gap-1 text-sm flex-wrap">
          <button onClick={() => setParentId(null)} className="text-primary-600 hover:underline">My Drive</button>
          {breadcrumb.map((crumb, i) => (
            <span key={crumb.id} className="flex items-center gap-1">
              <span className="text-faint">/</span>
              <button
                onClick={() => setParentId(crumb.id)}
                className={i === breadcrumb.length - 1 ? "text-ink font-medium" : "text-primary-600 hover:underline"}
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </nav>
      )}

      {loading && <SkeletonList rows={6} />}
      {!loading && error && <ErrorState description={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && (
        <EmptyState
          icon={FolderOpen}
          title={isStarred ? "No starred files" : isTrashed ? "Trash is empty" : "This folder is empty"}
          description={!isStarred && !isTrashed ? "Upload files or create a folder to get started." : undefined}
        />
      )}

      {!loading && !error && items.length > 0 && viewMode === "list" && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-faint uppercase tracking-wide border-b border-line">
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium hidden md:table-cell">Modified</th>
                <th className="px-4 py-2.5 font-medium hidden md:table-cell">Size</th>
                <th className="px-4 py-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className={`border-t border-line hover:bg-primary-50/40 transition-colors group ${item.id === highlightId ? "bg-primary-50 ring-1 ring-inset ring-primary-200" : ""}`}>
                  <td className="px-4 py-3">
                    <button
                      className="flex items-center gap-2.5 text-left w-full"
                      onClick={() => item.type === "folder" ? setParentId(item.id) : handleDownload(item)}
                      disabled={busyId === item.id}
                    >
                      {item.type === "folder"
                        ? <Folder size={16} className="text-amber shrink-0" />
                        : <File size={16} className="text-primary-400 shrink-0" />}
                      <span className="font-medium text-ink truncate max-w-xs">{item.name}</span>
                      {item.isStarred && <Star size={12} className="fill-amber text-amber shrink-0" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted hidden md:table-cell">{formatTimestamp(item.updatedAt)}</td>
                  <td className="px-4 py-3 text-muted hidden md:table-cell">
                    {item.type === "file" ? formatFileSize(item.size) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.isTrashed ? (
                        <>
                          <button onClick={() => handleRestore(item)} disabled={busyId === item.id} className="p-1.5 rounded-lg text-faint hover:text-mint hover:bg-primary-50" title="Restore">
                            <RotateCcw size={14} />
                          </button>
                          <button onClick={() => handleTrashOrDelete(item)} disabled={busyId === item.id} className="p-1.5 rounded-lg text-faint hover:text-coral hover:bg-coral-bg" title="Delete permanently">
                            <Trash size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleStar(item)} disabled={busyId === item.id} className="p-1.5 rounded-lg text-faint hover:text-amber hover:bg-primary-50" title={item.isStarred ? "Unstar" : "Star"}>
                            <Star size={14} className={item.isStarred ? "fill-amber text-amber" : ""} />
                          </button>
                          {item.type === "file" && (
                            <button onClick={() => handleDownload(item)} disabled={busyId === item.id} className="p-1.5 rounded-lg text-faint hover:text-primary hover:bg-primary-50" title="Download">
                              <Download size={14} />
                            </button>
                          )}
                          <button onClick={() => handleTrashOrDelete(item)} disabled={busyId === item.id} className="p-1.5 rounded-lg text-faint hover:text-coral hover:bg-coral-bg" title="Move to trash">
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && items.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => item.type === "folder" ? setParentId(item.id) : handleDownload(item)}
              disabled={busyId === item.id}
              className={`card card-hover p-4 flex flex-col items-center gap-2 text-center ${item.id === highlightId ? "ring-2 ring-primary-300" : ""}`}
            >
              {item.type === "folder"
                ? <Folder size={32} className="text-amber" />
                : <File size={32} className="text-primary-400" />}
              <p className="text-xs font-medium text-ink truncate w-full">{item.name}</p>
              <p className="text-[10px] text-faint">{formatTimestamp(item.updatedAt)}</p>
            </button>
          ))}
        </div>
      )}

      {modal === "folder" && (
        <NewFolderModal parentId={parentId} onClose={() => setModal(null)} onCreated={load} />
      )}
      {modal === "upload" && (
        <UploadFileModal parentId={parentId} onClose={() => setModal(null)} onUploaded={load} />
      )}
    </div>
  );
}
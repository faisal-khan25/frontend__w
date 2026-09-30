import { useEffect, useState, useCallback } from "react";
import { FolderOpen, Plus, RefreshCw, Download, Trash2, FileText } from "lucide-react";
import * as documentService from "../../services/documentService";
import UploadDocumentModal from "./UploadDocumentModal";

const CATEGORY_LABEL = {
  ID_PROOF: "ID Proof",
  CONTRACT: "Contract",
  CERTIFICATE: "Certificate",
  PAYSLIP: "Payslip",
  POLICY: "Policy",
  OTHER: "Other",
};

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsWidget() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await documentService.getMyDocuments();
      setDocs(result);
    } catch (err) {
      setError("Unable to load documents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleUploaded(doc) {
    setModalOpen(false);
    setDocs((prev) => [doc, ...prev]);
  }

  async function handleDownload(doc) {
    setBusyId(doc.id);
    setError(null);
    try {
      await documentService.downloadDocument(doc.id, doc.fileName);
    } catch (err) {
      setError(err.response?.data?.error || "Unable to download this document.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(doc) {
    setBusyId(doc.id);
    setError(null);
    try {
      await documentService.deleteDocument(doc.id);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err) {
      setError(err.response?.data?.error || "Unable to delete this document.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div id="documents" className="card card-pad scroll-mt-20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
          <FolderOpen size={18} className="text-primary" /> Documents
        </h2>
        <button className="btn-primary btn-sm" onClick={() => setModalOpen(true)}>
          <Plus size={14} /> Upload
        </button>
      </div>

      {error && <div className="state-error mb-4">{error}</div>}

      {loading ? (
        <div className="state-loading">
          <RefreshCw size={16} className="animate-spin" /> Loading documents…
        </div>
      ) : docs.length === 0 ? (
        <p className="text-sm text-faint">No documents yet. Upload your first one.</p>
      ) : (
        <ul className="space-y-2">
          {docs.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center gap-3 rounded-xl border border-line px-4 py-3"
            >
              <div className="shrink-0 w-9 h-9 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
                <FileText size={16} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink truncate">{doc.title}</p>
                <div className="flex items-center flex-wrap gap-2 mt-1">
                  <span className="badge-primary">{CATEGORY_LABEL[doc.category] || doc.category}</span>
                  <span className="text-xs text-faint">
                    {formatSize(doc.fileSize)} · {formatDate(doc.uploadedAt)}
                    {!doc.uploadedBySelf && doc.uploadedByName ? ` · by ${doc.uploadedByName}` : ""}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleDownload(doc)}
                  disabled={busyId === doc.id}
                  className="p-1.5 rounded-lg text-faint hover:text-primary hover:bg-primary-50 disabled:opacity-50"
                  aria-label="Download document"
                  title="Download"
                >
                  <Download size={14} />
                </button>
                <button
                  onClick={() => handleDelete(doc)}
                  disabled={busyId === doc.id}
                  className="p-1.5 rounded-lg text-faint hover:text-coral hover:bg-coral-bg disabled:opacity-50"
                  aria-label="Delete document"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modalOpen && (
        <UploadDocumentModal onClose={() => setModalOpen(false)} onUploaded={handleUploaded} />
      )}
    </div>
  );
}

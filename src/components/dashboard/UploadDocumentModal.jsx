import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import Modal from "../common/Modal";
import * as documentService from "../../services/documentService";

const CATEGORIES = ["ID_PROOF", "CONTRACT", "CERTIFICATE", "PAYSLIP", "POLICY", "OTHER"];
const CATEGORY_LABEL = {
  ID_PROOF: "ID Proof",
  CONTRACT: "Contract",
  CERTIFICATE: "Certificate",
  PAYSLIP: "Payslip",
  POLICY: "Policy",
  OTHER: "Other",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED = ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx";

export default function UploadDocumentModal({ onClose, onUploaded }) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function handleFileChange(e) {
    const selected = e.target.files?.[0] || null;
    setError(null);
    if (selected && selected.size > MAX_FILE_SIZE) {
      setError("File is too large. Maximum size is 10MB.");
      setFile(null);
      return;
    }
    setFile(selected);
    if (selected && !title) setTitle(selected.name.replace(/\.[^/.]+$/, ""));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError("Please choose a file to upload.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const doc = await documentService.uploadDocument(file, { title: title.trim(), category });
      onUploaded(doc);
    } catch (err) {
      setError(err.response?.data?.error || "Unable to upload this document.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Upload Document" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="state-error">{error}</div>}

        <div>
          <label className="field-label">File</label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-1 w-full rounded-xl border-2 border-dashed border-line hover:border-primary-300 px-4 py-6 flex flex-col items-center justify-center gap-2 text-center transition-colors"
          >
            <UploadCloud size={22} className="text-primary" />
            <span className="text-sm font-medium text-ink">
              {file ? file.name : "Click to choose a file"}
            </span>
            <span className="text-xs text-faint">PDF, JPG, PNG, WEBP, DOC, DOCX · up to 10MB</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="docTitle">Title (optional)</label>
          <input
            id="docTitle"
            type="text"
            className="input-field mt-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Aadhaar Card"
            maxLength={150}
          />
        </div>

        <div>
          <label className="field-label" htmlFor="docCategory">Category</label>
          <select
            id="docCategory"
            className="input-field mt-1"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? "Uploading…" : "Upload"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

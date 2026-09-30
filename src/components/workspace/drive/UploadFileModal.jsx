import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { UploadCloud } from "lucide-react";
import WorkspaceModal from "../common/WorkspaceModal";
import { driveApi } from "../../../lib/driveApi";

export default function UploadFileModal({ parentId = null, onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    try {
      await driveApi.uploadFile(file, { parentId }, (pct) => setProgress(pct));
      toast.success("File uploaded");
      onUploaded?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <WorkspaceModal
      title="Upload file"
      onClose={onClose}
      size="sm"
      footer={
        <>
          <button className="btn-ghost btn-sm" onClick={onClose} disabled={uploading}>Cancel</button>
          <button className="btn-primary btn-sm" onClick={handleUpload} disabled={uploading || !file}>
            {uploading ? `Uploading… ${progress}%` : "Upload"}
          </button>
        </>
      }
    >
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-10 cursor-pointer transition-colors ${
          dragOver ? "border-primary bg-primary-50" : "border-line hover:border-primary-300"
        }`}
      >
        <UploadCloud size={28} className="text-primary-400" />
        {file ? (
          <p className="text-sm font-medium text-ink">{file.name}</p>
        ) : (
          <>
            <p className="text-sm text-ink font-medium">Click to choose a file, or drag it here</p>
            <p className="text-xs text-faint">Any file type is supported</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>
    </WorkspaceModal>
  );
}

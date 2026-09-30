import { useEffect, useRef, useState } from "react";
import {
  FileText, FileSpreadsheet, FileArchive, Film, Music2,
  Download, Loader2, AlertTriangle, ImageOff,
} from "lucide-react";
import { chatApi } from "../../../lib/chatApi";
import { formatFileSize } from "../../../utils/date";

const blobUrlCache = new Map();

function iconFor(mimeType = "") {
  if (mimeType.startsWith("video/")) return Film;
  if (mimeType.startsWith("audio/")) return Music2;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return FileSpreadsheet;
  if (mimeType.includes("zip")) return FileArchive;
  return FileText;
}

export default function MessageAttachment({
  attachment,
  isImage,
  pending,
  localPreviewUrl,
  progress,
  failed,
  onRetry,
  download,
}) {
  const fetchBlob = download || (() => chatApi.downloadAttachment(attachment.id));
  const cacheKey = attachment ? String(attachment.id) : null;
  const [blobUrl, setBlobUrl] = useState(() => (cacheKey ? blobUrlCache.get(cacheKey) : null));
  const [loadError, setLoadError] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => () => { mountedRef.current = false; }, []);

  useEffect(() => {
    if (pending || !isImage || !attachment || blobUrl) return;
    let cancelled = false;
    fetchBlob()
      .then((blob) => {
        if (cancelled || !mountedRef.current) return;
        const url = URL.createObjectURL(blob);
        if (cacheKey) blobUrlCache.set(cacheKey, url);
        setBlobUrl(url);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => { cancelled = true; };
  }, [attachment, isImage, pending, blobUrl]);

  async function handleDownload() {
    if (!attachment) return;
    setDownloading(true);
    try {
      const blob = cacheKey && blobUrlCache.has(cacheKey)
        ? await fetch(blobUrlCache.get(cacheKey)).then((r) => r.blob())
        : await fetchBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.fileName || "download";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setLoadError(true);
    } finally {
      setDownloading(false);
    }
  }

  const name = attachment?.fileName || "Attachment";
  const size = attachment?.size;
  const mimeType = attachment?.mimeType || "";
  const previewSrc = pending ? localPreviewUrl : blobUrl;

  if (isImage) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-line/60 max-w-[240px] bg-canvas">
        {previewSrc && !loadError ? (
          <img
            src={previewSrc}
            alt={name}
            onClick={() => !pending && window.open(previewSrc, "_blank", "noopener")}
            className={`block w-full max-h-60 object-cover ${!pending ? "cursor-zoom-in" : ""}`}
          />
        ) : (
          <div className="w-full h-32 flex items-center justify-center text-faint">
            {loadError ? <ImageOff size={22} /> : <Loader2 size={20} className="animate-spin" />}
          </div>
        )}

        {pending && (
          <div className="absolute inset-0 bg-ink/40 flex flex-col items-center justify-center gap-1 text-white">
            {failed ? (
              <>
                <AlertTriangle size={18} />
                <button type="button" onClick={onRetry} className="text-[11px] underline underline-offset-2">
                  Retry upload
                </button>
              </>
            ) : (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span className="text-[11px] font-medium">{progress != null ? `${progress}%` : "Uploading…"}</span>
              </>
            )}
          </div>
        )}

        <div className="px-2 py-1 text-[11px] text-muted truncate bg-surface/80">{name}</div>
      </div>
    );
  }

  const Icon = iconFor(mimeType);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line/60 bg-canvas px-3 py-2.5 max-w-[280px]">
      <div className="w-9 h-9 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
        {pending && !failed ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-ink truncate" title={name}>{name}</p>
        <p className="text-[11px] text-faint">
          {pending
            ? failed
              ? "Upload failed"
              : progress != null ? `Uploading… ${progress}%` : "Uploading…"
            : size != null ? formatFileSize(size) : ""}
        </p>
      </div>
      {pending && failed && (
        <button type="button" onClick={onRetry} title="Retry" className="shrink-0 p-1.5 rounded-lg text-coral hover:bg-coral-bg">
          <AlertTriangle size={15} />
        </button>
      )}
      {!pending && (
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          title="Download"
          className="shrink-0 p-1.5 rounded-lg text-muted hover:text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50"
        >
          {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
        </button>
      )}
    </div>
  );
}

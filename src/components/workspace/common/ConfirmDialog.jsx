import { AlertTriangle } from "lucide-react";
import WorkspaceModal from "./WorkspaceModal";

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onClose,
}) {
  return (
    <WorkspaceModal title={title} onClose={onClose} size="sm">
      <div className="space-y-4">
        {danger && (
          <div className="flex items-center gap-2 text-coral">
            <AlertTriangle size={18} />
            <span className="text-sm font-medium">{message}</span>
          </div>
        )}
        {!danger && message && <p className="text-sm text-muted">{message}</p>}

        <div className="flex gap-3 pt-1">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`flex-1 ${danger ? "btn-coral" : "btn-primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </WorkspaceModal>
  );
}

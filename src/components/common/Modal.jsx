import { X } from "lucide-react";
import { useEffect } from "react";

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative card card-pad w-full max-w-md shadow-card-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-faint hover:text-ink transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

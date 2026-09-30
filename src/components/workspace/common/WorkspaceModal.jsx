import { useEffect } from "react";
import { X } from "lucide-react";

const SIZE_CLASS = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export default function WorkspaceModal({
  title,
  onClose,
  children,
  footer,
  size = "md",
  bodyClassName = "",
}) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`relative w-full ${SIZE_CLASS[size] || SIZE_CLASS.md} bg-surface rounded-2xl shadow-card-lg flex flex-col max-h-[90vh]`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
          <h2 className="font-display font-bold text-ink text-base">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-faint hover:bg-primary-50 hover:text-ink transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className={`overflow-y-auto flex-1 px-5 py-4 ${bodyClassName}`}>
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-line shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

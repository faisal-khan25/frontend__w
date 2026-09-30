import { AlertCircle, RefreshCw } from "lucide-react";

export default function ErrorState({ description, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
      <div className="w-12 h-12 rounded-2xl bg-coral-bg flex items-center justify-center mb-4">
        <AlertCircle size={22} className="text-coral" />
      </div>
      <p className="font-display font-bold text-ink">Something went wrong</p>
      {description && <p className="text-sm text-muted mt-1 max-w-sm">{description}</p>}
      {onRetry && (
        <button onClick={onRetry} className="btn-outline btn-sm mt-5 flex items-center gap-2">
          <RefreshCw size={14} /> Try again
        </button>
      )}
    </div>
  );
}

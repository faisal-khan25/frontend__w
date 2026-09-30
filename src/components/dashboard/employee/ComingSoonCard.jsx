import { Construction } from "lucide-react";

export default function ComingSoonCard({ id, icon: Icon = Construction, title, description }) {
  return (
    <div id={id} className="card card-pad scroll-mt-20">
      <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2 mb-4">
        <Icon size={18} className="text-primary" /> {title}
      </h2>
      <div className="flex flex-col items-center justify-center text-center py-6 px-4 rounded-xl bg-canvas border border-dashed border-line">
        <Construction size={22} className="text-faint mb-2" />
        <p className="text-sm font-medium text-ink">Not connected yet</p>
        <p className="text-xs text-faint mt-1 max-w-xs">
          {description || `This module needs a backend API before it can show real ${title.toLowerCase()} data.`}
        </p>
      </div>
    </div>
  );
}

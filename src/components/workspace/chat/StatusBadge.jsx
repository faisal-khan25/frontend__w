import { Clock, Users, Ban, MinusCircle, MessageCircle } from "lucide-react";

const STATUS_STYLE = {
  MEETING: { icon: Users, className: "bg-primary-50 text-primary-700" },
  BUSY: { icon: MinusCircle, className: "bg-amber-bg text-amber" },
  DO_NOT_DISTURB: { icon: Ban, className: "bg-coral-bg text-coral" },
  AWAY: { icon: Clock, className: "bg-line text-muted" },
  CUSTOM: { icon: MessageCircle, className: "bg-mint-bg text-mint" },
};

function untilLabel(endTime) {
  if (!endTime) return "";
  const end = new Date(endTime);
  if (Number.isNaN(end.getTime())) return "";
  const now = new Date();
  const sameDay = end.toDateString() === now.toDateString();
  const time = end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return sameDay ? `until ${time}` : `until ${end.toLocaleDateString(undefined, { day: "numeric", month: "short" })}, ${time}`;
}

export default function StatusBadge({ status, variant = "pill", className = "" }) {
  if (!status || !status.isActive) return null;

  const style = STATUS_STYLE[status.statusType] || STATUS_STYLE.CUSTOM;
  const Icon = style.icon;
  const title = `${status.label}${status.endTime ? ` (${untilLabel(status.endTime)})` : ""}`;

  if (variant === "dot") {
    return (
      <span
        title={title}
        className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full shrink-0 ${style.className} ${className}`}
      >
        <Icon size={9} strokeWidth={2.5} />
      </span>
    );
  }

  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${style.className} ${className}`}
    >
      <Icon size={11} />
      <span className="truncate max-w-[160px]">{status.label}</span>
      {status.endTime && <span className="opacity-70">· {untilLabel(status.endTime)}</span>}
    </span>
  );
}
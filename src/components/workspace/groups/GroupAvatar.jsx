import { Users } from "lucide-react";
import { assetUrl } from "../../../lib/api";

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-xl",
};

const TINTS = [
  "bg-primary-100 text-primary-700",
  "bg-mint-bg text-mint",
  "bg-sky-bg text-sky",
  "bg-violet-bg text-violet",
  "bg-amber-bg text-amber",
  "bg-coral-bg text-coral",
];

function tintFor(seed = "") {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  }
  return TINTS[hash % TINTS.length];
}

function initialsFor(name = "") {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function GroupAvatar({ name, icon, iconType, size = "md", className = "" }) {
  const sizeClass = SIZES[size] || SIZES.md;
  const isImage =
    iconType === "IMAGE" || (iconType === undefined && typeof icon === "string" && icon.startsWith("/uploads/"));
  const isEmoji = !isImage && typeof icon === "string" && icon.length > 0;

  if (isImage) {
    return (
      <img
        src={assetUrl(icon)}
        alt=""
        className={`${sizeClass} rounded-xl object-cover shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} ${
        isEmoji ? "bg-primary-50" : tintFor(name || "")
      } rounded-xl shrink-0 flex items-center justify-center font-display font-bold ${className}`}
      aria-hidden="true"
    >
      {isEmoji ? (
        <span className="leading-none">{icon}</span>
      ) : name ? (
        initialsFor(name)
      ) : (
        <Users size={16} />
      )}
    </div>
  );
}
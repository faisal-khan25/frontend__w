import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";


const CATEGORIES = [
  {
    name: "Smileys",
    emojis: ["😀","😁","😂","🤣","😊","😇","🙂","😉","😍","😘","😜","🤗","🤔","😐","😴","😅","😎","🥳","😢","😭","😡","😱","🥺","😬","🙄","😏","😌","🤩","🤯","🤝"],
  },
  {
    name: "Gestures",
    emojis: ["👍","👎","👏","🙌","🙏","👌","✌️","🤞","👋","💪","🤟","🫶","👊","🖐️","🤙","☝️"],
  },
  {
    name: "Hearts",
    emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","💔","💕","💖","💗"],
  },
  {
    name: "Objects",
    emojis: ["🎉","🎊","🔥","✨","⭐","💯","✅","❌","⚡","💡","📌","📎","📅","⏰","🚀","🎯"],
  },
  {
    name: "Work",
    emojis: ["💼","📈","📊","💻","📧","☕","🗓️","✍️","🤝","🏆"],
  },
];

const RECENTS_KEY = "chat_recent_emojis";
const MAX_RECENTS = 16;

function loadRecents() {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecents(list) {
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(list.slice(0, MAX_RECENTS)));
  } catch {
  
  }
}

export default function EmojiPicker({ onSelect, onClose }) {
  const [recents, setRecents] = useState(loadRecents);
  const panelRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    }
    function handleEscape(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  function pick(emoji) {
    const next = [emoji, ...recents.filter((e) => e !== emoji)].slice(0, MAX_RECENTS);
    setRecents(next);
    saveRecents(next);
    onSelect(emoji);
  }

  return (
    <div
      ref={panelRef}
      className="absolute bottom-full right-0 mb-2 w-72 max-h-80 overflow-y-auto rounded-2xl border border-line bg-surface shadow-card-lg p-3 z-20"
      role="dialog"
      aria-label="Emoji picker"
    >
      {recents.length > 0 && (
        <div className="mb-2">
          <p className="flex items-center gap-1 text-[11px] font-semibold text-faint uppercase tracking-wide px-1 mb-1">
            <Clock size={11} /> Recent
          </p>
          <div className="grid grid-cols-8 gap-0.5">
            {recents.map((emoji, i) => (
              <button
                key={`recent-${i}`}
                type="button"
                onClick={() => pick(emoji)}
                className="w-8 h-8 flex items-center justify-center text-lg rounded-lg hover:bg-primary-50 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {CATEGORIES.map((cat) => (
        <div key={cat.name} className="mb-2 last:mb-0">
          <p className="text-[11px] font-semibold text-faint uppercase tracking-wide px-1 mb-1">
            {cat.name}
          </p>
          <div className="grid grid-cols-8 gap-0.5">
            {cat.emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => pick(emoji)}
                className="w-8 h-8 flex items-center justify-center text-lg rounded-lg hover:bg-primary-50 transition-colors"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { mailApi } from "../../../lib/mailApi";

function isValidEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
}

export default function PeoplePicker({ value = [], onChange, placeholder = "Add people" }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      mailApi
        .searchContacts(q)
        .then((contacts) => {
          setSuggestions(
            (contacts || []).filter((c) => !value.some((v) => v.id === c.id))
          );
        })
        .catch(() => setSuggestions([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query, value]);

  function addPerson(person) {
    const alreadyIn = value.some(
      (v) => v.id === person.id || v.email?.toLowerCase() === person.email?.toLowerCase()
    );
    if (alreadyIn) {
      setQuery("");
      setSuggestions([]);
      setOpen(false);
      return;
    }
    onChange([...value, person]);
    setQuery("");
    setSuggestions([]);
    setOpen(false);
  }

  function commitFreeText() {
    const raw = query.trim().replace(/,+$/, "").trim();
    if (!raw) return;
    if (isValidEmail(raw)) {
      addPerson({ id: raw, email: raw, name: raw });
    }
  }

  function remove(id) {
    onChange(value.filter((p) => p.id !== id));
    inputRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === "Tab" || e.key === ",") {
      if (suggestions.length === 0 || !open) {
        e.preventDefault();
        commitFreeText();
      }
    } else if (e.key === "Backspace" && query === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function handleBlur() {
    setTimeout(() => {
      commitFreeText();
      setOpen(false);
    }, 150);
  }

  return (
    <div className="relative" ref={containerRef}>
      <div
        className="flex flex-wrap gap-1.5 items-center rounded-xl border border-line bg-canvas px-3 py-2 min-h-[42px] focus-within:ring-2 focus-within:ring-primary-200 focus-within:border-primary cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((p) => (
          <span
            key={p.id}
            className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 rounded-full px-2.5 py-0.5 text-xs font-medium"
          >
            {p.name && p.name !== p.email ? p.name : p.email}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); remove(p.id); }}
              aria-label={`Remove ${p.name || p.email}`}
              className="ml-0.5 hover:text-coral transition-colors"
            >
              <X size={12} />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          className="flex-1 min-w-[140px] bg-transparent text-sm outline-none text-ink placeholder:text-faint"
          placeholder={value.length === 0 ? placeholder : ""}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        />

        {loading && <Loader2 size={14} className="animate-spin text-faint shrink-0" />}
      </div>

      {open && query.trim() && !loading && suggestions.length === 0 && isValidEmail(query.trim()) && (
        <div className="absolute z-50 mt-1 w-full bg-surface border border-line rounded-xl shadow-card px-4 py-2.5">
          <button
            type="button"
            className="w-full text-left text-sm hover:bg-primary-50 transition-colors rounded-lg px-1 py-1"
            onMouseDown={(e) => {
              e.preventDefault();
              commitFreeText();
            }}
          >
            <span className="text-faint">Add </span>
            <span className="font-medium text-ink">{query.trim()}</span>
            <span className="text-faint text-xs ml-2">(press Enter or click)</span>
          </button>
        </div>
      )}

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-surface border border-line rounded-xl shadow-card max-h-48 overflow-y-auto">
          {suggestions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault();
                  addPerson(s);
                }}
              >
                <p className="font-medium text-ink">{s.name}</p>
                <p className="text-xs text-faint">{s.email}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

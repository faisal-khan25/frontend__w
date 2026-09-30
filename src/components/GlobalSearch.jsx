import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, AlertCircle } from "lucide-react";
import { chatApi } from "../lib/index";
import useGlobalSearch from "../lib/useGlobalSearch";
import GroupedSearchResults from "./SearchResults";
import getSearchResultPath from "../lib/searchNav";

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [busyItemId, setBusyItemId] = useState(null);
  const boxRef = useRef(null);
  const navigate = useNavigate();

  const { query, setQuery, results, counts, total, loading, error, hasResults, isEmpty } =
    useGlobalSearch({ perModuleLimit: 5 });

  useEffect(() => {
    function onClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(path) {
    setOpen(false);
    setQuery("");
    navigate(path);
  }

  async function handleItemClick(item) {
    if (item.module === "employees") {
      const key = `${item.module}-${item.id}`;
      setBusyItemId(key);
      try {
        const conversation = await chatApi.createDirectConversation(item.id);
        go(`/workspace/chat?conversation=${conversation.id}`);
      } catch {
        setBusyItemId(null);
      }
      return;
    }

    const path = getSearchResultPath(item);
    if (path) go(path);
  }

  function handleViewAll(moduleName) {
    setOpen(false);
    navigate(`/workspace/search?q=${encodeURIComponent(query.trim())}&module=${moduleName}`);
  }

  return (
    <div className="relative flex-1 max-w-xl" ref={boxRef}>
      <div className="relative">
        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim()) {
              setOpen(false);
              navigate(`/workspace/search?q=${encodeURIComponent(query.trim())}`);
            }
          }}
          placeholder="Search mail, chat, drive, calendar, meetings, people"
          className="w-full rounded-pill border border-line bg-canvas pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary focus:bg-white transition"
        />
      </div>

      {open && query.trim() && (
        <div className="absolute z-40 mt-2 w-full rounded-xl border border-line bg-surface shadow-card-lg max-h-96 overflow-y-auto">
          {loading && (
            <div className="flex items-center gap-2 px-4 py-4 text-sm text-muted">
              <Loader2 size={15} className="animate-spin" /> Searching…
            </div>
          )}
          {!loading && error && (
            <div className="flex items-center gap-2 px-4 py-4 text-sm text-coral">
              <AlertCircle size={15} /> {error}
            </div>
          )}
          {!loading && !error && isEmpty && (
            <div className="px-4 py-4 text-sm text-muted">No results for "{query}"</div>
          )}
          {!loading && !error && hasResults && (
            <>
              <GroupedSearchResults
                results={results}
                counts={counts}
                onItemClick={handleItemClick}
                onViewAll={handleViewAll}
                busyItemId={busyItemId}
              />
              {total > 0 && (
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate(`/workspace/search?q=${encodeURIComponent(query.trim())}`);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-primary-600 hover:underline border-t border-line"
                >
                  See all results
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

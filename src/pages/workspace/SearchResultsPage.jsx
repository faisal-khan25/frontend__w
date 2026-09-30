import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search, Loader2, AlertCircle, ChevronLeft, ChevronRight,
  MessageSquare, Mail, FolderOpen, Calendar, Users, Video,
  FileText, Folder, File,
} from "lucide-react";
import { searchApi } from "../../lib/searchApi";
import { formatTimestamp } from "../../utils/date";

const MODULE_CONFIG = {
  chat:      { label: "Chat",      icon: MessageSquare },
  mail:      { label: "Mail",      icon: Mail          },
  drive:     { label: "Drive",     icon: FolderOpen    },
  calendar:  { label: "Calendar",  icon: Calendar      },
  employees: { label: "People",    icon: Users         },
  meetings:  { label: "Meetings",  icon: Video         },
};

function getResultPath(item) {
  switch (item.module) {
    case "chat":      return `/workspace/chat?conversation=${item.meta?.conversationId}`;
    case "mail":      return `/workspace/mail?open=${item.id}`;
    case "drive":     return `/workspace/drive?open=${item.id}`;
    case "calendar":  return `/workspace/calendar?event=${item.id}`;
    case "employees": return `/employee/dashboard`;
    case "meetings":  return `/workspace/meet/${item.meta?.roomId || item.id}`;
    default:          return "/workspace";
  }
}

function ResultCard({ item, onClick }) {
  const IconMap = {
    drive: item.type === "folder" ? Folder : File,
    mail: Mail, chat: MessageSquare, calendar: Calendar,
    employees: Users, meetings: Video,
  };
  const Icon = IconMap[item.module] || FileText;

  return (
    <button
      onClick={onClick}
      className="card card-hover w-full text-left flex items-start gap-3 px-4 py-3.5 transition-shadow"
    >
      <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={16} className="text-primary-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-ink text-sm truncate">{item.title || "(no title)"}</p>
        {item.snippet && (
          <p className="text-xs text-muted mt-0.5 line-clamp-2">{item.snippet}</p>
        )}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {item.user && (
            <span className="text-[11px] text-faint">{item.user.name}</span>
          )}
          {item.date && (
            <span className="text-[11px] text-faint">{formatTimestamp(item.date)}</span>
          )}
          {item.meta?.status && (
            <span className="text-[10px] font-medium badge-primary capitalize">
              {item.meta.status.toLowerCase()}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const q = searchParams.get("q") || "";
  const activeModule = searchParams.get("module") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [overview, setOverview] = useState(null);

  const load = useCallback(async () => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      if (activeModule) {
        const data = await searchApi.searchModule(activeModule, q, page, 20);
        setResults(data.results || []);
        setPagination(data.pagination || null);
        setOverview(null);
      } else {
        const data = await searchApi.globalSearch(q, 5);
        setOverview(data);
        setResults([]);
        setPagination(null);
      }
    } catch (err) {
      setError("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [q, activeModule, page]);

  useEffect(() => { load(); }, [load]);

  function go(path) { navigate(path); }

  function setModule(mod) {
    setSearchParams({ q, module: mod, page: "1" });
  }

  function setPage(p) {
    setSearchParams({ q, module: activeModule, page: String(p) });
  }

  const ModuleIcon = activeModule ? MODULE_CONFIG[activeModule]?.icon : Search;
  const moduleLabel = activeModule ? MODULE_CONFIG[activeModule]?.label : "All";

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6 space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-ink flex items-center gap-2">
          <Search size={20} className="text-primary-500" />
          Search results
        </h1>
        <p className="text-sm text-muted mt-0.5">
          {q ? <>Results for "<span className="font-medium text-ink">{q}</span>"</> : "Enter a search term"}
          {activeModule && <> in <span className="font-medium text-ink">{moduleLabel}</span></>}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setSearchParams({ q })}
          className={`pill !py-1.5 !px-3.5 text-xs font-semibold ${!activeModule ? "!bg-primary !text-white !border-primary" : ""}`}
        >
          All
        </button>
        {Object.entries(MODULE_CONFIG).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <button
              key={key}
              onClick={() => setModule(key)}
              className={`pill !py-1.5 !px-3.5 text-xs font-semibold flex items-center gap-1.5
                ${activeModule === key ? "!bg-primary !text-white !border-primary" : ""}`}
            >
              <Icon size={12} /> {cfg.label}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="flex items-center gap-3 py-8 text-muted">
          <Loader2 size={18} className="animate-spin" /> Searching…
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-2 text-coral py-4">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {!loading && !error && q && !loading && results.length === 0 && !overview && (
        <div className="text-center py-12">
          <Search size={32} className="text-faint mx-auto mb-3" />
          <p className="font-display font-bold text-ink">No results found</p>
          <p className="text-sm text-muted mt-1">Try different keywords or switch the module filter</p>
        </div>
      )}

      {!loading && !error && activeModule && results.length > 0 && (
        <div className="space-y-2">
          {results.map((item) => (
            <ResultCard key={`${item.module}-${item.id}`} item={item} onClick={() => go(getResultPath(item))} />
          ))}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-faint">
                Page {pagination.page} of {pagination.totalPages} · {pagination.total} results
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="btn-ghost btn-sm disabled:opacity-40"
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                  className="btn-ghost btn-sm disabled:opacity-40"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && !error && !activeModule && overview && (
        <div className="space-y-6">
          {Object.entries(MODULE_CONFIG).map(([key, cfg]) => {
            const items = overview.results?.[key] || [];
            const total = overview.counts?.[key] || 0;
            if (items.length === 0) return null;
            const Icon = cfg.icon;
            return (
              <section key={key}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold text-ink text-sm flex items-center gap-1.5">
                    <Icon size={15} className="text-primary-500" /> {cfg.label}
                    <span className="text-xs text-faint font-normal">({total})</span>
                  </h2>
                  {total > items.length && (
                    <button
                      onClick={() => setModule(key)}
                      className="text-xs font-medium text-primary-600 hover:underline"
                    >
                      View all {total} →
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {items.map((item) => (
                    <ResultCard key={`${item.module}-${item.id}`} item={item} onClick={() => go(getResultPath(item))} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

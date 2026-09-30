import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Inbox, Send, FileEdit, Star, Trash2, Search as SearchIcon, Pencil,
  Paperclip, RotateCcw, Reply, ReplyAll, Forward, X, ChevronLeft, ChevronRight,
  ShieldAlert, ShieldCheck,
} from "lucide-react";
import { mailApi } from "../../lib/mailApi";
import { SkeletonList } from "../../components/workspace/common/Skeleton";
import EmptyState from "../../components/workspace/common/EmptyState";
import ErrorState from "../../components/workspace/common/ErrorState";
import ConfirmDialog from "../../components/workspace/common/ConfirmDialog";
import ComposeModal from "../../components/workspace/mail/ComposeModal";
import { formatTimestamp, formatFileSize } from "../../utils/date";
import useAuth from "../../hooks/useAuth";

const FOLDERS = [
  { key: "inbox", label: "Inbox", icon: Inbox },
  { key: "sent", label: "Sent", icon: Send },
  { key: "drafts", label: "Drafts", icon: FileEdit },
  { key: "starred", label: "Starred", icon: Star },
  { key: "spam", label: "Spam", icon: ShieldAlert },
  { key: "trash", label: "Trash", icon: Trash2 },
];

function stripHtml(html = "") {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default function MailPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [folder, setFolder] = useState("inbox");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ messages: [], pagination: null, loading: true, error: null });
  const [selected, setSelected] = useState(null);
  const [compose, setCompose] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmSpam, setConfirmSpam] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    mailApi
      .listMail({ folder, search: debouncedSearch, page, pageSize: 20 })
      .then((data) => setState({ messages: data.messages, pagination: data.pagination, loading: false, error: null }))
      .catch(() => setState((s) => ({ ...s, loading: false, error: "Couldn't load your mail." })));
  }, [folder, debouncedSearch, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const openId = params.get("open");
    if (openId) {
      mailApi.getMessage(openId).then(setSelected).catch(() => {});
    }
  }, [params]);

  function switchFolder(key) {
    setFolder(key);
    setPage(1);
    setSelected(null);
    setParams({});
  }

  async function openMessage(msg) {
    try {
      const full = await mailApi.getMessage(msg.id);
      setSelected(full);
      if (!msg.isRead) load();
    } catch {
      toast.error("Couldn't open message");
    }
  }

  async function toggleStar(msg, e) {
    e?.stopPropagation();
    try {
      await mailApi.setFlags(msg.id, { isStarred: !msg.isStarred });
      load();
      if (selected?.id === msg.id) setSelected((s) => ({ ...s, isStarred: !msg.isStarred }));
    } catch {
      toast.error("Couldn't update star");
    }
  }

  async function handleTrashOrDelete(id) {
    try {
      await mailApi.trashOrDelete(id);
      toast.success(folder === "trash" ? "Message permanently deleted" : "Moved to trash");
      setSelected(null);
      setConfirmDelete(null);
      load();
    } catch {
      toast.error("Couldn't delete message");
    }
  }

  async function handleRestore(id) {
    try {
      await mailApi.restoreFromTrash(id);
      toast.success("Message restored");
      setSelected(null);
      load();
    } catch {
      toast.error("Couldn't restore message");
    }
  }

  async function handleMarkSpam(id) {
    try {
      await mailApi.markAsSpam(id);
      toast.success("Conversation marked as spam.");
      setSelected(null);
      setConfirmSpam(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't mark as spam");
    }
  }

  async function handleMarkNotSpam(id) {
    try {
      await mailApi.markAsNotSpam(id);
      toast.success("Marked as not spam.");
      setSelected(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't update message");
    }
  }

  async function downloadAttachment(attachment) {
    try {
      const blob = await mailApi.downloadAttachment(attachment.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Couldn't download attachment");
    }
  }

  const activeFolder = FOLDERS.find((f) => f.key === folder);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-56 shrink-0 border-r border-line bg-surface p-3 hidden md:flex md:flex-col">
        <button
          onClick={() => setCompose({ mode: "new" })}
          className="btn-primary w-full mb-4 justify-start"
        >
          <Pencil size={16} /> Compose
        </button>
        <nav className="space-y-0.5">
          {FOLDERS.map((f) => (
            <button
              key={f.key}
              onClick={() => switchFolder(f.key)}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                folder === f.key ? "bg-primary-50 text-primary-700" : "text-muted hover:bg-primary-50 hover:text-ink"
              }`}
            >
              <f.icon size={17} /> {f.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center gap-3 px-4 lg:px-6 py-3 border-b border-line bg-surface">
          <button className="md:hidden btn-primary btn-sm" onClick={() => setCompose({ mode: "new" })}>
            <Pencil size={14} />
          </button>
          <h1 className="font-display font-bold text-ink hidden md:block">{activeFolder?.label}</h1>
          <div className="relative flex-1 max-w-md ml-auto">
            <SearchIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search mail"
              className="w-full rounded-pill border border-line bg-canvas pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary"
            />
          </div>
        </div>

        <div className="flex md:hidden gap-1 px-3 py-2 overflow-x-auto border-b border-line bg-surface">
          {FOLDERS.map((f) => (
            <button
              key={f.key}
              onClick={() => switchFolder(f.key)}
              className={`shrink-0 flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-medium ${
                folder === f.key ? "bg-primary-50 text-primary-700" : "text-muted bg-canvas"
              }`}
            >
              <f.icon size={13} /> {f.label}
            </button>
          ))}
        </div>

        <div className="flex-1 flex min-h-0">
          <div className={`flex-1 min-w-0 overflow-y-auto ${selected ? "hidden lg:block lg:max-w-md lg:border-r lg:border-line" : ""}`}>
            {state.loading && <div className="p-4"><SkeletonList rows={8} /></div>}
            {!state.loading && state.error && <ErrorState description={state.error} onRetry={load} />}
            {!state.loading && !state.error && state.messages.length === 0 && (
              <EmptyState icon={activeFolder.icon} title={`No mail in ${activeFolder.label}`} description="Messages will show up here." />
            )}
            {!state.loading && !state.error && state.messages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => openMessage(msg)}
                className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-line transition-colors ${
                  selected?.id === msg.id ? "bg-primary-50" : "hover:bg-primary-50/50"
                } ${!msg.isRead ? "bg-white" : "bg-canvas/40"}`}
              >
                <button onClick={(e) => toggleStar(msg, e)} className="mt-0.5 shrink-0" aria-label="Star">
                  <Star size={16} className={msg.isStarred ? "fill-amber text-amber" : "text-faint"} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm truncate ${!msg.isRead ? "font-bold text-ink" : "font-medium text-muted"}`}>
                      {folder === "sent" ? msg.to?.map((t) => t.name).join(", ") || "(no recipients)" : msg.from?.name || "Unknown"}
                    </span>
                    <span className="text-[11px] text-faint shrink-0">{formatTimestamp(msg.sentAt || msg.createdAt)}</span>
                  </div>
                  <p className={`text-sm truncate ${!msg.isRead ? "text-ink font-semibold" : "text-muted"}`}>{msg.subject || "(no subject)"}</p>
                  <p className="text-xs text-faint truncate">{stripHtml(msg.bodyText)}</p>
                </div>
                {msg.attachments?.length > 0 && <Paperclip size={13} className="text-faint mt-1 shrink-0" />}
              </button>
            ))}

            {state.pagination && state.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3">
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-ghost btn-sm disabled:opacity-40">
                  <ChevronLeft size={14} /> Prev
                </button>
                <span className="text-xs text-muted">Page {state.pagination.page} of {state.pagination.totalPages}</span>
                <button disabled={page >= state.pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="btn-ghost btn-sm disabled:opacity-40">
                  Next <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>

          {selected && (
            <div className="flex-1 min-w-0 overflow-y-auto bg-white">
              <div className="flex items-center justify-between px-5 py-3 border-b border-line sticky top-0 bg-white">
                <button className="lg:hidden btn-ghost btn-sm" onClick={() => setSelected(null)}>
                  <ChevronLeft size={16} /> Back
                </button>
                <div className="flex items-center gap-1 ml-auto">
                  <button onClick={(e) => toggleStar(selected, e)} className="p-2 rounded-lg hover:bg-primary-50">
                    <Star size={16} className={selected.isStarred ? "fill-amber text-amber" : "text-muted"} />
                  </button>
                  {folder === "drafts" ? (
                    <button onClick={() => setCompose({ mode: "new", draft: selected })} className="p-2 rounded-lg hover:bg-primary-50" title="Edit draft">
                      <Pencil size={16} className="text-muted" />
                    </button>
                  ) : (
                    <>
                      <button onClick={() => setCompose({ mode: "reply", sourceMessage: selected })} className="p-2 rounded-lg hover:bg-primary-50" title="Reply">
                        <Reply size={16} className="text-muted" />
                      </button>
                      <button onClick={() => setCompose({ mode: "replyAll", sourceMessage: selected })} className="p-2 rounded-lg hover:bg-primary-50" title="Reply all">
                        <ReplyAll size={16} className="text-muted" />
                      </button>
                      <button onClick={() => setCompose({ mode: "forward", sourceMessage: selected })} className="p-2 rounded-lg hover:bg-primary-50" title="Forward">
                        <Forward size={16} className="text-muted" />
                      </button>
                    </>
                  )}
                  {folder === "trash" ? (
                    <button onClick={() => handleRestore(selected.id)} className="p-2 rounded-lg hover:bg-primary-50" title="Restore">
                      <RotateCcw size={16} className="text-muted" />
                    </button>
                  ) : null}
                  {!selected.isMine && !selected.isSpam && (
                    <button onClick={() => setConfirmSpam(selected.id)} className="p-2 rounded-lg hover:bg-primary-50" title="Report spam">
                      <ShieldAlert size={16} className="text-muted" />
                    </button>
                  )}
                  {selected.isSpam && (
                    <button onClick={() => handleMarkNotSpam(selected.id)} className="p-2 rounded-lg hover:bg-primary-50" title="Not spam">
                      <ShieldCheck size={16} className="text-muted" />
                    </button>
                  )}
                  <button onClick={() => setConfirmDelete(selected.id)} className="p-2 rounded-lg hover:bg-coral-bg" title="Delete">
                    <Trash2 size={16} className="text-coral" />
                  </button>
                  <button onClick={() => setSelected(null)} className="hidden lg:block p-2 rounded-lg hover:bg-primary-50" title="Close">
                    <X size={16} className="text-muted" />
                  </button>
                </div>
              </div>

              <div className="p-5">
                {selected.isSpam && (
                  <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber/30 bg-amber/10 px-3 py-2 text-xs text-ink">
                    <span className="flex items-center gap-1.5"><ShieldAlert size={14} /> This message is in Spam.</span>
                    <button onClick={() => handleMarkNotSpam(selected.id)} className="font-semibold text-primary-700 hover:underline">
                      Not spam
                    </button>
                  </div>
                )}
                <h2 className="font-display text-xl font-bold text-ink mb-3">{selected.subject || "(no subject)"}</h2>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-ink">{selected.from?.name}</p>
                    <p className="text-xs text-muted">
                      to {selected.to?.map((t) => t.name).join(", ") || "—"}
                      {selected.cc?.length > 0 && <> · cc {selected.cc.map((c) => c.name).join(", ")}</>}
                      {selected.bcc?.length > 0 && <> · bcc {selected.bcc.map((b) => b.name).join(", ")}</>}
                    </p>
                  </div>
                  <span className="text-xs text-faint shrink-0">{formatTimestamp(selected.sentAt || selected.createdAt)}</span>
                </div>

                <div
                  className="workspace-rte text-sm text-ink"
                  dangerouslySetInnerHTML={{ __html: selected.bodyText || "" }}
                />

                {selected.attachments?.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-line">
                    <p className="text-xs font-semibold text-faint uppercase mb-2">Attachments</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.attachments.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => downloadAttachment(a)}
                          className="flex items-center gap-2 border border-line rounded-lg px-3 py-2 text-xs hover:border-primary-300 hover:bg-primary-50 transition-colors"
                        >
                          <Paperclip size={13} className="text-primary-500" />
                          <span className="text-ink">{a.fileName}</span>
                          <span className="text-faint">{formatFileSize(a.fileSize)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {compose && (
        <ComposeModal
          mode={compose.mode}
          sourceMessage={compose.sourceMessage}
          draft={compose.draft}
          currentUserId={user?.id}
          onClose={() => setCompose(null)}
          onSent={load}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={folder === "trash" ? "Delete permanently?" : "Move to trash?"}
          message={
            folder === "trash"
              ? "This message will be permanently deleted and can't be recovered."
              : "You can restore this message from Trash later."
          }
          confirmLabel={folder === "trash" ? "Delete forever" : "Move to trash"}
          danger
          onConfirm={() => handleTrashOrDelete(confirmDelete)}
          onClose={() => setConfirmDelete(null)}
        />
      )}

      {confirmSpam && (
        <ConfirmDialog
          title="Report spam?"
          message="This message will move out of your inbox into Spam. You can mark it not spam later."
          confirmLabel="Report spam"
          danger
          onConfirm={() => handleMarkSpam(confirmSpam)}
          onClose={() => setConfirmSpam(null)}
        />
      )}
    </div>
  );
}
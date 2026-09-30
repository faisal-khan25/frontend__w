import { Loader2, MessageSquare, SearchX, User, Users, AlertCircle, RefreshCw } from "lucide-react";
import StatusBadge from "./StatusBadge";

function messageSnippet(content, max = 80) {
  if (!content) return "";
  const plain = String(content).replace(/\s+/g, " ").trim();
  return plain.length > max ? `${plain.slice(0, max).trim()}…` : plain;
}

function formatMessageTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
}


export default function ChatSearchPanel({
  loading,
  error,
  isEmpty,
  conversations,
  messages = [],
  employees,
  onRetry,
  onSelectConversation,
  onSelectEmployee,
  onSelectMessage,
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted">
        <Loader2 size={14} className="animate-spin" /> Searching…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center text-center gap-2 px-4 py-6">
        <AlertCircle size={20} className="text-coral" />
        <p className="text-sm text-muted">{error}</p>
        {onRetry && (
          <button onClick={onRetry} className="btn-outline btn-sm mt-1 flex items-center gap-1.5">
            <RefreshCw size={12} /> Try again
          </button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center text-center gap-2 px-4 py-8">
        <SearchX size={22} className="text-faint" />
        <p className="text-sm font-medium text-ink">No matches found</p>
        <p className="text-xs text-faint">Try a different name, email, or message keyword.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-line">
      {conversations.length > 0 && (
        <div className="py-1.5">
          <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-faint">Conversations</p>
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv)}
              className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-primary-50/60 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
                {conv.type === "DIRECT" ? <User size={14} /> : <Users size={14} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-ink truncate">{conv.name}</p>
                  {conv.type === "DIRECT" && <StatusBadge status={conv.status} variant="dot" />}
                </div>
                {conv.lastMessagePreview && (
                  <p className="text-xs text-faint truncate">{conv.lastMessagePreview}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="py-1.5">
          <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-faint">Messages</p>
          {messages.map((msg) => (
            <button
              key={msg.id}
              onClick={() => onSelectMessage(msg)}
              className="w-full text-left flex items-start gap-3 px-4 py-2.5 hover:bg-primary-50/60 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center shrink-0 overflow-hidden mt-0.5">
                {msg.conversationAvatar ? (
                  <img src={msg.conversationAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <MessageSquare size={14} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-ink truncate">
                    {msg.conversationName || msg.sender?.name || "Conversation"}
                  </p>
                  <span className="text-[11px] text-faint shrink-0">{formatMessageTime(msg.createdAt)}</span>
                </div>
                <p className="text-xs text-faint truncate">
                  {msg.sender?.name ? `${msg.sender.name}: ` : ""}
                  {messageSnippet(msg.content)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {employees.length > 0 && (
        <div className="py-1.5">
          <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-faint">Start a new chat</p>
          {employees.map((emp) => (
            <button
              key={emp.id}
              onClick={() => onSelectEmployee(emp)}
              className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-primary-50/60 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center shrink-0 overflow-hidden">
                {emp.profileImage ? (
                  <img src={emp.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <MessageSquare size={14} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-ink truncate">{emp.name}</p>
                  <StatusBadge status={emp.status} variant="dot" />
                </div>
                <p className="text-xs text-faint truncate">{[emp.department, emp.email].filter(Boolean).join(" · ")}</p>
              </div>
              {emp.status?.isActive && (
                <StatusBadge status={emp.status} className="hidden sm:inline-flex" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
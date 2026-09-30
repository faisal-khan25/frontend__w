import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, Info, Loader2, Send, Users, MessageSquare, Smile, Paperclip } from "lucide-react";
import toast from "react-hot-toast";
import MessageBubble from "./MessageBubble";
import GroupAvatar from "./GroupAvatar";
import EmptyState from "../common/EmptyState";
import EmojiPicker from "../chat/EmojiPicker";
import { validateAttachment } from "../chat/attachmentConstants";
import { groupApi } from "../../../lib/groupApi";

function dayLabel(value) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

function shouldShowHeader(message, previous) {
  if (!previous) return true;
  if (previous.messageType === "SYSTEM") return true;
  if (previous.senderId !== message.senderId) return true;
  return new Date(message.createdAt) - new Date(previous.createdAt) > 5 * 60 * 1000;
}

export default function GroupChatWindow({
  group,
  messages,
  loading,
  hasMore,
  loadingMore,
  onLoadOlder,
  onSend,
  onSendAttachment,
  onRetryAttachment,
  typingUsers,
  onTyping,
  onStoppedTyping,
  currentUserId,
  onOpenInfo,
  onBack,
  onMessageDeleted,
  className = "",
}) {
  const [draft, setDraft] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const scrollRef = useRef(null);
  const endRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const pinnedToBottomRef = useRef(true);
  const prevGroupIdRef = useRef(null);
  const prevScrollHeightRef = useRef(0);

  function isNearBottom() {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }

  useLayoutEffect(() => {
    if (prevGroupIdRef.current !== group?.id) {
      prevGroupIdRef.current = group?.id;
      pinnedToBottomRef.current = true;
      setDraft("");
      requestAnimationFrame(() => {
        endRef.current?.scrollIntoView({ block: "end" });
      });
    }
  }, [group?.id]);

  useLayoutEffect(() => {
    if (!messages.length) return;

    const el = scrollRef.current;
    if (!el) return;

    if (loadingMore === false && prevScrollHeightRef.current) {
      const delta = el.scrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = 0;
      if (delta > 0) {
        el.scrollTop += delta;
        return;
      }
    }

    if (pinnedToBottomRef.current) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, loadingMore]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    pinnedToBottomRef.current = isNearBottom();

    if (el.scrollTop < 80 && hasMore && !loadingMore) {
      prevScrollHeightRef.current = el.scrollHeight;
      onLoadOlder();
    }
  }

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [draft]);

  function submit() {
    const body = draft.trim();
    if (!body) return;
    onSend(body);
    setDraft("");
    onStoppedTyping();
    pinnedToBottomRef.current = true;
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function insertEmoji(emoji) {
    const el = textareaRef.current;
    if (!el) {
      setDraft((prev) => prev + emoji);
      return;
    }
    const start = el.selectionStart ?? draft.length;
    const end = el.selectionEnd ?? draft.length;
    const next = draft.slice(0, start) + emoji + draft.slice(end);
    setDraft(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  }

  function triggerFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFileChosen(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const validationError = validateAttachment(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    onSendAttachment(file);
  }

  async function handleDeleteMessage(message) {
    try {
      await groupApi.deleteMessage(message.id);
      onMessageDeleted(message.id);
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't delete that message");
    }
  }

  if (!group) {
    return (
      <div className={`flex-1 flex items-center justify-center bg-canvas ${className}`}>
        <EmptyState
          icon={MessageSquare}
          title="Select a group"
          description="Choose a group from the list to start chatting with your team."
        />
      </div>
    );
  }

  const isAdmin = Boolean(group.isGroupAdmin) || group.myRole === "GROUP_ADMIN";
  let lastDay = null;

  return (
    <div className={`flex-1 flex flex-col min-w-0 bg-canvas ${className}`}>
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-line bg-surface shrink-0">
        <button
          onClick={onBack}
          aria-label="Back to groups"
          className="md:hidden p-1.5 rounded-lg text-faint hover:bg-primary-50 hover:text-ink"
        >
          <ArrowLeft size={18} />
        </button>

        <GroupAvatar name={group.name} icon={group.icon} iconType={group.iconType} size="md" />

        <div className="flex-1 min-w-0">
          <h2 className="font-display font-bold text-ink text-sm truncate">
            {group.name}
          </h2>
          <p className="text-xs text-muted truncate">
            {group.memberCount} member{group.memberCount === 1 ? "" : "s"}
            {group.description ? ` · ${group.description}` : ""}
          </p>
        </div>

        <button
          onClick={onOpenInfo}
          aria-label="Group details"
          title={isAdmin ? "Group details and admin settings" : "Group details"}
          className="btn-outline btn-sm shrink-0"
        >
          <Info size={14} />
          <span className="hidden sm:inline">Details</span>
        </button>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3"
      >
        {loading && (
          <div className="flex items-center justify-center py-10 text-faint">
            <Loader2 size={20} className="animate-spin" />
          </div>
        )}

        {!loading && loadingMore && (
          <div className="flex justify-center py-2 text-faint">
            <Loader2 size={15} className="animate-spin" />
          </div>
        )}

        {!loading && !hasMore && messages.length > 0 && (
          <p className="text-center text-[11px] text-faint py-2">
            This is the beginning of {group.name}
          </p>
        )}

        {!loading && messages.length === 0 && (
          <EmptyState
            icon={Users}
            title="No messages yet"
            description={`Say hello to ${group.name}.`}
          />
        )}

        {!loading &&
          messages.map((message, index) => {
            const previous = index > 0 ? messages[index - 1] : null;
            const day = dayLabel(message.createdAt);
            const showDay = day !== lastDay;
            lastDay = day;

            const isMine = message.senderId === currentUserId;

            return (
              <div key={message.id}>
                {showDay && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-line" />
                    <span className="text-[11px] font-semibold text-faint uppercase tracking-wide">
                      {day}
                    </span>
                    <div className="flex-1 h-px bg-line" />
                  </div>
                )}
                <MessageBubble
                  message={message}
                  isMine={isMine}
                  showHeader={showDay || shouldShowHeader(message, previous)}
                  canDelete={isMine || isAdmin}
                  onDelete={handleDeleteMessage}
                  onRetryAttachment={onRetryAttachment}
                />
              </div>
            );
          })}

        <div ref={endRef} />
      </div>

      <div className="h-5 px-4 shrink-0" aria-live="polite">
        {typingUsers.length > 0 && (
          <p className="text-xs text-muted italic">
            {typingUsers.length === 1
              ? `${typingUsers[0].name} is typing…`
              : typingUsers.length === 2
              ? `${typingUsers[0].name} and ${typingUsers[1].name} are typing…`
              : "Several people are typing…"}
          </p>
        )}
      </div>

      <div className="flex items-end gap-2 px-4 py-3 border-t border-line bg-surface shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChosen}
          className="hidden"
        />

        <button
          type="button"
          onClick={triggerFilePicker}
          aria-label="Attach a file"
          title="Attach a file"
          className="p-2 rounded-lg text-faint hover:bg-primary-50 hover:text-ink shrink-0"
        >
          <Paperclip size={18} />
        </button>

        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (e.target.value.trim()) onTyping();
            else onStoppedTyping();
          }}
          onBlur={onStoppedTyping}
          onKeyDown={handleKeyDown}
          rows={1}
          maxLength={5000}
          placeholder={`Message ${group.name}`}
          aria-label={`Message ${group.name}`}
          className="flex-1 resize-none rounded-2xl border border-line bg-canvas px-4 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-primary-200 max-h-36"
        />

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setEmojiOpen((v) => !v)}
            aria-label="Add an emoji"
            title="Add an emoji"
            className="p-2 rounded-lg text-faint hover:bg-primary-50 hover:text-ink"
          >
            <Smile size={18} />
          </button>
          {emojiOpen && (
            <EmojiPicker onSelect={insertEmoji} onClose={() => setEmojiOpen(false)} />
          )}
        </div>

        <button
          onClick={submit}
          disabled={!draft.trim()}
          aria-label="Send message"
          className="btn-primary btn-sm h-10 w-10 !px-0 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

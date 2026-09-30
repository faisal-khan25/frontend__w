import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  MessageSquare, Plus, Search as SearchIcon, Send, Users,
  User, RefreshCw, X, ArrowLeft, Phone, Video, Loader2, PhoneOff,
  Smile, Paperclip, Trash2, CircleUserRound,
} from "lucide-react";
import { chatApi } from "../../lib/chatApi";
import { mailApi } from "../../lib/mailApi";
import ErrorState from "../../components/workspace/common/ErrorState";
import ConfirmDialog from "../../components/workspace/common/ConfirmDialog";
import CallRoom from "../../components/workspace/call/CallRoom";
import EmojiPicker from "../../components/workspace/chat/EmojiPicker";
import MessageAttachment from "../../components/workspace/chat/MessageAttachment";
import { validateAttachment, ALLOWED_MIME_TYPES } from "../../components/workspace/chat/attachmentConstants";
import StatusBadge from "../../components/workspace/chat/StatusBadge";
import SetStatusModal from "../../components/workspace/chat/SetStatusModal";
import ChatSearchPanel from "../../components/workspace/chat/ChatSearchPanel";
import statusApi from "../../lib/statusApi";
import { formatTimestamp } from "../../utils/date";
import useAuth from "../../hooks/useAuth";
import useCallSocket from "../../hooks/useCallSocket";
import useChatSearch from "../../hooks/useChatSearch";
import useEmployeeStatuses from "../../hooks/useEmployeeStatuses";
import { useCallContext } from "../../context/CallContext";
import socketService from "../../lib/socketService";

function reconcileIncomingMessage(prev, incoming, myId) {
  if (prev.some((m) => m.id === incoming.id)) return prev;

  if (incoming.sender?.id === myId) {
    const pendingIdx = prev.findIndex((m) => m._status === "sending" || m._status === "uploading");
    if (pendingIdx !== -1) {
      const next = [...prev];
      next[pendingIdx] = { ...incoming, _status: "sent" };
      return next;
    }
  }
  return [...prev, incoming];
}

function resolveTempMessage(prev, tempId, saved) {
  if (prev.some((m) => m.id === saved.id && m.id !== tempId)) {
    return prev.filter((m) => m.id !== tempId);
  }
  return prev.map((m) => (m.id === tempId ? { ...saved, _status: "sent" } : m));
}

function bumpConversationForMessage(list, msg, myId, activeId) {
  const idx = list.findIndex((c) => c.id === msg.conversationId);
  if (idx === -1) return list;

  const preview = msg.isDeleted
    ? "This message was deleted"
    : msg.content
      ? msg.content
      : msg.attachments?.[0]?.fileName
        ? `📎 ${msg.attachments[0].fileName}`
        : "";

  const current = list[idx];
  const updated = {
    ...current,
    lastMessageAt: msg.createdAt,
    lastMessagePreview: preview,
    unreadCount:
      msg.conversationId === activeId || msg.sender?.id === myId
        ? current.unreadCount
        : (current.unreadCount || 0) + 1,
  };

  const next = list.slice();
  next.splice(idx, 1);
  next.unshift(updated);
  return next;
}

function OutgoingCallOverlay({ peerName, peerImage, callType, onCancel }) {
  const initials = (peerName || "?")
    .split(" ").filter(Boolean).slice(0, 2)
    .map((n) => n[0].toUpperCase()).join("");

  return (
    <div className="fixed inset-0 z-50 bg-gray-950/95 backdrop-blur-sm flex items-center justify-center">
      <div className="flex flex-col items-center gap-6 text-white text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping scale-110" />
          <div className="relative w-24 h-24 rounded-full bg-primary flex items-center justify-center font-bold text-3xl overflow-hidden">
            {peerImage
              ? <img src={peerImage} alt={peerName} className="w-full h-full object-cover" />
              : initials}
          </div>
        </div>

        <div>
          <p className="text-white/60 text-sm font-medium uppercase tracking-wider">
            Calling {callType === "video" ? "Video" : "Audio"}
          </p>
          <p className="font-display font-bold text-2xl mt-1">{peerName}</p>
        </div>

        <div className="flex items-center gap-2 text-white/50 text-sm">
          <Loader2 size={14} className="animate-spin" /> Waiting for answer…
        </div>

        <button
          onClick={onCancel}
          className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors mt-2"
          title="Cancel call"
        >
          <PhoneOff size={24} />
        </button>
        <p className="text-white/40 text-xs">Cancel</p>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const { startCall, cancelCall } = useCallSocket();
  const { activeCall, setActiveCall, clearActiveCall } = useCallContext();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeConvId, setActiveConvId] = useState(params.get("conversation") || null);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgInput, setMsgInput] = useState("");
  const [sending, setSending] = useState(false);
  const [highlightMessageId, setHighlightMessageId] = useState(null);
  const pendingHighlightRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const [emojiOpen, setEmojiOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const activeConvIdRef = useRef(activeConvId);
  const pendingPreviewUrlsRef = useRef(new Map());

  const search = useChatSearch();
  const [searchFocused, setSearchFocused] = useState(false);
  const searchBoxRef = useRef(null);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [myStatus, setMyStatus] = useState(null);
  const directPeerIds = useMemo(
    () =>
      conversations
        .filter((c) => c.type === "DIRECT")
        .map((c) => c.members?.find((m) => m.id !== user?.id)?.id)
        .filter(Boolean),
    [conversations, user?.id]
  );
  const liveStatuses = useEmployeeStatuses(directPeerIds);

  useEffect(() => { activeConvIdRef.current = activeConvId; }, [activeConvId]);

  useEffect(() => {
    function onClickOutside(e) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => () => {
    pendingPreviewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    pendingPreviewUrlsRef.current.clear();
  }, []);

  const [outgoingCall, setOutgoingCall] = useState(null);

  const loadConversations = useCallback(() => {
    setLoading(true);
    setError(null);
    chatApi
      .listConversations()
      .then(setConversations)
      .catch(() => setError("Couldn't load conversations."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (!user?.id) return undefined;
    statusApi.getMyStatus().then(setMyStatus).catch(() => {});

    function onUpdated({ userId, status }) {
      if (userId === user.id) setMyStatus(status);
    }
    function onCleared({ userId }) {
      if (userId === user.id) setMyStatus(null);
    }
    function onExpired({ userId }) {
      if (userId === user.id) setMyStatus(null);
    }
    socketService.on("status:updated", onUpdated);
    socketService.on("status:cleared", onCleared);
    socketService.on("status:expired", onExpired);
    return () => {
      socketService.off("status:updated", onUpdated);
      socketService.off("status:cleared", onCleared);
      socketService.off("status:expired", onExpired);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!activeConvId) { setActiveConv(null); setMessages([]); return; }
    setMsgLoading(true);
    Promise.all([
      chatApi.getConversation(activeConvId),
      chatApi.listMessages(activeConvId, { limit: 50 }),
    ])
      .then(([conv, msgData]) => {
        setActiveConv(conv);
        setMessages(msgData.messages || []);
        chatApi.markConversationRead(activeConvId).catch(() => {});
        setConversations((prev) => prev.map((c) => (c.id === activeConvId ? { ...c, unreadCount: 0 } : c)));
      })
      .catch(() => toast.error("Couldn't load messages"))
      .finally(() => setMsgLoading(false));
  }, [activeConvId]);

  const tryHighlightPendingMessage = useCallback((msgList) => {
    const targetId = pendingHighlightRef.current;
    if (!targetId || !msgList.some((m) => m.id === targetId)) return false;
    pendingHighlightRef.current = null;
    setHighlightMessageId(targetId);
    setTimeout(() => {
      document.querySelector(`[data-message-id="${targetId}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
    setTimeout(() => setHighlightMessageId(null), 2000);
    return true;
  }, []);

  useEffect(() => {
    if (pendingHighlightRef.current) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    tryHighlightPendingMessage(messages);
  }, [messages, tryHighlightPendingMessage]);

  useEffect(() => {
    function onMessageNew(msg) {
      setConversations((prev) => bumpConversationForMessage(prev, msg, user?.id, activeConvIdRef.current));

      if (msg.conversationId !== activeConvIdRef.current) return;

      setMessages((prev) => reconcileIncomingMessage(prev, msg, user?.id));

      if (msg.sender?.id !== user?.id) {
        chatApi.markConversationRead(msg.conversationId).catch(() => {});
      }
    }

    function onMessageDeleted({ id, conversationId }) {
      if (conversationId !== activeConvIdRef.current) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isDeleted: true, content: null, attachments: [] } : m))
      );
    }

    socketService.on("message:new", onMessageNew);
    socketService.on("message:deleted", onMessageDeleted);

    return () => {
      socketService.off("message:new", onMessageNew);
      socketService.off("message:deleted", onMessageDeleted);
    };
  }, [user?.id]);

  async function handleSend(e) {
    e.preventDefault();
    const text = msgInput.trim();
    if (!text || !activeConvId) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const conversationId = activeConvId;
    const optimistic = {
      id: tempId,
      conversationId,
      sender: { id: user?.id, name: user?.name, profileImage: user?.profileImage },
      isMine: true,
      messageType: "TEXT",
      content: text,
      attachments: [],
      reactions: [],
      isEdited: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      _status: "sending",
    };

    setMessages((prev) => [...prev, optimistic]);
    setMsgInput("");
    setSending(true);
    try {
      const saved = await chatApi.sendMessage(conversationId, { content: text });
      setMessages((prev) => resolveTempMessage(prev, tempId, saved));
    } catch (err) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, _status: "failed" } : m)));
      toast.error(err.response?.data?.error || "Couldn't send message");
    } finally {
      setSending(false);
    }
  }

  async function retryMessage(tempMsg) {
    setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? { ...m, _status: "sending" } : m)));
    try {
      const saved = await chatApi.sendMessage(tempMsg.conversationId, { content: tempMsg.content });
      setMessages((prev) => resolveTempMessage(prev, tempMsg.id, saved));
    } catch (err) {
      setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? { ...m, _status: "failed" } : m)));
      toast.error(err.response?.data?.error || "Couldn't send message");
    }
  }

  function dismissFailedMessage(tempId) {
    const url = pendingPreviewUrlsRef.current.get(tempId);
    if (url) { URL.revokeObjectURL(url); pendingPreviewUrlsRef.current.delete(tempId); }
    setMessages((prev) => prev.filter((m) => m.id !== tempId));
  }

  function insertEmoji(emoji) {
    const el = textareaRef.current;
    if (!el) { setMsgInput((prev) => prev + emoji); return; }
    const start = el.selectionStart ?? msgInput.length;
    const end = el.selectionEnd ?? msgInput.length;
    const next = msgInput.slice(0, start) + emoji + msgInput.slice(end);
    setMsgInput(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  }

  function triggerFilePicker() {
    if (!activeConvId) return;
    fileInputRef.current?.click();
  }

  async function uploadAttachment(tempId, conversationId, file) {
    try {
      const saved = await chatApi.sendAttachmentMessage(conversationId, file, {
        onUploadProgress: (pct) => {
          setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, _progress: pct } : m)));
        },
      });
      setMessages((prev) => resolveTempMessage(prev, tempId, saved));
      const url = pendingPreviewUrlsRef.current.get(tempId);
      if (url) { URL.revokeObjectURL(url); pendingPreviewUrlsRef.current.delete(tempId); }
    } catch (err) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, _status: "failed" } : m)));
      const status = err.response?.status;
      const serverMsg = err.response?.data?.error;
      if (status === 413 || /large/i.test(serverMsg || "")) {
        toast.error(serverMsg || "File is too large to upload.");
      } else if (status === 400 && /type/i.test(serverMsg || "")) {
        toast.error(serverMsg || "That file type isn't supported.");
      } else {
        toast.error(serverMsg || "Upload failed. Please try again.");
      }
    }
  }

  function retryAttachment(tempMsg) {
    setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? { ...m, _status: "uploading", _progress: 0 } : m)));
    uploadAttachment(tempMsg.id, tempMsg.conversationId, tempMsg._localFile);
  }

  async function handleFileChosen(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !activeConvId) return;

    const validationError = validateAttachment(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const tempId = `temp-att-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const conversationId = activeConvId;
    const isImage = file.type.startsWith("image/");
    const localPreviewUrl = isImage ? URL.createObjectURL(file) : null;
    if (localPreviewUrl) pendingPreviewUrlsRef.current.set(tempId, localPreviewUrl);

    const optimistic = {
      id: tempId,
      conversationId,
      sender: { id: user?.id, name: user?.name, profileImage: user?.profileImage },
      isMine: true,
      messageType: isImage ? "IMAGE" : "FILE",
      content: null,
      attachments: [{ id: null, fileName: file.name, mimeType: file.type, size: file.size }],
      reactions: [],
      isEdited: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      _status: "uploading",
      _progress: 0,
      _localFile: file,
      _localPreviewUrl: localPreviewUrl,
    };

    setMessages((prev) => [...prev, optimistic]);
    await uploadAttachment(tempId, conversationId, file);
  }

  async function confirmDeleteMessage() {
    const target = deleteTarget;
    setDeleteTarget(null);
    if (!target) return;

    setMessages((prev) =>
      prev.map((m) => (m.id === target.id ? { ...m, isDeleted: true, content: null, attachments: [] } : m))
    );
    try {
      await chatApi.deleteMessage(target.id);
    } catch (err) {
      setMessages((prev) => prev.map((m) => (m.id === target.id ? target : m)));
      toast.error(err.response?.data?.error || "Couldn't delete message");
    }
  }

  async function handleNewDirect() {
    const email = window.prompt("Enter the email address of the person to message:");
    if (!email) return;
    try {
      const contacts = await mailApi.searchContacts(email);
      const contact = contacts?.find((c) => c.email?.toLowerCase() === email.toLowerCase());
      if (!contact) { toast.error("User not found"); return; }
      const conv = await chatApi.createDirectConversation(contact.id);
      loadConversations();
      setActiveConvId(conv.id || conv.conversation?.id);
    } catch { toast.error("Couldn't start conversation"); }
  }

  function handleSelectSearchConversation(conv) {
    setActiveConvId(conv.id);
    search.setQuery("");
    setSearchFocused(false);
  }

  function handleSelectSearchMessage(msg) {
    pendingHighlightRef.current = msg.id;
    setHighlightMessageId(null);
    search.setQuery("");
    setSearchFocused(false);
    if (msg.conversationId === activeConvId) {
      tryHighlightPendingMessage(messages);
    } else {
      setActiveConvId(msg.conversationId);
    }
  }

  async function handleSelectSearchEmployee(emp) {
    search.setQuery("");
    setSearchFocused(false);
    try {
      const conv = await chatApi.createDirectConversation(emp.id);
      loadConversations();
      setActiveConvId(conv.id || conv.conversation?.id);
    } catch {
      toast.error("Couldn't start conversation");
    }
  }

  function getPeer(conv) {
    if (!conv || conv.type !== "DIRECT") return null;
    return conv.members?.find((m) => m.id !== user?.id) || null;
  }

  async function handleStartCall(type) {
    const peer = getPeer(activeConv);
    if (!peer) {
      toast.error("Can only call in a direct conversation");
      return;
    }

    try {
      const { callId, meetingId } = await startCall({
        targetUserId: peer.id,
        targetName: peer.name,
        type,
        conversationId: activeConvId,
      });

      setOutgoingCall({
        callId,
        meetingId,
        peerName: peer.name,
        peerImage: peer.profileImage,
        type,
      });

      setActiveCall({ meetingId, type });
    } catch (err) {
      toast.error("Couldn't start call: " + (err.message || "Unknown error"));
    }
  }

  function handleCancelCall() {
    if (outgoingCall) {
      cancelCall(outgoingCall.callId, outgoingCall.meetingId);
    }
    setOutgoingCall(null);
    clearActiveCall();
  }

  function handleCallEnd() {
    setOutgoingCall(null);
    clearActiveCall();
  }

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const peer = getPeer(activeConv);

  if (activeCall && outgoingCall?.meetingId === activeCall.meetingId) {
    return (
      <CallRoom
        meetingId={activeCall.meetingId}
        peerName={outgoingCall.peerName}
        peerImage={outgoingCall.peerImage}
        callType={activeCall.type}
        isIncoming={false}
        onEnd={handleCallEnd}
      />
    );
  }

  return (
    <>
      <div className="flex h-[calc(100vh-4rem)]">
        <div className={`flex flex-col border-r border-line bg-surface shrink-0 w-72 ${activeConvId && isMobile ? "hidden" : ""}`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-line gap-2">
            <h1 className="font-display font-bold text-ink flex items-center gap-2 min-w-0">
              <MessageSquare size={18} className="text-primary-500 shrink-0" /> Chat
            </h1>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setStatusModalOpen(true)}
                title={myStatus?.isActive ? `${myStatus.label} — click to change` : "Set your status"}
                className="btn-outline btn-sm flex items-center gap-1.5"
              >
                {myStatus?.isActive ? (
                  <StatusBadge status={myStatus} variant="dot" />
                ) : (
                  <CircleUserRound size={14} />
                )}
                Status
              </button>
              <button onClick={handleNewDirect} className="btn-primary btn-sm">
                <Plus size={14} /> New
              </button>
            </div>
          </div>

          <div className="px-3 py-2 border-b border-line relative" ref={searchBoxRef}>
            <div className="relative">
              <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <input
                value={search.query}
                onChange={(e) => search.setQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                placeholder="Search people, conversations, or messages"
                className="w-full rounded-pill border border-line bg-canvas pl-8 pr-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>

            {searchFocused && search.isSearching && (
              <div className="absolute left-3 right-3 top-full mt-1.5 z-20 bg-surface border border-line rounded-xl shadow-lg max-h-96 overflow-y-auto">
                <ChatSearchPanel
                  loading={search.loading}
                  error={search.error}
                  isEmpty={search.isEmpty}
                  conversations={search.conversations}
                  messages={search.messages}
                  employees={search.employees}
                  onRetry={search.retry}
                  onSelectConversation={handleSelectSearchConversation}
                  onSelectEmployee={handleSelectSearchEmployee}
                  onSelectMessage={handleSelectSearchMessage}
                />
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex items-center gap-2 p-4 text-sm text-muted">
                <RefreshCw size={14} className="animate-spin" /> Loading…
              </div>
            )}
            {!loading && error && <ErrorState description={error} onRetry={loadConversations} />}
            {!loading && !error && conversations.length === 0 && (
              <p className="text-sm text-faint text-center py-10">No conversations yet.</p>
            )}
            {conversations.map((conv) => {
              const isActive = conv.id === activeConvId;
              const otherMember = conv.type === "DIRECT"
                ? conv.members?.find((m) => m.id !== user?.id)
                : null;
              const name = conv.name || otherMember?.name || "Conversation";
              const lastMsg = conv.lastMessagePreview || "";
              const unread = conv.unreadCount || 0;
              const rowStatus = otherMember ? (liveStatuses[otherMember.id] ?? conv.status) : null;
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-line transition-colors ${
                    isActive ? "bg-primary-50" : "hover:bg-primary-50/50"
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center shrink-0 text-sm font-bold">
                    {conv.type === "DIRECT" ? <User size={16} /> : <Users size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-sm font-semibold text-ink truncate">{name}</p>
                        {conv.type === "DIRECT" && <StatusBadge status={rowStatus} variant="dot" />}
                      </div>
                      {unread > 0 && (
                        <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                          {unread > 9 ? "9+" : unread}
                        </span>
                      )}
                    </div>
                    {lastMsg && <p className="text-xs text-muted truncate">{lastMsg}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {activeConvId ? (
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-line bg-surface">
              {isMobile && (
                <button onClick={() => setActiveConvId(null)} className="p-1.5 rounded-lg hover:bg-primary-50">
                  <ArrowLeft size={18} />
                </button>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <p className="font-display font-bold text-ink truncate">
                    {activeConv?.name || peer?.name || "Conversation"}
                  </p>
                  {activeConv?.type === "DIRECT" && peer && (
                    <StatusBadge status={liveStatuses[peer.id] ?? peer.status} />
                  )}
                </div>
                {activeConv?.type === "GROUP" && (
                  <span className="text-xs text-faint">{activeConv.members?.length} members</span>
                )}
              </div>

              {activeConv?.type === "DIRECT" && peer && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleStartCall("audio")}
                    title="Audio call"
                    className="p-2 rounded-xl text-muted hover:text-primary-600 hover:bg-primary-50 transition-colors"
                  >
                    <Phone size={18} />
                  </button>
                  <button
                    onClick={() => handleStartCall("video")}
                    title="Video call"
                    className="p-2 rounded-xl text-muted hover:text-primary-600 hover:bg-primary-50 transition-colors"
                  >
                    <Video size={18} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {msgLoading && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <RefreshCw size={14} className="animate-spin" /> Loading messages…
                </div>
              )}
              {messages.map((msg) => {
                const isMine = msg.sender?.id === user?.id;
                const isTemp = typeof msg.id === "string" && msg.id.startsWith("temp-");
                const failed = msg._status === "failed";
                const isTextSending = isTemp && !failed && msg.messageType === "TEXT";
                return (
                  <div
                    key={msg.id}
                    data-message-id={msg.id}
                    className={`group flex ${isMine ? "justify-end" : "justify-start"} ${
                      highlightMessageId === msg.id ? "animate-pulse-once" : ""
                    }`}
                  >
                    <div className={`flex items-end gap-1 max-w-[75%] ${isMine ? "flex-row" : "flex-row-reverse"}`}>
                      {isMine && !isTemp && !msg.isDeleted && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(msg)}
                          title="Delete message"
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 rounded-lg text-faint hover:text-coral hover:bg-coral-bg shrink-0 mb-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}

                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm min-w-[72px] ${
                          isMine
                            ? `bg-primary text-white rounded-br-sm ${failed ? "opacity-60" : ""}`
                            : "bg-canvas border border-line text-ink rounded-bl-sm"
                        }`}
                      >
                        {!isMine && (
                          <p className="text-[11px] font-semibold mb-1 opacity-70">{msg.sender?.name}</p>
                        )}

                        {msg.isDeleted ? (
                          <p className={`italic text-sm ${isMine ? "text-white/70" : "text-faint"}`}>
                            This message was deleted
                          </p>
                        ) : (
                          <>
                            {msg.attachments?.length > 0 && (
                              <div className="space-y-1.5 mb-1.5">
                                {msg.attachments.map((att, i) => (
                                  <MessageAttachment
                                    key={att.id || i}
                                    attachment={att}
                                    isImage={msg.messageType === "IMAGE"}
                                    pending={isTemp}
                                    localPreviewUrl={msg._localPreviewUrl}
                                    progress={msg._progress}
                                    failed={failed}
                                    onRetry={() => retryAttachment(msg)}
                                  />
                                ))}
                              </div>
                            )}
                            {msg.content && (
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            )}
                          </>
                        )}

                        <div className={`flex items-center gap-1.5 mt-1 text-[10px] ${isMine ? "text-white/60 justify-end" : "text-faint"}`}>
                          {isTextSending && <Loader2 size={10} className="animate-spin" />}
                          <span>{formatTimestamp(msg.createdAt)}</span>
                          {failed && (
                            <>
                              <button
                                type="button"
                                onClick={() => (msg.messageType === "TEXT" ? retryMessage(msg) : retryAttachment(msg))}
                                className="underline underline-offset-2 font-medium"
                              >
                                Retry
                              </button>
                              <button
                                type="button"
                                onClick={() => dismissFailedMessage(msg.id)}
                                title="Remove"
                                className="hover:opacity-80"
                              >
                                <X size={11} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSend}
              className="flex items-end gap-2 px-3 sm:px-4 py-3 border-t border-line bg-surface"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_MIME_TYPES.join(",")}
                onChange={handleFileChosen}
                className="hidden"
              />
              <button
                type="button"
                onClick={triggerFilePicker}
                title="Attach a file"
                className="p-2.5 rounded-xl text-muted hover:text-primary-600 hover:bg-primary-50 transition-colors shrink-0"
              >
                <Paperclip size={18} />
              </button>

              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setEmojiOpen((v) => !v)}
                  title="Add emoji"
                  className={`p-2.5 rounded-xl transition-colors ${emojiOpen ? "text-primary-600 bg-primary-50" : "text-muted hover:text-primary-600 hover:bg-primary-50"}`}
                >
                  <Smile size={18} />
                </button>
                {emojiOpen && (
                  <EmojiPicker onSelect={insertEmoji} onClose={() => setEmojiOpen(false)} />
                )}
              </div>

              <textarea
                ref={textareaRef}
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder="Write a message… (Enter to send)"
                rows={1}
                className="flex-1 min-w-0 rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary resize-none"
              />
              <button
                type="submit"
                disabled={sending || !msgInput.trim()}
                className="btn-primary btn-sm shrink-0"
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <MessageSquare size={40} className="text-faint mx-auto mb-3" />
              <p className="font-display font-bold text-ink">Select a conversation</p>
              <p className="text-sm text-muted mt-1">
                Choose from the list or start a new direct message.
              </p>
            </div>
          </div>
        )}
      </div>

      {outgoingCall && !activeCall?.meetingId && (
        <OutgoingCallOverlay
          peerName={outgoingCall.peerName}
          peerImage={outgoingCall.peerImage}
          callType={outgoingCall.type}
          onCancel={handleCancelCall}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete message"
          message="This message will be deleted for everyone in this conversation. This can't be undone."
          confirmLabel="Delete"
          danger
          onConfirm={confirmDeleteMessage}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {statusModalOpen && (
        <SetStatusModal
          onClose={() => setStatusModalOpen(false)}
          onSaved={(saved) => setMyStatus(saved)}
        />
      )}
    </>
  );
}
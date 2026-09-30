
 

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import socketService from "../lib/socketService";
import { groupApi } from "../lib/groupApi";
import useAuth from "./useAuth";

const TYPING_TIMEOUT_MS = 2500;


function sortGroups(list) {
  return [...list].sort(
    (a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0)
  );
}


function reconcileMessage(prev, incoming, myId) {
  if (prev.some((m) => m.id === incoming.id)) return prev;

  if (incoming.senderId === myId) {
    const pendingIdx = prev.findIndex((m) => m._status === "sending");
    if (pendingIdx !== -1) {
      const next = [...prev];
      next[pendingIdx] = { ...incoming, _status: "sent" };
      return next;
    }
  }
  return [...prev, incoming];
}

export default function useGroupChat() {
  const { user } = useAuth();
  const myId = user?.id;

  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsError, setGroupsError] = useState(null);
  
  const [canCreateGroup, setCanCreateGroup] = useState(false);

  const [activeGroupId, setActiveGroupId] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);

  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [typingUsers, setTypingUsers] = useState([]);

  
  const activeGroupIdRef = useRef(null);
  activeGroupIdRef.current = activeGroupId;

  const typingTimersRef = useRef({});
  const typingSentAtRef = useRef(0);

  const loadGroups = useCallback(async ({ search } = {}) => {
    try {
      setGroupsError(null);
      const { groups: list, canCreateGroup: allowed } = await groupApi.listGroups({ search });
      setGroups(sortGroups(list));
      setCanCreateGroup(allowed);
    } catch (err) {
      setGroupsError(
        err.response?.data?.error || "Couldn't load your groups. Please try again."
      );
    } finally {
      setGroupsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  
  useEffect(() => {
    if (!activeGroupId) {
      setActiveGroup(null);
      setMessages([]);
      return undefined;
    }

    let cancelled = false;
    setMessagesLoading(true);
    setTypingUsers([]);

    (async () => {
      try {
        const [detail, history] = await Promise.all([
          groupApi.getGroup(activeGroupId),
          groupApi.listMessages(activeGroupId, { limit: 40 }),
        ]);
        if (cancelled) return;

        setActiveGroup(detail);
        setMessages(history.messages);
        setHasMore(history.hasMore);

        await groupApi.markRead(activeGroupId);
        if (cancelled) return;
        setGroups((prev) =>
          prev.map((g) => (g.id === activeGroupId ? { ...g, unreadCount: 0 } : g))
        );
      } catch (err) {
        if (cancelled) return;
        toast.error(
          err.response?.data?.error || "Couldn't open this group."
        );
        setActiveGroupId(null);
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    })();

    socketService.emit("join_group", { groupId: activeGroupId });

    return () => {
      cancelled = true;
      socketService.emit("leave_group", { groupId: activeGroupId });
    };
  }, [activeGroupId]);

  
  useEffect(() => {
    const unsubscribe = socketService.onReconnect(() => {
      if (activeGroupIdRef.current) {
        socketService.emit("join_group", { groupId: activeGroupIdRef.current });
      }
    });
    return unsubscribe;
  }, []);

  
  useEffect(() => {
    if (!myId) return undefined;

    
    function onReceiveMessage(payload) {
      if (payload.groupId !== activeGroupIdRef.current) return;
      setMessages((prev) => reconcileMessage(prev, payload, myId));

      
      if (payload.senderId && payload.senderId !== myId) {
        groupApi.markRead(payload.groupId).catch(() => {});
      }
    }

    
    function onSidebarMessage(payload) {
      setGroups((prev) =>
        sortGroups(
          prev.map((g) => {
            if (g.id !== payload.groupId) return g;
            const isOpen = g.id === activeGroupIdRef.current;
            const isMine = payload.senderId === myId;
            const isSystem = payload.messageType === "SYSTEM";
            return {
              ...g,
              lastMessage: {
                id: payload.id,
                message: payload.message,
                messageType: payload.messageType,
                senderId: payload.senderId,
                senderName: payload.sender?.name || null,
                createdAt: payload.createdAt,
              },
              lastMessageAt: payload.createdAt,
              unreadCount:
                isOpen || isMine || isSystem
                  ? g.unreadCount
                  : (g.unreadCount || 0) + 1,
            };
          })
        )
      );
    }

    function onGroupCreated(detail) {
      setGroups((prev) =>
        prev.some((g) => g.id === detail.id) ? prev : sortGroups([detail, ...prev])
      );
    }

    function onGroupUpdated(detail) {
      setGroups((prev) =>
        prev.map((g) => (g.id === detail.id ? { ...g, ...detail } : g))
      );
      if (detail.id === activeGroupIdRef.current) {
        setActiveGroup((prev) => (prev ? { ...prev, ...detail } : detail));
      }
    }

    function onMembersUpdated({ groupId, members }) {
      if (groupId === activeGroupIdRef.current) {
        setActiveGroup((prev) =>
          prev ? { ...prev, members, memberCount: members.length } : prev
        );
      }
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId ? { ...g, memberCount: members.length } : g
        )
      );
    }

    function onMemberAdded({ groupId, addedByName, members }) {
      if (groupId === activeGroupIdRef.current && members?.length) {
        const names = members.map((m) => m.user?.name).filter(Boolean).join(", ");
        if (names) toast(`${addedByName || "Someone"} added ${names}`);
      }
    }

    function onMemberRemoved({ groupId, userId, userName, removedByName, left }) {
      if (groupId !== activeGroupIdRef.current || userId === myId) return;
      toast(left ? `${userName || "A member"} left the group` : `${removedByName || "An admin"} removed ${userName || "a member"}`);
    }

    function dropGroup(groupId, message) {
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      if (groupId === activeGroupIdRef.current) {
        setActiveGroupId(null);
        toast(message);
      }
    }

    function onGroupRemoved({ groupId }) {
      dropGroup(groupId, "You were removed from this group");
    }

    function onGroupDeleted({ groupId }) {
      dropGroup(groupId, "This group was deleted");
    }

    function onMessageDeleted({ groupId, messageId }) {
      if (groupId !== activeGroupIdRef.current) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, isDeleted: true, message: null } : m
        )
      );
    }

    function onRead({ groupId }) {
      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, unreadCount: 0 } : g))
      );
    }

    function onTyping({ groupId, userId, name }) {
      if (groupId !== activeGroupIdRef.current || userId === myId) return;
      setTypingUsers((prev) =>
        prev.some((u) => u.userId === userId) ? prev : [...prev, { userId, name }]
      );
      clearTimeout(typingTimersRef.current[userId]);
      typingTimersRef.current[userId] = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
      }, TYPING_TIMEOUT_MS + 1000);
    }

    function onStoppedTyping({ groupId, userId }) {
      if (groupId !== activeGroupIdRef.current) return;
      clearTimeout(typingTimersRef.current[userId]);
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
    }

    function onGroupError({ error }) {
      if (error) toast.error(error);
    }

    socketService.on("receive_message", onReceiveMessage);
    socketService.on("group:message", onSidebarMessage);
    socketService.on("group:created", onGroupCreated);
    socketService.on("group:updated", onGroupUpdated);
    socketService.on("group:members_updated", onMembersUpdated);
    socketService.on("group:member-added", onMemberAdded);
    socketService.on("group:member-removed", onMemberRemoved);
    socketService.on("group:removed", onGroupRemoved);
    socketService.on("group:deleted", onGroupDeleted);
    socketService.on("group:message_deleted", onMessageDeleted);
    socketService.on("group:read", onRead);
    socketService.on("user_typing", onTyping);
    socketService.on("user_stopped_typing", onStoppedTyping);
    socketService.on("group:error", onGroupError);

    const timers = typingTimersRef.current;
    return () => {
      socketService.off("receive_message", onReceiveMessage);
      socketService.off("group:message", onSidebarMessage);
      socketService.off("group:created", onGroupCreated);
      socketService.off("group:updated", onGroupUpdated);
      socketService.off("group:members_updated", onMembersUpdated);
      socketService.off("group:member-added", onMemberAdded);
      socketService.off("group:member-removed", onMemberRemoved);
      socketService.off("group:removed", onGroupRemoved);
      socketService.off("group:deleted", onGroupDeleted);
      socketService.off("group:message_deleted", onMessageDeleted);
      socketService.off("group:read", onRead);
      socketService.off("user_typing", onTyping);
      socketService.off("user_stopped_typing", onStoppedTyping);
      socketService.off("group:error", onGroupError);
      Object.values(timers).forEach(clearTimeout);
    };
  }, [myId]);

  const sendMessage = useCallback(
    async (text) => {
      const body = (text || "").trim();
      if (!body || !activeGroupId) return;

      const tempId = `temp-${Date.now()}`;
      const optimistic = {
        id: tempId,
        groupId: activeGroupId,
        senderId: myId,
        sender: {
          id: myId,
          name: [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.name,
          profileImage: user?.profileImage || null,
        },
        message: body,
        messageType: "TEXT",
        createdAt: new Date().toISOString(),
        _status: "sending",
      };
      setMessages((prev) => [...prev, optimistic]);

      try {
        const saved = await groupApi.sendMessage(activeGroupId, { message: body });
        setMessages((prev) => {
          if (prev.some((m) => m.id === saved.id)) {
            return prev.filter((m) => m.id !== tempId);
          }
          return prev.map((m) => (m.id === tempId ? { ...saved, _status: "sent" } : m));
        });
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, _status: "failed" } : m))
        );
        toast.error(err.response?.data?.error || "Message failed to send");
      }
    },
    [activeGroupId, myId, user]
  );

  const pendingPreviewUrlsRef = useRef(new Map());

  const sendAttachment = useCallback(
    async (file, { caption } = {}) => {
      if (!file || !activeGroupId) return;
      const groupId = activeGroupId;
      const tempId = `temp-att-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const isImage = file.type.startsWith("image/");
      const localPreviewUrl = isImage ? URL.createObjectURL(file) : null;
      if (localPreviewUrl) pendingPreviewUrlsRef.current.set(tempId, localPreviewUrl);

      const optimistic = {
        id: tempId,
        groupId,
        senderId: myId,
        sender: {
          id: myId,
          name: [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.name,
          profileImage: user?.profileImage || null,
        },
        message: caption || null,
        messageType: isImage ? "IMAGE" : "FILE",
        attachment: {
          name: file.name,
          size: file.size,
          mimeType: file.type,
          isImage,
        },
        createdAt: new Date().toISOString(),
        _status: "sending",
        _progress: 0,
        _localFile: file,
        _localPreviewUrl: localPreviewUrl,
      };
      setMessages((prev) => [...prev, optimistic]);

      const upload = async () => {
        try {
          const saved = await groupApi.sendAttachmentMessage(groupId, file, {
            caption,
            onUploadProgress: (pct) =>
              setMessages((prev) =>
                prev.map((m) => (m.id === tempId ? { ...m, _progress: pct } : m))
              ),
          });
          setMessages((prev) => {
            if (prev.some((m) => m.id === saved.id)) {
              return prev.filter((m) => m.id !== tempId);
            }
            return prev.map((m) => (m.id === tempId ? { ...saved, _status: "sent" } : m));
          });
          const url = pendingPreviewUrlsRef.current.get(tempId);
          if (url) {
            URL.revokeObjectURL(url);
            pendingPreviewUrlsRef.current.delete(tempId);
          }
        } catch (err) {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? { ...m, _status: "failed" } : m))
          );
          toast.error(err.response?.data?.error || "Upload failed. Please try again.");
        }
      };

      await upload();
    },
    [activeGroupId, myId, user]
  );

  const retryAttachment = useCallback((tempMessage) => {
    if (!tempMessage?._localFile) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === tempMessage.id ? { ...m, _status: "sending", _progress: 0 } : m))
    );
    groupApi
      .sendAttachmentMessage(tempMessage.groupId, tempMessage._localFile, {
        caption: tempMessage.message,
        onUploadProgress: (pct) =>
          setMessages((prev) =>
            prev.map((m) => (m.id === tempMessage.id ? { ...m, _progress: pct } : m))
          ),
      })
      .then((saved) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === saved.id)) {
            return prev.filter((m) => m.id !== tempMessage.id);
          }
          return prev.map((m) => (m.id === tempMessage.id ? { ...saved, _status: "sent" } : m));
        });
      })
      .catch((err) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempMessage.id ? { ...m, _status: "failed" } : m))
        );
        toast.error(err.response?.data?.error || "Upload failed. Please try again.");
      });
  }, []);

  const notifyTyping = useCallback(() => {
    if (!activeGroupId) return;
    const now = Date.now();
    if (now - typingSentAtRef.current < TYPING_TIMEOUT_MS) return;
    typingSentAtRef.current = now;
    socketService.emit("user_typing", { groupId: activeGroupId });
  }, [activeGroupId]);

  const notifyStoppedTyping = useCallback(() => {
    if (!activeGroupId) return;
    typingSentAtRef.current = 0;
    socketService.emit("user_stopped_typing", { groupId: activeGroupId });
  }, [activeGroupId]);

  const loadOlderMessages = useCallback(async () => {
    if (!activeGroupId || !hasMore || loadingMore || messages.length === 0) return;
    setLoadingMore(true);
    try {
      const oldest = messages[0];
      const page = await groupApi.listMessages(activeGroupId, {
        before: oldest.createdAt,
        limit: 30,
      });
      setMessages((prev) => {
        const known = new Set(prev.map((m) => m.id));
        return [...page.messages.filter((m) => !known.has(m.id)), ...prev];
      });
      setHasMore(page.hasMore);
    } catch {
      toast.error("Couldn't load older messages");
    } finally {
      setLoadingMore(false);
    }
  }, [activeGroupId, hasMore, loadingMore, messages]);

  const refreshActiveGroup = useCallback(async () => {
    if (!activeGroupIdRef.current) return;
    try {
      const detail = await groupApi.getGroup(activeGroupIdRef.current);
      setActiveGroup(detail);
      setGroups((prev) =>
        prev.map((g) => (g.id === detail.id ? { ...g, ...detail } : g))
      );
    } catch {
    }
  }, []);

  return {
    groups,
    groupsLoading,
    groupsError,
    loadGroups,
    setGroups,
    canCreateGroup,
    activeGroupId,
    setActiveGroupId,
    activeGroup,
    refreshActiveGroup,
    messages,
    messagesLoading,
    hasMore,
    loadingMore,
    loadOlderMessages,
    sendMessage,
    sendAttachment,
    retryAttachment,
    typingUsers,
    notifyTyping,
    notifyStoppedTyping,
  };
}

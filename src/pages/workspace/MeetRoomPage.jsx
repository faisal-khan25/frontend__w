import { useCallback, useEffect, useRef, useState, memo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  PhoneOff, MessageSquare, Users, MoreVertical, Copy,
  Send, Loader2, AlertTriangle, RefreshCw, WifiOff,
} from "lucide-react";
import toast from "react-hot-toast";
import { meetApi } from "../../lib/meetApi";
import useAuth from "../../hooks/useAuth";
import { formatTimestamp, formatDateTime } from "../../utils/date";
import socketService from "../../lib/socketService";
import useMeetingWebRTC from "../../hooks/useMeetingWebRTC";

const ParticipantTile = memo(function ParticipantTile({ participant, stream, isLocal = false, isLarge = false, connectionState, cameraOn, micOn }) {
  const videoRef = useRef(null);
  const initials = (participant.user?.name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");

  const size = isLarge ? "text-4xl w-20 h-20" : "text-2xl w-14 h-14";

  const isCamOn = cameraOn !== undefined ? cameraOn : participant.isCameraOn !== false;
  const isMicOnDisplay = micOn !== undefined ? micOn : participant.isMicOn !== false;
  const hasVideoTrack = !!stream?.getVideoTracks().some((t) => t.readyState !== "ended");
  const showVideo = isCamOn && hasVideoTrack;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;
    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }
    video.play().catch(() => {});
  }, [stream, stream?.id]);

  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-2xl bg-gray-900 overflow-hidden
        ${isLarge ? "aspect-video w-full" : "aspect-video"}`}
    >
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${isLocal ? "scale-x-[-1]" : ""}`}
        />
      ) : (
        <div
          className={`rounded-full bg-primary flex items-center justify-center font-bold text-white shrink-0 ${size}`}
          style={{ backgroundColor: stringToColor(participant.user?.name || "") }}
        >
          {participant.user?.profileImage ? (
            <img
              src={participant.user.profileImage}
              alt={participant.user.name}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            initials
          )}
        </div>
      )}

      {!isLocal && (connectionState === "disconnected" || connectionState === "failed") && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="flex items-center gap-2 text-white/80 text-xs bg-black/50 px-3 py-1.5 rounded-full">
            <WifiOff size={13} /> Reconnecting…
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-between gap-2">
          <p className="text-white text-xs font-medium truncate">
            {participant.user?.name || "Unknown"}
            {participant.isMe && " (you)"}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            {isMicOnDisplay ? (
              <Mic size={12} className="text-white" />
            ) : (
              <MicOff size={12} className="text-red-400" />
            )}
            {participant.isScreenSharing && (
              <Monitor size={12} className="text-mint" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

function ParticipantsPanel({ participants, onInvite }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <p className="font-semibold text-white text-sm">
          Participants ({participants.length})
        </p>
        <button
          onClick={onInvite}
          className="text-xs text-primary-300 hover:text-white transition-colors"
        >
          + Invite
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {participants.map((p) => (
          <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 rounded-lg mx-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: stringToColor(p.user?.name || "") }}
            >
              {(p.user?.name || "?")
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((n) => n[0].toUpperCase())
                .join("")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {p.user?.name || "Unknown"}{p.isMe && " (you)"}
              </p>
              <p className="text-white/50 text-xs truncate">{p.user?.email}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {p.isMicOn ? (
                <Mic size={14} className="text-white/60" />
              ) : (
                <MicOff size={14} className="text-red-400" />
              )}
              {!p.isCameraOn && <VideoOff size={14} className="text-red-400" />}
              {p.isScreenSharing && <Monitor size={14} className="text-mint" />}
            </div>
          </div>
        ))}
        {participants.length === 0 && (
          <p className="text-white/40 text-sm text-center py-8">No participants yet</p>
        )}
      </div>
    </div>
  );
}

function ChatPanel({ messages, onSend, isConnected }) {
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput("");
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/10 shrink-0">
        <p className="font-semibold text-white text-sm">Meeting chat</p>
        <p className="text-white/40 text-xs mt-0.5">
          {isConnected ? "Live — messages go to everyone in this meeting" : "Connecting…"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <p className="text-white/40 text-sm text-center py-8">No messages yet. Say hi 👋</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}>
            {!msg.isMe && (
              <p className="text-white/50 text-[11px] mb-1 font-medium">{msg.senderName}</p>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                msg.isMe
                  ? "bg-indigo-600 text-white rounded-br-sm"
                  : "bg-white/10 text-white rounded-bl-sm"
              }`}
            >
              {msg.text}
            </div>
            <p className="text-white/30 text-[10px] mt-1">{formatTimestamp(msg.time)}</p>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 px-3 py-3 border-t border-white/10 shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isConnected ? "Send a message…" : "Connecting…"}
          disabled={!isConnected}
          className="flex-1 bg-white/10 text-white placeholder:text-white/30 rounded-xl px-3 py-2 text-sm outline-none border border-transparent focus:border-indigo-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || !isConnected}
          className="p-2 rounded-xl bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-700 transition-colors"
          aria-label="Send"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

function InviteModal({ meetingUrl, onClose }) {
  function copyLink() {
    navigator.clipboard.writeText(window.location.origin + meetingUrl).catch(() => {});
    toast.success("Link copied");
  }
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-5 space-y-4 border border-white/10">
        <p className="font-bold text-white">Invite people</p>
        <p className="text-white/60 text-sm">Share this link to invite others to the meeting.</p>
        <div className="flex gap-2">
          <input
            readOnly
            value={window.location.origin + meetingUrl}
            className="flex-1 bg-white/10 text-white text-sm rounded-xl px-3 py-2 outline-none border border-white/10"
          />
          <button onClick={copyLink} className="btn-primary btn-sm shrink-0">
            <Copy size={14} /> Copy
          </button>
        </div>
        <button onClick={onClose} className="w-full py-2 text-sm text-white/60 hover:text-white transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}

function CtrlBtn({ on, onIcon: OnIcon, offIcon: OffIcon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-colors ${
        danger
          ? "bg-red-600 hover:bg-red-700 text-white"
          : on
          ? "bg-white/10 hover:bg-white/20 text-white"
          : "bg-red-500/20 hover:bg-red-500/30 text-red-400"
      }`}
    >
      {on ? <OnIcon size={20} /> : <OffIcon size={20} />}
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}

function ElapsedTimer({ joinedAt }) {
  const [elapsed, setElapsed] = useState("00:00");
  useEffect(() => {
    const start = joinedAt ? new Date(joinedAt).getTime() : Date.now();
    function tick() {
      const secs = Math.floor((Date.now() - start) / 1000);
      const m = String(Math.floor(secs / 60)).padStart(2, "0");
      const s = String(secs % 60).padStart(2, "0");
      setElapsed(`${m}:${s}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [joinedAt]);
  return <span className="text-white/60 text-sm font-mono">{elapsed}</span>;
}

function LobbyPreviewVideo({ stream }) {
  const videoRef = useRef(null);
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);
  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="w-full h-full object-cover scale-x-[-1]"
    />
  );
}

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "#6F66FF", "#2BC48A", "#F5A524", "#FF6B6B",
    "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6",
  ];
  return colors[Math.abs(hash) % colors.length];
}

export default function MeetRoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [permissionError, setPermissionError] = useState(null);

  const webrtc = useMeetingWebRTC({ meetingId: id });
  const { localStream, remoteStreams, peerConnectionStates } = webrtc;

  const peerSocketMapRef = useRef({});

  const socketUserMapRef = useRef({});

  const [peerMapVersion, setPeerMapVersion] = useState(0);
  function writePeerMap(userId, socketId) {
    peerSocketMapRef.current[userId] = socketId;
    socketUserMapRef.current[userId] = socketId;
    setPeerMapVersion((v) => v + 1);
  }

  const mediaPromiseRef = useRef(null);

  const [remoteMediaOverride, setRemoteMediaOverride] = useState({});

  const [livePeerUserIds, setLivePeerUserIds] = useState(new Set());

  const [chatMessages, setChatMessages] = useState([]);
  const [chatUnread, setChatUnread] = useState(0);

  const [isSocketConnected, setIsSocketConnected] = useState(() => socketService.connected);

  const [sidePanel, setSidePanel] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [ending, setEnding] = useState(false);
  const [showEndMenu, setShowEndMenu] = useState(false);
  const menuRef = useRef(null);

  const [joinedAt, setJoinedAt] = useState(null);

  const loadMeeting = useCallback(async () => {
    try {
      const data = await meetApi.getMeeting(id);
      setMeeting(data);

      if (data.participants) {
        data.participants.forEach((p) => {
          const uid = p.user?.id;
          if (!uid || p.isMe) return;
          if (!peerSocketMapRef.current[uid]) {
            const sid = socketUserMapRef.current[uid];
            if (sid) peerSocketMapRef.current[uid] = sid;
          }
        });

        const freshIds = new Set(data.participants.map((p) => p.user?.id));
        setLivePeerUserIds((prev) => {
          const next = new Set([...prev].filter((uid) => !freshIds.has(uid)));
          return next.size === prev.size ? prev : next;
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't load this meeting.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadMeeting(); }, [loadMeeting]);

  useEffect(() => {
    if (!joined) return;

    if (socketService.connected) {
      socketService.emit("meet:join", { meetingId: id });
    }

    function onMeetJoined({ meetingId: joinedId }) {
      if (joinedId === id) setIsSocketConnected(true);
    }

    const unsub = socketService.onReconnect(() => {
      console.debug("[meet] reconnected — re-joining room", id);
      socketService.emit("meet:join", { meetingId: id });
    });

    function onConnect()    { setIsSocketConnected(true);  }
    function onDisconnect() { setIsSocketConnected(false); }

    socketService.on("meet:joined",  onMeetJoined);
    socketService.on("connect",      onConnect);
    socketService.on("disconnect",   onDisconnect);

    return () => {
      unsub();
      socketService.off("meet:joined",  onMeetJoined);
      socketService.off("connect",      onConnect);
      socketService.off("disconnect",   onDisconnect);
    };
  }, [joined, id]);

  useEffect(() => {
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowEndMenu(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!joined) return;
    const id_ = setInterval(() => loadMeeting(), 10000);
    return () => clearInterval(id_);
  }, [joined, loadMeeting]);

  useEffect(() => {
    if (!joined) return;
    let cancelled = false;

    async function onPeerJoined({ socketId, userId }) {
      if (cancelled || userId === user?.id) return;
      console.log("[meet] peer-joined", { socketId, userId });

      if (userId) {
        writePeerMap(userId, socketId);

        setLivePeerUserIds((prev) => {
          if (prev.has(userId)) return prev;
          const next = new Set(prev);
          next.add(userId);
          return next;
        });
      } else if (socketId) {
        console.warn("[meet] peer-joined missing userId, socketId=", socketId);
        loadMeeting();
      }

      if (!webrtc.localStreamRef.current && mediaPromiseRef.current) {
        await mediaPromiseRef.current;
      }

      webrtc.createPeerConnection(socketId);
      await webrtc.createOfferTo(socketId);
      setTimeout(() => { if (!cancelled) loadMeeting(); }, 1500);
    }

    function onOffer({ fromSocketId, fromUserId, sdp }) {
      if (cancelled) return;
      console.log("[meet] offer received from", fromSocketId, fromUserId);

      if (fromUserId && fromSocketId) {
        writePeerMap(fromUserId, fromSocketId);

        setLivePeerUserIds((prev) => {
          if (prev.has(fromUserId)) return prev;
          const next = new Set(prev);
          next.add(fromUserId);
          return next;
        });
      } else if (fromSocketId) {
        loadMeeting();
      }

      (async () => {
        if (!webrtc.localStreamRef.current && mediaPromiseRef.current) {
          await mediaPromiseRef.current;
        }
        if (cancelled) return;
        webrtc.handleOffer(fromSocketId, sdp);
      })();
    }

    function onAnswer({ fromSocketId, fromUserId, sdp }) {
      if (cancelled) return;
      console.log("[meet] answer received from", fromSocketId, fromUserId);

      if (fromUserId && fromSocketId) {
        writePeerMap(fromUserId, fromSocketId);
      }

      webrtc.handleAnswer(fromSocketId, sdp);
    }

    function onIceCandidate({ fromSocketId, candidate }) {
      if (cancelled) return;
      console.log("[meet] ice-candidate from", fromSocketId);
      webrtc.handleRemoteIceCandidate(fromSocketId, candidate);
    }

    function onPeerLeft({ userId: leftUserId, socketId }) {
      if (cancelled) return;
      const sid = socketId || peerSocketMapRef.current[leftUserId];
      if (sid) webrtc.removePeer(sid);
      if (leftUserId) {
        delete peerSocketMapRef.current[leftUserId];
        delete socketUserMapRef.current[leftUserId];
        setLivePeerUserIds((prev) => {
          const next = new Set(prev);
          next.delete(leftUserId);
          return next;
        });
        setRemoteMediaOverride((prev) => {
          if (!(leftUserId in prev)) return prev;
          const next = { ...prev };
          delete next[leftUserId];
          return next;
        });
      }
      loadMeeting();
    }

    function onMediaState({ userId: fromUserId, isCameraOn: cam, isMicOn: mic, isScreenSharing: share }) {
      if (cancelled || fromUserId === user?.id) return;
      setRemoteMediaOverride((prev) => ({
        ...prev,
        [fromUserId]: {
          ...(prev[fromUserId] || {}),
          ...(cam !== undefined && { isCameraOn: cam }),
          ...(mic !== undefined && { isMicOn: mic }),
          ...(share !== undefined && { isScreenSharing: share }),
        },
      }));
    }

    function onMeetingEnded() {
      if (cancelled) return;
      toast("Meeting ended by the organizer", { icon: "📞" });
      setMeeting((prev) => (prev ? { ...prev, status: "ENDED" } : prev));
    }

    function onChatMessage({ from, message, sentAt, messageId }) {
      if (cancelled) return;
      if (!message || !from) return;

      setChatMessages((prev) => {
        const isDupe = prev.some(
          (m) => (messageId && m.serverId === messageId) ||
                 (m.senderId === String(from.userId) && m.time === sentAt && m.text === message)
        );
        if (isDupe) return prev;

        const isMe = String(from.userId) === String(user?.id);
        return [
          ...prev,
          {
            id:         messageId || `${sentAt}-${from.userId}`,
            serverId:   messageId || null,
            senderId:   String(from.userId),
            senderName: from.name || "Participant",
            avatar:     from.profileImage || null,
            text:       message,
            time:       sentAt || new Date().toISOString(),
            isMe,
          },
        ];
      });

      setSidePanel((current) => {
        if (current !== "chat") setChatUnread((n) => n + 1);
        return current;
      });
    }

    socketService.off("meet:peer-joined",   onPeerJoined);
    socketService.off("meet:offer",         onOffer);
    socketService.off("meet:answer",        onAnswer);
    socketService.off("meet:ice-candidate", onIceCandidate);
    socketService.off("meet:peer-left",     onPeerLeft);
    socketService.off("meet:media-state",   onMediaState);
    socketService.off("meeting:ended",      onMeetingEnded);
    socketService.off("meet:chat",          onChatMessage);

    socketService.on("meet:peer-joined",    onPeerJoined);
    socketService.on("meet:offer",          onOffer);
    socketService.on("meet:answer",         onAnswer);
    socketService.on("meet:ice-candidate",  onIceCandidate);
    socketService.on("meet:peer-left",      onPeerLeft);
    socketService.on("meet:media-state",    onMediaState);
    socketService.on("meeting:ended",       onMeetingEnded);
    socketService.on("meet:chat",           onChatMessage);

    return () => {
      cancelled = true;
      socketService.off("meet:peer-joined",   onPeerJoined);
      socketService.off("meet:offer",         onOffer);
      socketService.off("meet:answer",        onAnswer);
      socketService.off("meet:ice-candidate", onIceCandidate);
      socketService.off("meet:peer-left",     onPeerLeft);
      socketService.off("meet:media-state",   onMediaState);
      socketService.off("meeting:ended",      onMeetingEnded);
      socketService.off("meet:chat",          onChatMessage);
    };
  }, [joined, user?.id]);

  useEffect(() => {
    return () => {
      webrtc.cleanupAll();
      socketService.off("meet:peer-joined");
      socketService.off("meet:offer");
      socketService.off("meet:answer");
      socketService.off("meet:ice-candidate");
      socketService.off("meet:peer-left");
      socketService.off("meet:media-state");
      socketService.off("meeting:ended");
      socketService.off("meet:chat");
    };
  }, []);

  useEffect(() => {
    function onBeforeUnload() {
      if (!joined) return;
      socketService.emit("meet:leave", { meetingId: id });
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [joined, id]);

  useEffect(() => {
    if (loading || !meeting || joined || meeting.status === "ENDED") return;
    if (webrtc.localStreamRef.current) return;
    if (mediaPromiseRef.current) return;

    mediaPromiseRef.current = webrtc
      .getLocalMedia({ audio: true, video: true })
      .catch((mediaErr) => {
        setPermissionError(
          mediaErr.name === "NotAllowedError" || mediaErr.name === "PermissionDeniedError"
            ? "Camera/microphone access was denied. You can still join, but others won't see or hear you until you allow access."
            : "Camera or microphone not available on this device."
        );
      });
  }, [loading, meeting?.id, meeting?.status, joined]);

  async function handleJoin() {
    setJoining(true);
    try {
      if (!socketService.connected && token) {
        socketService.connect(token);
      }

      const data = await meetApi.joinMeeting(id);
      setMeeting(data);
      setJoinedAt(new Date().toISOString());
      setJoined(true);

      socketService.emit("meet:join", { meetingId: id });

      meetApi.updateMediaState(id, {
        isCameraOn: webrtc.isCameraOn,
        isMicOn: webrtc.isMicOn,
        isScreenSharing: false,
      }).catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't join the meeting");
    } finally {
      setJoining(false);
    }
  }

  function toggleMic() {
    const next = webrtc.toggleMute();
    meetApi.updateMediaState(id, { isMicOn: next }).catch(() => {});
  }

  function toggleCamera() {
    const next = webrtc.toggleCamera();
    meetApi.updateMediaState(id, { isCameraOn: next }).catch(() => {});
  }

  async function toggleScreenShare() {
    if (webrtc.isScreenSharing) {
      await webrtc.stopScreenShare();
      meetApi.updateMediaState(id, { isScreenSharing: false }).catch(() => {});
    } else {
      await webrtc.startScreenShare();
      meetApi.updateMediaState(id, { isScreenSharing: true }).catch(() => {});
    }
  }

  function handleChatSend(text) {
    if (!text?.trim()) return;
    if (!socketService.connected) {
      toast.error("Not connected — please wait a moment and try again.");
      return;
    }
    socketService.emit("meet:chat", {
      meetingId: id,
      message:   text.trim(),
    });
  }

  async function handleLeave() {
    setLeaving(true);
    socketService.emit("meet:leave", { meetingId: id });
    webrtc.cleanupAll();
    try {
      await meetApi.leaveMeeting(id);
    } catch { }
    navigate("/workspace/meet", { replace: true });
  }

  async function handleEnd() {
    setEnding(true);
    socketService.emit("meet:leave", { meetingId: id });
    webrtc.cleanupAll();
    try {
      await meetApi.endMeeting(id);
      toast.success("Meeting ended for everyone");
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't end the meeting");
    } finally {
      setEnding(false);
      setShowEndMenu(false);
      navigate("/workspace/meet", { replace: true });
    }
  }

  useEffect(() => {
    if (joined && meeting?.status === "ENDED") {
      webrtc.cleanupAll();
    }
  }, [joined, meeting?.status]);

  const isOrganizer = meeting?.organizer?.id === user?.id;
  const myParticipant = meeting?.participants?.find((p) => p.isMe);

  function decorateParticipant(p) {
    const override = p.isMe ? null : remoteMediaOverride[p.user?.id];
    const socketId = p.isMe ? null : peerSocketMapRef.current[p.user?.id];
    return {
      participant: override ? { ...p, ...override } : p,
      stream: p.isMe ? localStream : (socketId ? remoteStreams[socketId] : null),
      connectionState: socketId ? peerConnectionStates[socketId] : undefined,
    };
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-white">
          <Loader2 size={32} className="animate-spin text-primary-400" />
          <p className="text-sm text-white/60">Loading meeting…</p>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center text-white space-y-4 max-w-sm px-6">
          <AlertTriangle size={40} className="text-red-400 mx-auto" />
          <p className="font-bold text-lg">{error || "Meeting not found"}</p>
          <button
            onClick={() => navigate("/workspace/meet")}
            className="btn-primary btn-sm"
          >
            Back to Meet
          </button>
        </div>
      </div>
    );
  }

  if (meeting.status === "ENDED") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center text-white space-y-4 max-w-sm px-6">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto">
            <PhoneOff size={28} className="text-white/60" />
          </div>
          <p className="font-bold text-xl">Meeting ended</p>
          <p className="text-white/50 text-sm">This meeting has been ended by the organizer.</p>
          <button
            onClick={() => navigate("/workspace/meet")}
            className="btn-primary btn-sm"
          >
            Back to Meet
          </button>
        </div>
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 gap-6">
        <div className="text-center space-y-2">
          <h1 className="font-display text-2xl font-bold text-white">{meeting.title || "Team Meeting"}</h1>
          <p className="text-white/50 text-sm">
            {meeting.status === "SCHEDULED"
              ? `Scheduled for ${formatDateTime(meeting.scheduledAt)}`
              : `${meeting.participantCount} in the meeting`}
          </p>
        </div>

        <div className="w-full max-w-sm aspect-video bg-gray-900 rounded-2xl flex flex-col items-center justify-center gap-3 border border-white/10 overflow-hidden relative">
          {localStream && webrtc.isCameraOn ? (
            <LobbyPreviewVideo stream={localStream} />
          ) : (
            <>
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold"
                style={{ backgroundColor: stringToColor(user?.name || "") }}
              >
                {(user?.name || "U").split(" ").filter(Boolean).slice(0, 2).map((n) => n[0].toUpperCase()).join("")}
              </div>
              <p className="text-white/60 text-sm">{user?.name}</p>
            </>
          )}
        </div>

        {permissionError && (
          <div className="w-full max-w-sm flex items-start gap-2 text-amber-300 text-xs bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>{permissionError}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={toggleMic}
            disabled={!localStream}
            className={`p-3 rounded-full transition-colors disabled:opacity-40 ${webrtc.isMicOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-500/20 text-red-400 hover:bg-red-500/30"}`}
            title={webrtc.isMicOn ? "Mute mic" : "Unmute mic"}
          >
            {webrtc.isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>
          <button
            onClick={toggleCamera}
            disabled={!localStream}
            className={`p-3 rounded-full transition-colors disabled:opacity-40 ${webrtc.isCameraOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-500/20 text-red-400 hover:bg-red-500/30"}`}
            title={webrtc.isCameraOn ? "Turn off camera" : "Turn on camera"}
          >
            {webrtc.isCameraOn ? <Video size={20} /> : <VideoOff size={20} />}
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate("/workspace/meet")}
            className="btn-ghost btn-sm text-white/60 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleJoin}
            disabled={joining}
            className="btn-primary"
          >
            {joining ? (
              <><Loader2 size={16} className="animate-spin" /> Joining…</>
            ) : (
              <><Video size={16} /> Join now</>
            )}
          </button>
        </div>
      </div>
    );
  }

  const restParticipants = meeting.participants || [];

  
  const restUserIds = new Set(restParticipants.map((p) => p.user?.id));
  const extraPeers = [...livePeerUserIds].filter((uid) => !restUserIds.has(uid));
  const allParticipants = [
    ...restParticipants,
    ...extraPeers.map((uid) => ({
      id: `live-${uid}`,
      user: { id: uid, name: "Joining…" },
      isMe: false,
      isCameraOn: true,
      isMicOn: true,
      isScreenSharing: false,
    })),
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900/80 backdrop-blur-sm border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <p className="text-white font-semibold text-sm truncate max-w-[200px]">
            {meeting.title || "Team Meeting"}
          </p>
          <ElapsedTimer joinedAt={joinedAt} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadMeeting}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            title="Refresh participants"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      
      <div className="flex flex-1 min-h-0">
        
        <div className="flex-1 flex flex-col min-w-0 p-3 gap-3 overflow-hidden">
          {allParticipants.length <= 1 ? (
           
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex-1 relative">
                {myParticipant && (
                  <ParticipantTile
                    participant={myParticipant}
                    isLocal
                    isLarge
                    stream={localStream}
                    cameraOn={webrtc.isCameraOn}
                    micOn={webrtc.isMicOn}
                  />
                )}
              </div>
              {allParticipants.length === 1 && (
                <div className="flex items-center justify-center py-4">
                  <div className="text-center text-white/50 space-y-1">
                    <Users size={28} className="mx-auto" />
                    <p className="text-sm">Waiting for others to join…</p>
                    <button
                      onClick={() => setShowInvite(true)}
                      className="text-primary-300 hover:text-white text-xs underline"
                    >
                      Invite someone
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : allParticipants.length === 2 ? (
            <div className="flex-1 grid grid-cols-2 gap-3">
              {allParticipants.map((p) => {
                const d = decorateParticipant(p);
                return (
                  <ParticipantTile
                    key={p.id}
                    participant={d.participant}
                    stream={d.stream}
                    isLocal={p.isMe}
                    connectionState={d.connectionState}
                    cameraOn={p.isMe ? webrtc.isCameraOn : undefined}
                    micOn={p.isMe ? webrtc.isMicOn : undefined}
                  />
                );
              })}
            </div>
          ) : (
            <div
              className="flex-1 grid gap-3"
              style={{
                gridTemplateColumns: `repeat(${Math.min(allParticipants.length, 3)}, 1fr)`,
              }}
            >
              {allParticipants.map((p) => {
                const d = decorateParticipant(p);
                return (
                  <ParticipantTile
                    key={p.id}
                    participant={d.participant}
                    stream={d.stream}
                    isLocal={p.isMe}
                    connectionState={d.connectionState}
                    cameraOn={p.isMe ? webrtc.isCameraOn : undefined}
                    micOn={p.isMe ? webrtc.isMicOn : undefined}
                  />
                );
              })}
            </div>
          )}
        </div>

        {sidePanel && (
          <div className="w-80 shrink-0 bg-gray-900 border-l border-white/10 flex flex-col overflow-hidden">
            <div className="flex border-b border-white/10 shrink-0">
              <button
                onClick={() => setSidePanel("participants")}
                className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  sidePanel === "participants" ? "text-white border-b-2 border-primary" : "text-white/40 hover:text-white"
                }`}
              >
                <Users size={14} /> People
              </button>
              <button
                onClick={() => { setSidePanel("chat"); setChatUnread(0); }}
                className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  sidePanel === "chat" ? "text-white border-b-2 border-primary" : "text-white/40 hover:text-white"
                }`}
              >
                <MessageSquare size={14} /> Chat
                {chatUnread > 0 && sidePanel !== "chat" && (
                  <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {chatUnread > 9 ? "9+" : chatUnread}
                  </span>
                )}
              </button>
              <button
                onClick={() => setSidePanel(null)}
                className="px-3 text-white/40 hover:text-white transition-colors"
                title="Close panel"
              >
                ×
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              {sidePanel === "participants" && (
                <ParticipantsPanel
                  participants={allParticipants}
                  onInvite={() => setShowInvite(true)}
                />
              )}
              {sidePanel === "chat" && (
                <ChatPanel
                  messages={chatMessages}
                  onSend={handleChatSend}
                  isConnected={isSocketConnected}
                />
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-900/90 backdrop-blur-sm border-t border-white/10 px-4 py-4 shrink-0">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <CtrlBtn
            on={webrtc.isMicOn}
            onIcon={Mic}
            offIcon={MicOff}
            label={webrtc.isMicOn ? "Mute" : "Unmute"}
            onClick={toggleMic}
          />
          <CtrlBtn
            on={webrtc.isCameraOn}
            onIcon={Video}
            offIcon={VideoOff}
            label={webrtc.isCameraOn ? "Camera off" : "Camera on"}
            onClick={toggleCamera}
          />
          <CtrlBtn
            on={webrtc.isScreenSharing}
            onIcon={Monitor}
            offIcon={MonitorOff}
            label={webrtc.isScreenSharing ? "Stop share" : "Share screen"}
            onClick={toggleScreenShare}
          />

          <div className="w-px h-10 bg-white/10 hidden sm:block" />

          <button
            onClick={() => setSidePanel(sidePanel === "participants" ? null : "participants")}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-colors ${
              sidePanel === "participants" ? "bg-white/20 text-white" : "bg-white/10 hover:bg-white/20 text-white"
            }`}
            title="Participants"
          >
            <Users size={20} />
            <span className="text-[11px] font-medium">
              People{allParticipants.length > 0 && ` · ${allParticipants.length}`}
            </span>
          </button>

          <button
            onClick={() => { setSidePanel(sidePanel === "chat" ? null : "chat"); setChatUnread(0); }}
            className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-colors ${
              sidePanel === "chat" ? "bg-white/20 text-white" : "bg-white/10 hover:bg-white/20 text-white"
            }`}
            title="Meeting chat"
          >
            <MessageSquare size={20} />
            <span className="text-[11px] font-medium">Chat</span>
            {chatUnread > 0 && sidePanel !== "chat" && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {chatUnread > 9 ? "9+" : chatUnread}
              </span>
            )}
          </button>

          <div className="w-px h-10 bg-white/10 hidden sm:block" />

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => {
                if (isOrganizer) {
                  setShowEndMenu((v) => !v);
                } else {
                  handleLeave();
                }
              }}
              disabled={leaving || ending}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-2xl bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-60"
            >
              {leaving || ending ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <PhoneOff size={20} />
              )}
              <span className="text-[11px] font-medium">
                {isOrganizer ? "End" : "Leave"}
              </span>
            </button>

            {isOrganizer && showEndMenu && (
              <div className="absolute bottom-full mb-2 right-0 bg-gray-800 border border-white/10 rounded-xl overflow-hidden shadow-2xl min-w-[180px]">
                <button
                  onClick={handleLeave}
                  disabled={leaving}
                  className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <PhoneOff size={14} className="text-orange-400" />
                  Leave meeting
                </button>
                <button
                  onClick={handleEnd}
                  disabled={ending}
                  className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/10 transition-colors flex items-center gap-2 border-t border-white/10"
                >
                  <PhoneOff size={14} />
                  End for everyone
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showInvite && (
        <InviteModal
          meetingUrl={meeting.meetingUrl || `/workspace/meet/${id}`}
          onClose={() => setShowInvite(false)}
        />
      )}
    </div>
  );
}
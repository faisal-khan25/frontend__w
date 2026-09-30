import { useEffect, useRef, useState } from "react";
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  PhoneOff, Loader2, AlertTriangle, MonitorSmartphone,
} from "lucide-react";
import toast from "react-hot-toast";
import useWebRTC from "../../../hooks/useWebRTC";
import socketService from "../../../lib/socketService";
import { meetApi } from "../../../lib/meetApi";
import { formatTimestamp } from "../../../utils/date";
import useAuth from "../../../hooks/useAuth";

function Avatar({ name, image, size = "lg" }) {
  const s = size === "lg" ? "w-24 h-24 text-4xl" : "w-12 h-12 text-lg";
  const initials = (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");

  return (
    <div
      className={`${s} rounded-full bg-primary flex items-center justify-center font-bold text-white overflow-hidden shrink-0`}
    >
      {image ? (
        <img src={image} alt={name} className="w-full h-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}

function CtrlButton({ active, onIcon: OnIcon, offIcon: OffIcon, label, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`flex flex-col items-center gap-1 px-4 py-3 rounded-2xl transition-colors focus:outline-none focus:ring-2 focus:ring-white/30
        ${danger
          ? "bg-red-600 hover:bg-red-700 text-white"
          : active
          ? "bg-white/15 hover:bg-white/25 text-white"
          : "bg-red-500/20 hover:bg-red-500/30 text-red-400"
        }`}
    >
      {active ? <OnIcon size={22} /> : <OffIcon size={22} />}
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}

function ElapsedTimer({ startTime }) {
  const [elapsed, setElapsed] = useState("00:00");
  useEffect(() => {
    const start = startTime ?? Date.now();
    function tick() {
      const secs = Math.floor((Date.now() - start) / 1000);
      const m = String(Math.floor(secs / 60)).padStart(2, "0");
      const s = String(secs % 60).padStart(2, "0");
      setElapsed(`${m}:${s}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime]);
  return <span className="font-mono text-sm text-white/60">{elapsed}</span>;
}

export default function CallRoom({
  meetingId,
  peerName,
  peerImage,
  callType = "video",
  isIncoming = false,
  onEnd,
}) {
  const { user } = useAuth();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const [callState, setCallState] = useState("connecting");
  const [peerSocketId, setPeerSocketId] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [permissionError, setPermissionError] = useState(null);
  const [remoteMediaState, setRemoteMediaState] = useState({
    isCameraOn: true,
    isMicOn: true,
    isScreenSharing: false,
  });

  const {
    localStream,
    remoteStreams,
    isMicOn,
    isCameraOn,
    isScreenSharing,
    connectionState,
    getLocalMedia,
    addLocalTracksToPeer,
    createPeerConnection,
    createOffer,
    createAnswer,
    handleRemoteAnswer,
    handleIceCandidate,
    toggleMute,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    cleanupCall,
  } = useWebRTC({ meetingId, myUserId: user?.id });

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    const stream = peerSocketId ? remoteStreams[peerSocketId] : null;
    if (remoteVideoRef.current && stream) {
      remoteVideoRef.current.srcObject = stream;
    }
  }, [remoteStreams, peerSocketId]);

  useEffect(() => {
    if (connectionState === "connected") {
      setCallState("active");
      setStartTime(Date.now());
    } else if (connectionState === "failed" || connectionState === "disconnected") {
      setCallState("error");
    }
  }, [connectionState]);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      try {
        const stream = await getLocalMedia({
          audio: true,
          video: callType === "video",
        });
        if (cancelled) return;

        socketService.emit("meet:join", { meetingId });

        await meetApi.joinMeeting(meetingId).catch(() => {});

        socketService.on("meet:peer-joined", async ({ socketId: remSockId, userId }) => {
          if (cancelled || userId === user?.id) return;
          setPeerSocketId(remSockId);
          const pc = createPeerConnection(remSockId);
          addLocalTracksToPeer(pc, stream);
          await createOffer(remSockId);
        });

        socketService.on("meet:offer", async ({ fromSocketId, sdp }) => {
          if (cancelled) return;
          setPeerSocketId(fromSocketId);
          const pc = createPeerConnection(fromSocketId);
          addLocalTracksToPeer(pc, stream);
          await createAnswer(fromSocketId, sdp);
        });

        socketService.on("meet:answer", async ({ sdp }) => {
          if (cancelled) return;
          await handleRemoteAnswer(sdp);
        });

        socketService.on("meet:ice-candidate", async ({ fromSocketId, candidate }) => {
          if (cancelled) return;
          await handleIceCandidate(candidate);
        });

        socketService.on("meet:peer-left", ({ userId: leftId }) => {
          if (cancelled) return;
          if (leftId !== user?.id) {
            setCallState("ended");
            toast("Call ended — the other person left", { icon: "📞" });
            setTimeout(handleEnd, 2000);
          }
        });

        socketService.on("meet:media-state", (data) => {
          if (cancelled || data.userId === user?.id) return;
          setRemoteMediaState({
            isCameraOn: data.isCameraOn ?? true,
            isMicOn: data.isMicOn ?? true,
            isScreenSharing: data.isScreenSharing ?? false,
          });
        });

      } catch (err) {
        if (cancelled) return;
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setPermissionError("Camera/microphone permission denied. Please allow access and try again.");
        } else if (err.name === "NotFoundError") {
          setPermissionError("Camera or microphone not found on this device.");
        } else {
          setPermissionError("Could not access camera/microphone: " + err.message);
        }
        setCallState("error");
      }
    }

    setup();

    return () => {
      cancelled = true;
      socketService.off("meet:peer-joined");
      socketService.off("meet:offer");
      socketService.off("meet:answer");
      socketService.off("meet:ice-candidate");
      socketService.off("meet:peer-left");
      socketService.off("meet:media-state");
    };
  }, [meetingId]);

  function handleEnd() {
    socketService.emit("meet:leave", { meetingId });
    meetApi.leaveMeeting(meetingId).catch(() => {});
    cleanupCall();
    onEnd?.();
  }

  if (callState === "error") {
    return (
      <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col items-center justify-center gap-4 text-white text-center p-6">
        <AlertTriangle size={40} className="text-red-400" />
        <p className="font-bold text-lg">Call failed</p>
        <p className="text-white/60 text-sm max-w-sm">
          {permissionError || "The connection was lost. Please try again."}
        </p>
        <button onClick={() => { cleanupCall(); onEnd?.(); }} className="btn-primary btn-sm mt-2">
          Close
        </button>
      </div>
    );
  }

  const isVideoCall = callType === "video";
  const remoteStream = peerSocketId ? remoteStreams[peerSocketId] : null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col select-none">
      <div className="flex-1 relative overflow-hidden">

        {isVideoCall ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-gray-900">
            <Avatar name={peerName} image={peerImage} size="lg" />
            <p className="font-display font-bold text-white text-2xl">{peerName}</p>
            {callState === "connecting" ? (
              <div className="flex items-center gap-2 text-white/60">
                <Loader2 size={16} className="animate-spin" /> Connecting…
              </div>
            ) : (
              <ElapsedTimer startTime={startTime} />
            )}
          </div>
        )}

        {isVideoCall && !remoteMediaState.isCameraOn && remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <Avatar name={peerName} image={peerImage} size="lg" />
          </div>
        )}

        {callState === "connecting" && isVideoCall && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 gap-3">
            <Avatar name={peerName} image={peerImage} size="lg" />
            <p className="font-bold text-white text-xl">{peerName}</p>
            <div className="flex items-center gap-2 text-white/60">
              <Loader2 size={16} className="animate-spin" /> Connecting…
            </div>
          </div>
        )}

        {isVideoCall && (
          <div className="absolute bottom-4 right-4 w-40 aspect-video rounded-xl overflow-hidden bg-gray-800 border-2 border-white/20 shadow-xl">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!isCameraOn && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <VideoOff size={20} className="text-white/40" />
              </div>
            )}
          </div>
        )}

        <div className="absolute top-0 left-0 right-0 px-5 py-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-3">
            <Avatar name={peerName} image={peerImage} size="sm" />
            <div>
              <p className="font-semibold text-white text-sm">{peerName}</p>
              {callState === "active" && <ElapsedTimer startTime={startTime} />}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!remoteMediaState.isMicOn && (
              <span className="flex items-center gap-1 text-xs text-red-400 bg-black/40 px-2 py-1 rounded-full">
                <MicOff size={12} /> Muted
              </span>
            )}
            {remoteMediaState.isScreenSharing && (
              <span className="flex items-center gap-1 text-xs text-mint bg-black/40 px-2 py-1 rounded-full">
                <MonitorSmartphone size={12} /> Sharing
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-900/95 backdrop-blur-sm border-t border-white/10 px-4 py-4">
        <div className="flex items-center justify-center gap-3 flex-wrap max-w-lg mx-auto">
          <CtrlButton
            active={isMicOn}
            onIcon={Mic}
            offIcon={MicOff}
            label={isMicOn ? "Mute" : "Unmute"}
            onClick={toggleMute}
          />

          {isVideoCall && (
            <CtrlButton
              active={isCameraOn}
              onIcon={Video}
              offIcon={VideoOff}
              label={isCameraOn ? "Camera off" : "Camera on"}
              onClick={toggleCamera}
            />
          )}

          {isVideoCall && (
            <CtrlButton
              active={!isScreenSharing}
              onIcon={MonitorOff}
              offIcon={Monitor}
              label={isScreenSharing ? "Stop share" : "Share screen"}
              onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            />
          )}

          <button
            type="button"
            onClick={handleEnd}
            className="flex flex-col items-center gap-1 px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            <PhoneOff size={22} />
            <span className="text-[11px] font-medium">End call</span>
          </button>
        </div>
      </div>
    </div>
  );
}

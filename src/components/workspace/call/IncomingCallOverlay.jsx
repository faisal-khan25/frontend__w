import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Video, Mic } from "lucide-react";
import { useCallContext } from "../../../context/CallContext";
import socketService from "../../../lib/socketService";
import CallRoom from "./CallRoom";

const RING_TIMEOUT_MS = 45_000;

function Avatar({ name, image }) {
  const initials = (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
  return (
    <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center font-bold text-white text-2xl overflow-hidden mx-auto">
      {image
        ? <img src={image} alt={name} className="w-full h-full object-cover" />
        : initials}
    </div>
  );
}

function RingEffect({ children }) {
  return (
    <div className="relative">
      <div className="absolute inset-0 rounded-full bg-mint/30 animate-ping" />
      <div className="relative">{children}</div>
    </div>
  );
}

export default function IncomingCallOverlay() {
  const { incomingCall, clearIncomingCall, setActiveCall, clearActiveCall } = useCallContext();
  const [inCall, setInCall] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!incomingCall) {
      clearTimeout(timerRef.current);
      return;
    }
    timerRef.current = setTimeout(() => {
      handleReject();
    }, RING_TIMEOUT_MS);

    return () => clearTimeout(timerRef.current);
  }, [incomingCall]);

  function handleAccept() {
    clearTimeout(timerRef.current);
    socketService.emit("call:accepted", {
      callId: incomingCall.callId,
      meetingId: incomingCall.meetingId,
    });
    setActiveCall({
      meetingId: incomingCall.meetingId,
      type: incomingCall.type,
    });
    setInCall(true);
  }

  function handleReject() {
    clearTimeout(timerRef.current);
    socketService.emit("call:rejected", {
      callId: incomingCall.callId,
      meetingId: incomingCall.meetingId,
    });
    clearIncomingCall();
  }

  function handleCallEnd() {
    setInCall(false);
    clearIncomingCall();
    clearActiveCall();
  }

  if (!incomingCall) return null;

  if (inCall) {
    return (
      <CallRoom
        meetingId={incomingCall.meetingId}
        peerName={incomingCall.callerName}
        peerImage={incomingCall.callerImage}
        callType={incomingCall.type}
        isIncoming
        onEnd={handleCallEnd}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
    >
      <div className="w-full max-w-xs bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 text-white">
        <div className="px-6 pt-8 pb-6 flex flex-col items-center gap-3 text-center">
          <RingEffect>
            <Avatar name={incomingCall.callerName} image={incomingCall.callerImage} />
          </RingEffect>

          <div>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mt-2">
              Incoming {incomingCall.type === "video" ? "Video" : "Audio"} Call
            </p>
            <p className="font-display font-bold text-xl mt-1">
              {incomingCall.callerName}
            </p>
          </div>

          <span className="flex items-center gap-1.5 text-xs font-medium bg-white/10 px-3 py-1.5 rounded-full">
            {incomingCall.type === "video"
              ? <><Video size={12} /> Video call</>
              : <><Mic size={12} /> Audio call</>
            }
          </span>
        </div>

        <div className="grid grid-cols-2 border-t border-white/10">
          <button
            onClick={handleReject}
            className="flex flex-col items-center gap-2 py-5 text-red-400 hover:bg-red-500/10 transition-colors border-r border-white/10"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <PhoneOff size={22} />
            </div>
            <span className="text-sm font-medium">Decline</span>
          </button>

          <button
            onClick={handleAccept}
            className="flex flex-col items-center gap-2 py-5 text-mint hover:bg-mint/10 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-mint/20 flex items-center justify-center">
              <Phone size={22} />
            </div>
            <span className="text-sm font-medium">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import socketService from "../lib/socketService";
import { useCallContext } from "../context/CallContext";
import { meetApi } from "../lib/meetApi";
import useAuth from "./useAuth";

export default function useCallSocket() {
  const { token, isAuthenticated, user } = useAuth();
  const { setIncomingCall, clearIncomingCall, setActiveCall, clearActiveCall } = useCallContext();

  const outgoingCallRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated && token) {
      socketService.connect(token);
    } else {
      socketService.disconnect();
    }
    return () => {
    };
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (!isAuthenticated) return;

    function onCallIncoming({ callId, meetingId, callerId, callerName, callerImage, type }) {
      if (callerId === user?.id) return;

      setIncomingCall({ callId, meetingId, callerName, callerImage, type });
    }

    function onCallAccepted({ callId, meetingId }) {
      if (outgoingCallRef.current?.callId !== callId) return;
      setActiveCall({ meetingId, type: outgoingCallRef.current?.type });
      outgoingCallRef.current = null;
    }

    function onCallRejected({ callId }) {
      if (outgoingCallRef.current?.callId !== callId) return;
      toast("Call declined", { icon: "📵" });
      clearActiveCall();
      outgoingCallRef.current = null;
    }

    function onCallEnded({ callId }) {
      if (outgoingCallRef.current?.callId === callId) {
        clearActiveCall();
        outgoingCallRef.current = null;
      }
      clearIncomingCall();
    }

    socketService.on("call:incoming", onCallIncoming);
    socketService.on("call:accepted", onCallAccepted);
    socketService.on("call:rejected", onCallRejected);
    socketService.on("call:ended", onCallEnded);

    return () => {
      socketService.off("call:incoming", onCallIncoming);
      socketService.off("call:accepted", onCallAccepted);
      socketService.off("call:rejected", onCallRejected);
      socketService.off("call:ended", onCallEnded);
    };
  }, [isAuthenticated, user?.id, setIncomingCall, clearIncomingCall, setActiveCall, clearActiveCall]);

  async function startCall({ targetUserId, targetName, type = "video", conversationId }) {
    const meeting = await meetApi.createMeeting({
      title: `${type === "video" ? "Video" : "Audio"} call`,
      conversationId: conversationId || undefined,
    });

    const callId = `call_${Date.now()}`;

    outgoingCallRef.current = { callId, meetingId: meeting.id, type };

    socketService.emit("call:invite", {
      callId,
      meetingId: meeting.id,
      targetUserId,
      type,
    });

    return { callId, meetingId: meeting.id };
  }

  function cancelCall(callId, meetingId) {
    socketService.emit("call:cancel", { callId, meetingId });
    clearActiveCall();
    outgoingCallRef.current = null;
  }

  return { startCall, cancelCall };
}

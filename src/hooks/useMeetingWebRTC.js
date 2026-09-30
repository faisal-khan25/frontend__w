import { useCallback, useRef, useState } from "react";
import socketService from "../lib/socketService";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    ...(import.meta.env.VITE_TURN_URL
      ? [{
          urls: import.meta.env.VITE_TURN_URL,
          username: import.meta.env.VITE_TURN_USERNAME,
          credential: import.meta.env.VITE_TURN_CREDENTIAL,
        }]
      : []),
  ],
};

export default function useMeetingWebRTC({ meetingId }) {
  const peerConnectionsRef = useRef({});
  const pendingCandidatesRef = useRef({});
  const remoteDescSetRef = useRef({});

  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [peerConnectionStates, setPCStates] = useState({});
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  function setPCState(socketId, state) {
    setPCStates((prev) => ({ ...prev, [socketId]: state }));
  }

  function addRemoteStream(socketId, stream) {
    setRemoteStreams((prev) => ({ ...prev, [socketId]: stream }));
  }

  function removeRemoteStream(socketId) {
    setRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[socketId];
      return next;
    });
  }

  const getLocalMedia = useCallback(async ({ audio = true, video = true } = {}) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio, video });
    localStreamRef.current = stream;
    setLocalStream(stream);
    setIsMicOn(true);
    setIsCameraOn(video);

    for (const pc of Object.values(peerConnectionsRef.current)) {
      const existingKinds = new Set(
        pc.getSenders().map((s) => s.track?.kind).filter(Boolean)
      );
      stream.getTracks().forEach((t) => {
        if (!existingKinds.has(t.kind)) pc.addTrack(t, stream);
      });
    }

    return stream;
  }, []);

  const createPeerConnection = useCallback((socketId) => {
    if (peerConnectionsRef.current[socketId]) {
      peerConnectionsRef.current[socketId].close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current[socketId] = pc;
    remoteDescSetRef.current[socketId] = false;
    pendingCandidatesRef.current[socketId] = [];

    pc.onicecandidate = ({ candidate }) => {
      if (!candidate) return;
      socketService.emit("meet:ice-candidate", {
        meetingId,
        targetSocketId: socketId,
        candidate: candidate.toJSON(),
      });
    };

    pc.ontrack = ({ streams, track }) => {
      console.log("[webrtc] ontrack received", { socketId, kind: track.kind, streams: streams?.length });
      if (streams?.[0]) {
        console.log("[webrtc] remote stream attached to socketId", socketId);
        addRemoteStream(socketId, streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("[webrtc] connectionState", socketId, pc.connectionState);
      setPCState(socketId, pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[webrtc] iceConnectionState", socketId, pc.iceConnectionState);
    };

    pc.onnegotiationneeded = async () => {
      try {
        if (pc.signalingState !== "stable") return;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketService.emit("meet:offer", {
          meetingId,
          targetSocketId: socketId,
          fromSocketId: socketService.id,
          sdp: pc.localDescription,
        });
      } catch (err) {
        console.error("[webrtc] renegotiation failed", err);
      }
    };

    const localStream = localStreamRef.current;
    if (localStream) {
      localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
    }

    return pc;
  }, [meetingId]);

  const createOfferTo = useCallback(async (socketId) => {
    const pc = peerConnectionsRef.current[socketId];
    if (!pc) return;
    try {
      console.log("[webrtc] createOffer →", socketId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log("[webrtc] offer sent →", socketId);
      socketService.emit("meet:offer", {
        meetingId,
        targetSocketId: socketId,
        fromSocketId: socketService.id,
        sdp: pc.localDescription,
      });
    } catch (err) {
      console.error("[webrtc] createOffer failed", err);
    }
  }, [meetingId]);

  const handleOffer = useCallback(async (fromSocketId, offerSdp) => {
    let pc = peerConnectionsRef.current[fromSocketId];
    if (!pc) pc = createPeerConnection(fromSocketId);

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offerSdp));
      remoteDescSetRef.current[fromSocketId] = true;

      for (const c of (pendingCandidatesRef.current[fromSocketId] || [])) {
        await pc.addIceCandidate(new RTCIceCandidate(c)).catch(console.warn);
      }
      pendingCandidatesRef.current[fromSocketId] = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketService.emit("meet:answer", {
        meetingId,
        targetSocketId: fromSocketId,
        fromSocketId: socketService.id,
        sdp: pc.localDescription,
      });
    } catch (err) {
      console.error("[webrtc] handleOffer failed", err);
    }
  }, [meetingId, createPeerConnection]);

  const handleAnswer = useCallback(async (fromSocketId, answerSdp) => {
    const pc = peerConnectionsRef.current[fromSocketId];
    if (!pc) return;
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answerSdp));
      remoteDescSetRef.current[fromSocketId] = true;

      for (const c of (pendingCandidatesRef.current[fromSocketId] || [])) {
        await pc.addIceCandidate(new RTCIceCandidate(c)).catch(console.warn);
      }
      pendingCandidatesRef.current[fromSocketId] = [];
    } catch (err) {
      console.error("[webrtc] handleAnswer failed", err);
    }
  }, []);

  const handleRemoteIceCandidate = useCallback(async (fromSocketId, candidate) => {
    const pc = peerConnectionsRef.current[fromSocketId];
    if (!pc) return;

    if (!remoteDescSetRef.current[fromSocketId]) {
      pendingCandidatesRef.current[fromSocketId] =
        pendingCandidatesRef.current[fromSocketId] || [];
      pendingCandidatesRef.current[fromSocketId].push(candidate);
      return;
    }
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn("[webrtc] addIceCandidate error", err);
    }
  }, []);

  const removePeer = useCallback((socketId) => {
    const pc = peerConnectionsRef.current[socketId];
    if (pc) { pc.close(); delete peerConnectionsRef.current[socketId]; }
    delete remoteDescSetRef.current[socketId];
    delete pendingCandidatesRef.current[socketId];
    removeRemoteStream(socketId);
    setPCStates((prev) => { const n = { ...prev }; delete n[socketId]; return n; });
  }, []);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return isMicOn;
    const next = !isMicOn;
    stream.getAudioTracks().forEach((t) => { t.enabled = next; });
    setIsMicOn(next);
    socketService.emit("meet:media-state", { meetingId, isMicOn: next });
    return next;
  }, [meetingId, isMicOn]);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return isCameraOn;
    const next = !isCameraOn;
    stream.getVideoTracks().forEach((t) => { t.enabled = next; });
    setIsCameraOn(next);
    socketService.emit("meet:media-state", { meetingId, isCameraOn: next });
    return next;
  }, [meetingId, isCameraOn]);

  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true, audio: false,
      });
      screenStreamRef.current = screenStream;
      const screenTrack = screenStream.getVideoTracks()[0];

      for (const pc of Object.values(peerConnectionsRef.current)) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(screenTrack).catch(console.warn);
      }

      if (localStreamRef.current) {
        const cloned = localStreamRef.current.clone();
        cloned.getVideoTracks().forEach((t) => cloned.removeTrack(t));
        cloned.addTrack(screenTrack);
        setLocalStream(cloned);
      }

      screenTrack.onended = () => stopScreenShare();
      setIsScreenSharing(true);
      socketService.emit("meet:media-state", { meetingId, isScreenSharing: true });
    } catch (err) {
      if (err.name !== "NotAllowedError") console.error("[webrtc] screen share error", err);
    }
  }, [meetingId]);

  const stopScreenShare = useCallback(async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    const cameraStream = localStreamRef.current;
    if (cameraStream) {
      const camTrack = cameraStream.getVideoTracks()[0];
      for (const pc of Object.values(peerConnectionsRef.current)) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender && camTrack) await sender.replaceTrack(camTrack).catch(console.warn);
      }
      setLocalStream(cameraStream);
    }
    setIsScreenSharing(false);
    socketService.emit("meet:media-state", { meetingId, isScreenSharing: false });
  }, [meetingId]);

  const cleanupAll = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    for (const pc of Object.values(peerConnectionsRef.current)) {
      pc.close();
    }
    peerConnectionsRef.current = {};
    remoteDescSetRef.current = {};
    pendingCandidatesRef.current = {};

    setLocalStream(null);
    setRemoteStreams({});
    setPCStates({});
    setIsMicOn(true);
    setIsCameraOn(true);
    setIsScreenSharing(false);
  }, []);

  return {
    localStream,
    localStreamRef,
    remoteStreams,
    peerConnectionStates,
    isMicOn,
    isCameraOn,
    isScreenSharing,
    getLocalMedia,
    createPeerConnection,
    createOfferTo,
    handleOffer,
    handleAnswer,
    handleRemoteIceCandidate,
    removePeer,
    toggleMute,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    cleanupAll,
  };
}
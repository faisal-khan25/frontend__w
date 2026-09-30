

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

export default function useWebRTC({ meetingId, myUserId }) {

  const pcRef = useRef(null);            
  const localStreamRef = useRef(null);   
  const screenStreamRef = useRef(null);  
  const pendingCandidates = useRef([]);  
  const remoteDescSet = useRef(false);   

  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); 
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionState, setConnectionState] = useState("new");
  

  
  const createPeerConnection = useCallback((targetSocketId) => {
    
    if (pcRef.current) {
      pcRef.current.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;
    remoteDescSet.current = false;

    
    pc.onicecandidate = ({ candidate }) => {
      if (!candidate || !targetSocketId) return;
      socketService.emit("meet:ice-candidate", {
        meetingId,
        targetSocketId,
        candidate: candidate.toJSON(),
      });
    };

   
    pc.ontrack = ({ streams }) => {
      if (!streams?.[0]) return;
      const stream = streams[0];
      setRemoteStreams((prev) => ({
        ...prev,
        [targetSocketId]: stream,
      }));
    };

    
    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
    };

    
    pc.onnegotiationneeded = async () => {
      if (!targetSocketId) return;
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketService.emit("meet:offer", {
          meetingId,
          targetSocketId,
          sdp: pc.localDescription,
        });
      } catch (err) {
        console.error("[webrtc] onnegotiationneeded error", err);
      }
    };

    return pc;
  }, [meetingId]);

  
  const getLocalMedia = useCallback(async ({ audio = true, video = true } = {}) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio, video });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsMicOn(true);
      setIsCameraOn(video);
      return stream;
    } catch (err) {
      console.error("[webrtc] getUserMedia failed", err);
      throw err;
    }
  }, []);

 
  const addLocalTracksToPeer = useCallback((pc, stream) => {
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });
  }, []);

  
  const createOffer = useCallback(async (targetSocketId) => {
    const pc = pcRef.current;
    if (!pc) return;
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketService.emit("meet:offer", {
        meetingId,
        targetSocketId,
        sdp: pc.localDescription,
      });
    } catch (err) {
      console.error("[webrtc] createOffer failed", err);
      throw err;
    }
  }, [meetingId]);

  
  const createAnswer = useCallback(async (fromSocketId, offerSdp) => {
    const pc = pcRef.current;
    if (!pc) return;
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offerSdp));
      remoteDescSet.current = true;

      for (const c of pendingCandidates.current) {
        await pc.addIceCandidate(new RTCIceCandidate(c)).catch(console.warn);
      }
      pendingCandidates.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketService.emit("meet:answer", {
        meetingId,
        targetSocketId: fromSocketId,
        sdp: pc.localDescription,
      });
    } catch (err) {
      console.error("[webrtc] createAnswer failed", err);
      throw err;
    }
  }, [meetingId]);

  const handleRemoteAnswer = useCallback(async (answerSdp) => {
    const pc = pcRef.current;
    if (!pc) return;
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answerSdp));
      remoteDescSet.current = true;
      for (const c of pendingCandidates.current) {
        await pc.addIceCandidate(new RTCIceCandidate(c)).catch(console.warn);
      }
      pendingCandidates.current = [];
    } catch (err) {
      console.error("[webrtc] handleRemoteAnswer failed", err);
    }
  }, []);

  
  const handleIceCandidate = useCallback(async (candidate) => {
    const pc = pcRef.current;
    if (!pc) return;
    if (!remoteDescSet.current) {
      pendingCandidates.current.push(candidate);
      return;
    }
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn("[webrtc] addIceCandidate error", err);
    }
  }, []);

  
  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsMicOn((prev) => {
      const next = !prev;
      socketService.emit("meet:media-state", { meetingId, isMicOn: next });
      return next;
    });
  }, [meetingId]);

  
  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsCameraOn((prev) => {
      const next = !prev;
      socketService.emit("meet:media-state", { meetingId, isCameraOn: next });
      return next;
    });
  }, [meetingId]);

  
  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      screenStreamRef.current = screenStream;

      const screenTrack = screenStream.getVideoTracks()[0];

      const pc = pcRef.current;
      if (pc) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          await sender.replaceTrack(screenTrack);
        }
      }

      
      setLocalStream((prev) => {
        if (!prev) return prev;
        const cloned = prev.clone();
        cloned.getVideoTracks().forEach((t) => cloned.removeTrack(t));
        cloned.addTrack(screenTrack);
        return cloned;
      });

      
      screenTrack.onended = () => {
        stopScreenShare();
      };

      setIsScreenSharing(true);
      socketService.emit("meet:media-state", { meetingId, isScreenSharing: true });
    } catch (err) {
      if (err.name !== "NotAllowedError") {
        console.error("[webrtc] startScreenShare failed", err);
      }
    }
  }, [meetingId]);

  
  const stopScreenShare = useCallback(async () => {
    const screenStream = screenStreamRef.current;
    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }

    const cameraStream = localStreamRef.current;
    if (cameraStream) {
      const cameraVideoTrack = cameraStream.getVideoTracks()[0];
      const pc = pcRef.current;
      if (pc && cameraVideoTrack) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          await sender.replaceTrack(cameraVideoTrack).catch(console.warn);
        }
      }
      setLocalStream(cameraStream);
    }

    setIsScreenSharing(false);
    socketService.emit("meet:media-state", { meetingId, isScreenSharing: false });
  }, [meetingId]);

  
  const cleanupCall = useCallback(() => {
  
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    setLocalStream(null);
    setRemoteStreams({});
    setIsMicOn(true);
    setIsCameraOn(true);
    setIsScreenSharing(false);
    setConnectionState("closed");
    remoteDescSet.current = false;
    pendingCandidates.current = [];
  }, []);

  return {
    
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

    
    pcRef,
    localStreamRef,
  };
}
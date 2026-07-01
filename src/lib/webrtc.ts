import { useEffect, useRef, useState, useCallback } from 'react';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

interface WebRTCCallbacks {
  onRemoteStream: (stream: MediaStream | null) => void;
  onLocalStream: (stream: MediaStream | null) => void;
  onConnectionState: (state: RTCPeerConnectionState) => void;
  onError: (error: string) => void;
}

export function useWebRTC(callbacks: WebRTCCallbacks) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const onIceCandidateRef = useRef<((candidate: RTCIceCandidate) => void) | null>(null);

  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    callbacks.onLocalStream(null);
    callbacks.onRemoteStream(null);
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    pendingCandidatesRef.current = [];
    onIceCandidateRef.current = null;
    setConnectionState('new');
  }, [callbacks]);

  const getMedia = useCallback(async (video: boolean): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: video ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      });
      localStreamRef.current = stream;
      callbacks.onLocalStream(stream);
      return stream;
    } catch (err: any) {
      callbacks.onError(`Media access denied: ${err.message}`);
      return null;
    }
  }, [callbacks]);

  const createPeerConnection = useCallback((stream: MediaStream, ws: WebSocket, targetId: string, callId: string, userId: string) => {
    if (pcRef.current) {
      pcRef.current.close();
    }
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        ws.send(JSON.stringify({
          type: 'call:ice-candidate',
          targetId,
          callId,
          userId,
          data: e.candidate.toJSON(),
        }));
      }
    };

    pc.ontrack = (e) => {
      callbacks.onRemoteStream(e.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
      callbacks.onConnectionState(pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        cleanup();
      }
    };

    return pc;
  }, [callbacks, cleanup]);

  const startCall = useCallback(async (
    video: boolean,
    ws: WebSocket,
    calleeId: string,
    callerId: string,
    callerName: string,
  ) => {
    const stream = await getMedia(video);
    if (!stream) return null;

    const pc = createPeerConnection(stream, ws, calleeId, 'pending', callerId);

    ws.send(JSON.stringify({
      type: 'call:initiate',
      callerId,
      calleeId,
      callerName,
      callType: video ? 'video' : 'audio',
    }));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    ws.send(JSON.stringify({
      type: 'call:offer',
      targetId: calleeId,
      callId: 'pending',
      userId: callerId,
      data: pc.localDescription,
    }));

    return pc;
  }, [getMedia, createPeerConnection]);

  const acceptCall = useCallback(async (
    ws: WebSocket,
    callId: string,
    callerId: string,
    calleeId: string,
    remoteOffer: any,
    video: boolean,
  ) => {
    const stream = await getMedia(video);
    if (!stream) return null;

    const pc = createPeerConnection(stream, ws, callerId, callId, calleeId);

    await pc.setRemoteDescription(new RTCSessionDescription(remoteOffer));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    ws.send(JSON.stringify({
      type: 'call:accept',
      callId,
      userId: calleeId,
    }));

    ws.send(JSON.stringify({
      type: 'call:answer',
      targetId: callerId,
      callId,
      userId: calleeId,
      data: pc.localDescription,
    }));

    return pc;
  }, [getMedia, createPeerConnection]);

  const handleRemoteDescription = useCallback(async (description: any) => {
    if (!pcRef.current) return;
    await pcRef.current.setRemoteDescription(new RTCSessionDescription(description));
    for (const candidate of pendingCandidatesRef.current) {
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch { /* ignore */ }
    }
    pendingCandidatesRef.current = [];
  }, []);

  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    if (!pcRef.current) {
      pendingCandidatesRef.current.push(candidate);
      return;
    }
    try {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch { /* ignore */ }
  }, []);

  const endCall = useCallback((ws: WebSocket | null, callId: string, userId: string) => {
    if (ws && callId !== 'pending') {
      ws.send(JSON.stringify({ type: 'call:end', callId, userId }));
    }
    cleanup();
  }, [cleanup]);

  const toggleMute = useCallback((): boolean | null => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        return track.enabled;
      }
    }
    return null;
  }, []);

  const toggleVideo = useCallback((): boolean | null => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        return track.enabled;
      }
    }
    return null;
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    connectionState,
    localStream: localStreamRef,
    startCall,
    acceptCall,
    endCall,
    toggleMute,
    toggleVideo,
    handleRemoteDescription,
    handleIceCandidate,
    cleanup,
  };
}

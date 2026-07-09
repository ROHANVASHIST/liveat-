import { useEffect, useRef, useCallback, useState } from 'react';
import AgoraRTC, {
  IAgoraRTCClient, ILocalAudioTrack, ILocalVideoTrack,
  IRemoteAudioTrack, IRemoteVideoTrack, UID,
} from 'agora-rtc-sdk-ng';

const APP_ID = import.meta.env.VITE_AGORA_APP_ID || '';

interface RemoteUserTracks {
  audio?: IRemoteAudioTrack;
  video?: IRemoteVideoTrack;
}

interface AgoraCallbacks {
  onRemoteUserJoined?: (userId: UID) => void;
  onRemoteUserLeft?: (userId: UID) => void;
  onRemoteTrackReady?: (userId: UID, mediaType: 'audio' | 'video') => void;
  onError?: (error: string) => void;
}

export function useAgora(callbacks?: AgoraCallbacks) {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<ILocalAudioTrack | null>(null);
  const localVideoTrackRef = useRef<ILocalVideoTrack | null>(null);
  const screenVideoTrackRef = useRef<ILocalVideoTrack | [ILocalVideoTrack, ILocalAudioTrack] | null>(null);
  const remoteTracksRef = useRef<Map<UID, RemoteUserTracks>>(new Map());
  const joinedRef = useRef(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  useEffect(() => {
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    clientRef.current = client;

    client.on('user-joined', (user) => {
      callbacks?.onRemoteUserJoined?.(user.uid);
    });

    client.on('user-left', (user) => {
      remoteTracksRef.current.delete(user.uid);
      callbacks?.onRemoteUserLeft?.(user.uid);
    });

    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      const tracks = remoteTracksRef.current.get(user.uid) || {};
      if (mediaType === 'audio') {
        tracks.audio = user.audioTrack ?? undefined;
      } else {
        tracks.video = user.videoTrack ?? undefined;
      }
      remoteTracksRef.current.set(user.uid, tracks);
      callbacks?.onRemoteTrackReady?.(user.uid, mediaType as 'audio' | 'video');
    });

    client.on('user-unpublished', (user, mediaType) => {
      const tracks = remoteTracksRef.current.get(user.uid);
      if (tracks) {
        if (mediaType === 'audio') delete tracks.audio;
        else delete tracks.video;
        if (!tracks.audio && !tracks.video) {
          remoteTracksRef.current.delete(user.uid);
        }
      }
    });

    return () => {
      client.removeAllListeners();
    };
  }, []);

  const joinChannel = useCallback(async (channel: string, video: boolean) => {
    if (!APP_ID) {
      callbacks?.onError?.('Agora App ID not configured. Add VITE_AGORA_APP_ID to .env');
      return;
    }
    if (joinedRef.current) return;
    joinedRef.current = true;

    try {
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      localAudioTrackRef.current = audioTrack;

      let videoTrack: ILocalVideoTrack | null = null;
      if (video) {
        videoTrack = await AgoraRTC.createCameraVideoTrack({
          facingMode: 'user',
          encoderConfig: '480p',
        });
        localVideoTrackRef.current = videoTrack;
      }

      await clientRef.current!.join(APP_ID, channel, null, null);
      await clientRef.current!.publish(
        video ? [audioTrack, videoTrack!] : [audioTrack]
      );

      if (videoTrack) videoTrack.play('local-video-container');
    } catch (err: any) {
      joinedRef.current = false;
      callbacks?.onError?.(`Agora join failed: ${err.message}`);
    }
  }, []);

  const leaveChannel = useCallback(async () => {
    if (!joinedRef.current) return;
    joinedRef.current = false;

    localAudioTrackRef.current?.close();
    localVideoTrackRef.current?.close();
    if (screenVideoTrackRef.current) {
      const screenTrack = screenVideoTrackRef.current;
      if (Array.isArray(screenTrack)) {
        screenTrack[0]?.close();
        screenTrack[1]?.close();
      } else {
        screenTrack.close();
      }
    }
    localAudioTrackRef.current = null;
    localVideoTrackRef.current = null;
    screenVideoTrackRef.current = null;

    remoteTracksRef.current.clear();
    setIsScreenSharing(false);

    await clientRef.current?.leave();
  }, []);

  const playRemoteTrack = useCallback((userId: UID, mediaType: 'audio' | 'video') => {
    const tracks = remoteTracksRef.current.get(userId);
    if (!tracks) return;

    if (mediaType === 'video' && tracks.video) {
      tracks.video.play('remote-video-container');
    }
    if (mediaType === 'audio' && tracks.audio) {
      tracks.audio.play();
    }
  }, []);

  const toggleMic = useCallback((): boolean => {
    const track = localAudioTrackRef.current;
    if (!track) return false;
    track.setEnabled(!track.enabled);
    return track.enabled;
  }, []);

  const toggleCamera = useCallback((): boolean => {
    const track = localVideoTrackRef.current;
    if (!track) return false;
    track.setEnabled(!track.enabled);
    return track.enabled;
  }, []);

  const startScreenShare = useCallback(async () => {
    if (!clientRef.current || !joinedRef.current) return false;
    try {
      const screenTrack = await AgoraRTC.createScreenVideoTrack({}, 'auto');
      screenVideoTrackRef.current = screenTrack;

      if (localVideoTrackRef.current) {
        await clientRef.current.unpublish(localVideoTrackRef.current);
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current.close();
        localVideoTrackRef.current = null;
      }

      const trackToPublish = Array.isArray(screenTrack) ? screenTrack[0] : screenTrack;
      await clientRef.current.publish(trackToPublish);
      trackToPublish.play('local-video-container');
      setIsScreenSharing(true);
      return true;
    } catch (err: any) {
      callbacks?.onError?.(`Screen share failed: ${err.message}`);
      return false;
    }
  }, []);

  const stopScreenShare = useCallback(async () => {
    if (!clientRef.current || !joinedRef.current || !screenVideoTrackRef.current) return;
    try {
      const screenTrack = screenVideoTrackRef.current;
      if (Array.isArray(screenTrack)) {
        await clientRef.current.unpublish(screenTrack[0]);
        screenTrack[0].close();
        screenTrack[1]?.close();
      } else {
        await clientRef.current.unpublish(screenTrack);
        screenTrack.close();
      }
      screenVideoTrackRef.current = null;

      const videoTrack = await AgoraRTC.createCameraVideoTrack({
        facingMode: 'user',
        encoderConfig: '480p',
      });
      localVideoTrackRef.current = videoTrack;
      await clientRef.current.publish(videoTrack);
      videoTrack.play('local-video-container');
      setIsScreenSharing(false);
    } catch (err: any) {
      callbacks?.onError?.(`Failed to stop screen share: ${err.message}`);
    }
  }, []);

  return {
    joinChannel,
    leaveChannel,
    playRemoteTrack,
    toggleMic,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    isScreenSharing,
    joinedRef,
  };
}
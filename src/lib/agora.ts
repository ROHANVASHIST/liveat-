import { useEffect, useRef, useCallback } from 'react';
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
  const remoteTracksRef = useRef<Map<UID, RemoteUserTracks>>(new Map());
  const joinedRef = useRef(false);

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
      callbacks?.onRemoteTrackReady?.(user.uid, mediaType);
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
    localAudioTrackRef.current = null;
    localVideoTrackRef.current = null;

    remoteTracksRef.current.clear();

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

  return {
    joinChannel,
    leaveChannel,
    playRemoteTrack,
    toggleMic,
    toggleCamera,
    joinedRef,
  };
}

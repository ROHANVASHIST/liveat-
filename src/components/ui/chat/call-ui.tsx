import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  MessageSquare,
  Monitor,
  Camera,
  Users,
  X,
  Circle,
  Clock,
  Plus
} from 'lucide-react';

interface CallUser {
  id: string;
  name: string;
  avatar?: string;
}

interface CallUIProps {
  isOpen: boolean;
  isVideo: boolean;
  caller: CallUser;
  callee: CallUser;
  callDirection: 'outgoing' | 'incoming';
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  onToggleVideo: () => void;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onToggleScreenShare?: () => void;
  isScreenSharing?: boolean;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isSpeakerOn: boolean;
  callDuration: number;
  callConnected: boolean;
  onMinimize?: () => void;
  isMinimized?: boolean;
  remoteParticipants?: Array<{ id: string; name: string }>;
  onAddParticipant?: () => void;
  className?: string;
}

export const CallUI: React.FC<CallUIProps> = ({
  isOpen,
  isVideo,
  caller,
  callee,
  callDirection,
  onAccept,
  onReject,
  onEnd,
  onToggleVideo,
  onToggleMute,
  onToggleSpeaker,
  onToggleScreenShare,
  isScreenSharing = false,
  isMuted,
  isVideoEnabled,
  isSpeakerOn,
  callDuration,
  callConnected,
  onMinimize,
  isMinimized,
  remoteParticipants = [],
  onAddParticipant,
  className,
}) => {
  const [showParticipants, setShowParticipants] = useState(false);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div className={cn(
        "fixed bottom-24 right-6 z-50 flex items-center gap-3 bg-background border border-primary/40 p-3 shadow-lg cursor-pointer hover:border-primary transition-all",
        className
      )} onClick={onMinimize}>
        <div className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center",
          isVideo ? "bg-primary/20" : "bg-emerald-500/20"
        )}>
          {isVideo ? <Video size={14} className="text-primary" /> : <Phone size={14} className="text-emerald-500" />}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest">{callee.name}</p>
          <p className="text-[8px] text-muted-foreground flex items-center gap-1">
            <Circle size={6} className="fill-green-500 text-green-500 animate-pulse" />
            {formatDuration(callDuration)}
            {remoteParticipants.length > 0 && (
              <span className="ml-1">+{remoteParticipants.length}</span>
            )}
          </p>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onEnd(); }} className="h-7 w-7 bg-red-500/20 border border-red-500/30 flex items-center justify-center hover:bg-red-500/30">
          <PhoneOff size={12} className="text-red-500" />
        </button>
      </div>
    );
  }

  const allParticipants = [callee, ...remoteParticipants];
  const gridCols = allParticipants.length <= 2 ? 1 : allParticipants.length <= 4 ? 2 : 3;

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex flex-col bg-background",
      className
    )}>
      {/* Remote video grid */}
      {isVideo && isVideoEnabled && (
        <div className="absolute inset-0 bg-black">
          <div className={cn(
            "w-full h-full grid gap-1 p-1",
            gridCols === 1 ? "grid-cols-1" : gridCols === 2 ? "grid-cols-2" : "grid-cols-3"
          )}>
            {allParticipants.map((p, i) => (
              <div
                key={p.id}
                id={`remote-video-container-${i}`}
                className="relative bg-black/50 rounded overflow-hidden"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white/30">{p.name?.charAt(0) || '?'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gradient overlay */}
      {isVideo && isVideoEnabled && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
      )}

      {/* Local Video (PiP) */}
      {isVideo && isVideoEnabled && (
        <div
          id="local-video-container"
          className="absolute top-4 left-4 z-20 w-40 h-28 rounded-lg overflow-hidden border-2 border-primary/40 shadow-lg"
        />
      )}

      {(!isVideo || !isVideoEnabled) && (
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5">
          <div className="absolute inset-0 bg-mesh opacity-30" />
          <div className="absolute inset-0 bg-gradient-radial from-primary/5 to-transparent" />
        </div>
      )}

      {/* Top buttons */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {/* Participants */}
        {callConnected && (
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className={cn(
              "h-10 px-3 backdrop-blur border flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold transition-all",
              showParticipants
                ? "bg-primary/20 border-primary/30 text-primary"
                : "bg-background/60 border-border text-foreground hover:bg-background/80"
            )}
          >
            <Users size={14} />
            <span>{allParticipants.length}</span>
          </button>
        )}
        <button
          onClick={onMinimize}
          className="h-10 w-10 bg-background/60 backdrop-blur border border-border flex items-center justify-center hover:bg-background/80 transition-all text-foreground"
          title="Minimize"
        >
          <Minimize2 size={16} />
        </button>
        <button
          onClick={onEnd}
          className="h-10 w-10 bg-red-500/80 backdrop-blur border border-red-400/30 flex items-center justify-center hover:bg-red-500 transition-all"
          title="End call"
        >
          <X size={16} className="text-white" />
        </button>
      </div>

      {/* Participants panel */}
      {showParticipants && callConnected && (
        <div className="absolute top-20 right-4 z-20 w-56 bg-background border border-border shadow-lg">
          <div className="p-3 border-b border-border">
            <span className="text-[9px] uppercase tracking-widest font-bold">Participants ({allParticipants.length})</span>
          </div>
          <div className="p-2 space-y-1 max-h-[200px] overflow-y-auto">
            {allParticipants.map((p, i) => (
              <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 text-[9px] uppercase tracking-wider">
                <div className={cn(
                  "h-5 w-5 rounded-full flex items-center justify-center text-[6px] font-bold",
                  i === 0 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {p.name?.charAt(0) || '?'}
                </div>
                <span className="flex-1 truncate">{p.name}</span>
                {i === 0 && <span className="text-[7px] text-primary">Host</span>}
              </div>
            ))}
          </div>
          {onAddParticipant && (
            <div className="p-2 border-t border-border">
              <button
                onClick={onAddParticipant}
                className="w-full flex items-center justify-center gap-2 py-1.5 text-[8px] uppercase tracking-wider text-muted-foreground hover:text-primary border border-dashed border-border hover:border-primary/30 transition-colors"
              >
                <Plus size={10} /> Add Participant
              </button>
            </div>
          )}
        </div>
      )}

      {/* Caller/Callee Info */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
        {(!isVideo || !isVideoEnabled) && (
          <>
            <div className={cn(
              "relative mb-8",
              callDirection === 'incoming' && !callConnected && "animate-bounce"
            )}>
              <div className={cn(
                "w-28 h-28 rounded-full border-4 flex items-center justify-center overflow-hidden",
                isVideo ? "border-primary/50" : "border-emerald-500/50"
              )}>
                {callee.avatar ? (
                  <img src={callee.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-foreground">
                    {callee.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {callDirection === 'outgoing' && !callConnected && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              )}
            </div>

            <h2 className="text-2xl font-bold text-foreground tracking-wide mb-2">{callee.name}</h2>

            <p className="text-sm text-muted-foreground font-mono">
              {callDirection === 'incoming' && !callConnected ? (
                <span className="text-emerald-500 flex items-center gap-2">
                  <Circle size={8} className="fill-emerald-500 animate-pulse" />
                  Incoming Call...
                </span>
              ) : callDirection === 'outgoing' && !callConnected ? (
                <span className="text-primary flex items-center gap-2">
                  <Clock size={14} className="animate-pulse" />
                  Calling...
                </span>
              ) : (
                <span className="text-muted-foreground">{formatDuration(callDuration)}</span>
              )}
            </p>
          </>
        )}
      </div>

      {/* Call Controls */}
      <div className="relative z-10 pb-12 px-6">
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={onToggleMute}
            className={cn(
              "h-14 w-14 rounded-full flex items-center justify-center transition-all border",
              isMuted
                ? "bg-red-500/20 border-red-500/30 text-red-500"
                : "bg-background/60 backdrop-blur border-border text-foreground hover:bg-background/80"
            )}
          >
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>

          {isVideo && (
            <button
              onClick={onToggleVideo}
              className={cn(
                "h-14 w-14 rounded-full flex items-center justify-center transition-all border",
                !isVideoEnabled
                  ? "bg-red-500/20 border-red-500/30 text-red-500"
                  : "bg-background/60 backdrop-blur border-border text-foreground hover:bg-background/80"
              )}
            >
              {isVideoEnabled ? <Video size={22} /> : <VideoOff size={22} />}
            </button>
          )}

          <button
            onClick={onToggleSpeaker}
            className={cn(
              "h-14 w-14 rounded-full flex items-center justify-center transition-all border",
              isSpeakerOn
                ? "bg-primary/20 border-primary/30 text-primary"
                : "bg-background/60 backdrop-blur border-border text-foreground hover:bg-background/80"
            )}
          >
            {isSpeakerOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
          </button>

          {callConnected && onToggleScreenShare && (
            <button
              onClick={onToggleScreenShare}
              className={cn(
                "h-14 w-14 rounded-full flex items-center justify-center transition-all border",
                isScreenSharing
                  ? "bg-primary/20 border-primary/30 text-primary"
                  : "bg-background/60 backdrop-blur border-border text-foreground hover:bg-background/80"
              )}
              title={isScreenSharing ? "Stop sharing" : "Share screen"}
            >
              <Monitor size={22} />
            </button>
          )}

          {callDirection === 'incoming' && !callConnected && (
            <button
              onClick={onAccept}
              className={cn(
                "h-14 w-14 rounded-full flex items-center justify-center transition-all border",
                isVideo
                  ? "bg-primary/20 border-primary/30 text-primary"
                  : "bg-emerald-500/20 border-emerald-500/30 text-emerald-500"
              )}
            >
              <Phone size={22} />
            </button>
          )}

          <button
            onClick={onEnd}
            className="h-14 w-14 rounded-full bg-red-500 border border-red-400 flex items-center justify-center hover:bg-red-600 transition-all"
          >
            <PhoneOff size={22} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const useCallTimer = () => {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    setSeconds(0);
    intervalRef.current = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSeconds(0);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { seconds, start, stop };
};
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Camera,
  Image as ImageIcon,
  Text,
  Send,
  Trash2,
  MoreHorizontal,
  Eye,
  Pause,
  Play,
  Circle,
  Plus,
  Users
} from 'lucide-react';

interface StatusData {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  mediaUrl?: string;
  type: 'text' | 'image';
  timestamp: Date;
  expiresAt: Date;
  viewed: boolean;
  viewers?: { userId: string; userName: string; viewedAt: Date }[];
}

interface StatusViewerProps {
  isOpen: boolean;
  onClose: () => void;
  statuses: StatusData[];
  initialIndex?: number;
  onNext?: () => void;
  onPrevious?: () => void;
  markAsViewed?: (statusId: string) => void;
  onCreateStatus?: (data: { content: string; mediaUrl?: string; type: 'text' | 'image' }) => void;
  currentUserId?: string;
  className?: string;
}

const STATUS_DURATION = 5000;

export const StatusViewer: React.FC<StatusViewerProps> = ({
  isOpen,
  onClose,
  statuses,
  initialIndex = 0,
  onNext,
  onPrevious,
  markAsViewed,
  onCreateStatus,
  currentUserId,
  className,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'text' | 'image'>('text');
  const [createContent, setCreateContent] = useState('');
  const [createMediaUrl, setCreateMediaUrl] = useState<string | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressStartRef = useRef(Date.now());

  const currentStatus = statuses[currentIndex];

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setProgress(0);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen || !currentStatus || isPaused) return;

    progressStartRef.current = Date.now() - (progress / 100) * STATUS_DURATION;

    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - progressStartRef.current;
      const newProgress = Math.min((elapsed / STATUS_DURATION) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        if (currentIndex < statuses.length - 1) {
          setCurrentIndex(i => i + 1);
          setProgress(0);
        } else {
          onClose();
        }
      }
    }, 50);

    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [isOpen, currentIndex, isPaused, currentStatus?.id]);

  useEffect(() => {
    if (currentStatus && markAsViewed && currentStatus.userId !== currentUserId) {
      markAsViewed(currentStatus.id);
    }
  }, [currentIndex]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      if (currentIndex > 0) {
        setCurrentIndex(i => i - 1);
        setProgress(0);
      }
    } else if (e.key === 'ArrowRight') {
      if (currentIndex < statuses.length - 1) {
        setCurrentIndex(i => i + 1);
        setProgress(0);
      } else {
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    } else if (e.key === ' ') {
      setIsPaused(p => !p);
    }
  }, [currentIndex, statuses.length, onClose]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  const handleCreateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onloadend = () => setCreateMediaUrl(reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
      setCreateType('image');
    }
  };

  const handleCreateStatus = () => {
    if (!createContent && !createMediaUrl) return;
    onCreateStatus?.({
      content: createContent,
      mediaUrl: createMediaUrl || undefined,
      type: createType,
    });
    setShowCreateModal(false);
    setCreateContent('');
    setCreateMediaUrl(null);
    setCreateType('text');
  };

  if (!isOpen) return null;

  const groupedByUser = statuses.reduce<Record<string, StatusData[]>>((acc, s) => {
    if (!acc[s.userId]) acc[s.userId] = [];
    acc[s.userId].push(s);
    return acc;
  }, {});

  const userOrder = Object.keys(groupedByUser);

  return (
    <>
      <div className={cn("fixed inset-0 z-50 flex flex-col bg-black", className)}>
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/60 to-transparent">
          {/* Progress bars */}
          <div className="flex gap-1 mb-4">
            {statuses.map((s, i) => (
              <div key={s.id} className="flex-1 h-[3px] bg-white/20 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full bg-white transition-all duration-100 rounded-full",
                    i < currentIndex && "w-full",
                    i === currentIndex && "animate-progress",
                    i > currentIndex && "w-0"
                  )}
                  style={i === currentIndex ? { width: `${progress}%`, transition: 'none' } : undefined}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-white/50 overflow-hidden bg-white/10 flex items-center justify-center">
                {currentStatus?.userAvatar ? (
                  <img src={currentStatus.userAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-sm">
                    {currentStatus?.userName?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{currentStatus?.userName}</p>
                <p className="text-white/60 text-xs">
                  {currentStatus?.timestamp ? new Date(currentStatus.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPaused(p => !p)}
                className="h-9 w-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
              >
                {isPaused ? <Play size={16} className="text-white" /> : <Pause size={16} className="text-white" />}
              </button>
              {currentStatus?.userId === currentUserId && currentStatus?.viewers && currentStatus.viewers.length > 0 && (
                <div className="flex items-center gap-1 bg-white/10 rounded-full px-3 py-1.5">
                  <Eye size={12} className="text-white/60" />
                  <span className="text-white/60 text-xs">{currentStatus.viewers.length}</span>
                </div>
              )}
              <button onClick={onClose} className="h-9 w-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all">
                <X size={18} className="text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Status Content */}
        <div
          className="flex-1 flex items-center justify-center relative cursor-pointer select-none"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            if (x < rect.width * 0.3) {
              if (currentIndex > 0) {
                setCurrentIndex(i => i - 1);
                setProgress(0);
              }
            } else if (x > rect.width * 0.7) {
              if (currentIndex < statuses.length - 1) {
                setCurrentIndex(i => i + 1);
                setProgress(0);
              } else {
                onClose();
              }
            }
          }}
        >
          {currentStatus?.type === 'image' && currentStatus.mediaUrl ? (
            <img
              src={currentStatus.mediaUrl}
              alt=""
              className="max-w-full max-h-full object-contain"
              draggable={false}
            />
          ) : (
            <div className="px-12 text-center">
              <p className="text-white text-2xl font-medium leading-relaxed whitespace-pre-wrap break-words">
                {currentStatus?.content}
              </p>
            </div>
          )}
        </div>

        {/* Bottom: Viewers */}
        {currentStatus?.userId === currentUserId && currentStatus?.viewers && currentStatus.viewers.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-white/60" />
              <span className="text-white/60 text-xs">Seen by {currentStatus.viewers.length}</span>
            </div>
            <div className="flex mt-2 gap-1">
              {currentStatus.viewers.slice(0, 7).map(v => (
                <div key={v.userId} className="w-7 h-7 rounded-full border border-white/30 bg-white/10 flex items-center justify-center">
                  <span className="text-white text-[9px] font-bold">{v.userName.charAt(0).toUpperCase()}</span>
                </div>
              ))}
              {currentStatus.viewers.length > 7 && (
                <div className="w-7 h-7 rounded-full border border-white/30 bg-white/10 flex items-center justify-center">
                  <span className="text-white text-[9px]">+{currentStatus.viewers.length - 7}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Status FAB */}
        {onCreateStatus && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="absolute bottom-6 right-6 h-14 w-14 rounded-full bg-primary border border-primary/50 flex items-center justify-center shadow-lg hover:bg-primary/90 transition-all z-20"
          >
            <Camera size={24} className="text-primary-foreground" />
          </button>
        )}
      </div>

      {/* Create Status Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-background border border-border w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-sm font-bold uppercase tracking-widest">Create Status</h3>
              <button onClick={() => { setShowCreateModal(false); setCreateMediaUrl(null); setCreateContent(''); }}>
                <X size={16} className="text-muted-foreground hover:text-foreground" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Type selector */}
              <div className="flex gap-2">
                <button
                  onClick={() => setCreateType('text')}
                  className={cn(
                    "flex-1 py-2 text-[10px] uppercase tracking-widest font-bold border transition-all",
                    createType === 'text' ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  <Text size={14} className="mx-auto mb-1" />
                  Text
                </button>
                <button
                  onClick={() => setCreateType('image')}
                  className={cn(
                    "flex-1 py-2 text-[10px] uppercase tracking-widest font-bold border transition-all",
                    createType === 'image' ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  <ImageIcon size={14} className="mx-auto mb-1" />
                  Image
                </button>
              </div>

              {/* Image upload */}
              {createType === 'image' && (
                <div>
                  {createMediaUrl ? (
                    <div className="relative">
                      <img src={createMediaUrl} alt="" className="w-full max-h-[300px] object-contain bg-black/20" />
                      <button
                        onClick={() => setCreateMediaUrl(null)}
                        className="absolute top-2 right-2 h-8 w-8 bg-black/50 flex items-center justify-center hover:bg-black/70"
                      >
                        <Trash2 size={14} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-all bg-muted/10">
                      <Camera size={32} className="text-muted-foreground mb-2" />
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Tap to Choose Image</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleCreateFileChange} />
                    </label>
                  )}
                </div>
              )}

              {/* Text content */}
              {createType === 'text' && (
                <textarea
                  value={createContent}
                  onChange={(e) => setCreateContent(e.target.value)}
                  placeholder="What's on your mind?"
                  maxLength={500}
                  rows={4}
                  className="w-full bg-muted/20 border border-border p-3 text-sm outline-none focus:border-primary resize-none text-foreground placeholder:text-muted-foreground/50"
                />
              )}

              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Status will expire in 24 hours</span>
                <span>{createContent.length}/500</span>
              </div>
            </div>

            <div className="flex gap-2 p-4 border-t border-border">
              <button
                onClick={() => { setShowCreateModal(false); setCreateMediaUrl(null); setCreateContent(''); }}
                className="flex-1 py-2 border border-border text-[10px] uppercase tracking-widest text-muted-foreground hover:bg-muted/20"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateStatus}
                disabled={!createContent && !createMediaUrl}
                className="flex-1 py-2 bg-primary text-primary-foreground text-[10px] uppercase tracking-widest font-bold border border-primary disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Send size={14} className="inline mr-1" />
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

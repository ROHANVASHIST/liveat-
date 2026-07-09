import React from 'react';
import { cn } from '@/lib/utils';
import { Circle, Check, X, Reply } from 'lucide-react';

interface UserStatusPickerProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: string;
  currentStatusText: string;
  onSetStatus: (status: string, statusText: string) => void;
  autoReply?: string;
  onSetAutoReply?: (message: string) => void;
}

const STATUS_OPTIONS = [
  { id: 'online', label: 'Online', color: 'text-green-500' },
  { id: 'away', label: 'Away', color: 'text-amber-500' },
  { id: 'busy', label: 'Do Not Disturb', color: 'text-red-500' },
  { id: 'offline', label: 'Invisible', color: 'text-muted-foreground' },
];

export const UserStatusPicker: React.FC<UserStatusPickerProps> = ({
  isOpen,
  onClose,
  currentStatus,
  currentStatusText,
  onSetStatus,
  autoReply = '',
  onSetAutoReply,
}) => {
  const [statusText, setStatusText] = React.useState(currentStatusText);
  const [selectedStatus, setSelectedStatus] = React.useState(currentStatus);
  const [autoReplyText, setAutoReplyText] = React.useState(autoReply);

  React.useEffect(() => {
    setSelectedStatus(currentStatus);
    setStatusText(currentStatusText);
    setAutoReplyText(autoReply);
  }, [currentStatus, currentStatusText, autoReply, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-80 border border-border bg-background shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="text-[10px] font-bold uppercase tracking-widest">Set Status</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSelectedStatus(opt.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 border transition-all text-[10px] uppercase tracking-widest",
                selectedStatus === opt.id
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/20"
              )}
            >
              <Circle size={8} className={cn("fill-current", opt.color)} />
              <span className="flex-1 text-left">{opt.label}</span>
              {selectedStatus === opt.id && <Check size={10} className="text-primary" />}
            </button>
          ))}

          <div className="pt-3 border-t border-border">
            <label className="text-[8px] uppercase tracking-widest text-muted-foreground block mb-2">Status Message</label>
            <input
              type="text"
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full bg-background border border-border h-9 px-3 text-[10px] tracking-wider outline-none focus:border-primary/50 transition-colors"
              maxLength={80}
            />
          </div>

          {onSetAutoReply && (
            <div className="pt-2 border-t border-border">
              <label className="text-[8px] uppercase tracking-widest text-muted-foreground block mb-2 flex items-center gap-1.5">
                <Reply size={10} /> Auto-Reply (when away)
              </label>
              <input
                type="text"
                value={autoReplyText}
                onChange={(e) => setAutoReplyText(e.target.value)}
                placeholder="I'm away right now..."
                className="w-full bg-background border border-border h-9 px-3 text-[10px] tracking-wider outline-none focus:border-primary/50 transition-colors"
                maxLength={120}
              />
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-border flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[9px] uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border hover:border-primary/30 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSetStatus(selectedStatus, statusText);
              if (onSetAutoReply) onSetAutoReply(autoReplyText);
              onClose();
            }}
            className="px-4 py-2 text-[9px] uppercase tracking-wider text-primary-foreground bg-primary border border-primary hover:bg-primary/90 transition-all"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
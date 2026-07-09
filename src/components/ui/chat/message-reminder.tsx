import React from 'react';
import { cn } from '@/lib/utils';
import { Bell, Clock, Check, X } from 'lucide-react';

interface MessageReminderProps {
  isOpen: boolean;
  onClose: () => void;
  messageContent: string;
  messageSender: string;
  onSetReminder: (minutes: number) => void;
}

const REMINDER_OPTIONS = [
  { label: '5 minutes', value: 5 },
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: 'Tomorrow', value: 1440 },
];

export const MessageReminder: React.FC<MessageReminderProps> = ({
  isOpen,
  onClose,
  messageContent,
  messageSender,
  onSetReminder,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-80 border border-border bg-background shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
            <Bell size={12} /> Set Reminder
          </span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-border/50">
          <p className="text-[8px] uppercase tracking-widest text-muted-foreground mb-1">Message from @{messageSender}</p>
          <p className="text-[11px] text-foreground/80 truncate">{messageContent}</p>
        </div>

        <div className="p-5 space-y-1">
          <p className="text-[8px] uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1">
            <Clock size={10} /> Remind me in...
          </p>
          {REMINDER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onSetReminder(opt.value); onClose(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 border border-transparent hover:border-border hover:bg-muted/20 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
            >
              <Clock size={10} className="shrink-0" />
              <span className="flex-1 text-left">{opt.label}</span>
              <Check size={10} className="opacity-0 group-hover:opacity-100" />
            </button>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[9px] uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border hover:border-primary/30 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

interface ReminderNotificationProps {
  reminder: { messageId: string; content: string; senderName: string; roomId: string } | null;
  onDismiss: () => void;
  onJump: (roomId: string, messageId: string) => void;
}

export const ReminderNotification: React.FC<ReminderNotificationProps> = ({ reminder, onDismiss, onJump }) => {
  if (!reminder) return null;

  return (
    <div className="fixed top-20 right-6 z-50 border border-primary/30 bg-background shadow-lg p-4 max-w-xs animate-in slide-in-from-right">
      <div className="flex items-start gap-3">
        <Bell size={14} className="text-primary shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[8px] uppercase tracking-widest text-primary font-bold mb-1">Reminder</p>
          <p className="text-[9px] text-muted-foreground truncate">From @{reminder.senderName}</p>
          <p className="text-[10px] text-foreground mt-1 line-clamp-2">{reminder.content}</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onJump(reminder.roomId, reminder.messageId)}
              className="text-[8px] uppercase tracking-wider text-primary border border-primary/30 px-2 py-1 hover:bg-primary/10 transition-colors"
            >
              Jump to
            </button>
            <button
              onClick={onDismiss}
              className="text-[8px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
        <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground shrink-0">
          <X size={12} />
        </button>
      </div>
    </div>
  );
};

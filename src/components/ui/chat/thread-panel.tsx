import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X, MessageSquare, Reply } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../avatar';

interface ThreadMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  isSelf?: boolean;
}

interface ThreadPanelProps {
  isOpen: boolean;
  parentMessage: { id: string; senderName: string; content: string } | null;
  replies: ThreadMessage[];
  onClose: () => void;
  onSendReply: (content: string) => void;
  currentUser: { id: string; name: string; avatar?: string };
}

export const ThreadPanel: React.FC<ThreadPanelProps> = ({
  isOpen,
  parentMessage,
  replies,
  onClose,
  onSendReply,
  currentUser,
}) => {
  const [replyText, setReplyText] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies]);

  if (!isOpen || !parentMessage) return null;

  return (
    <div className="w-[360px] border-l border-border bg-background/80 backdrop-blur-md flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-primary" />
          <span className="text-[10px] uppercase tracking-[0.25em] font-bold">Thread</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-primary transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* Parent Message */}
      <div className="p-4 border-b border-border bg-muted/10">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-5 w-5 border border-border flex items-center justify-center overflow-hidden">
            <span className="text-[7px] font-bold">{parentMessage.senderName?.charAt(0) || '?'}</span>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider text-foreground">{parentMessage.senderName}</span>
        </div>
        <p className="text-[11px] text-foreground/80 leading-relaxed">{parentMessage.content}</p>
      </div>

      {/* Replies */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {replies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Reply size={20} className="text-muted-foreground/30 mb-3" />
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground/50">No replies yet</p>
            <p className="text-[8px] text-muted-foreground/30 mt-1">Start the conversation in this thread</p>
          </div>
        ) : (
          replies.map(reply => (
            <div key={reply.id} className={cn(
              "flex gap-3",
              reply.isSelf ? "flex-row-reverse" : "flex-row"
            )}>
              <div className="h-6 w-6 border border-border flex items-center justify-center overflow-hidden shrink-0">
                <span className="text-[6px] font-bold">{reply.senderName?.charAt(0) || '?'}</span>
              </div>
              <div className={cn(
                "flex-1 min-w-0 border p-2",
                reply.isSelf ? "bg-primary/10 border-primary/20" : "bg-muted/10 border-border"
              )}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-foreground">{reply.senderName}</span>
                  <span className="text-[7px] text-muted-foreground ml-auto">
                    {new Date(reply.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-foreground/80">{reply.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Input */}
      <div className="p-4 border-t border-border">
        <div className="flex items-end gap-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (replyText.trim()) {
                  onSendReply(replyText);
                  setReplyText('');
                }
              }
            }}
            placeholder="Reply in thread..."
            className="flex-1 bg-background border border-border h-9 px-3 text-[10px] tracking-wider outline-none focus:border-primary/50 transition-colors"
          />
          <button
            onClick={() => {
              if (replyText.trim()) {
                onSendReply(replyText);
                setReplyText('');
              }
            }}
            disabled={!replyText.trim()}
            className="h-9 px-3 border border-primary/30 text-primary text-[8px] uppercase tracking-widest font-bold hover:bg-primary/10 transition-colors disabled:opacity-30"
          >
            Reply
          </button>
        </div>
      </div>
    </div>
  );
};
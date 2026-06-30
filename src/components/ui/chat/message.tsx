import React, { useState, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../avatar';
import { cn } from '@/lib/utils';
import {
  Check,
  CheckCheck,
  FileIcon,
  Download,
  Smile,
  Star,
  Sparkles,
  Terminal,
  Activity,
  Reply,
  Forward,
  Copy
} from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  isSelf?: boolean;
  type?: 'text' | 'image' | 'file';
  mediaUrl?: string;
  status?: 'sent' | 'delivered' | 'read';
  isPinned?: boolean;
  reactions?: { emoji: string; userId: string; userName?: string }[];
}

interface MessageProps {
  message: Message;
  currentUser: {
    id: string;
    name: string;
    avatar?: string;
  };
  onReaction?: (emoji: string) => void;
  onPin?: () => void;
  onReply?: () => void;
  isReplying?: boolean;
  onForward?: () => void;
}

export const Message: React.FC<MessageProps> = ({ message, currentUser, onReaction, onPin, onReply, isReplying, onForward }) => {
  const isSelf = message.senderId === currentUser.id;
  const [showReactions, setShowReactions] = useState(false);

  const reactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];
  const isAI = (message.senderName || '').toLowerCase().includes('agent') ||
               (message.senderName || '').toLowerCase().includes('ai') ||
               message.senderName === 'General';

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = message.content;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }, [message.content]);

  return (
    <div className={cn(
      "group flex w-full gap-4 mb-8 font-mono",
      isSelf ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Sender Identifier */}
      <div className="flex flex-col items-center gap-2">
        <Avatar className={cn(
          "h-10 w-10 border rounded-none flex items-center justify-center overflow-hidden transition-all",
          isSelf ? "border-primary/50" : "border-border"
        )}>
          <AvatarImage src={message.senderAvatar} className="grayscale brightness-125" />
          <AvatarFallback className="text-[10px] bg-muted font-bold rounded-none flex items-center justify-center h-full w-full">
            {message.senderName ? message.senderName.substring(0, 1) : 'U'}
          </AvatarFallback>
        </Avatar>
        <div className={cn("h-full w-[1px] bg-border/30 grow")} />
      </div>

      <div className={cn(
        "flex max-w-[85%] flex-col gap-2",
        isSelf ? "items-end" : "items-start"
      )}>
        {/* Metadata Line */}
        <div className="flex items-center gap-3 px-1">
           {isSelf ? (
             <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Operator::Self</span>
           ) : (
             <>
               <span className="text-[9px] font-bold text-foreground uppercase tracking-widest">{message.senderName}</span>
               {isAI && (
                 <span className="text-[8px] font-bold bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 uppercase tracking-tighter flex items-center gap-1">
                   <Sparkles size={8} /> Internal_Node
                 </span>
               )}
             </>
           )}
           <span
             className="text-[8px] text-muted-foreground uppercase tracking-widest ml-auto opacity-50"
             title={new Date(message.timestamp).toLocaleString([], {
               year: 'numeric', month: 'long', day: 'numeric',
               hour: '2-digit', minute: '2-digit', second: '2-digit'
             })}
           >
             {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
           </span>
        </div>

        {/* Message Node */}
        <div className="relative group/bubble flex items-start gap-3">
          <div className={cn(
            "border p-4 transition-all duration-200 relative min-w-[120px]",
            isSelf
              ? "bg-primary border-primary text-primary-foreground"
              : cn(
                  "bg-muted/30 border-border text-foreground hover:border-primary/40 focus-within:border-primary/40",
                  isAI && "border-primary/20 bg-primary/5"
                ),
            isReplying && "border-l-primary border-l-4"
          )}>
            {/* Action Buttons for Node */}
            <div className={cn(
              "absolute -top-3 flex gap-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity z-10",
              isSelf ? "right-2" : "left-2"
            )}>
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="h-6 px-1.5 bg-background border border-border text-foreground hover:border-primary transition-colors flex items-center gap-1"
              >
                <Smile size={10} />
              </button>
              <button
                onClick={onPin}
                className={cn(
                  "h-6 px-1.5 bg-background border transition-colors flex items-center gap-1",
                  message.isPinned ? "border-primary text-primary" : "border-border text-foreground hover:border-primary"
                )}
              >
                <Star size={10} className={cn(message.isPinned && "fill-primary")} />
              </button>
              <button
                onClick={() => onReply?.()}
                className="h-6 px-1.5 bg-background border border-border text-foreground hover:border-primary transition-colors flex items-center gap-1"
              >
                <Reply size={10} />
              </button>
              <button
                onClick={() => onForward?.()}
                className="h-6 px-1.5 bg-background border border-border text-foreground hover:border-primary transition-colors flex items-center gap-1"
              >
                <Forward size={10} />
              </button>
              <button
                onClick={handleCopy}
                className="h-6 px-1.5 bg-background border border-border text-foreground hover:border-primary transition-colors flex items-center gap-1"
              >
                <Copy size={10} />
              </button>
            </div>

            {message.type === 'image' && message.mediaUrl ? (
              <div className="border border-border/20 mb-2 overflow-hidden group/img relative bg-black/20">
                <img src={message.mediaUrl} alt="Shared Node Data" className="max-w-full h-auto max-h-[350px] object-cover grayscale brightness-110 contrast-125" />
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover/img:opacity-100 transition-opacity" />
              </div>
            ) : message.type === 'file' && message.mediaUrl ? (
              <div className={cn(
                "flex items-center gap-4 p-3 mb-2 border transition-colors cursor-pointer group/file",
                isSelf ? "bg-white/10 border-white/20" : "bg-background border-border hover:border-primary/40"
              )}>
                <div className="h-9 w-9 border border-border/50 flex items-center justify-center">
                   <FileIcon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-[11px] font-bold truncate uppercase tracking-widest">persistence_file.bin</p>
                   <p className="text-[8px] uppercase tracking-widest opacity-60 mt-1">2.4 MB • DATA_NODE</p>
                </div>
                <Download size={12} className="opacity-40" />
              </div>
            ) : (
              <p className={cn(
                "text-[13px] leading-relaxed tracking-wider",
                isSelf ? "font-medium" : "text-foreground"
              )}>
                {message.content}
              </p>
            )}

            {/* Status Line */}
            <div className={cn(
              "flex items-center gap-2 mt-3 opacity-40",
              isSelf ? "justify-end text-primary-foreground" : "justify-start text-muted-foreground"
            )}>
              <span className="text-[8px] uppercase tracking-widest">
                Checksum: {message.id?.toString().substring(0, 8) || 'UNKNOWN'}
              </span>
              {isSelf && (
                <div className="flex items-center">
                  {message.status === 'read' ? (
                    <CheckCheck size={10} />
                  ) : (
                    <Check size={10} />
                  )}
                </div>
              )}
            </div>

            {showReactions && (
              <div className={cn(
                "absolute -top-10 bg-background border border-primary/40 p-1 flex gap-1 z-50 shadow-[0_0_20px_rgba(0,229,255,0.1)]",
                isSelf ? "right-0" : "left-0"
              )}>
                {reactions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReaction?.(emoji);
                      setShowReactions(false);
                    }}
                    className="h-8 w-8 text-sm hover:bg-primary/10 transition-colors flex items-center justify-center border border-transparent hover:border-primary/20"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Display Subscript Reactions */}
            {message.reactions && message.reactions.length > 0 && (
              <div className="absolute -bottom-3 right-2 flex gap-1 z-10">
                {Array.from(new Set(message.reactions.map(r => r.emoji))).map(emoji => {
                   const count = message.reactions!.filter(r => r.emoji === emoji).length;
                   return (
                     <div key={emoji} className="flex items-center gap-1 bg-background border border-border px-1.5 py-0.5 rounded-full text-[10px] shadow-sm">
                       <span>{emoji}</span>
                       {count > 1 && <span className="font-bold opacity-70">{count}</span>}
                     </div>
                   );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

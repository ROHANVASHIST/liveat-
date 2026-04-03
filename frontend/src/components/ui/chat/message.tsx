import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../avatar';
import { cn } from '@/lib/utils';
import { 
  Check, 
  CheckCheck, 
  FileIcon, 
  Download, 
  MoreHorizontal, 
  Smile,
  ImageIcon,
  Star
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
}

export const Message: React.FC<MessageProps> = ({ message, currentUser, onReaction, onPin }) => {
  const isSelf = message.senderId === currentUser.id;
  const [showReactions, setShowReactions] = useState(false);

  const reactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  return (
    <div className={cn(
      "group flex w-full gap-3 mb-6 transition-all duration-500 animate-in fade-in slide-in-from-bottom-3",
      isSelf ? "flex-row-reverse" : "flex-row"
    )}>
      <Avatar className="h-9 w-9 shrink-0 shadow-md border-2 border-white ring-1 ring-slate-100 mt-1 cursor-pointer hover:scale-105 transition-transform">
        <AvatarImage src={message.senderAvatar} alt={message.senderName} className="object-cover" />
        <AvatarFallback className="font-bold bg-slate-50 text-[10px] text-slate-400">
          {message.senderName.substring(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn(
        "flex max-w-[75%] flex-col gap-1.5",
        isSelf ? "items-end" : "items-start"
      )}>
        <div className="flex items-center gap-2 px-1">
           {!isSelf && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{message.senderName}</span>}
           <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
             {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
           </span>
        </div>

        <div className="relative group/bubble flex items-center gap-2">
          {isSelf && (
            <div className="flex flex-col gap-1 items-center">
              <button
                 onClick={() => setShowReactions(!showReactions)}
                 className="opacity-0 group-hover/bubble:opacity-100 p-2 hover:bg-slate-50 rounded-full transition-all text-slate-300 hover:text-blue-600"
              >
                <Smile className="h-4 w-4" />
              </button>
              <button
                 onClick={onPin}
                 className={cn(
                   "opacity-0 group-hover/bubble:opacity-100 p-2 hover:bg-slate-50 rounded-full transition-all",
                   message.isPinned ? "text-orange-400 opacity-100" : "text-slate-300 hover:text-orange-500"
                 )}
              >
                <Star className={cn("h-4 w-4", message.isPinned && "fill-orange-400")} />
              </button>
            </div>
          )}

          <div className={cn(
            "rounded-2xl px-5 py-3.5 shadow-sm transition-all duration-300",
            isSelf
              ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-none shadow-blue-500/20"
              : "bg-white border border-slate-100 text-slate-800 rounded-tl-none hover:bg-slate-50/50"
          )}>
            {message.type === 'image' && message.mediaUrl ? (
              <div className="relative rounded-xl overflow-hidden mb-1 group/img shadow-sm border border-black/5">
                <img src={message.mediaUrl} alt="Shared Image" className="max-w-full h-auto max-h-[350px] object-cover transition-transform group-hover/img:scale-105 duration-700" />
                <div className="absolute inset-0 bg-slate-900/0 group-hover/img:bg-slate-900/20 transition-all flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                   <div className="h-10 w-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white scale-90 group-hover/img:scale-100 transition-transform">
                      <Download className="h-5 w-5" />
                   </div>
                </div>
              </div>
            ) : message.type === 'file' && message.mediaUrl ? (
              <div className={cn(
                "flex items-center gap-4 p-4 rounded-xl mb-1 border transition-all cursor-pointer group/file",
                isSelf ? "bg-white/10 border-white/20 hover:bg-white/20" : "bg-slate-50 border-slate-200 hover:border-blue-200"
              )}>
                <div className={cn(
                  "h-11 w-11 rounded-lg flex items-center justify-center transition-colors",
                  isSelf ? "bg-white/20 group-hover/file:bg-white/30" : "bg-white shadow-sm group-hover/file:bg-blue-50"
                )}>
                   <FileIcon className={cn("h-5 w-5", isSelf ? "text-white" : "text-blue-600")} />
                </div>
                <div className="flex-1 min-w-0">
                   <p className={cn("text-sm font-bold truncate", isSelf ? "text-white" : "text-slate-900")}>Document.pdf</p>
                   <p className={cn("text-[10px] uppercase font-black tracking-widest opacity-60 mt-0.5", isSelf ? "text-blue-100" : "text-slate-400")}>2.4 MB • PDF NODE</p>
                </div>
                <Download className={cn("h-4 w-4 transition-transform group-hover/file:translate-y-0.5", isSelf ? "text-white/40" : "text-slate-300")} />
              </div>
            ) : (
              <p className="text-[15px] leading-relaxed tracking-tight font-medium">
                {message.content.split(/(\s+)/).map((part, i) => {
                  if (part.match(/^https?:\/\/\S+/)) {
                    return (
                      <a 
                        key={i} 
                        href={part} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={cn(
                          "underline font-bold transition-all underline-offset-4 decoration-current/30 hover:decoration-current",
                          isSelf ? "text-white" : "text-blue-600"
                        )}
                      >
                        {part}
                      </a>
                    );
                  }
                  return part;
                })}
              </p>
            )}
            
            <div className={cn(
              "flex items-center gap-1.5 mt-2 transition-opacity",
              isSelf ? "justify-end" : "justify-start"
            )}>
              {isSelf && (
                <div className="flex items-center">
                  {message.status === 'read' ? (
                    <CheckCheck className="h-3.5 w-3.5 text-blue-100" />
                  ) : (
                    <Check className="h-3.5 w-3.5 text-blue-200/60" />
                  )}
                </div>
              )}
            </div>

            {showReactions && (
              <div className={cn(
                "absolute -top-14 bg-white border border-slate-100 rounded-2xl p-1.5 flex gap-1 z-50 shadow-2xl shadow-slate-200/50 animate-in zoom-in-95 duration-200",
                isSelf ? "right-0" : "left-0"
              )}>
                {reactions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReaction?.(emoji);
                      setShowReactions(false);
                    }}
                    className="h-9 w-9 text-xl hover:bg-slate-50 rounded-xl transition-all flex items-center justify-center hover:scale-125 active:scale-95"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!isSelf && (
            <div className="flex flex-col gap-1 items-center">
              <button
                 onClick={() => setShowReactions(!showReactions)}
                 className="opacity-0 group-hover/bubble:opacity-100 p-2 hover:bg-slate-50 rounded-full transition-all text-slate-300 hover:text-blue-600"
              >
                <Smile className="h-4 w-4" />
              </button>
              <button
                 onClick={onPin}
                 className={cn(
                   "opacity-0 group-hover/bubble:opacity-100 p-2 hover:bg-slate-50 rounded-full transition-all",
                   message.isPinned ? "text-orange-400 opacity-100" : "text-slate-300 hover:text-orange-500"
                 )}
              >
                <Star className={cn("h-4 w-4", message.isPinned && "fill-orange-400")} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

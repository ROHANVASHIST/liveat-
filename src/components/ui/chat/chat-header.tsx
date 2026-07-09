import React from 'react';
import { cn } from '@/lib/utils';
import {
  Settings,
  Sparkles,
  Activity,
  Menu,
  Phone,
  Video,
  MoreVertical,
  Trash2,
  Download,
  Info,
  PanelRightOpen,
  Circle
} from 'lucide-react';

interface ChatHeaderProps {
  title: string;
  subtitle?: string;
  onlineCount?: number;
  onBack?: () => void;
  onSettings?: () => void;
  onToggleSidebar?: () => void;
  sentiment?: 'calm' | 'ai' | 'warning' | 'error';
  onSummarize?: () => void;
  isSummarizing?: boolean;
  onClearHistory?: () => void;
  onExport?: (format?: 'txt' | 'json') => void;
  typingUserNames?: string[];
  showInfo?: boolean;
  onInfoToggle?: () => void;
  onSearchToggle?: () => void;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
  onViewStatus?: () => void;
  hasStatus?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  title,
  subtitle,
  onlineCount,
  onSettings,
  onToggleSidebar,
  sentiment = 'calm',
  onSummarize,
  isSummarizing,
  onClearHistory,
  onExport,
  typingUserNames = [],
  showInfo,
  onInfoToggle,
  onSearchToggle,
  onVoiceCall,
  onVideoCall,
  onViewStatus,
  hasStatus,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  const sentimentColor = {
    calm: 'border-primary/20 bg-primary/5 text-primary',
    ai: 'border-violet-500/20 bg-violet-500/5 text-violet-400',
    warning: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
    error: 'border-red-500/20 bg-red-500/5 text-red-400',
  }[sentiment];

  return (
    <header className="flex items-center justify-between px-4 md:px-6 h-16 border-b border-border bg-background/80 backdrop-blur-md z-40 relative font-mono">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden h-9 w-9 border border-border flex items-center justify-center hover:bg-muted transition-colors shrink-0"
        >
          <Menu size={16} />
        </button>

        {/* Status ring avatar */}
        <div className="relative shrink-0 cursor-pointer" onClick={onViewStatus}>
          <div className={cn(
            "h-9 w-9 border-2 flex items-center justify-center overflow-hidden rounded-full",
            hasStatus ? "border-primary" : "border-border"
          )}>
            <span className="text-sm font-bold text-foreground">
              {title ? title.charAt(0).toUpperCase() : '?'}
            </span>
          </div>
          {hasStatus && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary border-2 border-background" />
          )}
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] truncate">{title}</h2>
            <div className={cn("flex items-center gap-1.5 px-1.5 py-0.5 border shrink-0", sentimentColor)}>
               <span className="h-1 w-1 rounded-full bg-current animate-tech-pulse" />
               <span className="text-[7px] font-bold uppercase tracking-widest hidden sm:inline">Live</span>
            </div>
          </div>
          {/* Typing indicator or subtitle */}
          {typingUserNames.length > 0 ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] text-primary italic normal-case tracking-normal">
                {typingUserNames.length === 1
                  ? `${typingUserNames[0]} is typing`
                  : `${typingUserNames.length} people typing`
                }
              </span>
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          ) : subtitle ? (
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5 opacity-60 truncate">
               {subtitle}
            </p>
          ) : onlineCount ? (
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5 opacity-60">
               {onlineCount} {onlineCount === 1 ? 'member' : 'members'} connected
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
         {/* Voice/Video Call Buttons */}
         {onVoiceCall && (
           <button
             onClick={onVoiceCall}
             className="h-9 w-9 border border-border flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-emerald-500"
             title="Voice call"
           >
             <Phone size={14} />
           </button>
         )}
         {onVideoCall && (
           <button
             onClick={onVideoCall}
             className="h-9 w-9 border border-border flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
             title="Video call"
           >
             <Video size={14} />
           </button>
         )}

         {onSummarize && (
            <button
              onClick={onSummarize}
              disabled={isSummarizing}
              className={cn(
                "h-9 px-3 border transition-all flex items-center gap-2 text-[9px] uppercase tracking-widest",
                isSummarizing ? "bg-muted border-border opacity-50" : "bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
              )}
              title="AI Summarize conversation"
            >
               <Sparkles size={12} className={cn(isSummarizing && "animate-spin")} />
               <span className="hidden md:inline">{isSummarizing ? "Analyzing..." : "Summarize"}</span>
            </button>
         )}

         <div className="w-[1px] h-5 bg-border mx-0.5 hidden sm:block" />

         {/* Info toggle button */}
         {onInfoToggle && (
           <button
             onClick={onInfoToggle}
             className={cn(
               "h-9 w-9 border flex items-center justify-center transition-colors",
               showInfo
                 ? "border-primary/40 bg-primary/10 text-primary"
                 : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
             )}
             title={showInfo ? "Close info panel" : "Open info panel"}
           >
             <Info size={14} />
           </button>
         )}

         {/* Search toggle button */}
         {onSearchToggle && (
           <button
             onClick={onSearchToggle}
             className="h-9 w-9 border border-border flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
             title="Search messages"
           >
             <PanelRightOpen size={14} />
           </button>
         )}

         {/* More Menu */}
         <div className="relative">
           <button
             onClick={() => setShowMenu(!showMenu)}
             className="h-9 w-9 border border-border flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
           >
             <MoreVertical size={14} />
           </button>
           {showMenu && (
             <>
               <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
               <div className="absolute right-0 top-full mt-1 w-48 bg-background border border-border shadow-lg z-50">
                  {onExport && (
                    <>
                      <button
                        onClick={() => { onExport('txt'); setShowMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
                      >
                        <Download size={12} /> Export as TXT
                      </button>
                      <button
                        onClick={() => { onExport('json'); setShowMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
                      >
                        <Download size={12} /> Export as JSON
                      </button>
                    </>
                  )}
                 {onClearHistory && (
                   <button
                     onClick={() => { onClearHistory(); setShowMenu(false); }}
                     className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-all"
                   >
                     <Trash2 size={12} /> Clear History
                   </button>
                 )}
                 {onSettings && (
                   <button
                     onClick={() => { onSettings(); setShowMenu(false); }}
                     className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
                   >
                     <Settings size={12} /> Settings
                   </button>
                 )}
               </div>
             </>
           )}
         </div>
      </div>
    </header>
  );
};

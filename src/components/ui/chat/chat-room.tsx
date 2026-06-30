import React from 'react';
import { ChatHeader } from './chat-header';
import { ChatContainer } from './chat-container';
import { ChatInput } from './chat-input';
import { Message } from './message';
import { cn } from '@/lib/utils';
import {
  Info,
  Users,
  MoreHorizontal,
  ChevronRight,
  Layout,
  Search,
  Star as StarIcon,
  MessageSquare,
  Sparkles,
  X,
  Image,
  FileText,
  Pin,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../avatar';

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
  isEdited?: boolean;
  isForwarded?: boolean;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
    type?: string;
  };
  caption?: string;
}

interface ChatPartner {
  id: string;
  name: string;
  avatar?: string;
}

interface MentionUser {
  id: string;
  name: string;
  avatar?: string;
}

interface ChatRoomProps {
  roomName: string;
  roomDescription?: string;
  messages: Message[];
  currentMessage: string;
  onMessageChange: (value: string) => void;
  onSendMessage: () => void;
  onlineUsers: number;
  currentUser: {
    id: string;
    name: string;
    avatar?: string;
  };
  isLoading?: boolean;
  chatPartner?: ChatPartner;
  className?: string;
  onBack?: () => void;
  onAddContact?: () => void;
  onSettings?: () => void;
  onFileSelect?: (file: File) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onToggleSidebar?: () => void;
  onClearHistory?: () => void;
  onPinMessage?: (messageId: string) => void;
  sentiment?: 'calm' | 'ai' | 'warning' | 'error';
  onPolish?: () => void;
  isPolishing?: boolean;
  onSummarize?: () => void;
  isSummarizing?: boolean;
  replyTo?: { id: string; senderName: string; content: string } | null;
  onCancelReply?: () => void;
  onEmojiSelect?: (emoji: string) => void;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
  onViewStatus?: () => void;
  hasStatus?: boolean;
  users?: MentionUser[];
  wallpaper?: string;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  roomName,
  roomDescription,
  messages,
  currentMessage,
  onMessageChange,
  onSendMessage,
  onlineUsers,
  currentUser,
  isLoading,
  chatPartner,
  className,
  onBack,
  onAddContact,
  onSettings,
  onFileSelect,
  onReaction,
  onToggleSidebar,
  onClearHistory,
  onPinMessage,
  sentiment,
  onPolish,
  isPolishing,
  onSummarize,
  isSummarizing,
  replyTo,
  onCancelReply,
  onEmojiSelect,
  onVoiceCall,
  onVideoCall,
  onViewStatus,
  hasStatus,
  users = [],
  wallpaper,
}) => {
  const [isMuted, setIsMuted] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showSearch, setShowSearch] = React.useState(false);
  const [activeFilter, setActiveFilter] = React.useState<'all' | 'media' | 'files' | 'pinned'>('all');
  const [showInfoPanel, setShowInfoPanel] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleExport = () => {
    const transcript = messages.map(m => `[${m.timestamp.toLocaleString()}] ${m.senderName}: ${m.content}`).join('\n');
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${roomName}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        setShowSearch(prev => !prev);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowInfoPanel(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  React.useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const filteredMessages = React.useMemo(() => {
    let result = messages;
    if (searchQuery) {
      result = result.filter(m =>
        m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.senderName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (activeFilter === 'media') {
      result = result.filter(m => m.type === 'image');
    } else if (activeFilter === 'files') {
      result = result.filter(m => m.type === 'file');
    } else if (activeFilter === 'pinned') {
      result = result.filter(m => m.isPinned);
    }
    return result;
  }, [messages, searchQuery, activeFilter]);

  const mediaCount = React.useMemo(() => messages.filter(m => m.type === 'image').length, [messages]);
  const fileCount = React.useMemo(() => messages.filter(m => m.type === 'file').length, [messages]);
  const pinnedCount = React.useMemo(() => messages.filter(m => m.isPinned).length, [messages]);

  const formatDateLabel = (dateStr: string) => {
    const today = new Date().toLocaleDateString();
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    return dateStr;
  };

  const groupByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    msgs.forEach(msg => {
      const dateStr = msg.timestamp.toLocaleDateString();
      const last = groups[groups.length - 1];
      if (last && last.date === dateStr) {
        last.messages.push(msg);
      } else {
        groups.push({ date: dateStr, messages: [msg] });
      }
    });
    return groups;
  };

  const groupedMessages = groupByDate(filteredMessages);
  const pinnedMessages = messages.filter(m => m.isPinned).slice(0, 5);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatBgStyle = wallpaper ? {
    backgroundImage: `url(${wallpaper})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  } : {};

  return (
    <div className={cn("flex flex-col h-screen bg-background overflow-hidden font-mono", className)}>
      <ChatHeader
        title={roomName}
        subtitle={roomDescription}
        onlineCount={onlineUsers}
        onBack={onBack}
        onSettings={onSettings}
        onToggleSidebar={onToggleSidebar}
        sentiment={sentiment}
        onSummarize={onSummarize}
        isSummarizing={isSummarizing}
        onClearHistory={onClearHistory}
        onExport={handleExport}
        showInfo={showInfoPanel}
        onInfoToggle={() => setShowInfoPanel(prev => !prev)}
        onSearchToggle={() => setShowSearch(prev => !prev)}
        onVoiceCall={onVoiceCall}
        onVideoCall={onVideoCall}
        onViewStatus={onViewStatus}
        hasStatus={hasStatus}
      />

      {/* Pinned Messages Bar */}
      {pinnedMessages.length > 0 && (
        <div className="border-b border-border bg-muted/10 backdrop-blur-sm">
          <div className="flex items-center gap-2 px-6 py-2 overflow-x-auto scrollbar-thin">
            <Pin size={12} className="text-primary shrink-0" />
            <span className="text-[9px] uppercase tracking-[0.25em] text-primary font-bold mr-1 shrink-0">Pinned</span>
            <div className="h-4 w-[1px] bg-border shrink-0" />
            {pinnedMessages.map(msg => (
              <div
                key={msg.id}
                className="flex items-center gap-2 shrink-0 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded cursor-pointer hover:bg-primary/10 transition-colors group"
              >
                <StarIcon size={10} className="text-primary/70" />
                <span className="text-[10px] text-foreground/80 truncate max-w-[180px] font-medium">
                  {msg.content}
                </span>
                <span className="text-[8px] text-muted-foreground uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                  Jump
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar */}
      {showSearch && (
        <div className="px-6 py-3 border-b border-border bg-muted/20 backdrop-blur-md flex items-center gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`SEARCH_NODE: ${roomName}...`}
              className="w-full bg-background/50 border border-border focus:border-primary h-9 pl-10 pr-4 text-[10px] uppercase tracking-widest transition-all outline-none text-foreground placeholder:text-muted-foreground/50"
            />
          </div>
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-mono whitespace-nowrap">
            {filteredMessages.length} / {messages.length}
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[9px] uppercase tracking-widest text-muted-foreground hover:text-primary"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => { setShowSearch(false); setSearchQuery(''); }}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-border bg-muted/10 backdrop-blur-sm">
        <div className="flex items-center gap-1">
          {([
            { key: 'all' as const, label: 'All', count: messages.length },
            { key: 'media' as const, label: 'Media', count: mediaCount },
            { key: 'files' as const, label: 'Files', count: fileCount },
            { key: 'pinned' as const, label: 'Pinned', count: pinnedCount },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={cn(
                'relative px-3 py-1.5 text-[9px] uppercase tracking-[0.25em] font-bold transition-all',
                activeFilter === tab.key
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
              <span className="ml-1.5 text-[8px] opacity-60">[{tab.count}]</span>
              {activeFilter === tab.key && (
                <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-primary shadow-[0_0_6px_rgba(0,229,255,0.5)]" />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {!showSearch && (
            <button
              onClick={() => setShowSearch(true)}
              className="text-muted-foreground hover:text-primary transition-colors p-1"
              title="Search (Ctrl+F)"
            >
              <Search size={14} />
            </button>
          )}
          <button
            onClick={() => setShowInfoPanel(prev => !prev)}
            className={cn(
              'text-muted-foreground hover:text-primary transition-colors p-1',
              showInfoPanel && 'text-primary'
            )}
            title="Room Info"
          >
            <Info size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 relative flex overflow-hidden">
        {/* Main Conversation */}
        <div
          className="flex-1 flex flex-col min-w-0 relative"
          style={chatBgStyle}
        >
          {!wallpaper && <div className="scan-line opacity-20" />}
          {wallpaper && <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />}

          {/* Reply-to Indicator */}
          {replyTo && (
            <div className="px-6 py-2 border-b border-primary/20 bg-primary/5 flex items-center gap-3 relative z-10">
              <div className="h-8 w-[2px] bg-primary/40 rounded-full" />
              <div className="flex-1 min-w-0">
                <span className="text-[9px] uppercase tracking-wider text-primary font-bold">
                  Replying to @{replyTo.senderName}
                </span>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {replyTo.content}
                </p>
              </div>
              <button
                onClick={onCancelReply}
                className="text-muted-foreground hover:text-primary transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <ChatContainer className="flex-1 px-8 py-4">
            <div className="flex flex-col gap-6">
              {filteredMessages.length === 0 ? (
                searchQuery ? (
                  <div className="flex flex-col items-center justify-center h-[50vh] text-center max-w-sm mx-auto">
                    <div className="h-16 w-16 border border-primary/30 bg-primary/5 flex items-center justify-center text-primary mb-6 animate-tech-pulse shadow-[0_0_20px_rgba(0,229,255,0.1)]">
                      <Search size={24} />
                    </div>
                    <h3 className="text-[14px] font-bold text-foreground uppercase tracking-widest">Signal_Loss: Target_Not_Found</h3>
                    <p className="text-[10px] text-muted-foreground font-medium mt-3 uppercase tracking-[0.2em] opacity-60">Adjust query parameters to locate requested node data.</p>
                  </div>
                ) : activeFilter === 'media' ? (
                  <div className="flex flex-col items-center justify-center h-[50vh] text-center max-w-sm mx-auto">
                    <div className="h-16 w-16 border border-primary/30 bg-primary/5 flex items-center justify-center text-primary mb-6 shadow-[0_0_20px_rgba(0,229,255,0.1)]">
                      <Image size={24} />
                    </div>
                    <h3 className="text-[14px] font-bold text-foreground uppercase tracking-widest">Media_Vault: Empty</h3>
                    <p className="text-[10px] text-muted-foreground font-medium mt-3 uppercase tracking-[0.2em] opacity-60">No media files have been transmitted in this channel.</p>
                  </div>
                ) : activeFilter === 'files' ? (
                  <div className="flex flex-col items-center justify-center h-[50vh] text-center max-w-sm mx-auto">
                    <div className="h-16 w-16 border border-primary/30 bg-primary/5 flex items-center justify-center text-primary mb-6 shadow-[0_0_20px_rgba(0,229,255,0.1)]">
                      <FileText size={24} />
                    </div>
                    <h3 className="text-[14px] font-bold text-foreground uppercase tracking-widest">File_Archive: Null</h3>
                    <p className="text-[10px] text-muted-foreground font-medium mt-3 uppercase tracking-[0.2em] opacity-60">No file transfers recorded in this conversation.</p>
                  </div>
                ) : activeFilter === 'pinned' ? (
                  <div className="flex flex-col items-center justify-center h-[50vh] text-center max-w-sm mx-auto">
                    <div className="h-16 w-16 border border-primary/30 bg-primary/5 flex items-center justify-center text-primary mb-6 shadow-[0_0_20px_rgba(0,229,255,0.1)]">
                      <Pin size={24} />
                    </div>
                    <h3 className="text-[14px] font-bold text-foreground uppercase tracking-widest">Pin_Board: Clear</h3>
                    <p className="text-[10px] text-muted-foreground font-medium mt-3 uppercase tracking-[0.2em] opacity-60">No messages have been pinned to this channel.</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[50vh] text-center max-w-sm mx-auto">
                    <div className="h-20 w-20 border border-primary/50 bg-primary/10 flex items-center justify-center text-primary mb-6 shadow-[0_0_30px_rgba(0,229,255,0.15)] group relative">
                      <div className="absolute inset-x-0 h-[1px] bg-primary/50 top-1/2 -translate-y-1/2" />
                      <div className="absolute inset-y-0 w-[1px] bg-primary/50 left-1/2 -translate-x-1/2" />
                      <Layout size={32} className="relative z-10 bg-background/50 p-1" />
                    </div>
                    <h3 className="text-[16px] font-bold text-foreground uppercase tracking-widest">Protocol::Initialize</h3>
                    <p className="text-[10px] text-muted-foreground font-medium mt-3 uppercase tracking-[0.2em] opacity-60 leading-relaxed">
                      Awaiting initial input sequence to establish connection with <span className="text-primary border-b border-primary/30">[{roomName}]</span>.
                    </p>
                  </div>
                )
              ) : (
                groupedMessages.map((group) => (
                  <React.Fragment key={group.date}>
                    <div className="flex items-center gap-4 py-1">
                      <div className="flex-1 h-[1px] bg-border/50" />
                      <span className="text-[8px] uppercase tracking-[0.3em] text-muted-foreground font-bold shrink-0">
                        {formatDateLabel(group.date)}
                      </span>
                      <div className="flex-1 h-[1px] bg-border/50" />
                    </div>
                    {group.messages.map((message) => (
                      <Message
                        key={message.id}
                        message={message}
                        currentUser={currentUser}
                        onReaction={(emoji) => onReaction?.(message.id, emoji)}
                        onPin={() => onPinMessage?.(message.id)}
                      />
                    ))}
                  </React.Fragment>
                ))
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </ChatContainer>

          <ChatInput
            value={currentMessage}
            onChange={onMessageChange}
            onSend={onSendMessage}
            isLoading={isLoading}
            placeholder={`Message ${roomName}...`}
            onFileSelect={onFileSelect}
            onPolish={onPolish}
            isPolishing={isPolishing}
            onEmojiSelect={onEmojiSelect}
            replyTo={replyTo ? { id: replyTo.id, senderId: '', senderName: replyTo.senderName, content: replyTo.content } : null}
            onCancelReply={onCancelReply}
            users={users}
          />
        </div>

        {/* Room Info Panel */}
        {showInfoPanel && (
          <div className="w-[320px] border-l border-border bg-background/80 backdrop-blur-md overflow-y-auto">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-foreground">Room_Info</span>
              <button
                onClick={() => setShowInfoPanel(false)}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-bold mb-3">Stats</div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Users, label: 'Members', value: onlineUsers },
                  { icon: MessageSquare, label: 'Messages', value: messages.length },
                  { icon: Image, label: 'Media', value: mediaCount },
                  { icon: FileText, label: 'Files', value: fileCount },
                ].map(stat => (
                  <div key={stat.label} className="tech-card p-3 flex flex-col items-center gap-2">
                    <stat.icon size={14} className="text-primary" />
                    <span className="text-[18px] font-bold text-foreground font-mono">{stat.value}</span>
                    <span className="text-[7px] uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-border space-y-3">
              <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-bold mb-3">Configuration</div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  {isMuted ? <BellOff size={12} className="text-muted-foreground" /> : <Bell size={12} className="text-primary" />}
                  <span className="text-[9px] uppercase tracking-wider text-foreground">Notifications</span>
                </div>
                <button
                  onClick={() => setIsMuted(prev => !prev)}
                  className={cn(
                    'text-[8px] uppercase tracking-wider px-2 py-1 border rounded font-bold transition-colors',
                    isMuted
                      ? 'border-destructive/30 text-destructive hover:bg-destructive/10'
                      : 'border-primary/30 text-primary hover:bg-primary/10'
                  )}
                >
                  {isMuted ? 'Muted' : 'Active'}
                </button>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Lock size={12} className="text-primary" />
                  <span className="text-[9px] uppercase tracking-wider text-foreground">Encryption</span>
                </div>
                <span className="text-[8px] uppercase tracking-wider text-primary font-bold">E2E</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Trash2 size={12} className="text-muted-foreground" />
                  <span className="text-[9px] uppercase tracking-wider text-foreground">Auto-Delete</span>
                </div>
                <span className="text-[8px] uppercase tracking-wider text-muted-foreground">Off</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Globe size={12} className="text-primary" />
                  <span className="text-[9px] uppercase tracking-wider text-foreground">Visibility</span>
                </div>
                <span className="text-[8px] uppercase tracking-wider text-primary font-bold">Public</span>
              </div>
            </div>

            {onClearHistory && (
              <div className="p-4 border-t border-border">
                <button
                  onClick={onClearHistory}
                  className="w-full py-2 border border-destructive/30 text-destructive text-[9px] uppercase tracking-[0.25em] font-bold hover:bg-destructive/10 transition-colors"
                >
                  Clear History
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const BellOff = ({ size, className }: { size?: number; className?: string }) => (
  <svg width={size || 16} height={size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M13.73 21a2 2 0 0 1-3.46 0" /><path d="M18.63 13A17.89 17.89 0 0 1 18 8" /><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" /><path d="M18 8a6 6 0 0 0-9.33-5" /><path d="m1 1 22 22" />
  </svg>
);

const Bell = ({ size, className }: { size?: number; className?: string }) => (
  <svg width={size || 16} height={size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 4 9 4 9H2s4-2 4-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const Lock = ({ size, className }: { size?: number; className?: string }) => (
  <svg width={size || 16} height={size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const Globe = ({ size, className }: { size?: number; className?: string }) => (
  <svg width={size || 16} height={size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="12" cy="12" r="10" /><line x1="2" x2="22" y1="12" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const Trash2 = ({ size, className }: { size?: number; className?: string }) => (
  <svg width={size || 16} height={size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

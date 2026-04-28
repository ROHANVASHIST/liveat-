import React from 'react';
import { Button } from '../button';
import { ChatHeader } from './chat-header';
import { ChatContainer } from './chat-container';
import { ChatInput } from './chat-input';
import { Message } from './message';
import { cn } from '@/lib/utils';
import { 
  Info, 
  Users, 
  Tag, 
  MoreHorizontal, 
  ChevronRight,
  Shield,
  Clock,
  Layout,
  Search,
  Star as StarIcon,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../avatar';
import { Badge } from '../badge';

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

interface ChatPartner {
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
  isSummarizing
}) => {
  const [isMuted, setIsMuted] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

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
    URL.revokeObjectURL(url);
  };

  const filteredMessages = messages.filter(m => 
    m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.senderName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedMessages = messages.filter(m => m.isPinned);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      />
      
      <div className="flex-1 relative flex overflow-hidden">
        {/* Main Conversation */}
        <div className="flex-1 flex flex-col min-w-0 bg-background/50 relative">
          {/* Scan Line Effect for Chat Area */}
          <div className="scan-line opacity-20" />
          
          {/* Internal Search Bar - Technical Style */}
          <div className="px-6 py-3 border-b border-border bg-muted/20 backdrop-blur-md flex items-center gap-3">
             <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`QUERY_NODE: ${roomName}...`}
                  className="w-full bg-background/50 border border-border focus:border-primary h-9 pl-10 pr-4 text-[10px] uppercase tracking-widest transition-all outline-none text-foreground placeholder:text-muted-foreground/50"
                />
             </div>
             {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-[9px] uppercase tracking-widest text-muted-foreground hover:text-primary">Abort</button>
             )}
          </div>

          <ChatContainer className="flex-1 px-8 py-4">
            <div className="flex flex-col gap-6">
               {(filteredMessages.length === 0 && searchQuery) ? (
                  <div className="flex flex-col items-center justify-center h-[50vh] text-center max-w-sm mx-auto">
                     <div className="h-16 w-16 border border-primary/30 bg-primary/5 flex items-center justify-center text-primary mb-6 animate-tech-pulse shadow-[0_0_20px_rgba(0,229,255,0.1)]">
                        <Search size={24} />
                     </div>
                     <h3 className="text-[14px] font-bold text-foreground uppercase tracking-widest">Signal_Loss: Target_Not_Found</h3>
                     <p className="text-[10px] text-muted-foreground font-medium mt-3 uppercase tracking-[0.2em] opacity-60">Adjust query parameters to locate requested node data.</p>
                  </div>
               ) : (filteredMessages.length === 0) ? (
                  <div className="flex flex-col items-center justify-center h-[50vh] text-center max-w-sm mx-auto">
                     <div className="h-20 w-20 border border-primary/50 bg-primary/10 flex items-center justify-center text-primary mb-6 shadow-[0_0_30px_rgba(0,229,255,0.15)] group relative">
                        <div className="absolute inset-x-0 h-[1px] bg-primary/50 top-1/2 -translate-y-1/2"></div>
                        <div className="absolute inset-y-0 w-[1px] bg-primary/50 left-1/2 -translate-x-1/2"></div>
                        <Layout size={32} className="relative z-10 bg-background/50 p-1" />
                     </div>
                     <h3 className="text-[16px] font-bold text-foreground uppercase tracking-widest">Protocol::Initialize</h3>
                     <p className="text-[10px] text-muted-foreground font-medium mt-3 uppercase tracking-[0.2em] opacity-60 leading-relaxed">
                        Awaiting initial input sequence to establish connection with <span className="text-primary border-b border-primary/30">[{roomName}]</span>.
                     </p>
                  </div>
               ) : (
                  filteredMessages.map((message) => (
                    <Message
                      key={message.id}
                      message={message}
                      currentUser={currentUser}
                      onReaction={(emoji) => onReaction?.(message.id, emoji)}
                      onPin={() => onPinMessage?.(message.id)}
                    />
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
          />
        </div>
      </div>
    </div>
  );
};

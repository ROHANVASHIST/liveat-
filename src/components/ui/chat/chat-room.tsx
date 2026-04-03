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
  MessageSquare
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
}) => {
  const [showInfo, setShowInfo] = React.useState(true);
  const [isMuted, setIsMuted] = React.useState(false);
  const [sidebarTab, setSidebarTab] = React.useState<'info' | 'pinned'>('info');
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
    <div className={cn("flex flex-col h-screen bg-white overflow-hidden animate-in fade-in duration-500", className)}>
      <ChatHeader
        title={roomName}
        subtitle={roomDescription}
        onlineCount={onlineUsers}
        onBack={onBack}
        onAddContact={onAddContact}
        onSettings={onSettings}
        onToggleSidebar={onToggleSidebar}
      />
      
      <div className="flex-1 relative flex overflow-hidden">
        {/* Main Conversation */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30">
          {/* Internal Search Bar */}
          <div className="px-8 py-4 border-b border-slate-100 bg-white/50 backdrop-blur-md flex items-center gap-3">
             <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search in ${roomName}...`}
                  className="w-full bg-slate-50/50 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-100 h-10 pl-11 pr-4 rounded-xl text-sm transition-all outline-none text-slate-700 placeholder:text-slate-300 font-medium"
                />
             </div>
             {searchQuery && (
                <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-blue-600 text-[10px] font-black uppercase tracking-widest px-2">Clear</Button>
             )}
          </div>

          <ChatContainer className="flex-1 px-8 py-4">
            <div className="flex flex-col gap-6">
               {(filteredMessages.length === 0 && searchQuery) ? (
                  <div className="flex flex-col items-center justify-center h-[50vh] text-center max-w-sm mx-auto">
                     <div className="h-16 w-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mb-6">
                        <Search className="h-8 w-8" />
                     </div>
                     <h3 className="text-lg font-bold text-slate-800">No signals found</h3>
                     <p className="text-xs text-slate-400 font-medium mt-1">Refine your search parameters to locate the required informational node.</p>
                  </div>
               ) : (filteredMessages.length === 0) ? (
                  <div className="flex flex-col items-center justify-center h-[50vh] text-center max-w-sm mx-auto">
                     <div className="h-20 w-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mb-6">
                        <Layout className="h-10 w-10" />
                     </div>
                     <h3 className="text-xl font-bold text-slate-800">Beginning of History</h3>
                     <p className="text-sm text-slate-400 font-medium mt-2">Send your first message to initialize the concierge thread with {roomName}.</p>
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
          />
        </div>

        {/* Right Info Sidebar (Concierge Style) */}
        {showInfo && (
          <aside className="hidden lg:flex w-80 flex-col border-l border-slate-100 bg-white animate-in slide-in-from-right-4 duration-500">
             <div className="p-4 border-b border-slate-100 flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSidebarTab('info')}
                  className={cn(
                    "flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest h-9",
                    sidebarTab === 'info' ? "bg-slate-50 text-blue-600 shadow-sm" : "text-slate-400"
                  )}
                >
                   Details
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSidebarTab('pinned')}
                  className={cn(
                    "flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest h-9",
                    sidebarTab === 'pinned' ? "bg-slate-50 text-blue-600 shadow-sm" : "text-slate-400"
                  )}
                >
                   Knowledge
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setShowInfo(false)} className="h-9 w-9 text-slate-300 hover:text-slate-500 ml-2">✕</Button>
             </div>

             <div className="flex-1 overflow-y-auto scrollbar-hide">
                {sidebarTab === 'info' ? (
                   <>
                      {/* Profile Card */}
                      <div className="p-6 text-center border-b border-slate-50">
                         <div className="relative inline-block mb-4">
                            <Avatar className="h-20 w-20 ring-4 ring-slate-50 border-white shadow-xl">
                               <AvatarImage src={chatPartner?.avatar || `https://i.pravatar.cc/200?u=${roomName}`} />
                               <AvatarFallback>{roomName[0]}</AvatarFallback>
                            </Avatar>
                            <span className="absolute bottom-1 right-1 h-4 w-4 bg-green-500 rounded-full border-[3px] border-white" />
                         </div>
                         <h3 className="text-lg font-bold text-slate-900">{chatPartner?.name || roomName}</h3>
                         <p className="text-[11px] font-black uppercase text-blue-600 tracking-wider mt-1">Concierge Lead</p>
                         
                         <div className="flex gap-2 mt-6">
                            <Button variant="outline" size="icon" className="flex-1 h-10 transition-all hover:bg-slate-50 border-slate-100">
                               <Clock className="h-4 w-4 text-slate-400" />
                            </Button>
                            <Button variant="outline" size="icon" className="flex-1 h-10 transition-all hover:bg-slate-50 border-slate-100">
                               <Shield className="h-4 w-4 text-slate-400" />
                            </Button>
                            <Button variant="outline" size="icon" className="flex-1 h-10 transition-all hover:bg-slate-50 border-slate-100">
                               <Tag className="h-4 w-4 text-slate-400" />
                            </Button>
                         </div>
                      </div>

                      {/* Sub-sections */}
                      <div className="p-6 space-y-8">
                         <div>
                            <h4 className="text-[9px] font-black uppercase text-slate-300 tracking-widest mb-3 flex items-center justify-between">
                               Active Members
                               <span className="h-4 px-1.5 rounded bg-slate-50 text-slate-400 flex items-center justify-center">{onlineUsers}</span>
                            </h4>
                            <div className="space-y-3">
                               {[1,2,3].map(i => (
                                  <div key={i} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                                     <Avatar className="h-7 w-7 border border-slate-100">
                                        <AvatarImage src={`https://i.pravatar.cc/100?img=${i+10}`} />
                                        <AvatarFallback>A</AvatarFallback>
                                     </Avatar>
                                     <span className="text-xs font-bold text-slate-600">Member Node {i}</span>
                                  </div>
                               ))}
                            </div>
                         </div>

                         <div>
                            <h4 className="text-[9px] font-black uppercase text-slate-300 tracking-widest mb-3">Quick Actions</h4>
                            <div className="space-y-1">
                               <Button variant="ghost" onClick={handleExport} className="w-full flex items-center justify-between p-3 h-auto group bg-transparent hover:bg-slate-50 text-slate-500 hover:text-blue-600 transition-all">
                                  <span className="text-xs font-bold">Export Transcript</span>
                                  <ChevronRight className="h-3 w-3 text-slate-300 group-hover:text-blue-400" />
                               </Button>
                               <Button variant="ghost" onClick={onClearHistory} className="w-full flex items-center justify-between p-3 h-auto group bg-transparent hover:bg-slate-50 text-slate-500 hover:text-red-600 transition-all">
                                  <span className="text-xs font-bold">Clear History</span>
                                  <ChevronRight className="h-3 w-3 text-slate-300 group-hover:text-red-400" />
                               </Button>
                               <Button variant="ghost" onClick={() => setIsMuted(!isMuted)} className={cn(
                                  "w-full flex items-center justify-between p-3 h-auto group bg-transparent hover:bg-slate-50 transition-all",
                                  isMuted ? "text-orange-500" : "text-slate-500 hover:text-orange-600"
                               )}>
                                  <span className="text-xs font-bold">{isMuted ? 'Unmute Signals' : 'Mute Signals'}</span>
                                  <ChevronRight className="h-3 w-3 text-slate-300 group-hover:text-orange-400" />
                               </Button>
                            </div>
                         </div>
                      </div>
                   </>
                ) : (
                   <div className="p-6">
                      <h4 className="text-[9px] font-black uppercase text-slate-300 tracking-widest mb-4">Pinned Knowledge</h4>
                      {pinnedMessages.length === 0 ? (
                         <div className="text-center py-12 px-4 italic">
                            <StarIcon className="h-8 w-8 text-slate-100 mx-auto mb-3" />
                            <p className="text-xs text-slate-300 font-medium leading-relaxed">No messages have been pinned to the knowledge base yet.</p>
                         </div>
                      ) : (
                         <div className="space-y-4">
                            {pinnedMessages.map(m => (
                               <div key={m.id} className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-orange-100 transition-all group animate-in slide-in-from-right-2 duration-300">
                                  <div className="flex items-center justify-between mb-2">
                                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{m.senderName}</span>
                                     <StarIcon className="h-3 w-3 text-orange-400 fill-orange-400" />
                                  </div>
                                  <p className="text-xs text-slate-600 line-clamp-3 font-medium leading-relaxed">{m.content}</p>
                                  <div className="mt-3 text-[8px] font-bold text-slate-300 uppercase tracking-widest flex items-center justify-between">
                                     <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                     <Button variant="ghost" size="sm" onClick={() => onPinMessage?.(m.id)} className="h-4 p-0 px-1 text-[8px] opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500">Unpin</Button>
                                  </div>
                                </div>
                            ))}
                         </div>
                      )}
                   </div>
                )}
             </div>


             <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                   <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                      <Layout size={16} />
                   </div>
                   <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-900 truncate uppercase tracking-widest">Premium Enforced</p>
                      <p className="text-[9px] font-bold text-slate-400 truncate mt-0.5">End-to-End Encryption Active</p>
                   </div>
                </div>
             </div>
          </aside>
        )}

        <Button 
          variant="outline"
          size="icon"
          onClick={() => setShowInfo(!showInfo)}
          className="absolute right-8 top-8 h-10 w-10 bg-white lg:hidden z-20"
        >
           <Info className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

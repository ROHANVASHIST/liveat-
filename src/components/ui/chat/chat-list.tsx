import React, { useState, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../avatar';
import { cn } from '@/lib/utils';
import { 
  MessageSquare,
  BarChart3,
  Settings,
  Plus,
  Terminal,
  Activity,
  ChevronRight,
  Hash,
  Users,
  Search,
  Circle,
  Clock
} from 'lucide-react';

interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastMessage?: string;
  lastMessageTime?: Date;
}

interface ChatRoom {
  id: string;
  name: string;
  description: string;
}

interface ChatListProps {
  rooms: ChatRoom[];
  users: ChatUser[];
  currentRoomId?: string;
  activeChatUserId?: string;
  currentUserId?: string;
  onSelectRoom: (roomId: string) => void;
  onSelectUser: (userId: string) => void;
  onSelectNav?: (nav: string) => void;
  onAddContact?: () => void;
  onOpenProfile: () => void;
  onCreateRoom?: () => void;
  typingUsers?: string[];
  roomUnreadCounts?: Record<string, number>;
  onStatusClick?: (userId: string) => void;
  statusUsers?: string[];
}

const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
};

export const ChatList: React.FC<ChatListProps> = ({
  rooms,
  users,
  currentRoomId,
  activeChatUserId,
  currentUserId,
  onSelectRoom,
  onSelectUser,
  onSelectNav,
  onOpenProfile,
  onCreateRoom,
  typingUsers = [],
  roomUnreadCounts = {},
  onStatusClick,
  statusUsers = [],
}) => {
  const [activeNav, setActiveNav] = useState('messages');
  const [sidebarSection, setSidebarSection] = useState<'rooms' | 'contacts'>('rooms');
  const [searchQuery, setSearchQuery] = useState('');
  const currentUserData = users.find(u => u.id === currentUserId);
  const onlineCount = users.filter(u => u.status === 'online').length;

  const mainNav = [
    { id: 'messages', label: 'Chat', icon: MessageSquare },
    { id: 'analytics', label: 'Monitor', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const filteredRooms = rooms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredUsers = users.filter(u => 
    u.id !== currentUserId && 
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onlineUsers = filteredUsers.filter(u => u.status === 'online');
  const offlineUsers = filteredUsers.filter(u => u.status !== 'online');

  return (
    <div className="flex h-full flex-col bg-card border-r border-border relative overflow-hidden font-mono">
      {/* App Branding */}
      <div className="p-5 border-b border-border bg-muted/10 group cursor-pointer" onClick={() => onSelectNav?.('messages')}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 border border-primary flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
             <Terminal size={20} />
          </div>
          <div>
             <h2 className="text-xs font-bold uppercase tracking-[0.2em] leading-none">LiveAt</h2>
             <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1.5 flex items-center gap-2">
               <span className="h-1.5 w-1.5 rounded-full status-online connection-pulse" /> 
               <span>{onlineCount} online</span>
             </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative group">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full bg-muted/20 border border-border focus:border-primary/50 h-8 pl-8 pr-3 text-[10px] uppercase tracking-widest outline-none transition-all text-foreground placeholder:text-muted-foreground/40"
          />
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-hide">
        <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground px-2 mb-3 opacity-50">Navigation</div>
        {mainNav.map((item) => (
          <button
            key={item.id}
            onClick={() => {
               setActiveNav(item.id);
               onSelectNav?.(item.id);
               if (item.id === 'settings') onOpenProfile();
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 text-[10px] uppercase tracking-widest transition-all border",
              activeNav === item.id 
                ? "bg-primary text-primary-foreground border-primary" 
                : "text-muted-foreground border-transparent hover:border-border hover:bg-muted/30"
            )}
          >
            <item.icon size={14} className={cn(activeNav === item.id ? "text-primary-foreground" : "text-muted-foreground")} />
            <span className="flex-1 text-left">{item.label}</span>
            {activeNav === item.id && <ChevronRight size={10} />}
          </button>
        ))}
        
        {/* Section Toggle: Rooms / Contacts */}
        <div className="pt-6">
          <div className="flex items-center gap-1 mb-3 border border-border bg-muted/10">
            <button 
              onClick={() => setSidebarSection('rooms')}
              className={cn(
                "flex-1 py-1.5 text-[9px] uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-1.5",
                sidebarSection === 'rooms' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Hash size={10} /> Rooms
            </button>
            <button 
              onClick={() => setSidebarSection('contacts')}
              className={cn(
                "flex-1 py-1.5 text-[9px] uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-1.5",
                sidebarSection === 'contacts' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Users size={10} /> Contacts
            </button>
            {sidebarSection === 'rooms' && (
              <button
                onClick={(e) => { e.stopPropagation(); onCreateRoom?.(); }}
                className="px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors border-l border-border"
              >
                <Plus size={12} />
              </button>
            )}
          </div>
            
          <div className="space-y-0.5">
            {sidebarSection === 'rooms' ? (
              filteredRooms.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest opacity-50">
                    {searchQuery ? 'No rooms found' : 'No rooms yet'}
                  </p>
                </div>
              ) : (
                filteredRooms.map(room => {
                  const unread = roomUnreadCounts[room.id] || 0;
                  return (
                    <button 
                      key={room.id} 
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-[10px] uppercase tracking-widest transition-all border",
                        currentRoomId === room.id && !activeChatUserId
                          ? "bg-muted/50 border-primary/30 text-foreground" 
                          : "text-muted-foreground border-transparent hover:bg-muted/20"
                      )}
                      onClick={() => onSelectRoom(room.id)}
                    >
                       <Hash size={12} className={cn(currentRoomId === room.id && !activeChatUserId ? "text-primary" : "text-muted-foreground opacity-50")} />
                       <span className="flex-1 text-left truncate">{room.name}</span>
                       {unread > 0 && (
                         <span className="flex items-center gap-1">
                           <Circle size={8} className="fill-primary text-primary" />
                           <span className="text-[8px] text-primary font-bold">{unread}</span>
                         </span>
                       )}
                       {currentRoomId === room.id && !activeChatUserId && <div className="h-1.5 w-1.5 bg-primary rounded-full shadow-[0_0_5px_hsl(var(--primary))]" />}
                    </button>
                  );
                })
              )
            ) : (
              filteredUsers.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest opacity-50">
                    {searchQuery ? 'No contacts found' : 'No contacts yet'}
                  </p>
                </div>
              ) : (
                <>
                  {onlineUsers.map(user => (
                    <button 
                      key={user.id} 
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-[10px] uppercase tracking-widest transition-all border",
                        activeChatUserId === user.id 
                          ? "bg-muted/50 border-primary/30 text-foreground" 
                          : "text-muted-foreground border-transparent hover:bg-muted/20"
                      )}
                      onClick={() => onSelectUser(user.id)}
                    >
                       <div
                         className="relative shrink-0 cursor-pointer"
                         onClick={(e) => { e.stopPropagation(); onStatusClick?.(user.id); }}
                       >
                           <div className={cn(
                             "h-7 w-7 rounded-full overflow-hidden",
                             "border-2",
                             statusUsers.includes(user.id) ? "border-primary" : "border-border"
                           )}>
                             <Avatar className="h-full w-full rounded-none">
                               <AvatarImage src={user.avatar} className="object-cover" />
                               <AvatarFallback className="text-[8px] bg-muted rounded-none">{user.name ? user.name[0] : 'U'}</AvatarFallback>
                             </Avatar>
                           </div>
                           <span className={cn(
                             "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-card",
                             user.status === 'online' ? "status-online" : user.status === 'away' ? "status-away" : "status-offline"
                           )} />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <span className="block truncate">{user.name}</span>
                          {typingUsers.includes(user.id) ? (
                            <span className="flex items-center gap-1 mt-0.5">
                              <span className="text-[8px] text-primary italic normal-case tracking-normal">typing</span>
                              <span className="typing-dot" />
                              <span className="typing-dot" />
                              <span className="typing-dot" />
                            </span>
                          ) : user.lastMessage ? (
                            <span className="block text-[8px] text-muted-foreground truncate mt-0.5 normal-case tracking-normal">{user.lastMessage}</span>
                          ) : null}
                        </div>
                        {!typingUsers.includes(user.id) && user.lastMessageTime ? (
                          <span className="flex items-center gap-1 shrink-0">
                            <Clock size={8} className="text-muted-foreground/50" />
                            <span className="text-[7px] text-muted-foreground uppercase tracking-widest opacity-50">{getRelativeTime(user.lastMessageTime)}</span>
                          </span>
                        ) : user.status === 'online' && !typingUsers.includes(user.id) ? (
                          <span className="text-[7px] text-muted-foreground uppercase tracking-widest opacity-50">Online</span>
                        ) : null}
                    </button>
                  ))}
                  {onlineUsers.length > 0 && offlineUsers.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1">
                      <div className="flex-1 h-px bg-border/50" />
                      <span className="text-[7px] uppercase tracking-widest text-muted-foreground/40 shrink-0">Offline</span>
                      <div className="flex-1 h-px bg-border/50" />
                    </div>
                  )}
                  {offlineUsers.map(user => (
                    <button 
                      key={user.id} 
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-[10px] uppercase tracking-widest transition-all border",
                        activeChatUserId === user.id 
                          ? "bg-muted/50 border-primary/30 text-foreground" 
                          : "text-muted-foreground border-transparent hover:bg-muted/20"
                      )}
                      onClick={() => onSelectUser(user.id)}
                    >
                       <div
                         className="relative shrink-0 cursor-pointer"
                         onClick={(e) => { e.stopPropagation(); onStatusClick?.(user.id); }}
                       >
                           <div className={cn(
                             "h-7 w-7 rounded-full overflow-hidden",
                             "border-2",
                             statusUsers.includes(user.id) ? "border-primary" : "border-border"
                           )}>
                             <Avatar className="h-full w-full rounded-none">
                               <AvatarImage src={user.avatar} className="object-cover" />
                               <AvatarFallback className="text-[8px] bg-muted rounded-none">{user.name ? user.name[0] : 'U'}</AvatarFallback>
                             </Avatar>
                           </div>
                           <span className={cn(
                             "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-card",
                             user.status === 'online' ? "status-online" : user.status === 'away' ? "status-away" : "status-offline"
                           )} />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <span className="block truncate">{user.name}</span>
                          {typingUsers.includes(user.id) ? (
                            <span className="flex items-center gap-1 mt-0.5">
                              <span className="text-[8px] text-primary italic normal-case tracking-normal">typing</span>
                              <span className="typing-dot" />
                              <span className="typing-dot" />
                              <span className="typing-dot" />
                            </span>
                          ) : user.lastMessage ? (
                            <span className="block text-[8px] text-muted-foreground truncate mt-0.5 normal-case tracking-normal">{user.lastMessage}</span>
                          ) : null}
                        </div>
                        {!typingUsers.includes(user.id) && user.lastMessageTime ? (
                          <span className="flex items-center gap-1 shrink-0">
                            <Clock size={8} className="text-muted-foreground/50" />
                            <span className="text-[7px] text-muted-foreground uppercase tracking-widest opacity-50">{getRelativeTime(user.lastMessageTime)}</span>
                          </span>
                        ) : user.status === 'online' && !typingUsers.includes(user.id) ? (
                          <span className="text-[7px] text-muted-foreground uppercase tracking-widest opacity-50">Online</span>
                        ) : null}
                    </button>
                  ))}
                </>
              )
            )}
          </div>
        </div>
      </nav>

      {/* Current User Status */}
      <div className="p-3 bg-muted/20 border-t border-border mt-auto">
         <div 
           className="flex items-center gap-3 p-2.5 border border-border bg-background hover:border-primary/50 transition-all cursor-pointer group"
           onClick={onOpenProfile}
         >
           <Avatar className="relative h-8 w-8 border border-border rounded-none overflow-hidden shrink-0">
              <AvatarImage src={currentUserData?.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground font-bold rounded-none">{currentUserData?.name ? currentUserData.name[0] : 'U'}</AvatarFallback>
           </Avatar>
           <div className="flex-1 min-w-0">
             <p className="text-[10px] font-bold text-foreground truncate uppercase tracking-widest">{currentUserData?.name || 'You'}</p>
             <p className="text-[8px] text-primary uppercase tracking-[0.2em] mt-0.5">Connected</p>
           </div>
           <Activity size={12} className="text-muted-foreground group-hover:text-primary animate-tech-pulse shrink-0" />
         </div>
      </div>
    </div>
  );
};

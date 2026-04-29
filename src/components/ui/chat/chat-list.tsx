import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../avatar';
import { Badge } from '../badge';
import { Button } from '../button';
import { Input } from '../input';
import { cn } from '@/lib/utils';
import { Search, Plus, Settings, Users, MessageSquare, ChartBar as BarChart3, LogOut, Bell, MoveVertical as MoreVertical, ChevronRight, Circle } from 'lucide-react';
import { ScrollArea } from '../scroll-area';
import { AppIcon } from '../app-icon';

interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastMessage?: string;
  lastMessageTime?: Date;
  email?: string;
}

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  onlineUsers: number;
  lastMessage?: string;
  type: 'public' | 'private' | 'direct';
}

interface ChatListProps {
  rooms: ChatRoom[];
  users: ChatUser[];
  currentRoomId?: string;
  currentUserId?: string;
  activeChatUserId?: string | null;
  onSelectRoom: (roomId: string) => void;
  onSelectUser: (userId: string) => void;
  onSelectNav?: (nav: string) => void;
  onAddContact: () => void;
  onOpenProfile: () => void;
  onSearch: (query: string) => void;
}

export const ChatList: React.FC<ChatListProps> = ({
  rooms,
  users,
  currentRoomId,
  currentUserId,
  activeChatUserId,
  onSelectRoom,
  onSelectUser,
  onSelectNav,
  onAddContact,
  onOpenProfile,
  onSearch,
}) => {
  const [activeNav, setActiveNav] = useState('messages');
  const [searchQuery, setSearchQuery] = useState('');
  
  const currentUserData = users.find(u => u.id === currentUserId);

  const mainNav = [
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-full flex-col bg-white border-r border-slate-100 relative overflow-hidden text-slate-600">
      {/* Branding Section */}
      <div className="p-8 flex items-center gap-4 mb-2">
        <div className="h-11 w-11 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20 rotate-3 hover:rotate-0 transition-transform duration-500">
           <AppIcon size={22} className="text-white" />
        </div>
        <div>
           <h2 className="text-sm font-black text-slate-900 leading-[1.1] uppercase tracking-tighter">Digital<br /><span className="text-blue-600">Concierge.</span></h2>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        <div className="mb-4 px-4">
           <h3 className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] mb-4">Workspace</h3>
        </div>
        {mainNav.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            onClick={() => {
               setActiveNav(item.id);
               onSelectNav?.(item.id);
               if (item.id === 'settings') onOpenProfile();
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-4 h-auto rounded-2xl text-sm font-bold transition-all relative group overflow-hidden",
              activeNav === item.id 
                ? "bg-blue-50/50 text-blue-600 shadow-sm border border-blue-100/50" 
                : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            )}
          >
            <item.icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", activeNav === item.id ? "text-blue-600" : "text-slate-300")} />
            {item.label}
            {activeNav === item.id && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-blue-600 rounded-l-full animate-in slide-in-from-right duration-500" />
            )}
          </Button>
        ))}
        
        {/* Messages Preview Section */}
        <div className="pt-10 mb-4 px-4 overflow-y-auto scrollbar-hide">
           <h3 className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] mb-6">
             {activeNav === 'messages' ? 'Active Rooms' : 'Agent Directory'}
           </h3>
           <div className="space-y-5">
              {activeNav === 'messages' ? (
                rooms.map(room => (
                  <div 
                    key={room.id} 
                    className={cn(
                      "flex items-center gap-3 group cursor-pointer hover:translate-x-1 transition-all rounded-2xl p-2",
                      currentRoomId === room.id ? "bg-blue-50/50" : "hover:bg-slate-50"
                    )}
                    onClick={() => onSelectRoom(room.id)}
                  >
                     <div className="h-9 w-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Badge className="bg-transparent text-inherit p-0 font-bold border-none">#</Badge>
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className={cn("text-[11px] font-black uppercase tracking-tight truncate", currentRoomId === room.id ? "text-blue-600" : "text-slate-700")}>{room.name}</p>
                        <p className="text-[10px] text-slate-400 truncate opacity-70 mt-0.5">{room.description}</p>
                     </div>
                  </div>
                ))
              ) : (
                users.map(user => (
                  <div 
                    key={user.id} 
                    className={cn(
                      "flex items-center gap-3 group cursor-pointer hover:translate-x-1 transition-all rounded-2xl p-2",
                      activeChatUserId === user.id ? "bg-blue-50/50" : "hover:bg-slate-50"
                    )}
                    onClick={() => onSelectUser(user.id)}
                  >
                     <div className="relative">
                        <Avatar className="h-9 w-9 ring-2 ring-white shadow-sm transition-all group-hover:shadow-md">
                           <AvatarImage src={user.avatar} />
                           <AvatarFallback className="bg-slate-100 text-[10px] text-slate-400 font-bold">{user.name[0]}</AvatarFallback>
                        </Avatar>
                        {user.status === 'online' && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-white animate-pulse" />}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                           <p className={cn("text-[11px] font-black uppercase tracking-tight truncate", activeChatUserId === user.id ? "text-blue-600" : "text-slate-700")}>{user.name}</p>
                           {user.status === 'online' && <span className="text-[8px] font-bold text-green-500 uppercase tracking-widest">Active</span>}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate opacity-70 mt-0.5">{user.email || 'Lead Concierge'}</p>
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>
      </nav>

      {/* User Section */}
      <div className="p-6 mt-auto border-t border-slate-50 bg-slate-50/30">
         <div 
           className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer group border border-transparent hover:border-slate-100"
           onClick={onOpenProfile}
         >
           <div className="relative">
             <Avatar className="h-10 w-10 ring-2 ring-white shadow-md transition-all group-hover:scale-105">
                <AvatarImage src={currentUserData?.avatar} />
                <AvatarFallback className="bg-blue-50 text-blue-600 font-bold">{currentUserData?.name[0] || 'U'}</AvatarFallback>
             </Avatar>
             <span className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-green-500 rounded-full border-[3px] border-white" />
           </div>
           <div className="flex-1 min-w-0">
             <p className="text-[11px] font-black text-slate-900 truncate uppercase tracking-widest">{currentUserData?.name || 'Admin Node'}</p>
             <p className="text-[9px] font-bold text-blue-500 uppercase tracking-[0.15em] opacity-80 mt-0.5">Authorized Lead</p>
           </div>
         </div>
      </div>
    </div>
  );
};

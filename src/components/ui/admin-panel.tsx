import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { X, Users, MessageSquare, Send, Trash2, Circle, Search } from 'lucide-react';

interface AdminPanelProps {
  users: any[];
  rooms: any[];
  onDeleteUser: (userId: string) => void;
  onDeleteRoom: (roomId: string) => void;
  onBroadcast: (message: string) => void;
  onClose?: () => void;
}

type Tab = 'users' | 'rooms' | 'broadcast';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  users,
  rooms,
  onDeleteUser,
  onDeleteRoom,
  onBroadcast,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [broadcastText, setBroadcastText] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [roomSearch, setRoomSearch] = useState('');

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredRooms = rooms.filter(r =>
    r.name?.toLowerCase().includes(roomSearch.toLowerCase()) ||
    r.description?.toLowerCase().includes(roomSearch.toLowerCase())
  );

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'users', label: 'Users', icon: <Users size={12} /> },
    { key: 'rooms', label: 'Rooms', icon: <MessageSquare size={12} /> },
    { key: 'broadcast', label: 'Broadcast', icon: <Send size={12} /> },
  ];

  return (
    <div className="border border-border bg-background w-full max-w-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="text-[10px] font-bold uppercase tracking-widest">Admin Panel</span>
          {onClose && (
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={14} />
            </button>
          )}
        </div>

      <div className="flex border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 text-[8px] uppercase tracking-widest font-bold border-b-2 transition-colors",
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {activeTab === 'users' && (
          <div className="space-y-3">
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="SEARCH_USERS..."
                className="w-full h-9 bg-background/50 border border-border pl-8 pr-3 text-[10px] uppercase tracking-widest outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {filteredUsers.map(user => (
                <div key={user.id} className="flex items-center gap-3 px-3 py-2.5 border border-border hover:border-primary/20 transition-colors">
                  <Circle size={8} className={cn(
                    'shrink-0',
                    user.status === 'online' ? 'text-emerald-500 fill-emerald-500' :
                    user.status === 'away' ? 'text-amber-500 fill-amber-500' :
                    'text-zinc-500 fill-zinc-500'
                  )} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground block truncate">{user.name || 'Unknown'}</span>
                    {user.email && (
                      <span className="text-[8px] text-muted-foreground tracking-wider block truncate">{user.email}</span>
                    )}
                  </div>
                  <span className={cn(
                    "text-[7px] uppercase tracking-widest px-1.5 py-0.5 border",
                    user.status === 'online' ? 'text-emerald-500 border-emerald-500/30' :
                    user.status === 'away' ? 'text-amber-500 border-amber-500/30' :
                    'text-zinc-500 border-zinc-500/30'
                  )}>
                    {user.status || 'offline'}
                  </span>
                  <button
                    onClick={() => onDeleteUser(user.id)}
                    className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="py-8 text-center">
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50">No users found</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'rooms' && (
          <div className="space-y-3">
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                placeholder="SEARCH_ROOMS..."
                className="w-full h-9 bg-background/50 border border-border pl-8 pr-3 text-[10px] uppercase tracking-widest outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {filteredRooms.map(room => (
                <div key={room.id} className="flex items-center gap-3 px-3 py-2.5 border border-border hover:border-primary/20 transition-colors">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground block truncate">{room.name || 'Unknown'}</span>
                    {room.description && (
                      <span className="text-[8px] text-muted-foreground tracking-wider block truncate">{room.description}</span>
                    )}
                  </div>
                  <span className={cn(
                    "text-[7px] uppercase tracking-widest px-1.5 py-0.5 border",
                    room.type === 'public' ? 'text-primary border-primary/30' :
                    room.type === 'private' ? 'text-amber-500 border-amber-500/30' :
                    'text-violet-500 border-violet-500/30'
                  )}>
                    {room.type || 'unknown'}
                  </span>
                  <button
                    onClick={() => onDeleteRoom(room.id)}
                    className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
              {filteredRooms.length === 0 && (
                <div className="py-8 text-center">
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50">No rooms found</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'broadcast' && (
          <div className="space-y-4">
            <div>
              <label className="text-[8px] uppercase tracking-widest text-muted-foreground block mb-2">Broadcast Message</label>
              <textarea
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                placeholder="TYPE_BROADCAST_MESSAGE..."
                rows={4}
                className="w-full bg-background/50 border border-border px-3 py-2.5 text-[10px] uppercase tracking-widest outline-none focus:border-primary resize-none placeholder:text-muted-foreground/30"
              />
            </div>
            <button
              onClick={() => { if (broadcastText.trim()) { onBroadcast(broadcastText.trim()); setBroadcastText(''); } }}
              disabled={!broadcastText.trim()}
              className={cn(
                "w-full h-10 flex items-center justify-center gap-2 text-[9px] uppercase tracking-widest font-bold border transition-all",
                broadcastText.trim()
                  ? "border-primary/30 text-primary hover:bg-primary/5"
                  : "border-border/30 text-muted-foreground/30 cursor-not-allowed"
              )}
            >
              <Send size={12} /> Send Broadcast
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

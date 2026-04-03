import { useState, useEffect, useCallback } from 'react';
import { ChatWelcome, ChatRoom, ChatList, UserProfile, AnalyticsDashboard } from './components/ui';
import { Button } from './components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/dialog';
import { Input } from './components/ui/input';
import { 
  Users 
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { cn } from './lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

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

function App() {
  const [currentUser, setCurrentUser] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserAvatar, setCurrentUserAvatar] = useState('');
  const [activeNav, setActiveNav] = useState('messages');
  const [currentMessage, setCurrentMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(1);
  const [activeRoomId, setActiveRoomId] = useState<string>('general');
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      const [roomsRes, usersRes, analyticsRes] = await Promise.all([
        fetch('/api/rooms'),
        fetch('/api/users'),
        fetch('/api/analytics')
      ]);

      if (roomsRes.ok) {
        const data = await roomsRes.json();
        setRooms(data.map((room: any) => ({
          id: room.id,
          name: room.name,
          description: room.description,
          onlineUsers: 0,
          type: room.type,
        })));
      }

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.map((user: any) => ({
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          status: user.status || 'offline',
          email: user.email,
        })));
      }

      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Failed to load real data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    const checkSupabaseSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user.user_metadata?.name || session.user.email?.split('@')[0] || '');
        setCurrentUserEmail(session.user.email || '');
        setCurrentUserId(session.user.id);
        setCurrentUserAvatar(session.user.user_metadata?.avatar_url || '');
        setIsConnected(true);
      }
    };

    const checkBackendSession = async () => {
      try {
        const response = await fetch('/api/auth/user', {
          credentials: 'include'
        });
        if (response.ok) {
          const user = await response.json();
          setCurrentUser(user.name);
          setCurrentUserEmail(user.email || '');
          setCurrentUserId(user.id);
          setCurrentUserAvatar(user.avatar);
          setIsConnected(true);
        }
      } catch (err) {
        console.error('Failed to check backend session:', err);
      }
    };

    checkSupabaseSession();
    checkBackendSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setCurrentUser(session.user.user_metadata?.name || session.user.email?.split('@')[0] || '');
        setCurrentUserEmail(session.user.email || '');
        setCurrentUserId(session.user.id);
        setCurrentUserAvatar(session.user.user_metadata?.avatar_url || '');
        setIsConnected(true);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      setCurrentUser('');
      setCurrentUserId('');
      setIsConnected(false);
      setActiveNav('messages');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    if (!currentUser || !isConnected) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:3000`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: 'join',
        userId: currentUserId || currentUser,
        userName: currentUser,
        roomId: activeRoomId,
      }));

      socket.send(JSON.stringify({
        type: 'load_messages',
        roomId: activeRoomId,
      }));

      socket.send(JSON.stringify({
        type: 'load_status',
      }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'message':
          setMessages((prev) => [...prev, {
            id: data.id,
            senderId: data.senderId,
            senderName: data.senderName,
            content: data.content,
            timestamp: new Date(data.timestamp),
            isSelf: data.senderId === (currentUserId || currentUser),
            type: data.msgType as 'text' | 'image' | 'file',
            mediaUrl: data.mediaUrl,
          }]);
          break;
        case 'message_history':
          setMessages(data.messages.map((msg: any) => ({
            id: msg.id,
            senderId: msg.senderId,
            senderName: msg.senderName,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            isSelf: msg.senderId === (currentUserId || currentUser),
            type: msg.msgType as 'text' | 'image' | 'file',
            mediaUrl: msg.mediaUrl,
          })));
          break;
        case 'user_count':
          setOnlineUsers(data.count);
          break;
        case 'user_joined':
          setUsers((prev) => {
            const filtered = prev.filter(u => u.id !== data.userId);
            return [...filtered, {
              id: data.userId,
              name: data.userName,
              status: 'online',
            }];
          });
          break;
        case 'user_left':
          setUsers((prev) => prev.filter(u => u.id !== data.userId));
          break;
        case 'room_created':
          setRooms((prev) => [
            ...prev,
            {
              id: data.roomId,
              name: data.roomName,
              description: data.roomDescription,
              onlineUsers: 0,
              type: data.roomType,
            },
          ]);
          break;
      }
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [currentUser, currentUserId, activeRoomId, isConnected]);

  const uploadMedia = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      const reader = new FileReader();
      return new Promise((resolve) => {
        reader.onloadend = async () => {
          try {
            const base64Data = reader.result as string;
            const response = await fetch('/api/upload/base64', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                base64Data,
                contentType: file.type,
                fileName: file.name,
              }),
              credentials: 'include',
            });

            if (!response.ok) {
              resolve(null);
              return;
            }

            const data = await response.json();
            resolve(data.url);
          } catch (err) {
            resolve(null);
          } finally {
            setIsUploading(false);
          }
        };
        reader.onerror = () => {
          setIsUploading(false);
          resolve(null);
        };
        reader.readAsDataURL(file);
      });
    } catch (err) {
      setIsUploading(false);
      return null;
    }
  };

  const handleSendMessage = useCallback(async () => {
    if ((!currentMessage.trim() && !pendingFile) || !ws || !currentUser) return;

    let mediaUrl: string | undefined = undefined;
    let msgType: 'text' | 'image' | 'file' = 'text';

    if (pendingFile) {
      msgType = pendingFile.type.startsWith('image/') ? 'image' : 'file';
      const uploadedUrl = await uploadMedia(pendingFile);
      if (uploadedUrl) {
        mediaUrl = uploadedUrl;
      }
    }

    const content = currentMessage.trim() || (pendingFile ? pendingFile.name : '');

    const message: Message = {
      id: Date.now().toString(),
      senderId: currentUserId || currentUser,
      senderName: currentUser,
      content,
      timestamp: new Date(),
      isSelf: true,
      type: msgType,
      mediaUrl: mediaUrl || filePreview || undefined,
    };

    setMessages((prev) => [...prev, message]);
    ws.send(JSON.stringify({
      type: 'message',
      content,
      senderId: currentUserId || currentUser,
      senderName: currentUser,
      roomId: activeRoomId,
      msgType: msgType,
      mediaUrl: mediaUrl,
    }));

    setCurrentMessage('');
    setFilePreview(null);
    setPendingFile(null);
  }, [currentMessage, ws, currentUser, currentUserId, activeRoomId, filePreview, pendingFile]);

  const handleFileUpload = (file: File) => {
    setPendingFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleReaction = (messageId: string, emoji: string) => {
    if (!ws || !currentUserId) return;
    ws.send(JSON.stringify({
      type: 'reaction',
      messageId,
      emoji,
      userId: currentUserId,
    }));
  };

  const handlePinMessage = (messageId: string) => {
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, isPinned: !m.isPinned } : m
    ));
  };

  const handleJoin = (username: string) => {
    if (username.trim()) {
      setCurrentUser(username);
      setIsConnected(true);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const handleEmailAuth = async (email: string, password: string, name: string, isSignup: boolean) => {
    const url = isSignup ? '/api/auth/signup' : '/api/auth/signin';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name: isSignup ? name : undefined }),
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Authentication failed');

    setCurrentUser(data.name);
    setCurrentUserId(data.id);
    setCurrentUserAvatar(data.avatar);
    setCurrentUserEmail(data.email || email);
    setIsConnected(true);
  };

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) return;
    ws?.send(JSON.stringify({
      type: 'create_room',
      roomName: newRoomName,
      roomDescription: newRoomDesc,
      roomType: 'public',
    }));
    setNewRoomName('');
    setNewRoomDesc('');
    setIsCreateRoomOpen(false);
  };

  const handleAddContact = () => {
    if (!newContactName.trim()) return;
    setUsers((prev) => [
      ...prev,
      { id: Date.now().toString(), name: newContactName, status: 'online' },
    ]);
    setNewContactName('');
    setIsAddContactOpen(false);
  };

  if (!currentUser || !isConnected) {
    return (
      <ChatWelcome 
        onJoin={handleJoin} 
        onGoogleLogin={handleGoogleLogin} 
        onEmailAuth={handleEmailAuth}
        isLoading={isLoading}
        onUsernameChange={setCurrentUser}
        currentUser={currentUser}
      />
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-inter select-none">
      {/* Sidebar - Consistent across all views */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-500 transform lg:relative lg:translate-x-0 shadow-2xl lg:shadow-none",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <ChatList
          rooms={rooms}
          users={users}
          currentRoomId={activeRoomId}
          currentUserId={currentUserId || currentUser}
          onSelectRoom={(id) => {
            setActiveRoomId(id);
            setActiveChatUserId(null);
            setIsSidebarOpen(false);
            setActiveNav('messages');
          }}
          onSelectUser={(id) => {
            setActiveChatUserId(id);
            setActiveRoomId('');
            setIsSidebarOpen(false);
            setActiveNav('messages');
          }}
          onSelectNav={setActiveNav}
          onAddContact={() => setIsAddContactOpen(true)}
          onOpenProfile={() => setActiveNav('settings')}
          onSearch={setSearchQuery}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        {activeNav === 'messages' && (
          <ChatRoom
            roomName={activeChatUserId ? (users.find(u => u.id === activeChatUserId)?.name || 'Direct Chat') : (rooms.find(r => r.id === activeRoomId)?.name || 'General')}
            messages={messages}
            currentMessage={currentMessage}
            onSendMessage={handleSendMessage}
            onMessageChange={setCurrentMessage}
            onFileSelect={handleFileUpload}
            onlineUsers={onlineUsers}
            currentUser={{
              id: currentUserId || currentUser,
              name: currentUser,
              avatar: currentUserAvatar
            }}
            onToggleSidebar={() => setIsSidebarOpen(true)}
            onReaction={handleReaction}
            onSettings={() => setActiveNav('settings')}
            onClearHistory={() => setMessages([])}
            onPinMessage={handlePinMessage}
          />
        )}

        {activeNav === 'analytics' && <AnalyticsDashboard data={analytics} messagesCount={messages.length} activeUsers={onlineUsers} />}

        {activeNav === 'settings' && (
          <UserProfile 
            user={{ 
              name: currentUser, 
              email: currentUserEmail, 
              avatar: currentUserAvatar 
            }} 
            onUpdate={async (data) => {
              try {
                const res = await fetch('/api/auth/user', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data),
                  credentials: 'include'
                });
                if (res.ok) {
                  const updated = await res.json();
                  setCurrentUser(updated.name);
                  setCurrentUserAvatar(updated.avatar);
                }
              } catch (err) {
                console.error('Update profile failed:', err);
              }
            }} 
            onLogout={handleLogout} 
          />
        )}
        
        {activeNav === 'contacts' && (
          <div className="flex-1 flex flex-col bg-white overflow-y-auto">
            <div className="p-12 border-b border-slate-50">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Contact Directory</h2>
              <p className="text-slate-400 font-medium">Manage your agent nodes and direct communication channels.</p>
            </div>
            
            <div className="p-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map(user => (
                <div 
                  key={user.id} 
                  onClick={() => {
                    setActiveChatUserId(user.id);
                    setActiveRoomId('');
                    setActiveNav('messages');
                  }}
                  className="p-6 rounded-[2rem] border border-slate-100 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/5 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-14 w-14 ring-4 ring-slate-50 group-hover:ring-blue-50 transition-all">
                        <AvatarImage src={user.avatar || `https://i.pravatar.cc/100?u=${user.id}`} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className={cn(
                        "absolute bottom-0 right-0 h-4 w-4 rounded-full border-[3px] border-white",
                        user.status === 'online' ? "bg-green-500" : "bg-slate-300"
                      )} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 leading-tight">{user.name}</h3>
                      <p className="text-[10px] font-black uppercase text-blue-600 tracking-wider mt-1">{user.status}</p>
                    </div>
                  </div>
                  <Button variant="ghost" className="w-full mt-6 bg-slate-50 group-hover:bg-blue-600 group-hover:text-white rounded-xl font-bold h-10 transition-all">
                    Initialize Chat
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <Dialog open={isCreateRoomOpen} onOpenChange={setIsCreateRoomOpen}>
        <DialogContent className="rounded-3xl p-8">
          <DialogHeader><DialogTitle className="text-2xl font-bold">New Concierge Room</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Input value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} placeholder="Room name (e.g. Support, Sales)" className="h-12 rounded-xl" />
            <Input value={newRoomDesc} onChange={(e) => setNewRoomDesc(e.target.value)} placeholder="What's this room for?" className="h-12 rounded-xl" />
            <Button onClick={handleCreateRoom} className="w-full">Initialize Room</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
        <DialogContent className="rounded-3xl p-8">
          <DialogHeader><DialogTitle className="text-2xl font-bold">Invite Agent</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Input value={newContactName} onChange={(e) => setNewContactName(e.target.value)} placeholder="Agent Display Name" className="h-12 rounded-xl" />
            <Button onClick={handleAddContact} className="w-full">Add to Directory</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatWelcome, ChatRoom, ChatList, UserProfile, AnalyticsDashboard, InstallPrompt, CommandPalette } from './components/ui';
import { Button } from './components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/dialog';
import { Input } from './components/ui/input';
import { ForwardMessageDialog } from './components/ui/chat/message-actions';
import { 
  Users 
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { cn } from './lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { polishText, summarizeChat, generateAIResponse } from './lib/ai';
import { encryptMessage, decryptMessage } from './lib/encryption';
import { CallUI, useCallTimer } from './components/ui/chat/call-ui';
import { useWebRTC } from './lib/webrtc';
import { StatusViewer } from './components/ui/chat/status-viewer';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL 
  ? (import.meta.env.VITE_BACKEND_URL.startsWith('http') ? import.meta.env.VITE_BACKEND_URL : `https://${import.meta.env.VITE_BACKEND_URL}`)
  : '';

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
  replyTo?: { id: string; content: string; senderName: string; type?: string };
  caption?: string;
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
  const [isLoading, setIsLoading] = useState(true);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [currentSentiment, setCurrentSentiment] = useState<'calm' | 'ai' | 'warning' | 'error'>('calm');
  const [isPolishing, setIsPolishing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [theme, setTheme] = useState<'black' | 'light'>(() => (localStorage.getItem('concierge-theme') as 'black' | 'light') || 'black');
  const [replyToMsg, setReplyToMsg] = useState<Message | null>(null);

  // Call state
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [callDirection, setCallDirection] = useState<'outgoing' | 'incoming'>('outgoing');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isCallMinimized, setIsCallMinimized] = useState(false);
  const [callId, setCallId] = useState<string>('');
  const [remoteOffer, setRemoteOffer] = useState<any>(null);
  const callTimer = useCallTimer();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Forward state
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [forwardMessage, setForwardMessage] = useState<any>(null);

  const getDMRoomId = (uid1: string, uid2: string) => {
    const sorted = [uid1, uid2].sort();
    return `dm_${sorted[0]}_${sorted[1]}`;
  };

  const webrtc = useWebRTC({
    onLocalStream: (stream) => {
      if (localVideoRef.current) stream && (localVideoRef.current.srcObject = stream);
    },
    onRemoteStream: (stream) => {
      if (remoteVideoRef.current) stream && (remoteVideoRef.current.srcObject = stream);
    },
    onConnectionState: (state) => {
      if (state === 'connected') {
        setIsCallMinimized(false);
      }
    },
    onError: (error) => {
      console.error('WebRTC error:', error);
      handleEndCall();
    },
  });

  // Status/stories state
  const [isStatusViewerOpen, setIsStatusViewerOpen] = useState(false);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [statusInitialIndex, setStatusInitialIndex] = useState(0);

  // Unread count state
  const [roomUnreadCounts, setRoomUnreadCounts] = useState<Record<string, number>>({});
  const [chatWallpaper, setChatWallpaper] = useState<string | null>(() => localStorage.getItem('chat-wallpaper'));

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('concierge-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (chatWallpaper) {
      localStorage.setItem('chat-wallpaper', chatWallpaper);
    } else {
      localStorage.removeItem('chat-wallpaper');
    }
  }, [chatWallpaper]);


  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const analyzeSentiment = (text: string) => {
    const lowerText = text.toLowerCase();
    if (lowerText.length < 5) return;
    if (lowerText.includes('error') || lowerText.includes('failed') || lowerText.includes('broken') || lowerText.includes('stop')) {
      setCurrentSentiment('error');
    } else if (lowerText.includes('warn') || lowerText.includes('wait') || lowerText.includes('slow')) {
      setCurrentSentiment('warning');
    } else if (lowerText.includes('ai') || lowerText.includes('agent') || lowerText.includes('node') || lowerText.includes('concierge')) {
      setCurrentSentiment('ai');
    } else {
      setCurrentSentiment('calm');
    }
  };



  const loadData = useCallback(async () => {
    try {
      const [roomsRes, usersRes, analyticsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/rooms`),
        fetch(`${API_BASE_URL}/api/users`),
        fetch(`${API_BASE_URL}/api/analytics`)
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
        const mappedUsers = data.map((user: any) => ({
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          status: user.status || 'offline',
          email: user.email,
        })).filter((u: any) => u.id !== 'ai-concierge-node');

        mappedUsers.unshift({
           id: 'ai-concierge-node',
           name: 'Concierge Core',
           avatar: 'https://cdn-icons-png.flaticon.com/512/8649/8649307.png',
           status: 'online',
        });

        setUsers(mappedUsers);
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
        setCurrentUser(session.user.user_metadata?.name || session.user.email?.split('@')?.[0] || '');
        setCurrentUserEmail(session.user.email || '');
        setCurrentUserId(session.user.id);
        setCurrentUserAvatar(session.user.user_metadata?.avatar_url || '');
        setIsConnected(true);
      }
    };

    const checkBackendSession = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/user`, {
          credentials: 'include'
        });
        if (response.ok) {
          const user = await response.json();
          if (user) {
            setCurrentUser(user.name);
            setCurrentUserEmail(user.email || '');
            setCurrentUserId(user.id);
            setCurrentUserAvatar(user.avatar);
            setIsConnected(true);
          }
        }
      } catch (err) {
        console.error('Failed to check backend session:', err);
      }
    };

    const initializeSession = async () => {
      setIsLoading(true);
      try {
        // Clean up URL if auth was successful from Google Redirect
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('auth') === 'success') {
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        await Promise.all([checkSupabaseSession(), checkBackendSession()]);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setCurrentUser(session.user.user_metadata?.name || session.user.email?.split('@')?.[0] || '');
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
      await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
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

    const rawUrl = import.meta.env.VITE_BACKEND_URL || `${window.location.hostname}:3000`;
    const protocol = window.location.protocol === 'https:' || rawUrl.includes(':443') ? 'wss:' : 'ws:';
    const hostPart = rawUrl.replace(/^https?:\/\//, '');
    const wsUrl = rawUrl.startsWith('ws') ? rawUrl : `${protocol}//${hostPart}`;
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
            content: decryptMessage(data.content),
            timestamp: new Date(data.timestamp),
            isSelf: data.senderId === (currentUserId || currentUser),
            type: data.msgType as 'text' | 'image' | 'file',
            mediaUrl: data.mediaUrl,
            replyTo: data.replyTo,
            isForwarded: data.isForwarded,
          }]);
          // Track unread counts for non-self messages in non-active rooms
          if (data.senderId !== (currentUserId || currentUser) && data.roomId !== activeRoomId) {
            setRoomUnreadCounts(prev => ({
              ...prev,
              [data.roomId || 'unknown']: (prev[data.roomId || 'unknown'] || 0) + 1,
            }));
          }
          break;
        case 'message_history':
          setMessages(data.messages.map((msg: any) => ({
            id: msg.id,
            senderId: msg.senderId,
            senderName: msg.senderName,
            content: decryptMessage(msg.content),
            timestamp: new Date(msg.timestamp),
            isSelf: msg.senderId === (currentUserId || currentUser),
            type: msg.msgType as 'text' | 'image' | 'file',
            mediaUrl: msg.mediaUrl,
            replyTo: msg.replyTo,
          })));
          break;
        case 'user_count':
          setOnlineUsers(data.count);
          break;
        case 'online_users':
          setUsers((prev) => {
            const onlineIds = new Set(data.users.map((u: any) => u.id));
            return prev.map(u => ({
              ...u,
              status: u.id === 'ai-concierge-node' ? 'online' as const : (onlineIds.has(u.id) ? 'online' as const : 'offline' as const),
            }));
          });
          break;
        case 'user_joined':
          setUsers((prev) => {
            const filtered = prev.filter(u => u.id !== data.userId && u.id !== 'ai-concierge-node');
            return [{
               id: 'ai-concierge-node',
                name: 'Concierge Core',
                avatar: 'https://cdn-icons-png.flaticon.com/512/8649/8649307.png',
               status: 'online'
            }, ...filtered, {
              id: data.userId,
              name: data.userName,
              status: 'online',
            }];
          });
          break;
        case 'user_left':
          setUsers((prev) => prev.map(u => u.id === data.userId ? { ...u, status: 'offline' as const } : u));
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
        case 'reaction':
          setMessages((prev) => prev.map(m => {
            if (m.id === data.messageId) {
               const existing = m.reactions || [];
               return { 
                 ...m, 
                 reactions: [...existing.filter(r => r.userId !== data.userId || r.emoji !== data.emoji), { emoji: data.emoji, userId: data.userId }] 
               };
            }
            return m;
          }));
          break;
        case 'call:incoming':
          setIsVideoCall(data.callType === 'video');
          setCallDirection('incoming');
          setCallId(data.callId);
          setIsCallOpen(true);
          setIsMuted(false);
          setIsVideoEnabled(data.callType === 'video');
          setIsSpeakerOn(false);
          setIsCallMinimized(false);
          break;
        case 'call:offer':
          setRemoteOffer({ callerId: data.userId, offer: data.data });
          break;
        case 'call:accepted':
          break;
        case 'call:rejected':
          handleEndCall();
          break;
        case 'call:ended':
          webrtc.cleanup();
          setIsCallOpen(false);
          setCallId('');
          callTimer.stop();
          setIsCallMinimized(false);
          break;
        case 'call:answer':
          if (data.data) webrtc.handleRemoteDescription(data.data);
          break;
        case 'call:ice-candidate':
          if (data.data) webrtc.handleIceCandidate(data.data);
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
            const response = await fetch(`${API_BASE_URL}/api/upload/base64`, {
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
    const isAINode = activeChatUserId === 'ai-concierge-node';

    if (!isAINode) {
      ws.send(JSON.stringify({
        type: 'message',
        content: encryptMessage(content),
        senderId: currentUserId || currentUser,
        senderName: currentUser,
        roomId: activeRoomId,
        msgType: msgType,
        mediaUrl: mediaUrl,
        replyTo: replyToMsg ? {
          id: replyToMsg.id,
          content: replyToMsg.content,
          senderName: replyToMsg.senderName,
          type: replyToMsg.type,
        } : undefined,
      }));
    }

    analyzeSentiment(content);
    setCurrentMessage('');
    setFilePreview(null);
    setPendingFile(null);
    setReplyToMsg(null);

    // AI Concierge Auto-Reply
    if (isAINode && content) {
      setTimeout(async () => {
        const reply = await generateAIResponse(content, "You are Concierge Core, the central AI intelligence of this system. You are helpful, professional, and efficient.");
        setMessages((prev) => [...prev, {
          id: Date.now().toString() + '-ai',
          senderId: 'ai-concierge-node',
          senderName: 'Concierge Core',
          avatar: 'https://cdn-icons-png.flaticon.com/512/8649/8649307.png',
          content: reply,
          timestamp: new Date(),
          isSelf: false,
          type: 'text'
        }]);
      }, 500);
    }
  }, [currentMessage, ws, currentUser, currentUserId, activeRoomId, activeChatUserId, filePreview, pendingFile]);

  const handlePolish = async () => {
    if (!currentMessage.trim() || isPolishing) return;
    setIsPolishing(true);
    const polished = await polishText(currentMessage);
    setCurrentMessage(polished);
    setIsPolishing(false);
  };

  const handleSummarize = async () => {
    if (messages.length === 0 || isSummarizing) return;
    setIsSummarizing(true);
    const summary = await summarizeChat(messages.map(m => ({ sender: m.senderName, text: m.content })));
    setMessages(prev => [...prev, {
      id: Date.now().toString() + '-summary',
      senderId: 'ai-concierge-node',
      senderName: 'Concierge Core (System Summary)',
      content: summary,
      timestamp: new Date(),
      isSelf: false,
      type: 'text',
      isPinned: true
    }]);
    setIsSummarizing(false);
  };

  const handleReply = (message: Message) => {
    setReplyToMsg(message);
  };

  const handleCancelReply = () => {
    setReplyToMsg(null);
  };

  const handleEmojiSelect = (emoji: string) => {
    setCurrentMessage(prev => prev + emoji);
  };

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

  // Call handlers
  const handleStartCall = async (video: boolean) => {
    if (!ws || !activeChatUserId) return;
    setIsVideoCall(video);
    setCallDirection('outgoing');
    setIsCallOpen(true);
    setIsMuted(false);
    setIsVideoEnabled(video);
    setIsSpeakerOn(false);
    setIsCallMinimized(false);
    setCallId('pending');
    callTimer.start();
    await webrtc.startCall(video, ws, activeChatUserId, currentUserId || currentUser, currentUser);
  };

  const handleAcceptCall = async () => {
    if (!ws || !remoteOffer || !callId) return;
    const isVideo = isVideoCall;
    setIsCallMinimized(false);
    callTimer.start();
    await webrtc.acceptCall(ws, callId, remoteOffer?.callerId || '', currentUserId || currentUser, remoteOffer.offer, isVideo);
    setRemoteOffer(null);
  };

  const handleEndCall = () => {
    if (ws && callId) {
      webrtc.endCall(ws, callId, currentUserId || currentUser);
    } else {
      webrtc.cleanup();
    }
    setIsCallOpen(false);
    setCallId('');
    setRemoteOffer(null);
    callTimer.stop();
    setIsCallMinimized(false);
  };

  const handleToggleMute = () => {
    const result = webrtc.toggleMute();
    if (result !== null) setIsMuted(!result);
  };

  const handleToggleVideo = () => {
    const result = webrtc.toggleVideo();
    if (result !== null) setIsVideoEnabled(!result);
  };

  const handleToggleSpeaker = () => setIsSpeakerOn(s => !s);

  // Status handlers
  const handleViewStatus = () => {
    const userStatuses = statuses.filter(s => s.userId === (activeChatUserId || activeRoomId));
    if (userStatuses.length > 0) {
      setStatusInitialIndex(0);
      setIsStatusViewerOpen(true);
    }
  };

  const handleCreateStatus = async (data: { content: string; mediaUrl?: string; type: 'text' | 'image' }) => {
    const newStatus = {
      id: Date.now().toString(),
      userId: currentUserId || currentUser,
      userName: currentUser,
      userAvatar: currentUserAvatar,
      content: data.content,
      mediaUrl: data.mediaUrl,
      type: data.type,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      viewed: false,
      viewers: [],
    };
    setStatuses(prev => [...prev, newStatus]);
    try {
      await fetch(`${API_BASE_URL}/api/status`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStatus),
      });
    } catch {}
  };

  const handleMarkStatusViewed = (statusId: string) => {
    setStatuses(prev => prev.map(s =>
      s.id === statusId ? { ...s, viewed: true, viewers: [...(s.viewers || []), { userId: currentUserId, userName: currentUser, viewedAt: new Date() }] } : s
    ));
  };

  const activeChatUser = users.find(u => u.id === activeChatUserId);
  const activeUserHasStatus = activeChatUserId ? statuses.some(s => s.userId === activeChatUserId) : false;

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
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  const handleEmailAuth = async (email: string, password: string, name: string, isSignup: boolean) => {
    const url = isSignup ? `${API_BASE_URL}/api/auth/signup` : `${API_BASE_URL}/api/auth/signin`;
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

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground animate-pulse">Initializing Interface...</p>
        </div>
      </div>
    );
  }

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
    <div className="flex h-screen w-full bg-mesh overflow-hidden font-inter select-none">
      {/* Sidebar - Consistent across all views */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 transform lg:relative lg:translate-x-0 border-r border-border bg-background/80 backdrop-blur-md",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <ChatList
          rooms={rooms}
          users={users}
          currentRoomId={activeRoomId}
          activeChatUserId={activeChatUserId ?? undefined}
          currentUserId={currentUserId || currentUser}
          onSelectRoom={(id) => {
            setActiveRoomId(id);
            setActiveChatUserId(null);
            setIsSidebarOpen(false);
            setActiveNav('messages');
            setRoomUnreadCounts(prev => ({ ...prev, [id]: 0 }));
          }}
          onSelectUser={(id) => {
            setActiveChatUserId(id);
            setActiveRoomId(getDMRoomId(currentUserId || currentUser, id));
            setIsSidebarOpen(false);
            setActiveNav('messages');
          }}
          onSelectNav={setActiveNav}
          onOpenProfile={() => setActiveNav('settings')}
          onCreateRoom={() => setIsCreateRoomOpen(true)}
          roomUnreadCounts={roomUnreadCounts}
          onStatusClick={(userId) => {
            const userStatuses = statuses.filter(s => s.userId === userId);
            if (userStatuses.length > 0) {
              setStatusInitialIndex(0);
              setIsStatusViewerOpen(true);
            }
          }}
          statusUsers={statuses.filter(s => !s.viewed).map(s => s.userId)}
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
            sentiment={currentSentiment}
            onPolish={handlePolish}
            isPolishing={isPolishing}
            onSummarize={handleSummarize}
            isSummarizing={isSummarizing}
            replyTo={replyToMsg}
            onCancelReply={handleCancelReply}
            onEmojiSelect={handleEmojiSelect}
            onVoiceCall={() => handleStartCall(false)}
            onVideoCall={() => handleStartCall(true)}
            onViewStatus={handleViewStatus}
            hasStatus={activeUserHasStatus}
            users={users.map(u => ({ id: u.id, name: u.name, avatar: u.avatar }))}
            wallpaper={chatWallpaper || undefined}
            onReply={(msg) => { setReplyToMsg(msg); }}
            onForward={(msg) => { setForwardMessage(msg); setForwardDialogOpen(true); }}
          />
        )}

        {activeNav === 'analytics' && <AnalyticsDashboard data={analytics} messagesCount={messages.length} activeUsers={onlineUsers} users={users} />}

        {activeNav === 'settings' && (
          <UserProfile 
            user={{ 
              name: currentUser, 
              email: currentUserEmail, 
              avatar: currentUserAvatar 
            }} 
            onUpdate={async (data) => {
              // Optimistically update frontend for immediate feedback
              if (data.name) setCurrentUser(data.name);
              if (data.email) setCurrentUserEmail(data.email);
              if (data.avatar) setCurrentUserAvatar(data.avatar);

              try {
                const res = await fetch(`${API_BASE_URL}/api/auth/user`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data),
                  credentials: 'include'
                });
                if (res.ok) {
                  const updated = await res.json();
                  // Re-sync with backend truth if provided
                  if (updated.name) setCurrentUser(updated.name);
                  if (updated.avatar) setCurrentUserAvatar(updated.avatar);
                  if (updated.email) setCurrentUserEmail(updated.email);
                }
              } catch (err) {
                console.error('Update profile failed:', err);
              }
            }} 
            onLogout={handleLogout} 
            theme={theme}
            onThemeChange={setTheme}
          />
        )}
        
      </div>

      {/* Modals */}
      <Dialog open={isCreateRoomOpen} onOpenChange={setIsCreateRoomOpen}>
        <DialogContent className="border-border p-8 bg-background font-mono">
          <DialogHeader><DialogTitle className="text-xl font-bold uppercase tracking-[0.2em]">INITIALIZE::NEW_ROOM_NODE</DialogTitle></DialogHeader>
          <div className="space-y-6 py-6">
            <div className="space-y-2">
               <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Node Name</label>
               <input value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} placeholder="e.g. CORE_SUPPORT, NETWORK_OPS" className="w-full h-12 bg-muted/20 border border-border px-4 text-[11px] uppercase tracking-widest outline-none focus:border-primary/50" />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Node Protocol Description</label>
               <input value={newRoomDesc} onChange={(e) => setNewRoomDesc(e.target.value)} placeholder="PURPOSE_DEFINED_LOGIC..." className="w-full h-12 bg-muted/20 border border-border px-4 text-[11px] uppercase tracking-widest outline-none focus:border-primary/50" />
            </div>
            <button onClick={handleCreateRoom} className="tech-btn w-full h-12 text-[11px] uppercase tracking-[0.3em] font-bold">Mount Sub-Node</button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
        <DialogContent className="border-border p-8 bg-background font-mono">
          <DialogHeader><DialogTitle className="text-xl font-bold uppercase tracking-[0.2em]">INVITE::OPERATOR_NODE</DialogTitle></DialogHeader>
          <div className="space-y-6 py-6">
            <div className="space-y-2">
               <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Operator Alias</label>
               <input value={newContactName} onChange={(e) => setNewContactName(e.target.value)} placeholder="NODENAME_001..." className="w-full h-12 bg-muted/20 border border-border px-4 text-[11px] uppercase tracking-widest outline-none focus:border-primary/50" />
            </div>
            <button onClick={handleAddContact} className="tech-btn w-full h-12 text-[11px] uppercase tracking-[0.3em] font-bold">Authorize Entry</button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Call UI */}
      <CallUI
        isOpen={isCallOpen}
        isVideo={isVideoCall}
        caller={{ id: currentUserId || currentUser, name: currentUser, avatar: currentUserAvatar }}
        callee={{ id: activeChatUserId || 'contact', name: activeChatUser?.name || rooms.find(r => r.id === activeRoomId)?.name || 'Contact', avatar: activeChatUser?.avatar }}
        callDirection={callDirection}
        onAccept={handleAcceptCall}
        onReject={handleEndCall}
        onEnd={handleEndCall}
        onToggleVideo={handleToggleVideo}
        onToggleMute={handleToggleMute}
        onToggleSpeaker={handleToggleSpeaker}
        isMuted={isMuted}
        isVideoEnabled={isVideoEnabled}
        isSpeakerOn={isSpeakerOn}
        callDuration={callTimer.seconds}
        onMinimize={() => setIsCallMinimized(!isCallMinimized)}
        isMinimized={isCallMinimized}
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
      />

      {/* Forward Dialog */}
      <ForwardMessageDialog
        isOpen={forwardDialogOpen}
        onOpenChange={setForwardDialogOpen}
        message={forwardMessage || { content: '', type: 'text', senderName: '' }}
        contacts={users.map(u => ({ id: u.id, name: u.name, avatar: u.avatar }))}
        groups={rooms.filter(r => r.type !== 'direct').map(r => ({ id: r.id, name: r.name }))}
        onForward={(recipients) => {
          if (!ws || !forwardMessage) return;
          recipients.forEach(r => {
            const targetRoomId = r.type === 'contact'
              ? getDMRoomId(currentUserId || currentUser, r.id)
              : r.id;
            ws.send(JSON.stringify({
              type: 'message',
              content: encryptMessage(forwardMessage.content),
              senderId: currentUserId || currentUser,
              senderName: currentUser,
              roomId: targetRoomId,
              msgType: forwardMessage.type || 'text',
              mediaUrl: forwardMessage.mediaUrl,
              isForwarded: true,
            }));
          });
          setForwardDialogOpen(false);
          setForwardMessage(null);
        }}
      />

      {/* Status Viewer */}
      <StatusViewer
        isOpen={isStatusViewerOpen}
        onClose={() => setIsStatusViewerOpen(false)}
        statuses={statuses.filter(s => s.userId === (activeChatUserId || activeRoomId))}
        initialIndex={statusInitialIndex}
        onCreateStatus={handleCreateStatus}
        markAsViewed={handleMarkStatusViewed}
        currentUserId={currentUserId || currentUser}
      />

      <InstallPrompt />
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
        onSelect={(id) => {
          if (id === 'settings') setActiveNav('settings');
          if (id === 'new_chat') setIsAddContactOpen(true);
        }}
      />
    </div>
  );
}

export default App;

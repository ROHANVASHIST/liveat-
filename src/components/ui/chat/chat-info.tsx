import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../dialog';
import { Button } from '../button';
import { Input } from '../input';
import { ScrollArea } from '../scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../avatar';
import { Badge } from '../badge';
import {
  Search,
  Archive,
  Pin,
  Lock,
  Star,
  Clock,
  FileText,
  Image,
  Video,
  Download,
  Trash2,
  Share2,
  ChevronRight,
  Settings,
  Info,
  Users,
  Globe,
  Phone,
  Video as VideoIcon,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInfoPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  chatType: 'room' | 'contact';
  chatInfo: {
    id: string;
    name: string;
    avatar?: string;
    description?: string;
    type?: 'public' | 'private';
    members?: Array<{
      id: string;
      name: string;
      avatar?: string;
      status?: string;
      isAdmin?: boolean;
    }>;
    media?: Array<{
      id: string;
      type: 'image' | 'video' | 'document';
      url: string;
      timestamp: Date;
    }>;
    pinnedMessages?: Array<{
      id: string;
      content: string;
      senderName: string;
      timestamp: Date;
    }>;
    starredMessages?: Array<{
      id: string;
      content: string;
      senderName: string;
      timestamp: Date;
    }>;
  };
  settings?: {
    isMuted: boolean;
    isPinned: boolean;
    isArchived: boolean;
    autoDelete: 'off' | '24h' | '7d' | '365d';
  };
  onToggleMute?: () => void;
  onTogglePin?: () => void;
  onToggleArchive?: () => void;
  onSetWallpaper?: () => void;
  onClearChat?: () => void;
  onExportChat?: () => void;
  onViewMedia?: () => void;
  onViewDocuments?: () => void;
  onViewLinks?: () => void;
  onSearchInChat?: () => void;
  onOpenSettings?: () => void;
}

export const ChatInfoPanel: React.FC<ChatInfoPanelProps> = ({
  isOpen,
  onOpenChange,
  chatType,
  chatInfo,
  settings,
  onToggleMute,
  onTogglePin,
  onToggleArchive,
  onSetWallpaper,
  onClearChat,
  onExportChat,
  onViewMedia,
  onViewDocuments,
  onViewLinks,
  onSearchInChat,
  onOpenSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'media' | 'files' | 'links'>('media');
  const [searchQuery, setSearchQuery] = useState('');

  const mediaCount = chatInfo.media?.length || 0;
  const documentCount = chatInfo.media?.filter(m => m.type === 'document').length || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={chatInfo.avatar} />
              <AvatarFallback className="text-xl">
                {chatInfo.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-lg">{chatInfo.name}</DialogTitle>
              <div className="text-sm text-muted-foreground">
                {chatType === 'room'
                  ? `${chatInfo.members?.length || 0} participants`
                  : chatInfo.description || 'Online'
                }
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-6 px-4 pb-4">
            {/* Quick actions */}
            <div className="grid grid-cols-4 gap-2">
              {onSearchInChat && (
                <button
                  onClick={onSearchInChat}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <Search className="w-5 h-5 text-primary" />
                  <span className="text-xs">Search</span>
                </button>
              )}
              
              {onToggleMute && (
                <button
                  onClick={onToggleMute}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <svg className={cn("w-5 h-5", settings?.isMuted && "text-primary")} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                  <span className="text-xs">{settings?.isMuted ? 'Unmute' : 'Mute'}</span>
                </button>
              )}
              
              {onTogglePin && (
                <button
                  onClick={onTogglePin}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <Pin className={cn("w-5 h-5", settings?.isPinned && "text-primary")} />
                  <span className="text-xs">{settings?.isPinned ? 'Unpin' : 'Pin'}</span>
                </button>
              )}
              
              {onToggleArchive && (
                <button
                  onClick={onToggleArchive}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <Archive className={cn("w-5 h-5", settings?.isArchived && "text-primary")} />
                  <span className="text-xs">{settings?.isArchived ? 'Unarchive' : 'Archive'}</span>
                </button>
              )}
            </div>

            {/* Members (for groups) */}
            {chatType === 'room' && chatInfo.members && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">Participants ({chatInfo.members.length})</h3>
                  {onViewMedia && (
                    <button onClick={onViewMedia} className="text-xs text-primary hover:underline">
                      See all
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  {chatInfo.members.slice(0, 5).map(member => (
                    <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="text-sm">
                          {member.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{member.name}</span>
                          {member.isAdmin && (
                            <Badge variant="secondary" className="text-xs">Admin</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{member.status || 'Online'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Media preview */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Media, links and docs</h3>
              </div>
              
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setActiveTab('media')}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
                    activeTab === 'media'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/80'
                  )}
                >
                  Media ({mediaCount})
                </button>
                <button
                  onClick={() => setActiveTab('files')}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
                    activeTab === 'files'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/80'
                  )}
                >
                  Files ({documentCount})
                </button>
              </div>

              {chatInfo.media && chatInfo.media.length > 0 ? (
                <div className="grid grid-cols-4 gap-1">
                  {chatInfo.media.slice(0, 8).map(item => (
                    <div
                      key={item.id}
                      className="aspect-square rounded overflow-hidden bg-secondary cursor-pointer hover:ring-2 hover:ring-primary"
                    >
                      {item.type === 'image' ? (
                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                      ) : item.type === 'video' ? (
                        <div className="w-full h-full flex items-center justify-center bg-secondary">
                          <Video className="w-6 h-6 text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary">
                          <FileText className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  {chatInfo.media.length > 8 && (
                    <button className="aspect-square rounded bg-secondary flex items-center justify-center text-sm font-medium hover:bg-secondary/80">
                      +{chatInfo.media.length - 8}
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No media shared yet
                </div>
              )}
            </div>

            {/* Pinned messages */}
            {chatInfo.pinnedMessages && chatInfo.pinnedMessages.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Pin className="w-4 h-4" />
                  Pinned ({chatInfo.pinnedMessages.length})
                </h3>
                <div className="space-y-2">
                  {chatInfo.pinnedMessages.slice(0, 2).map(msg => (
                    <div key={msg.id} className="p-3 bg-secondary rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">
                        {msg.senderName}
                      </div>
                      <p className="text-sm truncate">{msg.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settings */}
            <div className="space-y-1">
              {onSetWallpaper && (
                <button
                  onClick={onSetWallpaper}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
                >
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  <span className="text-sm">Chat wallpaper</span>
                </button>
              )}
              
              {onToggleMute && (
                <button
                  onClick={onToggleMute}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
                >
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  <span>
                    {settings?.isMuted ? 'Unmute notifications' : 'Mute notifications'}
                  </span>
                </button>
              )}
              
              {onSearchInChat && (
                <button
                  onClick={onSearchInChat}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
                >
                  <Search className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">Search in chat</span>
                </button>
              )}
              
              <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm flex-1">Encryption</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 2a10 10 0 0 1 10 10c0 2.7-1.1 5.2-2.8 7"/><path d="M2 12a10 10 0 0 1 10-10"/><path d="M7 12a5 5 0 0 1 5-5"/><path d="M12 17a5 5 0 0 1-5-5"/></svg>
                  End-to-end
                </span>
              </button>
              
              {onClearChat && (
                <button
                  onClick={onClearChat}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-red-500"
                >
                  <Trash2 className="w-5 h-5" />
                  <span className="text-sm">Clear chat</span>
                </button>
              )}
              
              {onExportChat && (
                <button
                  onClick={onExportChat}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
                >
                  <Download className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">Export chat</span>
                </button>
              )}
            </div>

            {/* Auto-delete */}
            {settings && (
              <div className="p-3 bg-secondary rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Auto-delete messages</div>
                    <div className="text-xs text-muted-foreground">
                      {settings.autoDelete === 'off'
                        ? 'Messages are not auto-deleted'
                        : `Messages delete after ${settings.autoDelete}`
                      }
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

// Archived chats list
interface ArchivedChatsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  chats: Array<{
    id: string;
    name: string;
    avatar?: string;
    lastMessage?: string;
    lastMessageTime?: Date;
    unreadCount?: number;
    type: 'room' | 'contact';
  }>;
  onUnarchiveChat?: (chatId: string) => void;
  onOpenChat?: (chatId: string) => void;
}

export const ArchivedChats: React.FC<ArchivedChatsProps> = ({
  isOpen,
  onOpenChange,
  chats,
  onUnarchiveChat,
  onOpenChat,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Archived chats
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px]">
          {chats.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Archive className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No archived chats</p>
            </div>
          ) : (
            <div className="space-y-1">
              {chats.map(chat => (
                <div
                  key={chat.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary cursor-pointer"
                  onClick={() => onOpenChat?.(chat.id)}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={chat.avatar} />
                    <AvatarFallback>
                      {chat.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{chat.name}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {chat.lastMessage}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-muted-foreground">
                      {chat.lastMessageTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnarchiveChat?.(chat.id);
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Unarchive
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

// Data and storage usage
interface StorageUsageProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  usage: {
    total: number;
    used: number;
    byType: {
      images: number;
      videos: number;
      documents: number;
      audio: number;
      stickers: number;
    };
    byChat: Array<{
      id: string;
      name: string;
      size: number;
      avatar?: string;
    }>;
  };
  onClearCache?: () => void;
  onDeleteChatData?: (chatId: string) => void;
}

export const StorageUsage: React.FC<StorageUsageProps> = ({
  isOpen,
  onOpenChange,
  usage,
  onClearCache,
  onDeleteChatData,
}) => {
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const types = [
    { key: 'images', label: 'Images', icon: Image, color: 'bg-green-500' },
    { key: 'videos', label: 'Videos', icon: Video, color: 'bg-blue-500' },
    { key: 'documents', label: 'Documents', icon: FileText, color: 'bg-gray-500' },
    { key: 'audio', label: 'Voice messages', icon: MessageSquare, color: 'bg-yellow-500' },
    { key: 'stickers', label: 'Stickers', icon: Star, color: 'bg-purple-500' },
  ] as const;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            Storage and data
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px]">
          <div className="space-y-6">
            {/* Usage overview */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Storage used</span>
                <span className="text-sm text-muted-foreground">
                  {formatSize(usage.used)} of {formatSize(usage.total)}
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${(usage.used / usage.total) * 100}%` }}
                />
              </div>
            </div>

            {/* By type */}
            <div>
              <h3 className="text-sm font-semibold mb-3">By type</h3>
              <div className="space-y-2">
                {types.map(({ key, label, icon: Icon, color }) => {
                  const size = usage.byType[key];
                  const percentage = usage.used > 0 ? (size / usage.used) * 100 : 0;
                  
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div className={cn("w-3 h-3 rounded-full", color)} />
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="flex-1 text-sm">{label}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatSize(size)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* By chat */}
            <div>
              <h3 className="text-sm font-semibold mb-3">By chat</h3>
              <div className="space-y-2">
                {usage.byChat.map(chat => (
                  <div
                    key={chat.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={chat.avatar} />
                      <AvatarFallback className="text-xs">
                        {chat.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{chat.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatSize(chat.size)}
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteChatData?.(chat.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Clear cache */}
            {onClearCache && (
              <Button
                variant="outline"
                className="w-full"
                onClick={onClearCache}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear all cache
              </Button>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
import React, { useState } from 'react';
import {
  Reply,
  Forward,
  Edit,
  Copy,
  Star,
  Pin,
  Trash2,
  MoreVertical,
  Share2,
  Image,
  Download,
  Eye,
  MessageSquare,
  ReplyAll,
  Shield,
  AlertTriangle,
  Search,
  Check,
} from 'lucide-react';
import { Button } from '../button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../dialog';
import { ScrollArea } from '../scroll-area';
import { cn } from '@/lib/utils';

interface MessageAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface MessageActionsProps {
  message: {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    timestamp: Date;
    type: 'text' | 'image' | 'video' | 'file' | 'voice';
    mediaUrl?: string;
    isEdited?: boolean;
    isForwarded?: boolean;
    replyTo?: {
      id: string;
      content: string;
      senderName: string;
    };
  };
  isOwn: boolean;
  showReplyOption?: boolean;
  canReply?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canForward?: boolean;
  canPin?: boolean;
  canStar?: boolean;
  onReply?: (message: any) => void;
  onReplyAll?: (message: any) => void;
  onEdit?: (message: any) => void;
  onDelete?: (message: any) => void;
  onForward?: (message: any) => void;
  onCopy?: (content: string) => void;
  onStar?: (message: any) => void;
  onPin?: (message: any) => void;
  onReport?: (message: any) => void;
  onSave?: (message: any) => void;
  onDownload?: (mediaUrl: string, fileName?: string) => void;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  message,
  isOwn,
  showReplyOption = true,
  canReply = true,
  canEdit = true,
  canDelete = true,
  canForward = true,
  canPin = false,
  canStar = true,
  onReply,
  onReplyAll,
  onEdit,
  onDelete,
  onForward,
  onCopy,
  onStar,
  onPin,
  onReport,
  onSave,
  onDownload,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const actions: MessageAction[] = [];

  // Reply actions
  if (showReplyOption && canReply) {
    actions.push({
      icon: <Reply className="w-4 h-4" />,
      label: 'Reply',
      onClick: () => {
        onReply?.(message);
        setShowMenu(false);
      },
    });

    if (message.type === 'text') {
      actions.push({
        icon: <ReplyAll className="w-4 h-4" />,
        label: 'Reply privately',
        onClick: () => {
          onReplyAll?.(message);
          setShowMenu(false);
        },
      });
    }
  }

  // Copy
  if (message.type === 'text' && onCopy) {
    actions.push({
      icon: <Copy className="w-4 h-4" />,
      label: 'Copy text',
      onClick: () => {
        onCopy(message.content);
        setShowMenu(false);
      },
    });
  }

  // Star/Save
  if (canStar && onStar) {
    actions.push({
      icon: <Star className="w-4 h-4" />,
      label: onSave ? 'Save message' : 'Star',
      onClick: () => {
        onStar(message);
        setShowMenu(false);
      },
    });
  }

  // Forward
  if (canForward && onForward && message.type === 'text') {
    actions.push({
      icon: <Forward className="w-4 h-4" />,
      label: 'Forward',
      onClick: () => {
        onForward(message);
        setShowMenu(false);
      },
    });
  }

  // Pin
  if (canPin && onPin) {
    actions.push({
      icon: <Pin className="w-4 h-4" />,
      label: 'Pin',
      onClick: () => {
        onPin(message);
        setShowMenu(false);
      },
    });
  }

  // Edit (only own messages)
  if (isOwn && canEdit && onEdit && message.type === 'text') {
    actions.push({
      icon: <Edit className="w-4 h-4" />,
      label: 'Edit',
      onClick: () => {
        onEdit(message);
        setShowMenu(false);
      },
    });
  }

  // Download media
  if (message.mediaUrl && onDownload && (message.type === 'image' || message.type === 'video' || message.type === 'file')) {
    actions.push({
      icon: <Download className="w-4 h-4" />,
      label: message.type === 'image' ? 'Save image' : 'Download',
      onClick: () => {
        onDownload(message.mediaUrl!, message.type === 'file' ? message.content : undefined);
        setShowMenu(false);
      },
    });
  }

  // Report
  if (!isOwn && onReport) {
    actions.push({
      icon: <AlertTriangle className="w-4 h-4" />,
      label: 'Report',
      danger: true,
      onClick: () => {
        onReport(message);
        setShowMenu(false);
      },
    });
  }

  // Delete (only own messages)
  if (isOwn && canDelete && onDelete) {
    actions.push({
      icon: <Trash2 className="w-4 h-4" />,
      label: 'Delete for me',
      danger: true,
      onClick: () => {
        setShowDeleteConfirm(true);
        setShowMenu(false);
      },
    });
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1.5 hover:bg-secondary rounded-full opacity-0 group-hover:opacity-100 transition-all"
        >
          <MoreVertical className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Dropdown menu */}
        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-full mt-1 bg-background border border-border rounded-lg shadow-lg py-1 z-50 min-w-[180px]">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={cn(
                    'w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-secondary transition-colors',
                    action.disabled && 'opacity-50 cursor-not-allowed',
                    action.danger && 'text-red-500 hover:bg-red-50'
                  )}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-background border border-border rounded-lg p-6 max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-2">Delete message?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This message will be deleted for you only. It will still be visible to other participants.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  onDelete?.(message);
                  setShowDeleteConfirm(false);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Quoted message display
interface QuotedMessageProps {
  message: {
    id: string;
    content: string;
    senderName: string;
    type: 'text' | 'image' | 'video' | 'file' | 'voice';
    mediaUrl?: string;
  };
  onClick?: () => void;
}

export const QuotedMessage: React.FC<QuotedMessageProps> = ({ message, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-2 p-2 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors text-left max-w-full"
    >
      <div className="w-1 h-full min-h-[40px] rounded-full bg-primary flex-shrink-0" />
      
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-primary mb-1">
          {message.senderName}
        </div>
        
        {message.type === 'text' ? (
          <p className="text-sm text-foreground/80 truncate">
            {message.content}
          </p>
        ) : message.type === 'image' ? (
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground/80">Photo</span>
          </div>
        ) : message.type === 'video' ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground/80">Video</span>
          </div>
        ) : message.type === 'voice' ? (
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground/80">Voice message</span>
          </div>
        ) : (
          <p className="text-sm text-foreground/80 truncate">
            {message.content}
          </p>
        )}
      </div>
    </button>
  );
};

// Forward message dialog
interface ForwardMessageDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  message: {
    content: string;
    type: string;
    senderName: string;
  };
  contacts: Array<{ id: string; name: string; avatar?: string }>;
  groups: Array<{ id: string; name: string; avatar?: string }>;
  onForward: (recipients: Array<{ id: string; type: 'contact' | 'group' }>) => void;
}

export const ForwardMessageDialog: React.FC<ForwardMessageDialogProps> = ({
  isOpen,
  onOpenChange,
  message,
  contacts = [],
  groups = [],
  onForward,
}) => {
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleRecipient = (id: string) => {
    setSelectedRecipients(prev =>
      prev.includes(id)
        ? prev.filter(r => r !== id)
        : [...prev, id]
    );
  };

  const handleForward = () => {
    // Convert selected IDs to recipient objects
    const recipients = selectedRecipients.map(id => ({
      id,
      type: contacts.find(c => c.id === id) ? 'contact' as const : 'group' as const,
    }));
    
    onForward(recipients);
    setSelectedRecipients([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Forward message
          </DialogTitle>
        </DialogHeader>

        {/* Message preview */}
        <div className="p-3 bg-secondary rounded-lg mb-4">
          <p className="text-sm truncate">{message.content}</p>
          <p className="text-xs text-muted-foreground mt-1">
            from {message.senderName}
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search contacts and groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-md bg-secondary"
          />
        </div>

        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {/* Contacts */}
            {filteredContacts.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Contacts
                </h4>
                {filteredContacts.map(contact => (
                  <button
                    key={contact.id}
                    onClick={() => toggleRecipient(contact.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left",
                      selectedRecipients.includes(contact.id)
                        ? 'bg-primary/10'
                        : 'hover:bg-secondary'
                    )}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                      {contact.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="font-medium">{contact.name}</span>
                    {selectedRecipients.includes(contact.id) && (
                      <Check className="w-4 h-4 text-primary ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Groups */}
            {filteredGroups.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Groups
                </h4>
                {filteredGroups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => toggleRecipient(group.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left",
                      selectedRecipients.includes(group.id)
                        ? 'bg-primary/10'
                        : 'hover:bg-secondary'
                    )}
                  >
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-medium">
                      {group.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="font-medium">{group.name}</span>
                    {selectedRecipients.includes(group.id) && (
                      <Check className="w-4 h-4 text-primary ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Empty state */}
            {filteredContacts.length === 0 && filteredGroups.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No contacts or groups found
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Forward button */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <span className="text-sm text-muted-foreground">
            {selectedRecipients.length} selected
          </span>
          <Button
            onClick={handleForward}
            disabled={selectedRecipients.length === 0}
          >
            <Forward className="w-4 h-4 mr-2" />
            Forward
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Starred messages list
interface StarredMessagesProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  messages: Array<{
    id: string;
    content: string;
    senderName: string;
    timestamp: Date;
    roomId: string;
  }>;
  onSelectMessage?: (messageId: string, roomId: string) => void;
}

export const StarredMessages: React.FC<StarredMessagesProps> = ({
  isOpen,
  onOpenChange,
  messages,
  onSelectMessage,
}) => {
  const groupedMessages = messages.reduce((acc, msg) => {
    const date = msg.timestamp.toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {} as { [key: string]: typeof messages });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Starred messages
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px]">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Star className="w-12 h-12 mb-3 opacity-50" />
              <p>No starred messages</p>
              <p className="text-xs mt-1">
                Long-press on a message to star it and save it here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date}>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    {date}
                  </h4>
                  {msgs.map(msg => (
                    <button
                      key={msg.id}
                      onClick={() => {
                        onSelectMessage?.(msg.id, msg.roomId);
                        onOpenChange(false);
                      }}
                      className="w-full text-left p-3 hover:bg-secondary rounded-lg transition-colors mb-1"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-medium text-sm">{msg.senderName}</span>
                        <span className="text-xs text-muted-foreground">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 truncate mt-1">
                        {msg.content}
                      </p>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
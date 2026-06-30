import React from 'react';
import { Check, CheckCheck, Clock, Eye, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageStatusProps {
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp?: Date;
  showStatus?: boolean;
  isOwn?: boolean;
}

export const MessageStatus: React.FC<MessageStatusProps> = ({
  status,
  timestamp,
  showStatus = true,
  isOwn = true,
}) => {
  if (!showStatus) return null;

  const statusConfig = {
    sending: {
      icon: <Clock className="w-3 h-3 text-muted-foreground animate-pulse" />,
      color: 'text-muted-foreground',
    },
    sent: {
      icon: <Check className="w-3 h-3 text-muted-foreground" />,
      color: 'text-muted-foreground',
    },
    delivered: {
      icon: <CheckCheck className="w-3 h-3 text-muted-foreground" />,
      color: 'text-muted-foreground',
    },
    read: {
      icon: <CheckCheck className="w-3 h-3 text-blue-500" />,
      color: 'text-blue-500',
    },
    failed: {
      icon: <AlertCircle className="w-3 h-3 text-red-500" />,
      color: 'text-red-500',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={cn("flex items-center gap-1", config.color)}>
      {config.icon}
      {timestamp && (
        <span className="text-[10px] opacity-70">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
};

// Read receipts component for group chats
interface ReadReceiptsProps {
  readBy: Array<{
    userId: string;
    userName: string;
    avatar?: string;
    readAt: Date;
  }>;
  totalParticipants: number;
  showAvatars?: boolean;
  maxAvatars?: number;
}

export const ReadReceipts: React.FC<ReadReceiptsProps> = ({
  readBy,
  totalParticipants,
  showAvatars = true,
  maxAvatars = 4,
}) => {
  if (readBy.length === 0) return null;

  const remaining = readBy.length - maxAvatars;

  return (
    <div className="flex items-center gap-2 mt-1">
      {showAvatars && (
        <div className="flex -space-x-2">
          {readBy.slice(0, maxAvatars).map((reader, index) => (
            <div
              key={reader.userId}
              className="w-5 h-5 rounded-full border-2 border-background bg-primary flex items-center justify-center overflow-hidden relative group"
              style={{ zIndex: maxAvatars - index }}
            >
              <span className="text-[8px] font-bold text-primary-foreground">
                {reader.userName.substring(0, 2).toUpperCase()}
              </span>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-background border border-border rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                {reader.userName}
              </div>
            </div>
          ))}
          {remaining > 0 && (
            <div className="w-5 h-5 rounded-full border-2 border-background bg-secondary flex items-center justify-center">
              <span className="text-[8px] font-bold text-foreground">+{remaining}</span>
            </div>
          )}
        </div>
      )}
      
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Eye className="w-3 h-3" />
        <span>
          {readBy.length === totalParticipants
            ? 'Seen by everyone'
            : `Seen by ${readBy.length} of ${totalParticipants}`
          }
        </span>
      </div>
    </div>
  );
};

// Message info popup (WhatsApp style)
interface MessageInfoPopupProps {
  messageId: string;
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  forwarded?: boolean;
  edited?: boolean;
  isOwn?: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
  onForward?: () => void;
  onPin?: () => void;
}

export const MessageInfoPopup: React.FC<MessageInfoPopupProps> = ({
  sentAt,
  deliveredAt,
  readAt,
  status,
  forwarded,
  edited,
  isOwn,
  onDelete,
  onEdit,
  onForward,
  onPin,
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[250px] text-sm space-y-3">
      {/* Status info for own messages */}
      {isOwn && (
        <div className="space-y-2 border-b border-border pb-2">
          {status === 'sending' && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>Sending...</span>
            </div>
          )}
          
          {status === 'sent' && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className="w-4 h-4" />
              <span>Sent</span>
            </div>
          )}
          
          {status === 'delivered' && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCheck className="w-4 h-4" />
              <span>Delivered</span>
            </div>
          )}
          
          {status === 'read' && (
            <div className="flex items-center gap-2 text-blue-500">
              <CheckCheck className="w-4 h-4" />
              <span>Read</span>
            </div>
          )}
          
          {status === 'failed' && (
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="w-4 h-4" />
              <span>Failed to send</span>
            </div>
          )}
          
          {/* Timestamps */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div>📤 {formatTime(sentAt)}</div>
            {deliveredAt && (
              <div>📥 Delivered: {formatTime(deliveredAt)}</div>
            )}
            {readAt && (
              <div>👁️ Read: {formatTime(readAt)}</div>
            )}
          </div>
        </div>
      )}
      
      {/* Message info */}
      <div className="space-y-1 text-xs text-muted-foreground">
        {forwarded && (
          <div className="flex items-center gap-2">
            <span>🔁</span>
            <span>Forwarded</span>
          </div>
        )}
        {edited && (
          <div className="flex items-center gap-2">
            <span>✏️</span>
            <span>Edited</span>
          </div>
        )}
      </div>
      
      {/* Actions for own messages */}
      {isOwn && (onDelete || onEdit || onForward || onPin) && (
        <div className="border-t border-border pt-2 space-y-1">
          {onPin && (
            <button
              onClick={onPin}
              className="w-full text-left px-2 py-1 hover:bg-secondary rounded text-xs flex items-center gap-2"
            >
              📌 Pin message
            </button>
          )}
          {onForward && (
            <button
              onClick={onForward}
              className="w-full text-left px-2 py-1 hover:bg-secondary rounded text-xs flex items-center gap-2"
            >
              🔁 Forward
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="w-full text-left px-2 py-1 hover:bg-secondary rounded text-xs flex items-center gap-2"
            >
              ✏️ Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="w-full text-left px-2 py-1 hover:bg-secondary rounded text-xs flex items-center gap-2 text-red-500"
            >
              🗑️ Delete for me
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Delivery status badge
export const DeliveryStatusBadge: React.FC<{
  unreadCount: number;
  lastActivity?: Date;
}> = ({ unreadCount, lastActivity }) => {
  if (unreadCount === 0) return null;

  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-primary/10 rounded-full">
      <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
      <span className="text-xs text-primary font-medium">
        {unreadCount === 1 ? 'unread message' : 'unread messages'}
      </span>
      {lastActivity && (
        <span className="text-[10px] text-muted-foreground">
          Last activity: {lastActivity.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
};
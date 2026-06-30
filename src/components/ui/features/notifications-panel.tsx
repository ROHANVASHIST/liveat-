import React, { useEffect } from 'react';
import { useNotifications } from '@/lib/hooks';
import { Bell, X, Check, CheckCheck, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../dialog';
import { Button } from '../button';
import { ScrollArea } from '../scroll-area';
import { cn } from '@/lib/utils';

interface NotificationsPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  isOpen,
  onOpenChange,
}) => {
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message_mentioned':
        return '📢';
      case 'message_replied':
        return '↩️';
      case 'reaction_added':
        return '😊';
      case 'message_pinned':
        return '📌';
      case 'user_joined':
        return '👋';
      default:
        return '💬';
    }
  };

  const getNotificationTitle = (notification: any) => {
    const titles: Record<string, string> = {
      message_mentioned: 'You were mentioned',
      message_replied: 'Someone replied to your message',
      reaction_added: 'New reaction',
      message_pinned: 'Message pinned',
      user_joined: 'User joined',
    };
    return titles[notification.type] || notification.title || 'New notification';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-1 bg-primary text-primary-foreground rounded text-xs font-semibold">
                  {unreadCount}
                </span>
              )}
            </DialogTitle>
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={markAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Mark all as read
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="h-[500px]">
          <div className="p-4">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bell className="w-12 h-12 mb-3 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification: any) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-3 rounded border transition-colors',
                      notification.read_at
                        ? 'border-border/30 bg-secondary/20'
                        : 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-sm">
                              {getNotificationTitle(notification)}
                            </p>
                            {notification.actor_name && (
                              <p className="text-xs text-muted-foreground">
                                from <span className="text-primary">{notification.actor_name}</span>
                              </p>
                            )}
                          </div>
                          {!notification.read_at && (
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                          )}
                        </div>

                        {notification.content && (
                          <p className="text-xs text-foreground/70 mt-1 line-clamp-2">
                            {notification.content}
                          </p>
                        )}

                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.created_at).toLocaleTimeString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notification.read_at && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAsRead(notification.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteNotification(notification.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

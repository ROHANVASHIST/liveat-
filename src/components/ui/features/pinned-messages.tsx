import React, { useEffect, useState } from 'react';
import { useMessagePin } from '@/lib/hooks';
import { ChevronDown, Pin, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../button';

interface PinnedMessagesProps {
  roomId: string;
  isOpen?: boolean;
  onSelectMessage?: (message: any) => void;
}

export const PinnedMessages: React.FC<PinnedMessagesProps> = ({
  roomId,
  isOpen = true,
  onSelectMessage,
}) => {
  const { pinnedMessages, fetchPinnedMessages, unpinMessage } = useMessagePin();
  const [isExpanded, setIsExpanded] = useState(isOpen);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadPinned = async () => {
      setIsLoading(true);
      try {
        await fetchPinnedMessages(roomId);
      } finally {
        setIsLoading(false);
      }
    };

    loadPinned();
  }, [roomId, fetchPinnedMessages]);

  if (pinnedMessages.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-border/50 bg-secondary/30">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/50 transition-colors",
          "font-mono text-sm font-semibold text-foreground/80"
        )}
      >
        <div className="flex items-center gap-2">
          <Pin className="w-4 h-4 text-primary" />
          <span>{pinnedMessages.length} pinned message{pinnedMessages.length !== 1 ? 's' : ''}</span>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 transition-transform duration-200",
            isExpanded ? 'transform rotate-180' : ''
          )}
        />
      </button>

      {isExpanded && (
        <div className="px-4 py-3 space-y-2 border-t border-border/30">
          {isLoading ? (
            <div className="text-xs text-muted-foreground">Loading...</div>
          ) : (
            pinnedMessages.map((pinned: any) => {
              const message = pinned.messages || pinned;
              return (
                <button
                  key={pinned.id}
                  onClick={() => onSelectMessage?.(message)}
                  className={cn(
                    "w-full text-left p-2 rounded text-xs border border-border/30",
                    "hover:bg-secondary/50 transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-semibold text-primary">{message.sender_name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        unpinMessage(message.id, roomId);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-foreground/70 line-clamp-2">{message.content}</p>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

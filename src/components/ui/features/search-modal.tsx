import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../dialog';
import { Input } from '../input';
import { Button } from '../button';
import { ScrollArea } from '../scroll-area';
import { useMessageSearch } from '@/lib/hooks';
import { Search, X, MessageSquare, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  roomId?: string;
  onSelectMessage?: (message: any) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onOpenChange,
  roomId,
  onSelectMessage,
}) => {
  const [query, setQuery] = useState('');
  const { isSearching, searchResults, search } = useMessageSearch();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        search(query, roomId);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, search, roomId]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="p-4 border-b border-border/50">
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search Messages
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 border-b border-border/50">
          <div className="relative">
            <Input
              placeholder="Search in messages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          <div className="p-4">
            {isSearching && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin">
                  <Search className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            )}

            {!isSearching && query && searchResults.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No messages found</p>
              </div>
            )}

            {!isSearching && !query && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Type to search messages</p>
              </div>
            )}

            <div className="space-y-2">
              {searchResults.map((message: any) => (
                <button
                  key={message.id}
                  onClick={() => {
                    onSelectMessage?.(message);
                    onOpenChange(false);
                  }}
                  className={cn(
                    "w-full text-left p-3 rounded border border-border/30 hover:bg-secondary transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="font-mono text-sm font-semibold text-primary">
                      {message.sender_name}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {new Date(message.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                  <p className="text-sm text-foreground/80 line-clamp-2">
                    {message.content}
                  </p>
                  {message.media_url && (
                    <div className="text-xs text-muted-foreground mt-1">
                      📎 Media attached
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

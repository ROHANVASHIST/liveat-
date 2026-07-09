import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { ScrollArea } from './scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { cn } from '@/lib/utils';
import { Search, X, Share2, UserPlus } from 'lucide-react';

interface ShareUser {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
}

interface ShareContactProps {
  isOpen: boolean;
  onClose: () => void;
  users: ShareUser[];
  onShare: (userId: string) => void;
}

export const ShareContact: React.FC<ShareContactProps> = ({
  isOpen,
  onClose,
  users,
  onShare,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  }, [users, searchQuery]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="border-border p-0 bg-background font-mono sm:max-w-[420px]">
        <DialogHeader className="p-5 border-b border-border">
          <DialogTitle className="text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-2">
            <Share2 size={14} className="text-primary" />
            SHARE::CONTACT_NODE
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 border-b border-border">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH_USERS..."
              className="w-full bg-muted/20 border border-border focus:border-primary h-10 pl-10 pr-10 text-[11px] uppercase tracking-widest outline-none transition-all text-foreground placeholder:text-muted-foreground/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-[350px]">
          <div className="p-2">
            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <UserPlus size={20} className="text-muted-foreground mb-3 opacity-50" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">No users found</p>
              </div>
            ) : (
              filteredUsers.map(user => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 border border-transparent hover:border-border hover:bg-muted/10 transition-all group"
                >
                  <Avatar className="h-8 w-8 border border-border rounded-none overflow-hidden shrink-0">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="text-[9px] bg-muted rounded-none">
                      {user.name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-foreground uppercase tracking-wider leading-tight truncate">
                      {user.name}
                    </p>
                    {user.email && (
                      <p className="text-[8px] text-muted-foreground truncate mt-0.5 normal-case tracking-normal">
                        {user.email}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => { onShare(user.id); onClose(); }}
                    className="h-8 px-3 text-[8px] uppercase tracking-wider font-bold border border-primary/30 text-primary hover:bg-primary/10 transition-all shrink-0 flex items-center gap-1.5"
                  >
                    <Share2 size={10} />
                    Share
                  </button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

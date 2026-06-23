import React, { useEffect } from 'react';
import { useUserBlock } from '@/lib/hooks';
import { UserX, AlertCircle } from 'lucide-react';
import { Button } from '../button';
import { ScrollArea } from '../scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../avatar';
import { cn } from '@/lib/utils';

interface BlockedUsersModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
}

export const BlockedUsersModal: React.FC<BlockedUsersModalProps> = ({
  isOpen,
  onOpenChange,
  currentUserId,
}) => {
  const { blockedUsers, isBlocking, fetchBlockedUsers, unblockUser } = useUserBlock();

  useEffect(() => {
    if (isOpen) {
      fetchBlockedUsers();
    }
  }, [isOpen, fetchBlockedUsers]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserX className="w-5 h-5" />
            Blocked Users
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px]">
          <div className="p-4">
            {blockedUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <UserX className="w-12 h-12 mb-2 opacity-50" />
                <p>No blocked users</p>
              </div>
            ) : (
              <div className="space-y-3">
                {blockedUsers.map((block: any) => (
                  <div
                    key={block.id}
                    className={cn(
                      "p-3 rounded border border-border/30",
                      "flex items-center justify-between",
                      "hover:bg-secondary/50 transition-colors"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={block.blocked_user?.avatar} />
                        <AvatarFallback>
                          {block.blocked_user?.name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">
                          {block.blocked_user?.name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {block.blocked_user?.email}
                        </p>
                        {block.reason && (
                          <p className="text-xs text-foreground/60 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {block.reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => unblockUser(block.blocked_user_id)}
                      disabled={isBlocking}
                      className="text-xs"
                    >
                      Unblock
                    </Button>
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

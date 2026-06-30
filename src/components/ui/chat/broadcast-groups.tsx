import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../dialog';
import { Button } from '../button';
import { Input } from '../input';
import { ScrollArea } from '../scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../avatar';
import { Badge } from '../badge';
import {
  Users,
  Send,
  Plus,
  Search,
  X,
  Check,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Share2,
  Volume2,
  Mic,
  Image,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BroadcastGroup {
  id: string;
  name: string;
  recipients: Array<{
    id: string;
    name: string;
    avatar?: string;
    phone?: string;
  }>;
  lastMessage?: string;
  lastMessageTime?: Date;
  createdAt: Date;
}

interface CreateBroadcastProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: Array<{
    id: string;
    name: string;
    avatar?: string;
    phone?: string;
  }>;
  onCreate: (name: string, recipientIds: string[]) => Promise<boolean>;
}

export const CreateBroadcast: React.FC<CreateBroadcastProps> = ({
  isOpen,
  onOpenChange,
  contacts,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleRecipient = (id: string) => {
    setSelectedRecipients(prev =>
      prev.includes(id)
        ? prev.filter(r => r !== id)
        : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!name.trim() || selectedRecipients.length === 0) return;

    setIsCreating(true);
    try {
      const success = await onCreate(name.trim(), selectedRecipients);
      if (success) {
        setName('');
        setSelectedRecipients([]);
        onOpenChange(false);
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Create broadcast list
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Broadcast name */}
          <div>
            <label className="text-sm font-medium mb-1 block">Broadcast name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for this broadcast"
              className="font-mono"
            />
          </div>

          {/* Recipients count */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedRecipients.length} recipient{selectedRecipients.length !== 1 ? 's' : ''} selected
            </span>
            <span className="text-xs text-muted-foreground">
              Messages will be sent individually
            </span>
          </div>

          {/* Search contacts */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-md bg-secondary"
            />
          </div>

          {/* Contacts list */}
          <ScrollArea className="h-[300px]">
            <div className="space-y-1">
              {filteredContacts.map(contact => {
                const isSelected = selectedRecipients.includes(contact.id);
                return (
                  <button
                    key={contact.id}
                    onClick={() => toggleRecipient(contact.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left",
                      isSelected ? 'bg-primary/10' : 'hover:bg-secondary'
                    )}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={contact.avatar} />
                      <AvatarFallback>
                        {contact.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{contact.name}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {contact.phone}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}

              {filteredContacts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No contacts found
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleCreate}
              disabled={!name.trim() || selectedRecipients.length === 0 || isCreating}
            >
              <Send className="w-4 h-4 mr-2" />
              Create
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Broadcast list management
interface BroadcastListsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  broadcasts: BroadcastGroup[];
  onSelectBroadcast: (id: string) => void;
  onEditBroadcast?: (id: string) => void;
  onDeleteBroadcast?: (id: string) => void;
  onShareBroadcast?: (id: string) => void;
}

export const BroadcastLists: React.FC<BroadcastListsProps> = ({
  isOpen,
  onOpenChange,
  broadcasts,
  onSelectBroadcast,
  onEditBroadcast,
  onDeleteBroadcast,
  onShareBroadcast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBroadcasts = broadcasts.filter(b =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Broadcast lists
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search broadcast lists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-md bg-secondary"
            />
          </div>

          {/* Broadcast lists */}
          <ScrollArea className="h-[400px]">
            {filteredBroadcasts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No broadcast lists</p>
                <p className="text-xs mt-1">
                  Create a broadcast list to send messages to multiple people at once
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredBroadcasts.map(broadcast => (
                  <div
                    key={broadcast.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary cursor-pointer"
                    onClick={() => onSelectBroadcast(broadcast.id)}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Send className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{broadcast.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {broadcast.recipients.length} recipients
                      </div>
                      {broadcast.lastMessage && (
                        <div className="text-xs text-muted-foreground truncate mt-1">
                          {broadcast.lastMessage}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onShareBroadcast?.(broadcast.id);
                        }}
                        className="p-1.5 hover:bg-secondary rounded"
                      >
                        <Share2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditBroadcast?.(broadcast.id);
                        }}
                        className="p-1.5 hover:bg-secondary rounded"
                      >
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteBroadcast?.(broadcast.id);
                        }}
                        className="p-1.5 hover:bg-secondary rounded text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Contact details panel
interface ContactDetailsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  contact: {
    id: string;
    name: string;
    avatar?: string;
    phone?: string;
    email?: string;
    status?: string;
    about?: string;
    lastSeen?: Date;
    isOnline?: boolean;
    groups?: Array<{
      id: string;
      name: string;
    }>;
    media?: Array<{
      id: string;
      type: 'image' | 'video';
      url: string;
    }>;
  };
  isBlocked?: boolean;
  onMessage?: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
  onBlock?: () => void;
  onUnblock?: () => void;
  onAddToGroup?: () => void;
  onShareContact?: () => void;
  onClearChat?: () => void;
  onDeleteContact?: () => void;
}

export const ContactDetails: React.FC<ContactDetailsProps> = ({
  isOpen,
  onOpenChange,
  contact,
  isBlocked = false,
  onMessage,
  onCall,
  onVideoCall,
  onBlock,
  onUnblock,
  onAddToGroup,
  onShareContact,
  onClearChat,
  onDeleteContact,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex flex-col items-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={contact.avatar} />
              <AvatarFallback className="text-2xl">
                {contact.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <DialogTitle className="text-xl">{contact.name}</DialogTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              {contact.isOnline ? (
                <span className="flex items-center gap-1 text-green-600">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Online
                </span>
              ) : contact.lastSeen ? (
                <span>last seen {contact.lastSeen.toLocaleString()}</span>
              ) : null}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[400px]">
          <div className="space-y-6 px-4">
            {/* Quick actions */}
            <div className="flex justify-center gap-4">
              <button
                onClick={onMessage}
                className="flex flex-col items-center gap-1 p-3 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                <MessageSquare className="w-6 h-6 text-primary" />
                <span className="text-xs">Message</span>
              </button>
              <button
                onClick={onCall}
                className="flex flex-col items-center gap-1 p-3 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                <Volume2 className="w-6 h-6 text-primary" />
                <span className="text-xs">Voice</span>
              </button>
              <button
                onClick={onVideoCall}
                className="flex flex-col items-center gap-1 p-3 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                <Image className="w-6 h-6 text-primary" />
                <span className="text-xs">Video</span>
              </button>
            </div>

            {/* Contact info */}
            <div className="space-y-3">
              {contact.phone && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Phone</div>
                  <div className="font-mono">{contact.phone}</div>
                </div>
              )}
              {contact.email && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Email</div>
                  <div>{contact.email}</div>
                </div>
              )}
              {contact.status && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Status</div>
                  <div>{contact.status}</div>
                </div>
              )}
              {contact.about && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">About</div>
                  <div className="text-sm">{contact.about}</div>
                </div>
              )}
            </div>

            {/* Shared groups */}
            {contact.groups && contact.groups.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-2">
                  Groups in common ({contact.groups.length})
                </div>
                {contact.groups.map(group => (
                  <div
                    key={group.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary"
                  >
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-medium">
                      {group.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="font-medium text-sm">{group.name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Shared media */}
            {contact.media && contact.media.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-muted-foreground">
                    Media ({contact.media.length})
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {contact.media.slice(0, 8).map(item => (
                    <div
                      key={item.id}
                      className="aspect-square rounded overflow-hidden bg-secondary cursor-pointer hover:ring-2 hover:ring-primary"
                    >
                      <img src={item.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-1 pt-4 border-t border-border">
              {isBlocked ? (
                <button
                  onClick={onUnblock}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-green-600"
                >
                  <Check className="w-5 h-5" />
                  <span>Unblock contact</span>
                </button>
              ) : (
                <button
                  onClick={onBlock}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-red-500"
                >
                  <X className="w-5 h-5" />
                  <span>Block contact</span>
                </button>
              )}
              
              <button
                onClick={onShareContact}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
              >
                <Share2 className="w-5 h-5 text-muted-foreground" />
                <span>Share contact</span>
              </button>
              
              <button
                onClick={onAddToGroup}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
              >
                <Users className="w-5 h-5 text-muted-foreground" />
                <span>Add to group</span>
              </button>
              
              <button
                onClick={onClearChat}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
              >
                <Trash2 className="w-5 h-5 text-muted-foreground" />
                <span>Clear chat</span>
              </button>
              
              <button
                onClick={onDeleteContact}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-red-500"
              >
                <Trash2 className="w-5 h-5" />
                <span>Delete contact</span>
              </button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
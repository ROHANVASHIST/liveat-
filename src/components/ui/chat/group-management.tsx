import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../dialog';
import { Button } from '../button';
import { Input } from '../input';
import { ScrollArea } from '../scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../avatar';
import { Badge } from '../badge';
import {
  Users,
  UserPlus,
  UserMinus,
  Crown,
  Shield,
  Settings,
  Copy,
  ExternalLink,
  Trash2,
  Edit,
  MoreVertical,
  Search,
  Check,
  X,
  Phone,
  Video,
  Info,
  Image as ImageIcon,
  Lock,
  Globe,
  Plus,
  Share2,
  Bell,
  BellOff,
  Volume2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'member';
  joinedAt: Date;
  isOnline?: boolean;
  lastSeen?: Date;
}

interface GroupSettingsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
  groupDescription?: string;
  groupAvatar?: string;
  groupType: 'public' | 'private' | 'group';
  members: GroupMember[];
  currentUserId: string;
  isCurrentUserAdmin?: boolean;
  onLeaveGroup?: () => void;
  onUpdateSettings?: (settings: any) => void;
  onRemoveMember?: (memberId: string) => void;
  onPromoteMember?: (memberId: string) => void;
  onDemoteMember?: (memberId: string) => void;
}

export const GroupSettings: React.FC<GroupSettingsProps> = ({
  isOpen,
  onOpenChange,
  groupId,
  groupName,
  groupDescription,
  groupAvatar,
  groupType,
  members,
  currentUserId,
  isCurrentUserAdmin = false,
  onLeaveGroup,
  onUpdateSettings,
  onRemoveMember,
  onPromoteMember,
  onDemoteMember,
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'settings' | 'media'>('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [editedName, setEditedName] = useState(groupName);
  const [editedDescription, setEditedDescription] = useState(groupDescription || '');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const currentUser = members.find(m => m.id === currentUserId);
  const admins = members.filter(m => m.role === 'admin');
  const regularMembers = members.filter(m => m.role === 'member');
  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyInviteLink = () => {
    const inviteLink = `${window.location.origin}/chat/${groupId}?invite=true`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveSettings = () => {
    onUpdateSettings?.({
      name: editedName,
      description: editedDescription,
    });
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={groupAvatar} />
              <AvatarFallback className="text-lg">
                {groupName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold">{groupName}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                {groupType === 'public' ? (
                  <><Globe className="w-3 h-3" /> Public group</>
                ) : groupType === 'private' ? (
                  <><Lock className="w-3 h-3" /> Private group</>
                ) : (
                  <><Users className="w-3 h-3" /> {members.length} participants</>
                )}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {['members', 'settings', 'media'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "flex-1 px-4 py-2 text-sm font-medium capitalize transition-colors",
                activeTab === tab
                  ? "text-primary border-b-2 border-primary -mb-px"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <ScrollArea className="h-[400px]">
          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-md bg-secondary"
                />
              </div>

              {/* Invite link */}
              <div className="p-3 bg-secondary rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Invite link</span>
                  <button
                    onClick={handleCopyInviteLink}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    {copiedLink ? (
                      <><Check className="w-3 h-3" /> Copied!</>
                    ) : (
                      <><Copy className="w-3 h-3" /> Copy link</>
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Anyone with this link can join this group
                </p>
              </div>

              {/* Members list */}
              <div className="space-y-2">
                {filteredMembers.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>
                          {member.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {member.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {member.name}
                          {member.id === currentUserId && ' (You)'}
                        </span>
                        {member.role === 'admin' && (
                          <Crown className="w-3 h-3 text-yellow-500" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {member.isOnline
                          ? 'online'
                          : `last seen ${formatDate(member.lastSeen || member.joinedAt)}`
                        }
                      </div>
                    </div>

                    {/* Admin actions */}
                    {isCurrentUserAdmin && member.id !== currentUserId && (
                      <div className="relative group">
                        <button className="p-1 hover:bg-secondary rounded">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {/* Dropdown */}
                        <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-background border border-border rounded-lg shadow-lg py-1 z-10 min-w-[150px]">
                          {member.role === 'member' ? (
                            <button
                              onClick={() => onPromoteMember?.(member.id)}
                              className="w-full text-left px-3 py-1.5 text-sm hover:bg-secondary flex items-center gap-2"
                            >
                              <Crown className="w-4 h-4 text-yellow-500" />
                              Make admin
                            </button>
                          ) : (
                            <button
                              onClick={() => onDemoteMember?.(member.id)}
                              className="w-full text-left px-3 py-1.5 text-sm hover:bg-secondary flex items-center gap-2"
                            >
                              <UserMinus className="w-4 h-4" />
                              Remove as admin
                            </button>
                          )}
                          <button
                            onClick={() => onRemoveMember?.(member.id)}
                            className="w-full text-left px-3 py-1.5 text-sm hover:bg-secondary flex items-center gap-2 text-red-500"
                          >
                            <UserMinus className="w-4 h-4" />
                            Remove from group
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              {/* Group name */}
              <div>
                <label className="text-sm font-medium mb-1 block">Group name</label>
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  disabled={!isCurrentUserAdmin}
                  className="font-mono"
                />
              </div>

              {/* Group description */}
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  disabled={!isCurrentUserAdmin}
                  className="w-full px-3 py-2 text-sm border border-border rounded-md bg-secondary resize-none h-20"
                  placeholder="Add group description..."
                />
              </div>

              {/* Media visibility */}
              <div className="p-3 bg-secondary rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-sm">Media visibility</span>
                  </div>
                  <select className="text-sm border border-border rounded px-2 py-1 bg-background">
                    <option>Visible to all</option>
                    <option>Admins only</option>
                    <option>Hidden</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    <span className="text-sm">Mute notifications</span>
                  </div>
                  <Button variant="outline" size="sm">
                    Mute
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm">Encryption</span>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    End-to-end
                  </Badge>
                </div>
              </div>

              {/* Save button */}
              {isCurrentUserAdmin && (
                <Button onClick={handleSaveSettings} className="w-full">
                  Save changes
                </Button>
              )}

              {/* Leave group */}
              <Button
                variant="outline"
                className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => setShowLeaveConfirm(true)}
              >
                Leave group
              </Button>
            </div>
          )}

          {/* Media Tab */}
          {activeTab === 'media' && (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Shared media, documents and links will appear here</p>
            </div>
          )}
        </ScrollArea>

        {/* Leave confirmation dialog */}
        {showLeaveConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background border border-border rounded-lg p-6 max-w-sm mx-4">
              <h3 className="font-semibold mb-2">Leave group?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You will stop receiving messages from this group. This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowLeaveConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    onLeaveGroup?.();
                    onOpenChange(false);
                  }}
                >
                  Leave
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Participant quick view
export const ParticipantItem: React.FC<{
  participant: GroupMember;
  onClick?: () => void;
  showStatus?: boolean;
}> = ({ participant, onClick, showStatus = true }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-secondary transition-colors text-left"
    >
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={participant.avatar} />
          <AvatarFallback>
            {participant.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {participant.isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{participant.name}</span>
          {participant.role === 'admin' && (
            <Crown className="w-3 h-3 text-yellow-500 flex-shrink-0" />
          )}
        </div>
        {showStatus && (
          <div className="text-xs text-muted-foreground">
            {participant.isOnline
              ? 'online'
              : participant.lastSeen
              ? `last seen ${participant.lastSeen.toLocaleString()}`
              : ''
            }
          </div>
        )}
      </div>
    </button>
  );
};
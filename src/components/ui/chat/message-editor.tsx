import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../button';
import { Input } from '../input';
import { X, Save, Clock, Calendar, AlertTriangle, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageEditProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  originalMessage: {
    id: string;
    content: string;
    roomId: string;
  };
  onSave: (messageId: string, newContent: string) => Promise<boolean>;
  onCancel: () => void;
}

export const MessageEditor: React.FC<MessageEditProps> = ({
  isOpen,
  onOpenChange,
  originalMessage,
  onSave,
  onCancel,
}) => {
  const [content, setContent] = useState(originalMessage.content);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      // Move cursor to end
      inputRef.current.setSelectionRange(content.length, content.length);
    }
  }, [isOpen, content]);

  const handleSave = async () => {
    if (!content.trim()) {
      setError('Message cannot be empty');
      return;
    }

    if (content.trim() === originalMessage.content.trim()) {
      onCancel();
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const success = await onSave(originalMessage.id, content.trim());
      if (success) {
        onOpenChange(false);
      } else {
        setError('Failed to save. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2">
            <Save className="w-4 h-4" />
            Edit message
          </h3>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder="Edit your message..."
              className={cn(
                "w-full min-h-[100px] max-h-[300px] p-3 resize-none border rounded-lg bg-secondary focus:outline-none focus:ring-2 focus:ring-primary",
                error && "border-red-500"
              )}
            />
            
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>{content.length} / 4096</span>
              <span>Press Enter to save, Esc to cancel</span>
            </div>
          </div>

          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Original message reference */}
          <div className="mt-4 p-3 bg-secondary/50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Original message:</div>
            <p className="text-sm opacity-70 line-through">
              {originalMessage.content}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !content.trim()}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Delete message options
interface DeleteMessageOptionsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  message: {
    id: string;
    content: string;
    senderId: string;
    timestamp: Date;
    roomId: string;
  };
  isOwn: boolean;
  onDeleteForMe: () => Promise<boolean>;
  onDeleteForEveryone: () => Promise<boolean>;
}

export const DeleteMessageOptions: React.FC<DeleteMessageOptionsProps> = ({
  isOpen,
  onOpenChange,
  message,
  isOwn,
  onDeleteForMe,
  onDeleteForEveryone,
}) => {
  const [isDeleting, setIsDeleting] = useState<'me' | 'everyone' | null>(null);
  const [error, setError] = useState('');

  // Check if message can be deleted for everyone (time limit - typically 1 hour)
  const canDeleteForEveryone = isOwn && (Date.now() - new Date(message.timestamp).getTime()) < 3600000;

  const handleDelete = async (type: 'me' | 'everyone') => {
    setIsDeleting(type);
    setError('');

    try {
      const success = type === 'me'
        ? await onDeleteForMe()
        : canDeleteForEveryone ? await onDeleteForEveryone() : false;

      if (success) {
        onOpenChange(false);
      } else {
        if (type === 'everyone') {
          setError('Cannot delete message. It may be too old.');
        } else {
          setError('Failed to delete message. Please try again.');
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-sm">
        <div className="p-4">
          <h3 className="font-semibold mb-2">Delete message?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            This message will be deleted from this conversation.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {/* Delete for me */}
            <button
              onClick={() => handleDelete('me')}
              disabled={isDeleting !== null}
              className="w-full p-3 text-left hover:bg-secondary rounded-lg transition-colors flex items-center gap-3"
            >
              <Trash2 className="w-5 h-5 text-red-500" />
              <div>
                <div className="font-medium">Delete for me</div>
                <div className="text-xs text-muted-foreground">
                  Message will be deleted only for you
                </div>
              </div>
            </button>

            {/* Delete for everyone (if eligible) */}
            {canDeleteForEveryone && (
              <button
                onClick={() => handleDelete('everyone')}
                disabled={isDeleting !== null}
                className="w-full p-3 text-left hover:bg-secondary rounded-lg transition-colors flex items-center gap-3"
              >
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div>
                  <div className="font-medium">Delete for everyone</div>
                  <div className="text-xs text-muted-foreground">
                    Message will be deleted for all participants
                  </div>
                </div>
              </button>
            )}

            {!canDeleteForEveryone && isOwn && (
              <div className="p-3 bg-secondary/50 rounded-lg text-sm text-muted-foreground">
                Messages can only be deleted for everyone within 1 hour of sending.
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-border">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting !== null}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

// Message scheduling
interface ScheduleMessageProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (scheduledTime: Date) => Promise<boolean>;
}

export const ScheduleMessage: React.FC<ScheduleMessageProps> = ({
  isOpen,
  onOpenChange,
  onSchedule,
}) => {
  const [selectedTime, setSelectedTime] = useState<string>('tomorrow');
  const [customDate, setCustomDate] = useState<string>('');
  const [customTime, setCustomTime] = useState<string>('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [error, setError] = useState('');

  const scheduleOptions = [
    { id: 'tomorrow', label: 'Tomorrow', icon: Calendar },
    { id: 'nextweek', label: 'Next week', icon: Calendar },
    { id: 'custom', label: 'Custom date & time', icon: Clock },
  ];

  const getScheduledTime = (): Date | null => {
    const now = new Date();

    switch (selectedTime) {
      case 'tomorrow':
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        return tomorrow;

      case 'nextweek':
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        nextWeek.setHours(9, 0, 0, 0);
        return nextWeek;

      case 'custom':
        if (!customDate || !customTime) {
          setError('Please select both date and time');
          return null;
        }
        const custom = new Date(`${customDate}T${customTime}`);
        if (custom <= now) {
          setError('Scheduled time must be in the future');
          return null;
        }
        return custom;

      default:
        return null;
    }
  };

  const handleSchedule = async () => {
    const scheduledTime = getScheduledTime();
    if (!scheduledTime) return;

    setIsScheduling(true);
    setError('');

    try {
      const success = await onSchedule(scheduledTime);
      if (success) {
        onOpenChange(false);
      } else {
        setError('Failed to schedule message');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-sm">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Schedule message
          </h3>
        </div>

        <div className="p-4 space-y-4">
          {/* Schedule options */}
          <div className="space-y-2">
            {scheduleOptions.map(option => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => setSelectedTime(option.id)}
                  className={cn(
                    "w-full p-3 text-left rounded-lg transition-colors flex items-center gap-3",
                    selectedTime === option.id
                      ? 'bg-primary/10 border border-primary'
                      : 'hover:bg-secondary border border-transparent'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{option.label}</span>
                  {selectedTime === option.id && (
                    <Check className="w-4 h-4 text-primary ml-auto" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom date/time */}
          {selectedTime === 'custom' && (
            <div className="space-y-3 p-4 bg-secondary rounded-lg">
              <div>
                <label className="text-sm font-medium mb-1 block">Date</label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => {
                    setCustomDate(e.target.value);
                    setError('');
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Time</label>
                <input
                  type="time"
                  value={customTime}
                  onChange={(e) => {
                    setCustomTime(e.target.value);
                    setError('');
                  }}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Preview */}
          <div className="p-3 bg-secondary/50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Message will be sent:</div>
            <div className="font-medium">
              {selectedTime === 'custom' && customDate && customTime
                ? new Date(`${customDate}T${customTime}`).toLocaleString()
                : selectedTime === 'tomorrow'
                ? 'Tomorrow at 9:00 AM'
                : 'Next week at 9:00 AM'
              }
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-4 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSchedule}
            disabled={isScheduling || (selectedTime === 'custom' && (!customDate || !customTime))}
          >
            {isScheduling ? 'Scheduling...' : 'Schedule'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Auto-delete messages settings
interface AutoDeleteSettingsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentSetting: 'off' | '24h' | '7d' | '365d';
  onUpdateSetting: (setting: 'off' | '24h' | '7d' | '365d') => Promise<boolean>;
  roomName?: string;
}

export const AutoDeleteSettings: React.FC<AutoDeleteSettingsProps> = ({
  isOpen,
  onOpenChange,
  currentSetting,
  onUpdateSetting,
  roomName = 'this chat',
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const options = [
    { value: 'off', label: 'Off', description: 'Messages are not auto-deleted' },
    { value: '24h', label: '24 hours', description: 'Messages will be deleted after 24 hours' },
    { value: '7d', label: '7 days', description: 'Messages will be deleted after 7 days' },
    { value: '365d', label: '1 year', description: 'Messages will be deleted after 1 year' },
  ];

  const handleUpdate = async (setting: typeof currentSetting) => {
    if (setting === currentSetting) return;

    setIsUpdating(true);
    try {
      await onUpdateSetting(setting);
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to update auto-delete setting');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-sm">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Auto-delete messages
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            New messages in {roomName} will be auto-deleted after the selected duration.
          </p>
        </div>

        <div className="p-4 space-y-2">
          {options.map(option => {
            const isSelected = currentSetting === option.value;
            return (
              <button
                key={option.value}
                onClick={() => handleUpdate(option.value as typeof currentSetting)}
                disabled={isUpdating}
                className={cn(
                  "w-full p-4 text-left rounded-lg transition-colors border",
                  isSelected
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-secondary border-transparent'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{option.label}</div>
                  {isSelected && <Check className="w-5 h-5 text-primary" />}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {option.description}
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-border">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
            disabled={isUpdating}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
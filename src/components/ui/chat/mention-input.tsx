import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { AtSign, User } from 'lucide-react';

interface MentionUser {
  id: string;
  name: string;
  avatar?: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  users: MentionUser[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  onSend,
  users,
  placeholder,
  disabled,
  className,
  children,
}) => {
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionRef = useRef<HTMLDivElement>(null);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(mentionSearch.toLowerCase())
  ).slice(0, 8);

  useEffect(() => {
    const text = value.slice(0, cursorPosition);
    const atIndex = text.lastIndexOf('@');
    if (atIndex !== -1) {
      const afterAt = text.slice(atIndex + 1);
      if (!afterAt.includes(' ')) {
        setMentionSearch(afterAt);
        setShowMentions(true);
        setMentionIndex(0);
        return;
      }
    }
    setShowMentions(false);
  }, [value, cursorPosition]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mentionRef.current && !mentionRef.current.contains(e.target as Node)) {
        setShowMentions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const insertMention = (user: MentionUser) => {
    const text = value.slice(0, cursorPosition);
    const atIndex = text.lastIndexOf('@');
    if (atIndex === -1) return;

    const before = value.slice(0, atIndex);
    const after = value.slice(cursorPosition);
    const newValue = `${before}@${user.name} ${after}`;
    onChange(newValue);
    setShowMentions(false);

    // Set cursor position after the mention
    const newPos = before.length + user.name.length + 2;
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(newPos, newPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(i => Math.min(i + 1, filteredUsers.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(i => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        if (filteredUsers[mentionIndex]) {
          e.preventDefault();
          insertMention(filteredUsers[mentionIndex]);
          return;
        }
      }
      if (e.key === 'Escape') {
        setShowMentions(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    setCursorPosition((e.target as HTMLTextAreaElement).selectionStart || 0);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Mention dropdown */}
      {showMentions && filteredUsers.length > 0 && (
        <div
          ref={mentionRef}
          className="absolute bottom-full left-0 right-0 mb-2 border border-border bg-background shadow-lg z-50 max-h-[200px] overflow-y-auto"
        >
          <div className="px-3 py-1.5 text-[8px] uppercase tracking-widest text-muted-foreground border-b border-border">
            Mentions
          </div>
          {filteredUsers.map((user, i) => (
            <button
              key={user.id}
              onClick={() => insertMention(user)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-[11px] uppercase tracking-widest transition-all",
                i === mentionIndex ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/30"
              )}
            >
              <div className="h-6 w-6 border border-border flex items-center justify-center bg-muted/20">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={10} />
                )}
              </div>
              <span className="font-bold">@{user.name}</span>
            </button>
          ))}
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onSelect={handleSelect}
        onClick={handleSelect}
        placeholder={placeholder || "Type @ to mention..."}
        disabled={disabled}
        rows={1}
        className="w-full bg-transparent border-none focus:ring-0 resize-none py-2 text-[13px] tracking-widest transition-all outline-none text-foreground placeholder:text-muted-foreground/30"
        style={{ height: 'auto', minHeight: '40px', maxHeight: '192px' }}
      />

      {children}
    </div>
  );
};

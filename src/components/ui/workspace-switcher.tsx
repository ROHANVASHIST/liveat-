import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { cn } from '@/lib/utils';
import { Check, Plus, ChevronDown } from 'lucide-react';

interface WorkspaceAccount {
  id: string;
  name: string;
  avatar?: string;
  email: string;
}

interface WorkspaceSwitcherProps {
  accounts: WorkspaceAccount[];
  activeAccountId: string;
  onSwitchAccount: (id: string) => void;
  onAddAccount: () => void;
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  accounts,
  activeAccountId,
  onSwitchAccount,
  onAddAccount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeAccount = accounts.find(a => a.id === activeAccountId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative font-mono">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 p-2.5 border border-border bg-background hover:border-primary/50 transition-all text-left"
      >
        <Avatar className="h-6 w-6 border border-border rounded-none overflow-hidden shrink-0">
          <AvatarImage src={activeAccount?.avatar} />
          <AvatarFallback className="text-[8px] bg-muted rounded-none">
            {activeAccount?.name?.[0] || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-foreground uppercase tracking-widest truncate leading-tight">
            {activeAccount?.name || 'Select Workspace'}
          </p>
          <p className="text-[7px] text-muted-foreground uppercase tracking-widest truncate leading-tight mt-0.5">
            {activeAccount?.email || ''}
          </p>
        </div>
        <ChevronDown size={12} className={cn('text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 border border-border bg-background shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-50 animate-fade-in">
          <div className="p-2 border-b border-border">
            <span className="text-[8px] uppercase tracking-[0.3em] text-muted-foreground px-2">
              WORKSPACES
            </span>
          </div>
          <div className="py-1 max-h-[200px] overflow-y-auto">
            {accounts.map(account => (
              <button
                key={account.id}
                onClick={() => { onSwitchAccount(account.id); setIsOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all hover:bg-muted/20',
                  activeAccountId === account.id && 'bg-primary/5'
                )}
              >
                <Avatar className="h-7 w-7 border border-border rounded-none overflow-hidden shrink-0">
                  <AvatarImage src={account.avatar} />
                  <AvatarFallback className="text-[9px] bg-muted rounded-none">
                    {account.name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-foreground uppercase tracking-widest truncate leading-tight flex items-center gap-2">
                    {account.name}
                    {activeAccountId === account.id && (
                      <Check size={10} className="text-primary shrink-0" />
                    )}
                  </p>
                  <p className="text-[7px] text-muted-foreground uppercase tracking-widest truncate leading-tight mt-0.5">
                    {account.email}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <div className="border-t border-border p-2">
            <button
              onClick={() => { onAddAccount(); setIsOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[9px] uppercase tracking-wider font-bold text-primary hover:bg-primary/5 border border-transparent hover:border-primary/30 transition-all"
            >
              <Plus size={12} />
              Add Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

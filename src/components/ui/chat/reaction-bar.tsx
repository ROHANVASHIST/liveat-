import React from 'react';
import { cn } from '@/lib/utils';
import { SmilePlus } from 'lucide-react';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '✅', '💯'];

interface ReactionBarProps {
  onReact: (emoji: string) => void;
  isSelf: boolean;
  show: boolean;
}

export const ReactionBar: React.FC<ReactionBarProps> = ({ onReact, isSelf, show }) => {
  if (!show) return null;

  return (
    <div className={cn(
      "absolute -top-10 bg-background border border-border p-1 flex gap-0.5 z-50 shadow-lg",
      isSelf ? "right-0" : "left-0"
    )}>
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onReact(emoji)}
          className="h-7 w-7 text-sm hover:bg-primary/10 transition-colors flex items-center justify-center border border-transparent hover:border-primary/20 rounded"
          title={emoji}
        >
          {emoji}
        </button>
      ))}
      <div className="w-[1px] h-5 bg-border/50 mx-0.5 self-center" />
      <button
        onClick={() => onReact('+')}
        className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
        title="More reactions"
      >
        <SmilePlus size={12} />
      </button>
    </div>
  );
};

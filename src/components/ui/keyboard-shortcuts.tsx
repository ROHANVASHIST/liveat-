import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Keyboard, Command, X } from 'lucide-react';

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; label: string }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'Messaging',
    shortcuts: [
      { keys: ['Enter'], label: 'Send message' },
      { keys: ['Shift', 'Enter'], label: 'New line' },
      { keys: ['Ctrl', 'K'], label: 'Open command palette' },
      { keys: ['Ctrl', 'F'], label: 'Search messages' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['Escape'], label: 'Close panel / Cancel reply' },
      { keys: ['Ctrl', 'Shift', 'M'], label: 'Toggle mute' },
    ],
  },
  {
    title: 'Actions',
    shortcuts: [
      { keys: ['Ctrl', 'C'], label: 'Copy selected message' },
      { keys: ['Ctrl', 'Shift', 'S'], label: 'Save message' },
      { keys: ['Ctrl', 'Shift', 'R'], label: 'Reply to message' },
      { keys: ['Ctrl', 'Shift', 'F'], label: 'Forward message' },
    ],
  },
];

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 pointer-events-none font-mono">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm pointer-events-auto"
        />
        <motion.div
          initial={{ scale: 0.98, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.98, opacity: 0, y: 10 }}
          className="w-full max-w-lg bg-background border border-primary/20 shadow-[0_0_50px_rgba(0,229,255,0.1)] overflow-hidden pointer-events-auto relative z-10"
        >
          {/* Header */}
          <div className="p-6 border-b border-border bg-muted/10 flex items-center gap-4">
            <div className="h-10 w-10 border border-border flex items-center justify-center text-primary">
              <Keyboard size={18} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em]">Keyboard Shortcuts</h3>
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider mt-1 opacity-60">
                System Commands Reference v1.0
              </p>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Shortcuts List */}
          <div className="max-h-[450px] overflow-y-auto p-4 space-y-6">
            {shortcutGroups.map(group => (
              <div key={group.title}>
                <div className="flex items-center gap-3 mb-3 px-1">
                  <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-primary">{group.title}</span>
                  <div className="h-px flex-1 bg-primary/10" />
                </div>
                <div className="space-y-1">
                  {group.shortcuts.map((shortcut, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-2 border border-transparent hover:border-border/50 hover:bg-muted/10 transition-colors"
                    >
                      <span className="text-[10px] text-foreground/80 tracking-wider">{shortcut.label}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, j) => (
                          <React.Fragment key={key}>
                            {j > 0 && <span className="text-[8px] text-muted-foreground mx-0.5">+</span>}
                            <kbd className={cn(
                              "px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider border",
                              key === 'Enter' || key === 'Escape'
                                ? "border-border bg-muted/20 text-muted-foreground"
                                : "border-primary/30 bg-primary/5 text-primary"
                            )}>
                              {key === 'Ctrl' ? <><Command size={8} className="inline -mt-0.5" /> {key}</> : key}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-primary animate-tech-pulse" />
              Press <kbd className="border border-border px-1 text-foreground">?</kbd> anytime
            </span>
            <span>ESC to close</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
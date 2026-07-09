import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { cn } from '@/lib/utils';
import { Plus, X, Zap, MessageSquare } from 'lucide-react';

interface QuickReplyTemplate {
  id: string;
  text: string;
  label: string;
}

interface QuickRepliesProps {
  onSelect: (text: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const STORAGE_KEY = 'quick-replies';
const DEFAULT_TEMPLATES: QuickReplyTemplate[] = [
  { id: 'default-1', text: "I'll be there shortly", label: 'On My Way' },
  { id: 'default-2', text: 'Thanks!', label: 'Thanks' },
  { id: 'default-3', text: 'On it.', label: 'On It' },
];

const loadTemplates = (): QuickReplyTemplate[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TEMPLATES));
  return DEFAULT_TEMPLATES;
};

const saveTemplates = (templates: QuickReplyTemplate[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
};

export const QuickReplies: React.FC<QuickRepliesProps> = ({
  onSelect,
  onClose,
  isOpen,
}) => {
  const [templates, setTemplates] = useState<QuickReplyTemplate[]>(loadTemplates);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newText, setNewText] = useState('');

  useEffect(() => {
    saveTemplates(templates);
  }, [templates]);

  const handleAdd = () => {
    if (!newLabel.trim() || !newText.trim()) return;
    const newTemplate: QuickReplyTemplate = {
      id: Date.now().toString(),
      text: newText.trim(),
      label: newLabel.trim(),
    };
    setTemplates(prev => [...prev, newTemplate]);
    setNewLabel('');
    setNewText('');
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="border-border p-0 bg-background font-mono sm:max-w-[400px]">
        <DialogHeader className="p-5 border-b border-border">
          <DialogTitle className="text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-2">
            <Zap size={14} className="text-primary" />
            QUICK::REPLY_NODE
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-2 max-h-[400px] overflow-y-auto">
          {templates.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare size={20} className="text-muted-foreground mb-3 opacity-50" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">No templates saved</p>
            </div>
          )}
          {templates.map(template => (
            <div
              key={template.id}
              className="flex items-center gap-2 group"
            >
              <button
                onClick={() => { onSelect(template.text); onClose(); }}
                className="flex-1 flex items-center gap-3 p-3 border border-border hover:border-primary/30 hover:bg-muted/20 transition-all text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider leading-tight">
                    {template.label}
                  </p>
                  <p className="text-[9px] text-muted-foreground truncate mt-0.5 normal-case tracking-normal">
                    {template.text}
                  </p>
                </div>
              </button>
              <button
                onClick={() => handleDelete(template.id)}
                className="h-9 w-9 flex items-center justify-center border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-all opacity-0 group-hover:opacity-100 shrink-0"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>

        <div className="border-t border-border p-4">
          {showAddForm ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[8px] uppercase tracking-widest text-muted-foreground ml-1">Label</label>
                <input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. ON_MY_WAY"
                  className="w-full bg-muted/20 border border-border h-8 px-3 text-[10px] uppercase tracking-widest outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/30"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] uppercase tracking-widest text-muted-foreground ml-1">Text</label>
                <input
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Message content..."
                  className="w-full bg-muted/20 border border-border h-8 px-3 text-[10px] normal-case tracking-normal outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/30"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAdd}
                  className="tech-btn flex-1 h-8 text-[9px]"
                >
                  Save Template
                </button>
                <button
                  onClick={() => { setShowAddForm(false); setNewLabel(''); setNewText(''); }}
                  className="h-8 px-4 text-[8px] uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border hover:border-primary/30 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/50 text-[9px] uppercase tracking-wider font-bold transition-all"
            >
              <Plus size={12} />
              Add Template
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

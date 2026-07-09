import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X, Plus, Smile, Star } from 'lucide-react';

interface CustomEmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
}

const DEFAULT_EMOJI = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '✅', '❌', '💯', '👋', '🥳', '😎', '🙏', '💪', '🤝', '✨'];

export const CustomEmojiPicker: React.FC<CustomEmojiPickerProps> = ({ isOpen, onClose, onEmojiSelect }) => {
  const [customEmojis, setCustomEmojis] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('custom-emojis') || '[]'); }
    catch { return []; }
  });
  const [showUploader, setShowUploader] = useState(false);
  const [activeTab, setActiveTab] = useState<'default' | 'custom'>('default');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const updated = [...customEmojis, dataUrl];
        setCustomEmojis(updated);
        localStorage.setItem('custom-emojis', JSON.stringify(updated));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeCustomEmoji = (index: number) => {
    const updated = customEmojis.filter((_, i) => i !== index);
    setCustomEmojis(updated);
    localStorage.setItem('custom-emojis', JSON.stringify(updated));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-72 border border-border bg-background shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-[9px] font-bold uppercase tracking-widest">Emoji & Stickers</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('default')}
            className={cn(
              "flex-1 py-2 text-[8px] uppercase tracking-widest font-bold flex items-center justify-center gap-1 border-b-2 transition-colors",
              activeTab === 'default' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Smile size={12} /> Emoji
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={cn(
              "flex-1 py-2 text-[8px] uppercase tracking-widest font-bold flex items-center justify-center gap-1 border-b-2 transition-colors",
              activeTab === 'custom' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Star size={12} /> Custom
          </button>
        </div>

        <div className="p-3">
          {activeTab === 'default' ? (
            <div className="grid grid-cols-6 gap-1">
              {DEFAULT_EMOJI.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => { onEmojiSelect(emoji); onClose(); }}
                  className="h-9 w-9 flex items-center justify-center text-base hover:bg-primary/10 border border-transparent hover:border-primary/30 transition-all"
                >
                  {emoji}
                </button>
              ))}
            </div>
          ) : (
            <div>
              {customEmojis.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground/50">No custom emoji yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {customEmojis.map((emojiUrl, i) => (
                    <div key={i} className="relative group">
                      <button
                        onClick={() => { onEmojiSelect(emojiUrl); onClose(); }}
                        className="h-12 w-full border border-border hover:border-primary/30 transition-colors overflow-hidden"
                      >
                        <img src={emojiUrl} alt="" className="w-full h-full object-contain p-1" />
                      </button>
                      <button
                        onClick={() => removeCustomEmoji(i)}
                        className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 border border-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={8} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-border text-muted-foreground hover:border-primary/30 hover:text-primary text-[8px] uppercase tracking-widest font-bold transition-colors"
              >
                <Plus size={12} /> Upload Emoji
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
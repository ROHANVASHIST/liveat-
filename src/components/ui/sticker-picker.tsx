import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { cn } from '@/lib/utils';
import { Plus, X, Image, Smile } from 'lucide-react';

interface StickerPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (stickerUrl: string) => void;
}

const STICKER_PACKS: Record<string, string[]> = {
  Reactions: ['😀', '😂', '🥰', '😎', '🤩', '😱', '🥳', '😤', '🤗', '😈', '💀', '👀'],
  Animals: ['🐶', '🐱', '🐼', '🦊', '🐸', '🐨', '🦁', '🐯', '🐰', '🐻', '🦄', '🐲'],
  Food: ['🍕', '🍔', '🌮', '🍦', '🍩', '🍪', '🧁', '🍫', '🍿', '🥑', '🌶️', '🍣'],
  Objects: ['💎', '🔥', '⭐', '🌈', '🎯', '🎨', '🎸', '🚀', '🎮', '💡', '🔮', '💣'],
};

const CUSTOM_STICKERS_KEY = 'custom-stickers';

export const StickerPicker: React.FC<StickerPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [activePack, setActivePack] = useState<string>('Reactions');
  const [customStickers, setCustomStickers] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_STICKERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(CUSTOM_STICKERS_KEY, JSON.stringify(customStickers));
  }, [customStickers]);

  const handleAddCustom = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setCustomStickers(prev => [...prev, dataUrl]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveCustom = (index: number) => {
    setCustomStickers(prev => prev.filter((_, i) => i !== index));
  };

  const packs = Object.keys(STICKER_PACKS);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="border-border p-0 bg-background font-mono sm:max-w-[420px]">
        <DialogHeader className="p-5 border-b border-border">
          <DialogTitle className="text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-2">
            <Smile size={14} className="text-primary" />
            STICKER::VAULT
          </DialogTitle>
        </DialogHeader>

        <div className="flex border-b border-border">
          {packs.map(pack => (
            <button
              key={pack}
              onClick={() => setActivePack(pack)}
              className={cn(
                'flex-1 py-2.5 text-[8px] uppercase tracking-wider font-bold border-b-2 transition-all',
                activePack === pack
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {pack}
            </button>
          ))}
        </div>

        <div className="p-5 max-h-[350px] overflow-y-auto">
          {activePack === 'Reactions' && customStickers.length > 0 && (
            <div className="mb-5">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground mb-3">Custom</div>
              <div className="grid grid-cols-4 gap-2">
                {customStickers.map((url, index) => (
                  <div key={index} className="relative group">
                    <button
                      onClick={() => { onSelect(url); onClose(); }}
                      className="w-full aspect-square border border-border hover:border-primary/50 transition-all overflow-hidden bg-muted/20 flex items-center justify-center p-1"
                    >
                      <img src={url} alt="" className="w-full h-full object-contain" />
                    </button>
                    <button
                      onClick={() => handleRemoveCustom(index)}
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X size={8} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-4 gap-2">
            {STICKER_PACKS[activePack].map((emoji, index) => (
              <button
                key={`${activePack}-${index}`}
                onClick={() => { onSelect('emoji:' + emoji); onClose(); }}
                className="w-full aspect-square border border-border hover:border-primary/50 hover:bg-muted/20 transition-all flex items-center justify-center text-3xl"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border p-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={handleAddCustom}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/50 text-[9px] uppercase tracking-wider font-bold transition-all"
          >
            <Image size={12} />
            Add Custom Sticker
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

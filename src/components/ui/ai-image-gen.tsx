import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { cn } from '@/lib/utils';
import { Sparkles, Image, X, Loader2, AlertTriangle } from 'lucide-react';

interface AiImageGenProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string) => Promise<string | null>;
  onInsert: (imageUrl: string) => void;
}

export const AiImageGen: React.FC<AiImageGenProps> = ({
  isOpen,
  onClose,
  onGenerate,
  onInsert,
}) => {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setError(null);
    setGeneratedImage(null);
    try {
      const result = await onGenerate(prompt.trim());
      if (result) {
        setGeneratedImage(result);
      } else {
        setError('Generation failed — null response');
      }
    } catch (err: any) {
      setError(err?.message || 'Generation error');
    } finally {
      setGenerating(false);
    }
  };

  const handleInsert = () => {
    if (generatedImage) {
      onInsert(generatedImage);
      handleReset();
      onClose();
    }
  };

  const handleReset = () => {
    setPrompt('');
    setGeneratedImage(null);
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); handleReset(); } }}>
      <DialogContent className="border-border p-0 bg-background font-mono sm:max-w-[500px]">
        <DialogHeader className="p-5 border-b border-border">
          <DialogTitle className="text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-2">
            <Sparkles size={14} className="text-primary" />
            AI::IMAGE_GEN_NODE
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
              placeholder="DESCRIBE_THE_IMAGE..."
              disabled={generating}
              className="flex-1 bg-muted/20 border border-border focus:border-primary h-10 px-3 text-[11px] uppercase tracking-widest outline-none transition-all text-foreground placeholder:text-muted-foreground/40 disabled:opacity-50"
            />
            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="tech-btn h-10 px-4 text-[9px] flex items-center gap-2 disabled:opacity-30"
            >
              {generating ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Sparkles size={12} />
              )}
              {generating ? 'GEN...' : 'Generate'}
            </button>
          </div>

          {generating && (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-primary/30 bg-primary/[0.02]">
              <Loader2 size={24} className="text-primary animate-spin mb-3" />
              <p className="text-[10px] uppercase tracking-widest text-primary animate-pulse">Generating...</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 border border-destructive/30 bg-destructive/10">
              <AlertTriangle size={14} className="text-destructive shrink-0" />
              <p className="text-[9px] text-destructive uppercase tracking-wider">{error}</p>
            </div>
          )}

          {generatedImage && !generating && (
            <div className="space-y-3">
              <div className="border border-border overflow-hidden bg-muted/20">
                <img
                  src={generatedImage}
                  alt={prompt}
                  className="w-full h-auto max-h-[300px] object-contain mx-auto"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleInsert}
                  className="tech-btn flex-1 h-10 text-[9px] flex items-center justify-center gap-2"
                >
                  <Image size={12} />
                  Insert to Chat
                </button>
                <button
                  onClick={handleReset}
                  className="h-10 px-4 text-[8px] uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border hover:border-primary/30 transition-all"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

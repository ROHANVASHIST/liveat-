import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Search, X, Loader2 } from 'lucide-react';

const TENOR_KEY = 'AIzaSyC3uF8P2WqoFwVjJKzLQVdFhCJx8JfL0cA';
const TENOR_BASE = 'https://tenor.googleapis.com/v2';

interface GifPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export const GifPicker: React.FC<GifPickerProps> = ({ isOpen, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGifs = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const endpoint = search.trim()
        ? `${TENOR_BASE}/search?q=${encodeURIComponent(search)}&key=${TENOR_KEY}&limit=20`
        : `${TENOR_BASE}/trending?key=${TENOR_KEY}&limit=20`;
      const res = await fetch(endpoint);
      const data = await res.json();
      setGifs(data.results || []);
    } catch {
      setGifs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchGifs('');
  }, [isOpen, fetchGifs]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) fetchGifs(query);
      else fetchGifs('');
    }, 400);
    return () => clearTimeout(timer);
  }, [query, fetchGifs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[480px] max-w-[90vw] max-h-[80vh] border border-border bg-background shadow-lg flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-[9px] font-bold uppercase tracking-widest">GIF Picker</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="relative px-4 py-3 border-b border-border">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SEARCH_GIF..."
            className="w-full bg-background/50 border border-border focus:border-primary h-9 pl-8 pr-3 text-[10px] uppercase tracking-widest transition-all outline-none text-foreground placeholder:text-muted-foreground/50"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="text-primary animate-spin" />
            </div>
          ) : gifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50">No GIFs found</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {gifs.map((gif) => {
                const url = gif.media_formats?.gif?.url || gif.media?.[0]?.gif?.url;
                if (!url) return null;
                return (
                  <button
                    key={gif.id}
                    onClick={() => { onSelect(url); onClose(); }}
                    className="border border-border hover:border-primary/40 transition-colors overflow-hidden aspect-video bg-muted/20"
                  >
                    <img
                      src={url}
                      alt={gif.title || ''}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

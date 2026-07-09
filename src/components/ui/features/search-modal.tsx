import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../dialog';
import { ScrollArea } from '../scroll-area';
import { Search, X, MessageSquare, Calendar, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: any[];
  onSearchResults: (results: any[]) => void;
}

const FILTER_CHIPS = ['All', 'Text', 'Media', 'Files', 'Pinned'] as const;

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  messages,
  onSearchResults,
}) => {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [senderFilter, setSenderFilter] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const uniqueSenders = useMemo(() => {
    const senders = new Set<string>();
    messages.forEach(m => {
      if (m.senderName) senders.add(m.senderName);
    });
    return Array.from(senders).sort();
  }, [messages]);

  const filteredResults = useMemo(() => {
    let results = [...messages];

    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(m =>
        (m.content || '').toLowerCase().includes(q) ||
        (m.senderName || '').toLowerCase().includes(q)
      );
    }

    if (activeFilter === 'Text') {
      results = results.filter(m => !m.type || m.type === 'text');
    } else if (activeFilter === 'Media') {
      results = results.filter(m => m.type === 'image');
    } else if (activeFilter === 'Files') {
      results = results.filter(m => m.type === 'file');
    } else if (activeFilter === 'Pinned') {
      results = results.filter(m => m.isPinned);
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      results = results.filter(m => new Date(m.timestamp) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      results = results.filter(m => new Date(m.timestamp) <= to);
    }

    if (senderFilter) {
      results = results.filter(m => m.senderName === senderFilter);
    }

    return results;
  }, [messages, query, activeFilter, dateFrom, dateTo, senderFilter]);

  useEffect(() => {
    onSearchResults(filteredResults);
  }, [filteredResults, onSearchResults]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="border-border p-0 bg-background font-mono sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader className="p-5 border-b border-border">
          <DialogTitle className="text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-2">
            <Search size={14} className="text-primary" />
            SEARCH::MESSAGE_NODES
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-4 border-b border-border">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SEARCH_MESSAGES..."
              className="w-full bg-muted/20 border border-border focus:border-primary h-10 pl-10 pr-10 text-[11px] uppercase tracking-widest outline-none transition-all text-foreground placeholder:text-muted-foreground/40"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {FILTER_CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => setActiveFilter(chip)}
                className={cn(
                  'px-2.5 py-1 text-[9px] uppercase tracking-wider font-bold border transition-all',
                  activeFilter === chip
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-primary bg-transparent'
                )}
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-[8px] uppercase tracking-widest text-muted-foreground ml-1">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-muted/20 border border-border h-8 px-2 text-[10px] uppercase tracking-widest outline-none focus:border-primary text-foreground"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[8px] uppercase tracking-widest text-muted-foreground ml-1">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-muted/20 border border-border h-8 px-2 text-[10px] uppercase tracking-widest outline-none focus:border-primary text-foreground"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[8px] uppercase tracking-widest text-muted-foreground ml-1">Sender</label>
            <select
              value={senderFilter}
              onChange={(e) => setSenderFilter(e.target.value)}
              className="w-full bg-muted/20 border border-border h-8 px-2 text-[10px] uppercase tracking-widest outline-none focus:border-primary text-foreground"
            >
              <option value="">ALL_NODES</option>
              {uniqueSenders.map(sender => (
                <option key={sender} value={sender}>{sender}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="px-5 py-2 border-b border-border bg-muted/10 flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-widest text-primary font-bold">
            RESULTS: {filteredResults.length}
          </span>
          {(query || activeFilter !== 'All' || dateFrom || dateTo || senderFilter) && (
            <button
              onClick={() => { setQuery(''); setActiveFilter('All'); setDateFrom(''); setDateTo(''); setSenderFilter(''); }}
              className="text-[8px] uppercase tracking-wider text-muted-foreground hover:text-primary"
            >
              Clear All Filters
            </button>
          )}
        </div>

        <ScrollArea className="flex-1 max-h-[400px]">
          <div className="p-5">
            {filteredResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 border border-primary/30 bg-primary/5 flex items-center justify-center text-primary mb-4">
                  <Search size={20} />
                </div>
                <p className="text-[11px] font-bold text-foreground uppercase tracking-widest">No results found</p>
                <p className="text-[9px] text-muted-foreground mt-2 uppercase tracking-[0.15em]">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredResults.map((msg: any) => (
                  <div
                    key={msg.id}
                    className="flex items-start gap-3 p-3 border border-border hover:border-primary/30 hover:bg-muted/20 transition-all cursor-pointer group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-bold text-primary uppercase tracking-wider">
                          {msg.senderName}
                        </span>
                        <span className="text-[7px] text-muted-foreground uppercase tracking-widest">
                          {new Date(msg.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-foreground/80 truncate normal-case tracking-normal">
                        {msg.content}
                      </p>
                      {msg.type && msg.type !== 'text' && (
                        <span className={cn(
                          'inline-block mt-1 px-1.5 py-0.5 text-[7px] uppercase tracking-wider font-bold',
                          msg.type === 'image' ? 'text-primary border border-primary/30' : 'text-muted-foreground border border-border'
                        )}>
                          [{msg.type.toUpperCase()}]
                        </span>
                      )}
                    </div>
                    <span className="text-[7px] text-muted-foreground uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      Jump &rarr;
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Folder, FolderOpen, X, Plus, Trash2 } from 'lucide-react';

interface Bookmark {
  id: string;
  content: string;
  senderName: string;
  timestamp: Date;
  folder?: string;
}

interface BookmarkFoldersProps {
  bookmarks: Bookmark[];
  onRemoveBookmark: (id: string) => void;
  onMoveToFolder: (id: string, folder: string) => void;
  onCreateFolder: (name: string) => void;
  folders: string[];
  onClose?: () => void;
}

export const BookmarkFolders: React.FC<BookmarkFoldersProps> = ({
  bookmarks,
  onRemoveBookmark,
  onMoveToFolder,
  onCreateFolder,
  folders,
  onClose,
}) => {
  const [activeFolder, setActiveFolder] = useState<string>('All');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [moveTarget, setMoveTarget] = useState<string | null>(null);

  const allFolders = ['All', 'Unfiled', ...folders];

  const filteredBookmarks = activeFolder === 'All'
    ? bookmarks
    : activeFolder === 'Unfiled'
    ? bookmarks.filter(b => !b.folder)
    : bookmarks.filter(b => b.folder === activeFolder);

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setShowNewFolder(false);
    }
  };

  return (
    <div className="border border-border bg-background flex h-[500px] max-h-[80vh]">
      <div className="w-[180px] border-r border-border flex flex-col">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <span className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold">Folders</span>
          {onClose && (
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={12} />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {allFolders.map(folder => (
            <button
              key={folder}
              onClick={() => setActiveFolder(folder)}
              className={cn(
                "w-full flex items-center gap-2 px-2.5 py-2 text-[9px] uppercase tracking-wider transition-colors border-l-2",
                activeFolder === folder
                  ? "border-primary text-foreground bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {activeFolder === folder ? <FolderOpen size={10} className="text-primary" /> : <Folder size={10} />}
              <span className="truncate">{folder}</span>
              <span className="ml-auto text-[7px] text-muted-foreground">
                {folder === 'All' ? bookmarks.length :
                 folder === 'Unfiled' ? bookmarks.filter(b => !b.folder).length :
                 bookmarks.filter(b => b.folder === folder).length}
              </span>
            </button>
          ))}
        </div>
        <div className="p-2 border-t border-border">
          {showNewFolder ? (
            <div className="flex gap-1">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') setShowNewFolder(false); }}
                placeholder="NAME..."
                className="flex-1 h-7 bg-background border border-border px-2 text-[8px] uppercase tracking-widest outline-none focus:border-primary"
                autoFocus
              />
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="h-7 w-7 flex items-center justify-center border border-primary/30 text-primary hover:bg-primary/5 disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <Plus size={10} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewFolder(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-[8px] uppercase tracking-widest text-muted-foreground hover:text-primary border border-dashed border-border hover:border-primary/30 transition-colors"
            >
              <Plus size={10} /> New Folder
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="p-3 border-b border-border">
          <span className="text-[8px] uppercase tracking-widest text-foreground font-bold">{activeFolder}</span>
          <span className="ml-2 text-[7px] text-muted-foreground">({filteredBookmarks.length})</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredBookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50">No bookmarks</span>
            </div>
          ) : (
            filteredBookmarks.map(bookmark => (
              <div key={bookmark.id} className="group relative border border-border hover:border-primary/20 transition-colors p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[8px] uppercase tracking-wider text-primary font-bold">{bookmark.senderName}</span>
                      <span className="text-[7px] text-muted-foreground">
                        {new Date(bookmark.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[10px] text-foreground/80 line-clamp-2 leading-relaxed">{bookmark.content}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {activeFolder !== 'Unfiled' && (
                      <button
                        onClick={() => onMoveToFolder(bookmark.id, 'Unfiled')}
                        className="h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary border border-transparent hover:border-border transition-all"
                        title="Move to Unfiled"
                      >
                        <Folder size={10} />
                      </button>
                    )}
                    <button
                      onClick={() => onRemoveBookmark(bookmark.id)}
                      className="h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 border border-transparent hover:border-red-500/30 transition-all"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
                {moveTarget === bookmark.id && folders.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 bg-background border border-border shadow-lg p-2">
                    <div className="text-[7px] uppercase tracking-widest text-muted-foreground mb-1 px-1">Move to:</div>
                    {folders.map(f => (
                      <button
                        key={f}
                        onClick={() => { onMoveToFolder(bookmark.id, f); setMoveTarget(null); }}
                        className="w-full text-left px-2 py-1.5 text-[8px] uppercase tracking-wider text-foreground hover:bg-muted/20"
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

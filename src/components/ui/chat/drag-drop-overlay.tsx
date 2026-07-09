import React from 'react';
import { cn } from '@/lib/utils';
import { Upload, FileText, Image, X } from 'lucide-react';

interface DragDropOverlayProps {
  isDragging: boolean;
  onFileDrop: (file: File) => void;
  onDragEnd: () => void;
}

export const DragDropOverlay: React.FC<DragDropOverlayProps> = ({ isDragging, onFileDrop, onDragEnd }) => {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileDrop(file);
    }
    onDragEnd();
  };

  if (!isDragging) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDragLeave={(e) => { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget as Node)) onDragEnd(); }}
      onDrop={handleDrop}
      onClick={onDragEnd}
    >
      <div
        className="border-2 border-dashed border-primary/50 bg-background p-12 text-center max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-16 w-16 mx-auto mb-4 border border-primary/30 bg-primary/5 flex items-center justify-center">
          <Upload size={28} className="text-primary" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground mb-2">Drop File Here</h3>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Drop any file to share it in the current conversation
        </p>
        <div className="flex items-center justify-center gap-4 mt-6 text-[8px] text-muted-foreground uppercase tracking-widest">
          <span className="flex items-center gap-1"><Image size={10} /> Images</span>
          <span className="flex items-center gap-1"><FileText size={10} /> Documents</span>
          <span className="flex items-center gap-1"><Upload size={10} /> Any File</span>
        </div>
        <button
          onClick={onDragEnd}
          className="mt-6 flex items-center gap-2 mx-auto text-[9px] uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
        >
          <X size={12} /> Cancel
        </button>
      </div>
    </div>
  );
};

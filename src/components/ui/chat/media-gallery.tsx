import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../dialog';
import { Button } from '../button';
import { ScrollArea } from '../scroll-area';
import { 
  Image, 
  Video, 
  FileText, 
  Download, 
  X, 
  Grid, 
  List,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'document' | 'audio';
  url: string;
  thumbnail?: string;
  fileName?: string;
  fileSize?: number;
  senderName: string;
  senderId: string;
  timestamp: Date;
  caption?: string;
}

interface MediaGalleryProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  messages: any[];
  currentUserId: string;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  isOpen,
  onOpenChange,
  messages,
  currentUserId,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedType, setSelectedType] = useState<'all' | 'image' | 'video' | 'document'>('all');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Extract media from messages
  const mediaItems: MediaItem[] = useMemo(() => {
    return messages
      .filter(msg => {
        if (msg.type === 'image' || msg.type === 'video' || msg.type === 'file') {
          if (selectedType !== 'all' && msg.type !== selectedType) return false;
          if (searchQuery && !msg.content?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
          return true;
        }
        return false;
      })
      .map((msg, index) => ({
        id: msg.id || `media-${index}`,
        type: msg.type === 'video' ? 'video' : msg.type === 'file' ? 'document' : 'image',
        url: msg.mediaUrl || msg.content,
        thumbnail: msg.mediaUrl || msg.content,
        senderName: msg.senderName,
        senderId: msg.senderId,
        timestamp: new Date(msg.timestamp),
        caption: msg.content,
      }));
  }, [messages, selectedType, searchQuery]);

  // Group by date
  const groupedItems = useMemo(() => {
    const groups: { [key: string]: MediaItem[] } = {};
    
    mediaItems.forEach(item => {
      let dateKey: string;
      const date = item.timestamp;
      
      if (isToday(date)) {
        dateKey = 'Today';
      } else if (isYesterday(date)) {
        dateKey = 'Yesterday';
      } else {
        dateKey = format(date, 'MMMM d, yyyy');
      }
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });
    
    return groups;
  }, [mediaItems]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const selectedMedia = selectedIndex !== null ? mediaItems[selectedIndex] : null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              Media & Files
            </DialogTitle>
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search media..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-1 text-sm border border-border rounded-md bg-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              {/* Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="px-3 py-1 text-sm border border-border rounded-md bg-secondary"
              >
                <option value="all">All</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="document">Files</option>
              </select>
              
              {/* View mode toggle */}
              <div className="flex border border-border rounded-md overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-1.5",
                    viewMode === 'grid' ? "bg-primary text-primary-foreground" : "bg-secondary"
                  )}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-1.5",
                    viewMode === 'list' ? "bg-primary text-primary-foreground" : "bg-secondary"
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="h-[500px]">
          {mediaItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
              <Image className="w-16 h-16 mb-4 opacity-50" />
              <p>No media found</p>
            </div>
          ) : viewMode === 'grid' ? (
            // Grid View
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([date, items]) => (
                <div key={date}>
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3">
                    <Calendar className="w-4 h-4" />
                    {date}
                    <span className="text-xs font-normal">({items.length})</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {items.map((item, index) => {
                      const actualIndex = mediaItems.indexOf(item);
                      return (
                        <button
                          key={item.id}
                          onClick={() => setSelectedIndex(actualIndex)}
                          className="aspect-square rounded-lg overflow-hidden border border-border hover:ring-2 hover:ring-primary transition-all relative group"
                        >
                          {item.type === 'image' ? (
                            <img
                              src={item.thumbnail}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : item.type === 'video' ? (
                            <>
                              <video
                                src={item.url}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Video className="w-8 h-8 text-white" />
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-secondary">
                              <FileText className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                          
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Maximize2 className="w-5 h-5 text-white" />
                          </div>
                          
                          {/* Date overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <p className="text-[10px] text-white truncate">
                              {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // List View
            <div className="space-y-2">
              {mediaItems.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedIndex(index)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary transition-colors text-left"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    {item.type === 'image' ? (
                      <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : item.type === 'video' ? (
                      <video src={item.url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary">
                        <FileText className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {item.fileName || (item.type === 'image' ? 'Image' : item.type === 'video' ? 'Video' : 'File')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sent by {item.senderName} • {item.timestamp.toLocaleDateString()}
                    </p>
                    {item.fileSize && (
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(item.fileSize)}
                      </p>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button className="p-2 hover:bg-secondary rounded-full">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-secondary rounded-full">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {/* Media viewer */}
        {selectedMedia && selectedIndex !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
            {/* Close button */}
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full z-10"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Navigation */}
            {selectedIndex > 0 && (
              <button
                onClick={() => setSelectedIndex(selectedIndex - 1)}
                className="absolute left-4 p-3 text-white hover:bg-white/10 rounded-full"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}
            
            {selectedIndex < mediaItems.length - 1 && (
              <button
                onClick={() => setSelectedIndex(selectedIndex + 1)}
                className="absolute right-4 p-3 text-white hover:bg-white/10 rounded-full"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
            
            {/* Media content */}
            <div className="max-w-[90vw] max-h-[90vh]">
              {selectedMedia.type === 'image' ? (
                <img
                  src={selectedMedia.url}
                  alt=""
                  className="max-w-full max-h-[85vh] object-contain"
                />
              ) : selectedMedia.type === 'video' ? (
                <video
                  src={selectedMedia.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-[85vh]"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-white p-8">
                  <FileText className="w-16 h-16 mb-4" />
                  <p className="text-lg font-medium">{selectedMedia.fileName}</p>
                  <p className="text-sm text-gray-400 mb-4">
                    {selectedMedia.fileSize && formatFileSize(selectedMedia.fileSize)}
                  </p>
                  <a
                    href={selectedMedia.url}
                    download={selectedMedia.fileName}
                    className="flex items-center gap-2 px-4 py-2 bg-primary rounded-lg"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                </div>
              )}
              
              {/* Caption */}
              {selectedMedia.caption && (
                <p className="text-white text-center mt-4 max-w-md mx-auto">
                  {selectedMedia.caption}
                </p>
              )}
              
              {/* Info */}
              <p className="text-gray-400 text-center text-sm mt-2">
                Sent by {selectedMedia.senderName} • {selectedMedia.timestamp.toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Quick media access toolbar
export const MediaQuickAccess: React.FC<{
  messages: any[];
  onOpenGallery: () => void;
  currentUserId: string;
}> = ({ messages, onOpenGallery, currentUserId }) => {
  const mediaCount = messages.filter(m => m.type === 'image' || m.type === 'video').length;
  const docCount = messages.filter(m => m.type === 'file').length;
  
  if (mediaCount === 0 && docCount === 0) return null;
  
  return (
    <div className="flex items-center gap-2 p-2 border-t border-border">
      <button
        onClick={onOpenGallery}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
      >
        <Image className="w-4 h-4" />
        {mediaCount > 0 && <span>Photos ({mediaCount})</span>}
      </button>
      
      {docCount > 0 && (
        <button
          onClick={onOpenGallery}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
        >
          <FileText className="w-4 h-4" />
          <span>Files ({docCount})</span>
        </button>
      )}
      
      <div className="flex-1" />
      
      <button
        onClick={onOpenGallery}
        className="text-primary text-sm hover:underline"
      >
        View all
      </button>
    </div>
  );
};
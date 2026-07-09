import React, { useState, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../avatar';
import { cn } from '@/lib/utils';
import {
  Check,
  CheckCheck,
  FileIcon,
  Download,
  Smile,
  Star,
  Sparkles,
  Reply,
  Forward,
  Copy,
  Image,
  Paperclip,
  Edit2,
  Languages,
  Bookmark,
  BookmarkCheck,
  Clock,
  MessageSquare
} from 'lucide-react';
import { LinkPreviewInline } from './link-preview';
import { ReactionBar } from './reaction-bar';
import { extractCodeBlocks } from './code-block';
import { translateMessage } from '@/lib/ai';
import { TtsButton } from '../tts-button';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  isSelf?: boolean;
  type?: 'text' | 'image' | 'file';
  mediaUrl?: string;
  status?: 'sent' | 'delivered' | 'read';
  isPinned?: boolean;
  reactions?: { emoji: string; userId: string; userName?: string }[];
  isEdited?: boolean;
  isForwarded?: boolean;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
    type?: string;
  };
  caption?: string;
}

interface MessageProps {
  message: Message;
  currentUser: {
    id: string;
    name: string;
    avatar?: string;
  };
  onReaction?: (emoji: string) => void;
  onPin?: () => void;
  onReply?: () => void;
  isReplying?: boolean;
  onForward?: () => void;
  onOpenThread?: () => void;
  onTranslate?: (messageId: string, content: string) => void;
  onSave?: (messageId: string, content: string, senderName: string, roomId: string) => void;
  isSaved?: boolean;
  onRemind?: (messageId: string, content: string, senderName: string) => void;
  readReceipts?: string[];
}

export const Message: React.FC<MessageProps> = ({ message, currentUser, onReaction, onPin, onReply, isReplying, onForward, onOpenThread, onTranslate, onSave, isSaved, onRemind, readReceipts }) => {
  const isSelf = message.senderId === currentUser.id;
  const [showReactions, setShowReactions] = useState(false);
  const [showTranslateMenu, setShowTranslateMenu] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(message.content.length > 400);

  const reactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];
  const isAI = (message.senderName || '').toLowerCase().includes('agent') ||
               (message.senderName || '').toLowerCase().includes('ai') ||
               message.senderName === 'General';

  const handleTranslate = useCallback(async (lang: string) => {
    if (translatedText) {
      setTranslatedText(null);
      return;
    }
    setIsTranslating(true);
    const result = await translateMessage(message.content, lang);
    setTranslatedText(result);
    setIsTranslating(false);
    setShowTranslateMenu(false);
  }, [message.content, translatedText]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = message.content;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }, [message.content]);

  const renderMarkdown = (text: string): React.ReactNode => {
    const elements: React.ReactNode[] = [];
    const lines = text.split('\n');
    let inList = false;
    let listItems: React.ReactNode[] = [];

    lines.forEach((line, li) => {
      // Headers
      if (line.startsWith('### ')) {
        if (inList) { elements.push(<ul key={`ul-${li}`} className="list-disc pl-4 space-y-1 my-1">{listItems}</ul>); listItems = []; inList = false; }
        elements.push(<h3 key={li} className="text-sm font-bold uppercase tracking-wider mt-2 mb-1 text-primary">{renderInline(line.slice(4))}</h3>);
        return;
      }
      if (line.startsWith('## ')) {
        if (inList) { elements.push(<ul key={`ul-${li}`} className="list-disc pl-4 space-y-1 my-1">{listItems}</ul>); listItems = []; inList = false; }
        elements.push(<h2 key={li} className="text-base font-bold uppercase tracking-widest mt-3 mb-1 text-primary">{renderInline(line.slice(3))}</h2>);
        return;
      }
      if (line.startsWith('# ')) {
        if (inList) { elements.push(<ul key={`ul-${li}`} className="list-disc pl-4 space-y-1 my-1">{listItems}</ul>); listItems = []; inList = false; }
        elements.push(<h1 key={li} className="text-lg font-bold uppercase tracking-[0.2em] mt-3 mb-2 text-primary">{renderInline(line.slice(2))}</h1>);
        return;
      }
      // Code block
      if (line.startsWith('```')) {
        if (inList) { elements.push(<ul key={`ul-${li}`} className="list-disc pl-4 space-y-1 my-1">{listItems}</ul>); listItems = []; inList = false; }
        const codeContent: string[] = [];
        let j = li + 1;
        while (j < lines.length && !lines[j].startsWith('```')) { codeContent.push(lines[j]); j++; }
        if (codeContent.length > 0) {
          elements.push(<pre key={`code-${li}`} className="bg-muted/20 border border-border/50 p-3 my-2 text-[11px] font-mono overflow-x-auto"><code>{codeContent.join('\n')}</code></pre>);
        }
        return;
      }
      // Unordered list
      if (line.match(/^[\s]*[-*+]\s/)) {
        inList = true;
        listItems.push(<li key={`li-${li}`} className="text-[12px] leading-relaxed">{renderInline(line.replace(/^[\s]*[-*+]\s/, ''))}</li>);
        return;
      }
      // Ordered list
      if (line.match(/^[\s]*\d+\.\s/)) {
        if (inList) { elements.push(<ul key={`ul-${li}`} className="list-disc pl-4 space-y-1 my-1">{listItems}</ul>); listItems = []; inList = false; }
        elements.push(<div key={`ol-${li}`} className="flex gap-2 text-[12px] leading-relaxed ml-4"><span className="text-primary/60">{line.match(/^[\s]*(\d+)\./)?.[1]}.</span><span>{renderInline(line.replace(/^[\s]*\d+\.\s/, ''))}</span></div>);
        return;
      }
      // Blockquote
      if (line.startsWith('> ')) {
        if (inList) { elements.push(<ul key={`ul-${li}`} className="list-disc pl-4 space-y-1 my-1">{listItems}</ul>); listItems = []; inList = false; }
        elements.push(<blockquote key={`bq-${li}`} className="border-l-2 border-primary/30 pl-3 my-1 text-[11px] italic text-muted-foreground">{renderInline(line.slice(2))}</blockquote>);
        return;
      }
      // Horizontal rule
      if (line.match(/^---+/)) {
        if (inList) { elements.push(<ul key={`ul-${li}`} className="list-disc pl-4 space-y-1 my-1">{listItems}</ul>); listItems = []; inList = false; }
        elements.push(<div key={`hr-${li}`} className="h-px bg-border/50 my-3" />);
        return;
      }
      // Empty line
      if (line.trim() === '') {
        if (inList) { elements.push(<ul key={`ul-${li}`} className="list-disc pl-4 space-y-1 my-1">{listItems}</ul>); listItems = []; inList = false; }
        elements.push(<br key={`br-${li}`} />);
        return;
      }
      // Regular paragraph
      if (inList) { elements.push(<ul key={`ul-${li}`} className="list-disc pl-4 space-y-1 my-1">{listItems}</ul>); listItems = []; inList = false; }
      elements.push(<p key={`p-${li}`} className="text-[13px] leading-relaxed tracking-wider mb-1">{renderInline(line)}</p>);
    });
    if (inList) { elements.push(<ul key="ul-end" className="list-disc pl-4 space-y-1 my-1">{listItems}</ul>); }

    return elements.length > 0 ? <>{elements}</> : text;
  };

  const renderInline = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*\*(.*?)\*\*\*|\*\*(.*?)\*\*|\*(.*?)\*|`(.*?)`|~~(.*?)~~|\[([^\]]+)\]\(([^)]+)\))/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      if (match[2]) { parts.push(<strong key={match.index} className="font-bold"><em>{match[2]}</em></strong>); }
      else if (match[3]) { parts.push(<strong key={match.index} className="font-bold">{match[3]}</strong>); }
      else if (match[4]) { parts.push(<em key={match.index} className="italic">{match[4]}</em>); }
      else if (match[5]) { parts.push(<code key={match.index} className="bg-muted/30 border border-border/50 px-1 py-0.5 text-[11px] font-mono">{match[5]}</code>); }
      else if (match[6]) { parts.push(<del key={match.index} className="line-through opacity-60">{match[6]}</del>); }
      else if (match[7] && match[8]) {
        parts.push(
          <a key={match.index} href={match[8]} target="_blank" rel="noopener noreferrer"
             className="text-primary underline underline-offset-2 hover:opacity-80"
             onClick={(e) => e.stopPropagation()}>
            {match[7]}
          </a>
        );
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    return parts.length > 0 ? <>{parts}</> : text;
  };

  const renderContent = useCallback(() => {
    const { parts } = extractCodeBlocks(message.content);
    if (parts.length === 1 && typeof parts[0] === 'string') {
      return renderMarkdown(parts[0] as string);
    }
    return <>{parts.map((part, i) => typeof part === 'string' ? <span key={i}>{renderMarkdown(part)}</span> : part)}</>;
  }, [message.content]);

  const handleDownload = useCallback(() => {
    if (message.mediaUrl) {
      const a = document.createElement('a');
      a.href = message.mediaUrl;
      a.download = message.content || 'download';
      a.click();
    }
  }, [message.mediaUrl, message.content]);

  const renderReplyPreview = () => {
    if (!message.replyTo) return null;
    return (
      <div
        className="flex items-start gap-2 mb-2 p-2 bg-muted/30 border-l-2 border-primary/50 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-bold text-primary uppercase tracking-wider mb-0.5">
            @{message.replyTo.senderName}
          </p>
          {message.replyTo.type === 'image' ? (
            <div className="flex items-center gap-1.5">
              <Image size={10} className="text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground truncate">Photo</span>
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground truncate">{message.replyTo.content}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn(
      "group flex w-full gap-4 mb-8 font-mono",
      isSelf ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Sender Identifier */}
      <div className="flex flex-col items-center gap-2">
        <Avatar className={cn(
          "h-10 w-10 border rounded-none flex items-center justify-center overflow-hidden transition-all",
          isSelf ? "border-primary/50" : "border-border"
        )}>
          <AvatarImage src={message.senderAvatar} className="grayscale brightness-125" />
          <AvatarFallback className="text-[10px] bg-muted font-bold rounded-none flex items-center justify-center h-full w-full">
            {message.senderName ? message.senderName.substring(0, 1) : 'U'}
          </AvatarFallback>
        </Avatar>
        <div className={cn("h-full w-[1px] bg-border/30 grow")} />
      </div>

      <div className={cn(
        "flex max-w-[85%] flex-col gap-2",
        isSelf ? "items-end" : "items-start"
      )}>
        {/* Metadata Line */}
        <div className="flex items-center gap-3 px-1">
           {isSelf ? (
             <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Operator::Self</span>
           ) : (
             <>
               <span className="text-[9px] font-bold text-foreground uppercase tracking-widest">{message.senderName}</span>
               {isAI && (
                 <span className="text-[8px] font-bold bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 uppercase tracking-tighter flex items-center gap-1">
                   <Sparkles size={8} /> Internal_Node
                 </span>
               )}
             </>
           )}
           {message.isForwarded && (
             <span className="text-[7px] uppercase tracking-widest text-muted-foreground/60 border border-border/30 px-1 py-0.5">
               FWD
             </span>
           )}
           <span
             className="text-[8px] text-muted-foreground uppercase tracking-widest ml-auto opacity-50"
             title={new Date(message.timestamp).toLocaleString([], {
               year: 'numeric', month: 'long', day: 'numeric',
               hour: '2-digit', minute: '2-digit', second: '2-digit'
             })}
           >
             {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
           </span>
        </div>

        {/* Message Node */}
        <div className="relative group/bubble flex items-start gap-3">
          <div className={cn(
            "border p-4 transition-all duration-200 relative min-w-[120px]",
            isSelf
              ? "bg-primary border-primary text-primary-foreground"
              : cn(
                  "bg-muted/30 border-border text-foreground hover:border-primary/40 focus-within:border-primary/40",
                  isAI && "border-primary/20 bg-primary/5"
                ),
            isReplying && "border-l-primary border-l-4"
          )}>
            {/* Action Buttons for Node */}
            <div className={cn(
              "absolute -top-3 flex gap-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity z-10",
              isSelf ? "right-2" : "left-2"
            )}>
              <button
                onClick={() => setShowReactions(!showReactions)}
                className="h-6 px-1.5 bg-background border border-border text-foreground hover:border-primary transition-colors flex items-center gap-1"
              >
                <Smile size={10} />
              </button>
              <button
                onClick={onPin}
                className={cn(
                  "h-6 px-1.5 bg-background border transition-colors flex items-center gap-1",
                  message.isPinned ? "border-primary text-primary" : "border-border text-foreground hover:border-primary"
                )}
              >
                <Star size={10} className={cn(message.isPinned && "fill-primary")} />
              </button>
              <button
                onClick={() => onReply?.()}
                className="h-6 px-1.5 bg-background border border-border text-foreground hover:border-primary transition-colors flex items-center gap-1"
              >
                <Reply size={10} />
              </button>
              {onOpenThread && (
                <button
                  onClick={onOpenThread}
                  className="h-6 px-1.5 bg-background border border-border text-foreground hover:border-primary transition-colors flex items-center gap-1"
                  title="Open thread"
                >
                  <MessageSquare size={10} />
                </button>
              )}
              <button
                onClick={() => onForward?.()}
                className="h-6 px-1.5 bg-background border border-border text-foreground hover:border-primary transition-colors flex items-center gap-1"
              >
                <Forward size={10} />
              </button>
              <button
                onClick={() => onSave?.(message.id, message.content, message.senderName, '')}
                className={cn(
                  "h-6 px-1.5 bg-background border transition-colors flex items-center gap-1",
                  isSaved ? "border-primary text-primary" : "border-border text-foreground hover:border-primary"
                )}
              >
                {isSaved ? <BookmarkCheck size={10} /> : <Bookmark size={10} />}
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowTranslateMenu(!showTranslateMenu)}
                  className="h-6 px-1.5 bg-background border border-border text-foreground hover:border-primary transition-colors flex items-center gap-1"
                >
                  <Languages size={10} />
                </button>
                {showTranslateMenu && (
                  <div className={cn(
                    "absolute top-full mt-1 bg-background border border-border shadow-lg z-50 py-1 min-w-[120px]",
                    isSelf ? "right-0" : "left-0"
                  )}>
                    {['en', 'es', 'fr', 'de', 'ja', 'zh', 'ar', 'pt'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => { handleTranslate(lang); setShowTranslateMenu(false); }}
                        className="w-full text-left px-3 py-1.5 text-[9px] uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
                      >
                        {lang === 'en' ? 'English' : lang === 'es' ? 'Spanish' : lang === 'fr' ? 'French' : lang === 'de' ? 'German' : lang === 'ja' ? 'Japanese' : lang === 'zh' ? 'Chinese' : lang === 'ar' ? 'Arabic' : 'Portuguese'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => onRemind?.(message.id, message.content, message.senderName)}
                className="h-6 px-1.5 bg-background border border-border text-foreground hover:border-primary transition-colors flex items-center gap-1"
              >
                <Clock size={10} />
              </button>
              <TtsButton text={message.content} />
              <button
                onClick={handleCopy}
                className="h-6 px-1.5 bg-background border border-border text-foreground hover:border-primary transition-colors flex items-center gap-1"
              >
                <Copy size={10} />
              </button>
            </div>

            {/* Reply Preview */}
            {renderReplyPreview()}

            {/* Image Type */}
            {message.type === 'image' && message.mediaUrl ? (
              <div className="border border-border/20 mb-2 overflow-hidden group/img relative bg-black/20">
                <img
                  src={message.mediaUrl}
                  alt={message.caption || "Shared Node Data"}
                  className="max-w-full h-auto max-h-[350px] object-cover grayscale brightness-110 contrast-125 cursor-pointer"
                  onClick={handleDownload}
                />
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover/img:opacity-100 transition-opacity" />
                {message.caption && (
                  <div className="p-3 bg-black/40 backdrop-blur-sm">
                    <p className="text-white text-[11px] leading-relaxed">{message.caption}</p>
                  </div>
                )}
              </div>
            ) : message.type === 'file' && message.mediaUrl ? (
              <div className={cn(
                "flex items-center gap-4 p-3 mb-2 border transition-colors cursor-pointer group/file",
                isSelf ? "bg-white/10 border-white/20" : "bg-background border-border hover:border-primary/40"
              )}>
                <div className="h-9 w-9 border border-border/50 flex items-center justify-center">
                   <FileIcon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-[11px] font-bold truncate uppercase tracking-widest">{message.content || 'persistence_file.bin'}</p>
                   <p className="text-[8px] uppercase tracking-widest opacity-60 mt-1">DATA_NODE</p>
                </div>
                <Download size={12} className="opacity-40 group-hover/file:opacity-100 transition-opacity" onClick={handleDownload} />
              </div>
            ) : (
              <>
                <p className={cn(
                  "text-[13px] leading-relaxed tracking-wider whitespace-pre-wrap break-words",
                  isSelf ? "font-medium text-primary-foreground" : "text-foreground",
                  isCollapsed && "line-clamp-6"
                )}>
                  {renderContent()}
                </p>
                {message.content.length > 400 && (
                  <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={cn(
                      "text-[8px] uppercase tracking-widest mt-1 font-bold transition-colors",
                      isSelf ? "text-primary-foreground/70 hover:text-primary-foreground" : "text-muted-foreground hover:text-primary"
                    )}
                  >
                    {isCollapsed ? 'Show more ▾' : 'Show less ▴'}
                  </button>
                )}
                {translatedText && (
                  <div className="mt-2 pt-2 border-t border-primary/20">
                    <p className="text-[10px] leading-relaxed tracking-wider text-primary/80 italic">
                      {translatedText}
                    </p>
                    <button
                      onClick={() => setTranslatedText(null)}
                      className="text-[7px] uppercase tracking-widest text-muted-foreground hover:text-primary mt-1"
                    >
                      Show original
                    </button>
                  </div>
                )}
                {isTranslating && (
                  <p className="text-[9px] text-primary animate-pulse mt-1">Translating...</p>
                )}
                {/* Link Preview */}
                <LinkPreviewInline text={message.content} />
              </>
            )}

            {/* Status Line */}
            <div className={cn(
              "flex items-center gap-2 mt-3",
              isSelf ? "justify-end" : "justify-start"
            )}>
              {message.isEdited && (
                <span className="text-[7px] uppercase tracking-widest text-muted-foreground/50">Edited</span>
              )}
              <div className={cn(
                "flex items-center gap-2 opacity-40",
                isSelf ? "text-primary-foreground" : "text-muted-foreground"
              )}>
                <span className="text-[8px] uppercase tracking-widest">
                  {message.id?.toString().substring(0, 8) || 'UNKNOWN'}
                </span>
                {isSelf && (
                  <div className="flex items-center gap-1">
                    {readReceipts && readReceipts.length > 0 ? (
                      <div className="flex items-center gap-1" title={`Read by ${readReceipts.length} ${readReceipts.length === 1 ? 'person' : 'people'}`}>
                        <CheckCheck size={10} className="text-blue-400" />
                        <span className="text-[6px] text-blue-400/70">{readReceipts.length}</span>
                      </div>
                    ) : message.status === 'read' ? (
                      <CheckCheck size={10} />
                    ) : message.status === 'delivered' ? (
                      <CheckCheck size={10} className="opacity-70" />
                    ) : (
                      <Check size={10} />
                    )}
                  </div>
                )}
              </div>
            </div>

            <ReactionBar onReact={(emoji) => { onReaction?.(emoji); setShowReactions(false); }} isSelf={isSelf} show={showReactions} />

            {/* Display Subscript Reactions */}
            {message.reactions && message.reactions.length > 0 && (
              <div className={cn(
                "absolute -bottom-3 flex gap-1 z-10",
                isSelf ? "right-2" : "left-2"
              )}>
                {Array.from(new Set(message.reactions.map(r => r.emoji))).map(emoji => {
                   const count = message.reactions!.filter(r => r.emoji === emoji).length;
                   return (
                     <div key={emoji} className="flex items-center gap-1 bg-background border border-border px-1.5 py-0.5 text-[10px] shadow-sm">
                       <span>{emoji}</span>
                       {count > 1 && <span className="font-bold opacity-70">{count}</span>}
                     </div>
                   );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

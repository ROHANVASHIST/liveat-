import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ExternalLink, Globe, Image } from 'lucide-react';

interface LinkPreviewData {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  siteName?: string;
}

interface LinkPreviewProps {
  url: string;
  className?: string;
  compact?: boolean;
  onFetch?: (url: string) => Promise<LinkPreviewData | null>;
}

const URL_REGEX = /(https?:\/\/[^\s<]+[^\s<.,;:!?)}\]'"])/g;

export const extractUrls = (text: string): string[] => {
  return text.match(URL_REGEX) || [];
};

export const LinkPreview: React.FC<LinkPreviewProps> = ({
  url,
  className,
  compact = false,
  onFetch,
}) => {
  const [preview, setPreview] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) return;

    const cached = sessionStorage.getItem(`link-preview:${url}`);
    if (cached) {
      try {
        setPreview(JSON.parse(cached));
        return;
      } catch {}
    }

    if (onFetch) {
      setLoading(true);
      setError(false);
      onFetch(url).then(data => {
        if (data) {
          setPreview(data);
          try { sessionStorage.setItem(`link-preview:${url}`, JSON.stringify(data)); } catch {}
        } else {
          setError(true);
        }
      }).catch(() => setError(true)).finally(() => setLoading(false));
    } else {
      // Client-side fallback: try to fetch basic metadata via open graph
      setLoading(true);
      fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`)
        .then(res => res.json())
        .then(data => {
          if (data?.data) {
            const p: LinkPreviewData = {
              url,
              title: data.data.title || '',
              description: data.data.description || '',
              image: data.data.image?.url,
              favicon: data.data.logo?.url,
              siteName: data.data.publisher || data.data.author || new URL(url).hostname,
            };
            setPreview(p);
            try { sessionStorage.setItem(`link-preview:${url}`, JSON.stringify(p)); } catch {}
          } else {
            setError(true);
          }
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    }
  }, [url]);

  if (loading) {
    return (
      <div className={cn("flex items-center gap-3 p-3 border border-border/50 bg-muted/10 animate-pulse", className)}>
        <div className="h-10 w-10 bg-muted/30 flex items-center justify-center">
          <Globe size={16} className="text-muted-foreground/50" />
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-muted/30 rounded w-3/4" />
          <div className="h-2 bg-muted/20 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (error || !preview) return null;

  if (compact && preview.title) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center gap-1.5 text-primary underline underline-offset-2 decoration-primary/30 hover:decoration-primary transition-all",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {preview.favicon && (
          <img src={preview.favicon} alt="" className="w-3.5 h-3.5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        )}
        <span className="text-[11px] font-medium truncate max-w-[200px]">{preview.title || url}</span>
        <ExternalLink size={10} className="shrink-0" />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "block border border-border/50 overflow-hidden hover:border-primary/30 transition-all group mt-2",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {preview.image && (
        <div className="relative h-32 bg-black/20 overflow-hidden">
          <img
            src={preview.image}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}
      <div className="p-3">
        {preview.siteName && (
          <p className="text-[8px] uppercase tracking-widest text-muted-foreground mb-1">{preview.siteName}</p>
        )}
        {preview.title && (
          <p className="text-[12px] font-bold text-foreground leading-tight mb-1 line-clamp-2">{preview.title}</p>
        )}
        {preview.description && (
          <p className="text-[10px] text-muted-foreground line-clamp-2">{preview.description}</p>
        )}
        <p className="text-[8px] text-muted-foreground/50 truncate mt-1 font-mono">{url}</p>
      </div>
    </a>
  );
};

export const LinkPreviewInline: React.FC<{
  text: string;
  className?: string;
  onFetch?: (url: string) => Promise<LinkPreviewData | null>;
}> = ({ text, className, onFetch }) => {
  const urls = extractUrls(text);
  if (urls.length === 0) return null;

  return (
    <>
      {urls.slice(0, 2).map((url, i) => (
        <LinkPreview key={i} url={url} className={className} onFetch={onFetch} />
      ))}
    </>
  );
};

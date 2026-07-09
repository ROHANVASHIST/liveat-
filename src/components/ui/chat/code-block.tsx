import React from 'react';
import { cn } from '@/lib/utils';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, className }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <div className={cn("relative group my-2 border border-border/50 bg-black/40", className)}>
      <div className="flex items-center justify-between px-4 py-1.5 bg-muted/20 border-b border-border/30">
        <span className="text-[8px] uppercase tracking-widest text-muted-foreground font-mono">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[8px] uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
        >
          {copied ? <Check size={10} /> : <Copy size={10} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-[11px] leading-relaxed font-mono text-foreground/90 whitespace-pre-wrap">
          {code}
        </code>
      </pre>
    </div>
  );
};

export function extractCodeBlocks(text: string): { blocks: { code: string; language: string }[]; parts: React.ReactNode[] } {
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  const blocks: { code: string; language: string }[] = [];
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const language = match[1] || 'plaintext';
    const code = match[2].trim();
    blocks.push({ code, language });
    parts.push(<CodeBlock key={blocks.length - 1} code={code} language={language} />);
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  if (blocks.length === 0) {
    parts.push(text);
  }

  return { blocks, parts };
}

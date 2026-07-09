import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Languages, X, ArrowRightLeft, Loader2 } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'ja', label: 'Japanese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ar', label: 'Arabic' },
  { code: 'pt', label: 'Portuguese' },
];

interface TranslationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onTranslate: (text: string, from: string, to: string) => Promise<string>;
  currentText?: string;
}

export const TranslationPanel: React.FC<TranslationPanelProps> = ({
  isOpen,
  onClose,
  onTranslate,
  currentText = '',
}) => {
  const [fromLang, setFromLang] = useState('en');
  const [toLang, setToLang] = useState('es');
  const [result, setResult] = useState('');
  const [translating, setTranslating] = useState(false);

  const handleTranslate = async () => {
    if (!currentText.trim()) return;
    setTranslating(true);
    try {
      const translated = await onTranslate(currentText, fromLang, toLang);
      setResult(translated);
    } catch {
      setResult('Translation failed');
    } finally {
      setTranslating(false);
    }
  };

  const swapLanguages = () => {
    setFromLang(toLang);
    setToLang(fromLang);
    setResult('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[400px] max-w-[90vw] border border-border bg-background shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Languages size={14} className="text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Translate</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-[8px] uppercase tracking-widest text-muted-foreground block mb-1.5">From</label>
              <select
                value={fromLang}
                onChange={(e) => { setFromLang(e.target.value); setResult(''); }}
                className="w-full h-10 bg-background border border-border px-3 text-[10px] uppercase tracking-widest outline-none focus:border-primary cursor-pointer"
              >
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={swapLanguages}
              className="mt-5 h-8 w-8 flex items-center justify-center border border-border hover:border-primary/40 text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowRightLeft size={12} />
            </button>

            <div className="flex-1">
              <label className="text-[8px] uppercase tracking-widest text-muted-foreground block mb-1.5">To</label>
              <select
                value={toLang}
                onChange={(e) => { setToLang(e.target.value); setResult(''); }}
                className="w-full h-10 bg-background border border-border px-3 text-[10px] uppercase tracking-widest outline-none focus:border-primary cursor-pointer"
              >
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>

          {currentText && (
            <div className="p-3 border border-border bg-muted/10">
              <span className="text-[8px] uppercase tracking-widest text-muted-foreground block mb-1">Original</span>
              <p className="text-[11px] text-foreground leading-relaxed">{currentText}</p>
            </div>
          )}

          <button
            onClick={handleTranslate}
            disabled={!currentText.trim() || translating}
            className={cn(
              "w-full h-10 flex items-center justify-center gap-2 text-[9px] uppercase tracking-widest font-bold border transition-all",
              translating
                ? "border-primary/20 text-muted-foreground"
                : "border-primary/30 text-primary hover:bg-primary/5"
            )}
          >
            {translating ? (
              <><Loader2 size={12} className="animate-spin" /> Translating...</>
            ) : (
              <><Languages size={12} /> Translate</>
            )}
          </button>

          {result && (
            <div className="p-3 border border-primary/20 bg-primary/5">
              <span className="text-[8px] uppercase tracking-widest text-primary block mb-1">
                {LANGUAGES.find(l => l.code === toLang)?.label || toLang}
              </span>
              <p className="text-[11px] text-foreground leading-relaxed">{result}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

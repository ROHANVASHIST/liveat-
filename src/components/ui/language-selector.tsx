import React from 'react';
import { cn } from '@/lib/utils';
import { Languages, Check, X } from 'lucide-react';
import { useI18n, Language } from '@/lib/i18n';

const LANGUAGES: { code: Language; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'de', label: 'German', native: 'Deutsch' },
  { code: 'ja', label: 'Japanese', native: '日本語' },
  { code: 'zh', label: 'Chinese', native: '中文' },
  { code: 'ar', label: 'Arabic', native: 'العربية' },
  { code: 'pt', label: 'Portuguese', native: 'Português' },
];

interface LanguageSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ isOpen, onClose }) => {
  const { language, setLanguage } = useI18n();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-72 border border-border bg-background shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Languages size={14} className="text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Interface Language</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="p-3 space-y-1">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { setLanguage(lang.code); onClose(); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 border transition-all text-[10px] uppercase tracking-widest",
                language === lang.code
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/20"
              )}
            >
              <span className="flex-1 text-left">
                <span className="block">{lang.native}</span>
                <span className="text-[7px] text-muted-foreground tracking-wider opacity-60">{lang.label}</span>
              </span>
              {language === lang.code && <Check size={10} className="text-primary" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
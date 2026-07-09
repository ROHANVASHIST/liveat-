import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TtsButtonProps {
  text: string;
  lang?: string;
  disabled?: boolean;
  className?: string;
}

export const TtsButton: React.FC<TtsButtonProps> = ({
  text,
  lang = 'en',
  disabled = false,
  className,
}) => {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSpeechAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const handleClick = useCallback(() => {
    if (!isSpeechAvailable || !text.trim()) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }, [text, lang, speaking, isSpeechAvailable]);

  useEffect(() => {
    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isSpeechAvailable) return null;

  return (
    <button
      onClick={handleClick}
      disabled={disabled || !text.trim()}
      title={speaking ? 'Stop speaking' : 'Read aloud'}
      className={cn(
        'h-6 w-6 flex items-center justify-center border transition-all',
        speaking
          ? 'border-primary bg-primary/20 text-primary animate-tech-pulse'
          : 'border-border text-muted-foreground hover:border-primary/50 hover:text-primary',
        disabled && 'opacity-30 cursor-not-allowed',
        className
      )}
    >
      {speaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
    </button>
  );
};

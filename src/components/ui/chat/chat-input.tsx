import React from 'react';
import { Button } from '../button';
import { cn } from '@/lib/utils';
import { 
  SendHorizontal, 
  Mic, 
  Plus,
  Wand,
  Terminal,
  Activity
} from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  onFileSelect?: (file: File) => void;
  onPolish?: () => void;
  isPolishing?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  isLoading,
  disabled,
  onFileSelect,
  onPolish,
  isPolishing,
}) => {
  const [isRecording, setIsRecording] = React.useState(false);
  const recognitionRef = React.useRef<any>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect?.(e.target.files[0]);
    }
  };

  const startSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('speechRecognition' in window)) {
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).speechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');
      onChange(transcript);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
  };

  return (
    <div className="p-4 md:p-6 bg-background border-t border-border mt-auto font-mono">
      <div className="max-w-5xl mx-auto flex items-end gap-3 p-1.5 border border-border bg-muted/10 group focus-within:border-primary/40 transition-all">
        <div className="flex items-center gap-1">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileChange}
            />
            <label
              htmlFor="file-upload"
              className="h-10 w-10 flex items-center justify-center cursor-pointer text-muted-foreground hover:text-primary transition-colors border border-transparent hover:border-border"
            >
              <Plus size={18} />
            </label>
        </div>

        <div className="flex-1 min-w-0 pb-1.5">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? "ANALYZING_VOICE..." : "CMD >_"}
            rows={1}
            disabled={disabled || isLoading}
            className={cn(
              "w-full bg-transparent border-none focus:ring-0 resize-none py-2 text-[13px] tracking-widest max-h-48 min-h-[40px] transition-all outline-none",
              isRecording ? "text-primary animate-pulse" : "text-foreground placeholder:text-muted-foreground/30"
            )}
            style={{ height: 'auto' }}
          />
        </div>

        <div className="flex items-center gap-1.5 pb-1">
            <button 
              onClick={startSpeechRecognition}
              className={cn(
                "h-10 w-10 flex items-center justify-center transition-all border",
                isRecording ? "text-primary border-primary bg-primary/10" : "text-muted-foreground border-transparent hover:border-border"
              )}
            >
              <Mic size={16} className={cn(isRecording && "animate-pulse")} />
            </button>
            {onPolish && (
              <button 
                onClick={onPolish}
                disabled={!value.trim() || isPolishing || isLoading}
                className={cn(
                  "h-10 w-10 flex items-center justify-center transition-all border",
                  isPolishing ? "text-primary border-primary bg-primary/10" : "text-muted-foreground border-transparent hover:border-border disabled:opacity-20"
                )}
              >
                <Wand size={16} className={cn(isPolishing && "animate-spin")} />
              </button>
            )}
            <button
              onClick={onSend}
              disabled={(!value.trim() && !isLoading) || disabled}
              className={cn(
                "tech-btn h-10 px-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest",
                !value.trim() && "opacity-20 grayscale pointer-events-none"
              )}
            >
              <span className="hidden sm:inline">Execute</span>
              <SendHorizontal size={14} />
            </button>
        </div>
      </div>
      <div className="max-w-5xl mx-auto flex justify-between mt-2 opacity-50 px-2">
         <span className="text-[8px] uppercase tracking-[0.2em] text-muted-foreground">Encryption: AES-256-GCM</span>
         <span className="text-[8px] uppercase tracking-[0.2em] text-muted-foreground">Buffer State: {value.length}/4096</span>
      </div>
    </div>
  );
};


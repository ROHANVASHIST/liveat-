import React from 'react';
import { Button } from '../button';
import { Input } from '../input';
import { cn } from '@/lib/utils';
import { 
  SendHorizontal, 
  Paperclip, 
  Smile, 
  Mic, 
  Plus,
  Image as ImageIcon
} from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  onFileSelect?: (file: File) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  isLoading,
  placeholder = 'Type a message...',
  disabled,
  onFileSelect,
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
      alert('Speech recognition is not supported in this browser.');
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

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');
      
      onChange(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  return (
    <div className="p-4 md:p-6 bg-gradient-to-t from-background to-transparent sticky bottom-0 z-30">
      <div className="max-w-5xl mx-auto flex items-end gap-3 p-2 bg-card/50 backdrop-blur-3xl border border-white/5 rounded-[2rem] shadow-2xl group focus-within:border-primary/30 transition-all duration-500">
        <div className="flex items-center">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileChange}
            />
            <label
              htmlFor="file-upload"
              className="h-10 w-10 flex items-center justify-center cursor-pointer text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-full transition-all active:scale-95"
            >
              <Plus className="h-5 w-5" />
            </label>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onChange(value + ' 😊')}
              className="text-slate-400 hover:text-blue-600 rounded-full hidden sm:flex"
            >
              <Smile className="h-5 w-5" />
            </Button>
        </div>

        <div className="flex-1 pb-1">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? "Listening..." : placeholder}
            rows={1}
            disabled={disabled || isLoading}
            className={cn(
              "w-full bg-transparent border-none focus:ring-0 resize-none py-2 text-sm md:text-base max-h-32 min-h-[40px] transition-all outline-none",
              isRecording ? "text-blue-600 font-medium italic" : "text-slate-900 placeholder:text-slate-300"
            )}
            style={{ height: 'auto' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
            }}
          />
        </div>

        <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={startSpeechRecognition}
              className={cn(
                "h-10 w-10 rounded-full transition-all active:scale-90",
                isRecording ? "text-red-500 bg-red-50 animate-pulse" : "text-slate-400 hover:text-blue-600 hover:bg-slate-50"
              )}
            >
              <Mic className={cn("h-5 w-5", isRecording && "fill-red-500")} />
            </Button>
            <Button
              onClick={onSend}
              disabled={(!value.trim() && !isLoading) || disabled}
              className={cn(
                "h-12 w-12 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 transition-all duration-300",
                value.trim() ? "scale-100 opacity-100" : "scale-90 opacity-40 shadow-none grayscale"
              )}
            >
              <SendHorizontal className="h-6 w-6 ml-0.5" />
            </Button>
        </div>
      </div>
      <p className="text-center text-[10px] text-muted-foreground/30 mt-3 font-bold uppercase tracking-widest">
        Enterprise Secure • End-to-End Encrypted
      </p>
    </div>
  );
};


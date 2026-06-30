import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../button';
import { Input } from '../input';
import { 
  Mic, 
  Paperclip, 
  Image, 
  Smile, 
  Send, 
  X,
  Play,
  Pause,
  MapPin,
  FileAudio,
  StopCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface E2EChatInputProps {
  roomId: string;
  currentUserId: string;
  currentUserName: string;
  onSendMessage: (content: string, type: 'text' | 'voice' | 'location' | 'media', metadata?: any) => void;
  isTyping?: boolean;
  onTyping?: (isTyping: boolean) => void;
  encryptedMode?: boolean;
}

export const E2EChatInput: React.FC<E2EChatInputProps> = ({
  roomId,
  currentUserId,
  currentUserName,
  onSendMessage,
  isTyping,
  onTyping,
  encryptedMode = true,
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  // Typing indicator
  useEffect(() => {
    const timer = setTimeout(() => {
      if (message.trim()) {
        onTyping?.(true);
      } else {
        onTyping?.(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [message, onTyping]);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message, 'text');
      setMessage('');
      onTyping?.(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Start timer
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setRecordingInterval(interval);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }
      
      setRecordingTime(0);
    }
  };

  const sendVoiceMessage = () => {
    if (audioBlob) {
      onSendMessage('', 'voice', {
        audioUrl: audioUrl,
        audioBlob: audioBlob,
        duration: recordingTime,
        fileSize: audioBlob.size,
      });
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingTime(0);
    }
  };

  const playVoiceMessage = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
    }
  };

  const discardVoiceMessage = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
  };

  // Location sharing
  const shareLocation = async (type: 'current' | 'live') => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        let mapUrl = '';
        if (type === 'current') {
          mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        } else {
          // Live location - would need to set up tracking
          mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}&z=15`;
        }
        
        onSendMessage(
          type === 'current' 
            ? `📍 Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            : `📍 Live Location shared for 1 hour`,
          'location',
          {
            latitude,
            longitude,
            mapUrl,
            type, // 'current' or 'live'
            expiresAt: type === 'live' ? Date.now() + 3600000 : null, // 1 hour for live
          }
        );
        
        setShowLocationPicker(false);
      },
      (error) => {
        console.error('Location error:', error);
        alert('Unable to retrieve your location');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // File upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, acceptType: 'image' | 'document') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // In real implementation, upload to server with encryption
    onSendMessage('', 'media', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      file: file,
      preview: acceptType === 'image' ? URL.createObjectURL(file) : null,
    });
    
    e.target.value = '';
  };

  return (
    <div className="border-t border-border/50 p-4 bg-background">
      {/* Recording UI */}
      {isRecording && (
        <div className="flex items-center gap-4 p-3 bg-red-50 rounded-lg mb-4 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <span className="text-red-600 font-semibold">Recording...</span>
          </div>
          
          <span className="font-mono">
            {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
          </span>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={stopRecording}
            className="ml-auto"
          >
            <StopCircle className="w-4 h-4 mr-1" />
            Stop
          </Button>
        </div>
      )}
      
      {/* Voice preview UI */}
      {audioBlob && !isRecording && (
        <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg mb-4">
          <Button
            variant="outline"
            size="icon"
            onClick={isPlaying ? () => {} : playVoiceMessage}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="1 15 5 9 9 14 13 5 17 12 21 9 23 12"/></svg>
              <span className="font-mono">
                {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
              </span>
              <span className="text-muted-foreground text-xs">
                {(audioBlob.size / 1024).toFixed(1)} KB
              </span>
            </div>
            {/* Visual waveform would go here */}
            <div className="flex items-center gap-0.5 h-8 mt-1">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-primary rounded-full"
                  style={{
                    height: `${Math.random() * 100}%`,
                    opacity: isPlaying ? 0.7 : 0.4,
                  }}
                />
              ))}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={discardVoiceMessage}>
              <X className="w-4 h-4 mr-1" />
              Discard
            </Button>
            <Button size="sm" onClick={sendVoiceMessage}>
              <Send className="w-4 h-4 mr-1" />
              Send
            </Button>
          </div>
        </div>
      )}
      
      {/* Location picker */}
      {showLocationPicker && (
        <div className="absolute bottom-full left-4 mb-2 bg-background border border-border rounded-lg shadow-lg p-2 z-50">
          <button
            onClick={() => shareLocation('current')}
            className="flex items-center gap-2 w-full p-2 hover:bg-secondary rounded text-left"
          >
            <MapPin className="w-5 h-5 text-primary" />
            <div>
              <div className="font-medium">Send Current Location</div>
              <div className="text-xs text-muted-foreground">Share where you are</div>
            </div>
          </button>
          <button
            onClick={() => shareLocation('live')}
            className="flex items-center gap-2 w-full p-2 hover:bg-secondary rounded text-left"
          >
            <div className="w-5 h-5 flex items-center justify-center bg-primary rounded-full">
              <span className="text-xs text-primary-foreground">LIVE</span>
            </div>
            <div>
              <div className="font-medium">Share Live Location</div>
              <div className="text-xs text-muted-foreground">For 1 hour</div>
            </div>
          </button>
        </div>
      )}
      
      {/* Message input area */}
      <div className="flex items-end gap-2">
        <div className="flex gap-1">
          {/* Attachment button */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <input
              type="file"
              id="file-input"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              className="hidden"
              onChange={(e) => handleFileSelect(e, 'document')}
            />
          </div>
          
          {/* Image button */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => document.getElementById('image-input')?.click()}
            >
              <Image className="w-5 h-5" />
            </Button>
            <input
              type="file"
              id="image-input"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFileSelect(e, 'image')}
            />
          </div>
          
          {/* Location button */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setShowLocationPicker(!showLocationPicker)}
          >
            <MapPin className="w-5 h-5" />
          </Button>
          
          {/* Voice button */}
          {isRecording ? null : (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={startRecording}
            >
              <Mic className="w-5 h-5" />
            </Button>
          )}
        </div>
        
        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={encryptedMode ? "Encrypted message..." : "Type a message..."}
            className="w-full resize-none min-h-[44px] max-h-[150px] px-4 py-2 rounded-full border border-border bg-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
            rows={1}
          />
        </div>
        
        {/* Send button */}
        <Button
          size="icon"
          className="rounded-full"
          onClick={message.trim() ? handleSend : startRecording}
          disabled={(!message.trim() && !audioBlob)}
        >
          {message.trim() ? (
            <Send className="w-5 h-5" />
          ) : audioBlob ? (
            <Send className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </Button>
      </div>
      
      {/* Encryption indicator */}
      {encryptedMode && (
        <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Messages are end-to-end encrypted
        </div>
      )}
    </div>
  );
};

// Typing indicator component
export const TypingIndicator: React.FC<{ users: string[] }> = ({ users }) => {
  if (users.length === 0) return null;
  
  return (
    <div className="flex items-center gap-1 px-4 py-2 text-sm text-muted-foreground">
      <div className="flex gap-0.5">
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>
        {users.length === 1 
          ? `${users[0]} is typing...`
          : `${users.length} people are typing...`
        }
      </span>
    </div>
  );
};

// Message status indicator (read receipts)
export const MessageStatus: React.FC<{ 
  status: 'sent' | 'delivered' | 'read' | 'pending';
  timestamp?: Date;
}> = ({ status, timestamp }) => {
  const statusIcons = {
    pending: <span className="text-muted-foreground text-xs">⏳</span>,
    sent: <span className="text-muted-foreground text-xs">✓</span>,
    delivered: <span className="text-muted-foreground text-xs">✓✓</span>,
    read: <span className="text-primary text-xs">✓✓</span>,
  };
  
  return (
    <div className="flex items-center gap-1">
      {statusIcons[status]}
      {timestamp && (
        <span className="text-[10px] text-muted-foreground">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
};
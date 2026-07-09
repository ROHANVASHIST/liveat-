import React from 'react';
import { cn } from '@/lib/utils';

interface MessageEffectsProps {
  effect: 'rainbow' | 'fire' | 'glitch' | 'none' | null;
  children: React.ReactNode;
  className?: string;
}

const styles = `
@keyframes msg-rainbow {
  0% { color: #ff0000; }
  16% { color: #ff8800; }
  33% { color: #ffff00; }
  50% { color: #00ff00; }
  66% { color: #0088ff; }
  83% { color: #8800ff; }
  100% { color: #ff0000; }
}
@keyframes msg-fire {
  0% { color: #ff4500; text-shadow: 0 0 4px #ff450080; }
  50% { color: #ff6600; text-shadow: 0 0 8px #ff660080; }
  100% { color: #ff4500; text-shadow: 0 0 4px #ff450080; }
}
@keyframes msg-glitch {
  0% { transform: skew(0deg, 0deg); opacity: 1; }
  20% { transform: skew(-2deg, 1deg); opacity: 0.9; }
  40% { transform: skew(2deg, -1deg); opacity: 1; }
  60% { transform: skew(-1deg, 2deg); opacity: 0.95; }
  80% { transform: skew(1deg, -2deg); opacity: 1; }
  100% { transform: skew(0deg, 0deg); opacity: 1; }
}
`;

export const MessageEffects: React.FC<MessageEffectsProps> = ({ effect, children, className }) => {
  if (!effect || effect === 'none') {
    return <>{children}</>;
  }

  const effectClass = effect === 'rainbow' ? 'animate-msg-rainbow' :
    effect === 'fire' ? 'animate-msg-fire' :
    effect === 'glitch' ? 'inline-block animate-msg-glitch' : '';

  return (
    <>
      <style>{styles}</style>
      <span className={cn(effectClass, className)} style={
        effect === 'rainbow' ? { animation: 'msg-rainbow 3s linear infinite' } as React.CSSProperties :
        effect === 'fire' ? { animation: 'msg-fire 1.5s ease-in-out infinite' } as React.CSSProperties :
        effect === 'glitch' ? { animation: 'msg-glitch 0.5s ease-in-out infinite' } as React.CSSProperties :
        undefined
      }>
        {children}
      </span>
    </>
  );
};

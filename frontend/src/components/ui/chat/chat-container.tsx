import React from 'react';
import { ScrollArea } from '../scroll-area';

interface ChatContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  children,
  className,
}) => {
  return (
    <ScrollArea className={`flex-1 p-4 ${className || ''}`}>
      <div className="space-y-4 pb-4">
        {children}
      </div>
    </ScrollArea>
  );
};

import React from 'react';
import { cn } from '@/lib/utils';

interface AppIconProps {
  className?: string;
  size?: number;
}

export const AppIcon: React.FC<AppIconProps> = ({ className, size = 40 }) => {
  return (
    <div 
      className={cn("relative flex items-center justify-center overflow-hidden", className)} 
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-primary via-accent to-primary animate-gradient-xy opacity-20 rounded-xl" />
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-2/3 h-2/3 text-primary relative z-10 drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M8 9h8" className="opacity-40" />
        <path d="M8 13h5" className="opacity-40" />
      </svg>
      <div className="absolute -top-1 -right-1 w-1/3 h-1/3 bg-accent rounded-full border-2 border-background z-20 shadow-sm" />
    </div>
  );
};

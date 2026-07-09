import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  rounded?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  className,
  rounded = true,
}) => (
  <div
    className={cn(
      'animate-pulse bg-muted/30',
      rounded ? 'rounded' : 'rounded-none',
      className
    )}
    style={{ width, height }}
  />
);

export const MessageSkeleton: React.FC<{ isSelf?: boolean }> = ({ isSelf = false }) => (
  <div className={cn(
    'flex items-start gap-3 p-4',
    isSelf && 'flex-row-reverse'
  )}>
    <Skeleton width={32} height={32} rounded className="rounded-full shrink-0" />
    <div className={cn('flex flex-col gap-2 flex-1', isSelf && 'items-end')}>
      <Skeleton width={120} height={10} />
      <Skeleton width="100%" height={10} />
      <Skeleton width="75%" height={10} />
      <Skeleton width={60} height={8} />
    </div>
  </div>
);

export const ChatListSkeleton: React.FC = () => (
  <div className="space-y-1 p-3">
    {[1, 2, 3, 4, 5].map(i => (
      <div key={i} className="flex items-center gap-3 p-3">
        <Skeleton width={32} height={32} rounded className="rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton width={`${60 + Math.random() * 30}%`} height={10} />
          <Skeleton width={`${40 + Math.random() * 40}%`} height={8} />
        </div>
      </div>
    ))}
  </div>
);

import React from 'react';
import { cn } from '../../lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  minRows?: number;
  maxRows?: number;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  minRows = 3,
  maxRows = 10,
  className,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          'block w-full rounded-lg border-gray-300 py-2 px-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm resize-none',
          error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
          className
        )}
        rows={minRows}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

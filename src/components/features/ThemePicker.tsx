import React, { useState } from 'react';

export const ThemePicker: React.FC<{ onThemeChange: (theme: any) => void }> = ({ onThemeChange }) => {
  const themes = [
    { name: 'Light', colors: { bg: '#ffffff', text: '#1f2937', primary: '#3b82f6' } },
    { name: 'Dark', colors: { bg: '#1f2937', text: '#ffffff', primary: '#60a5fa' } },
    { name: 'Ocean', colors: { bg: '#0f172a', text: '#e2e8f0', primary: '#06b6d4' } },
    { name: 'Forest', colors: { bg: '#f0fdf4', text: '#166534', primary: '#22c55e' } },
    { name: 'Sunset', colors: { bg: '#fef2f2', text: '#991b1b', primary: '#f97316' } },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
      {themes.map(theme => (
        <button key={theme.name} onClick={() => onThemeChange(theme.colors)}
          className="p-4 rounded-lg border-2 hover:border-blue-500 transition-all"
          style={{ backgroundColor: theme.colors.bg, color: theme.colors.text }}>
          <p className="font-medium">{theme.name}</p>
          <div className="flex gap-1 mt-2 justify-center">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.bg }} />
          </div>
        </button>
      ))}
    </div>
  );
};
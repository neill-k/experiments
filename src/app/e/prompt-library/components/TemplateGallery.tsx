'use client';

import { useState } from 'react';
import { PRESETS } from '../constants';

interface TemplateGalleryProps {
  onLoadPreset: (preset: { name: string; content: string }) => void;
}

export function TemplateGallery({ onLoadPreset }: TemplateGalleryProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-full px-3 py-2.5 text-xs transition-colors min-h-[44px] flex justify-between items-center"
        style={{
          fontFamily: 'var(--font-body)',
          color: 'var(--muted)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--fg)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--muted)';
        }}
      >
        <span>Templates</span>
        <span className="text-[10px]">{showDropdown ? '\u25b2' : '\u25bc'}</span>
      </button>
      {showDropdown && (
        <div
          className="absolute bottom-full left-0 right-0 mb-1 border shadow-2xl z-10 max-h-48 overflow-y-auto"
          style={{
            backgroundColor: 'var(--bg)',
            borderColor: 'var(--border)',
          }}
        >
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                onLoadPreset(preset);
                setShowDropdown(false);
              }}
              className="w-full px-3 py-2.5 text-left text-xs transition-colors min-h-[44px] flex items-center"
              style={{
                fontFamily: 'var(--font-body)',
                color: 'var(--muted)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--fg)';
                e.currentTarget.style.backgroundColor = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--muted)';
                e.currentTarget.style.backgroundColor = '';
              }}
            >
              {preset.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

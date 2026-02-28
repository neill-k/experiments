'use client';

import { useState } from 'react';

interface NewPromptModalProps {
  onClose: () => void;
  onCreate: (name: string) => void;
}

export function NewPromptModal({ onClose, onCreate }: NewPromptModalProps) {
  const [name, setName] = useState('');

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="p-5 md:p-6 w-full max-w-sm border"
        style={{
          backgroundColor: 'var(--bg)',
          borderColor: 'var(--border)',
        }}
      >
        <h2
          className="text-base mb-4 tracking-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--fg)' }}
        >
          New Prompt
        </h2>
        <input
          type="text"
          aria-label="Prompt name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && name) {
              onCreate(name);
            }
          }}
          placeholder="Prompt name&#x2026;"
          className="w-full px-4 py-3 bg-transparent border mb-4 outline-none min-h-[44px] text-sm transition-colors"
          style={{
            borderColor: 'var(--border)',
            fontFamily: 'var(--font-body)',
            color: 'var(--fg)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-hover)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
          autoFocus
        />
        <div className="flex gap-px">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border text-xs transition-colors min-h-[44px] flex items-center justify-center"
            style={{
              borderColor: 'var(--border)',
              fontFamily: 'var(--font-mono)',
              color: 'var(--muted)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-hover)';
              e.currentTarget.style.color = 'var(--fg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--muted)';
            }}
          >
            cancel
          </button>
          <button
            onClick={() => name && onCreate(name)}
            disabled={!name}
            className="flex-1 px-4 py-3 border text-xs transition-colors min-h-[44px] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              borderColor: 'var(--border)',
              fontFamily: 'var(--font-mono)',
              color: 'var(--fg)',
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.borderColor = 'var(--border-hover)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            create
          </button>
        </div>
      </div>
    </div>
  );
}

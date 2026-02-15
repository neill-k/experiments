'use client';

import type { Prompt } from '../types';
import { SearchBar } from './SearchBar';
import { TemplateGallery } from './TemplateGallery';

interface PromptListProps {
  prompts: Prompt[];
  selectedId: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelect: (id: string) => void;
  onTogglePin: (id: string) => void;
  onNewPrompt: () => void;
  onImport: () => void;
  onLoadPreset: (preset: { name: string; content: string }) => void;
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
}

export function PromptList({
  prompts,
  selectedId,
  searchQuery,
  onSearchChange,
  onSelect,
  onTogglePin,
  onNewPrompt,
  onImport,
  onLoadPreset,
  sidebarOpen,
  onCloseSidebar,
}: PromptListProps) {
  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={onCloseSidebar}
        />
      )}

      <div
        className={`
          md:w-64 md:relative fixed inset-y-0 left-0 z-40
          transform transition-transform duration-200 ease-out
          border-r flex flex-col
          w-72 pt-14
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
        style={{
          backgroundColor: 'var(--bg)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="px-4 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h1
            className="text-base tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--fg)' }}
          >
            Prompt Library
          </h1>
          <p
            className="text-[11px] mt-1 tracking-wide uppercase"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--muted)' }}
          >
            Organize &middot; Version &middot; Test
          </p>
        </div>

        <SearchBar value={searchQuery} onChange={onSearchChange} />

        <div className="flex-1 overflow-y-auto py-2">
          {prompts.map((prompt) => (
            <div key={prompt.id} className="w-full group px-2">
              <button
                onClick={() => {
                  onSelect(prompt.id);
                  onCloseSidebar();
                }}
                className="w-full text-left px-3 py-2.5 mb-px text-sm truncate transition-colors min-h-[44px] flex items-center justify-between border-l-2"
                style={{
                  fontFamily: 'var(--font-body)',
                  color: selectedId === prompt.id ? 'var(--fg)' : 'var(--muted)',
                  backgroundColor: selectedId === prompt.id ? 'var(--accent)' : undefined,
                  borderLeftColor: selectedId === prompt.id ? 'var(--fg)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (selectedId !== prompt.id) {
                    e.currentTarget.style.color = 'var(--fg)';
                    e.currentTarget.style.backgroundColor = 'var(--accent)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedId !== prompt.id) {
                    e.currentTarget.style.color = 'var(--muted)';
                    e.currentTarget.style.backgroundColor = '';
                  }
                }}
              >
                <span className="truncate">{prompt.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin(prompt.id);
                  }}
                  className="ml-2 text-xs transition-colors flex-shrink-0"
                  style={{
                    color: prompt.isPinned ? 'var(--fg)' : 'var(--border-hover)',
                    opacity: prompt.isPinned ? 1 : undefined,
                  }}
                  title={prompt.isPinned ? 'Unpin' : 'Pin to top'}
                  aria-label={prompt.isPinned ? 'Unpin prompt' : 'Pin prompt to top'}
                >
                  {prompt.isPinned ? '\u25cf' : '\u25cb'}
                </button>
              </button>
            </div>
          ))}
        </div>

        <div className="p-3 border-t space-y-1.5" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={onNewPrompt}
            className="w-full px-3 py-2.5 border text-xs tracking-wide uppercase transition-colors min-h-[44px] flex items-center justify-center"
            style={{
              borderColor: 'var(--border)',
              fontFamily: 'var(--font-body)',
              color: 'var(--fg)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            New Prompt
          </button>
          <button
            onClick={onImport}
            className="w-full px-3 py-2.5 text-xs transition-colors min-h-[44px] flex items-center justify-center"
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
            Import .md
          </button>
          <TemplateGallery onLoadPreset={onLoadPreset} />
        </div>
      </div>
    </>
  );
}

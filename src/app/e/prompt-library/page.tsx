'use client';

import { useState, useCallback } from 'react';
import { Comments } from '@/components/comments/Comments';
import { usePromptStorage } from './hooks/usePromptStorage';
import { usePromptState } from './hooks/usePromptState';
import { useLlmTest } from './hooks/useLlmTest';
import { serializePrompt } from './utils';
import { PromptList } from './components/PromptList';
import { PromptEditor } from './components/PromptEditor';
import { PromptPreview } from './components/PromptPreview';
import { VariablePanel } from './components/VariablePanel';
import { VersionHistory } from './components/VersionHistory';
import { SettingsPanel } from './components/SettingsPanel';
import { NewPromptModal } from './components/NewPromptModal';
import { LlmTestPanel } from './components/LlmTestPanel';
import type { Prompt } from './types';

export default function PromptLibrary() {
  const {
    prompts,
    settings,
    setSettings,
    createPrompt,
    savePrompt,
    deletePrompt,
    togglePin,
    importFromFile,
  } = usePromptStorage();

  const {
    selectedId,
    selectedPrompt,
    editName,
    setEditName,
    editContent,
    setEditContent,
    testValues,
    setTestValues,
    showPreview,
    setShowPreview,
    searchQuery,
    setSearchQuery,
    showSettings,
    setShowSettings,
    filteredPrompts,
    previewContent,
    selectPrompt,
    restoreVersion,
  } = usePromptState(prompts);

  const { llmLoading, llmResponse, testWithLLM } = useLlmTest(settings);

  const [showNewPrompt, setShowNewPrompt] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleCreatePrompt = useCallback(
    (name: string) => {
      const id = createPrompt(name);
      selectPrompt(id);
      setShowNewPrompt(false);
    },
    [createPrompt, selectPrompt]
  );

  const handleLoadPreset = useCallback(
    (preset: { name: string; content: string }) => {
      const id = createPrompt(preset.name, preset.content);
      selectPrompt(id);
    },
    [createPrompt, selectPrompt]
  );

  const handleSave = useCallback(() => {
    if (!selectedPrompt) return;
    savePrompt(selectedPrompt.id, editName, editContent);
  }, [selectedPrompt, savePrompt, editName, editContent]);

  const handleDelete = useCallback(() => {
    if (!selectedPrompt) return;
    deletePrompt(selectedPrompt.id);
    // Select next available prompt
    const remaining = prompts.filter((p) => p.id !== selectedPrompt.id);
    if (remaining.length > 0) {
      selectPrompt(remaining[0].id);
    }
  }, [selectedPrompt, deletePrompt, prompts, selectPrompt]);

  const handleShare = useCallback(() => {
    if (!selectedPrompt) return;
    const encoded = serializePrompt(selectedPrompt);
    const shareUrl = `${window.location.origin}${window.location.pathname}?s=${encoded}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Share link copied to clipboard!');
  }, [selectedPrompt]);

  const handleCopyContent = useCallback(
    (text: string) => {
      navigator.clipboard.writeText(text);
    },
    []
  );

  const handleExport = useCallback(
    (prompt: Prompt) => {
      const filename = `${prompt.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
      const content = `# ${prompt.name}\n\n${prompt.content}\n\n---\n*Exported from Prompt Library on ${new Date().toLocaleDateString()}*`;
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    []
  );

  const handleSelect = useCallback(
    (id: string) => {
      selectPrompt(id);
      setSidebarOpen(false);
    },
    [selectPrompt]
  );

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--fg)' }}
    >
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-[60px] left-3 z-40 p-3 min-w-[44px] min-h-[44px] flex items-center justify-center border text-sm transition-colors"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--bg)',
          fontFamily: 'var(--font-mono)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? '\u00d7' : '\u2261'}
      </button>

      <div className="flex h-screen pt-14">
        {/* Sidebar */}
        <PromptList
          prompts={filteredPrompts}
          selectedId={selectedId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelect={handleSelect}
          onTogglePin={togglePin}
          onNewPrompt={() => setShowNewPrompt(true)}
          onImport={importFromFile}
          onLoadPreset={handleLoadPreset}
          sidebarOpen={sidebarOpen}
          onCloseSidebar={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedPrompt ? (
            <>
              {/* Header */}
              <div
                className="px-4 md:px-6 py-3 border-b flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-0"
                style={{ borderColor: 'var(--border)' }}
              >
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-lg md:text-xl bg-transparent border-none outline-none w-full md:w-80 tracking-tight"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--fg)',
                  }}
                />
                <div className="flex flex-wrap gap-px">
                  <HeaderButton
                    label="settings"
                    active={showSettings}
                    onClick={() => setShowSettings(!showSettings)}
                  />
                  <HeaderButton label="share" onClick={handleShare} />
                  <HeaderButton
                    label={showPreview ? 'edit' : 'preview'}
                    active={showPreview}
                    onClick={() => setShowPreview(!showPreview)}
                  />
                  <HeaderButton label="save" onClick={handleSave} />
                  <HeaderButton label="delete" danger onClick={handleDelete} />
                </div>
              </div>

              {/* Settings Panel */}
              {showSettings && (
                <SettingsPanel settings={settings} onChange={setSettings} />
              )}

              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Editor / Preview */}
                <div className="flex-1 p-4 md:p-6 overflow-auto">
                  {showPreview ? (
                    <PromptPreview
                      content={previewContent}
                      onCopy={() => handleCopyContent(previewContent)}
                    />
                  ) : (
                    <PromptEditor
                      content={editContent}
                      onChange={setEditContent}
                    />
                  )}
                </div>

                {/* Right Panel: Variables, Versions, Actions */}
                <div
                  className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l p-4 md:p-5 overflow-y-auto"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <VariablePanel
                    variables={selectedPrompt.variables}
                    values={testValues}
                    onChange={setTestValues}
                  />

                  <VersionHistory
                    versions={selectedPrompt.versions}
                    onRestore={restoreVersion}
                  />

                  <div className="mt-4 flex gap-px">
                    <ActionButton
                      label="copy"
                      onClick={() => handleCopyContent(editContent)}
                    />
                    <ActionButton
                      label="export"
                      onClick={() => handleExport(selectedPrompt)}
                    />
                  </div>

                  <LlmTestPanel
                    hasApiKey={!!settings.apiKey}
                    loading={llmLoading}
                    response={llmResponse}
                    onTest={() => testWithLLM(previewContent)}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center">
                <p
                  className="text-base mb-2 tracking-tight"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--muted)',
                  }}
                >
                  No prompt selected
                </p>
                <p
                  className="text-xs"
                  style={{
                    fontFamily: 'var(--font-body)',
                    color: 'var(--border-hover)',
                  }}
                >
                  Create a new prompt or load a template to begin
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Prompt Modal */}
      {showNewPrompt && (
        <NewPromptModal
          onClose={() => setShowNewPrompt(false)}
          onCreate={handleCreatePrompt}
        />
      )}

      {/* Comments */}
      <div className="mx-auto max-w-3xl px-4 pb-12">
        <Comments slug="prompt-library" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small inline sub-components (no separate files needed)            */
/* ------------------------------------------------------------------ */

function HeaderButton({
  label,
  active,
  danger,
  onClick,
}: {
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  const baseColor = danger ? '#444' : active ? 'var(--fg)' : 'var(--muted)';
  const baseBg = active ? 'rgba(235,235,235,0.05)' : 'transparent';

  return (
    <button
      onClick={onClick}
      className="px-3 py-2 text-xs tracking-tight transition-colors min-h-[44px] min-w-[44px] flex items-center border"
      style={{
        fontFamily: 'var(--font-mono)',
        borderColor: active ? 'var(--border-hover)' : 'var(--border)',
        color: baseColor,
        backgroundColor: baseBg,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = danger
          ? 'rgba(204,51,51,0.3)'
          : 'var(--border-hover)';
        e.currentTarget.style.color = danger ? '#c33' : 'var(--fg)';
        if (!active) {
          e.currentTarget.style.backgroundColor = danger
            ? 'transparent'
            : 'rgba(235,235,235,0.07)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = active
          ? 'var(--border-hover)'
          : 'var(--border)';
        e.currentTarget.style.color = baseColor;
        e.currentTarget.style.backgroundColor = baseBg;
      }}
    >
      {label}
    </button>
  );
}

function ActionButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 px-3 py-2.5 border text-xs transition-colors min-h-[44px] flex items-center justify-center"
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
      {label}
    </button>
  );
}

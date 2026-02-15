'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Comments } from '@/components/comments/Comments';
import { usePromptStorage } from './hooks/usePromptStorage';
import { usePromptState } from './hooks/usePromptState';
import { useAutoSave, type SaveStatus } from './hooks/useAutoSave';
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
    restorePrompt,
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
    clearSelection,
    restoreVersion,
  } = usePromptState(prompts);

  const { llmLoading, llmResponse, testWithLLM } = useLlmTest(settings);

  const { status: saveStatus, saveNow } = useAutoSave({
    selectedPrompt,
    editName,
    editContent,
    savePrompt,
  });

  const [showNewPrompt, setShowNewPrompt] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [undoToast, setUndoToast] = useState<{ prompt: Prompt; timer: number } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    saveNow();
  }, [saveNow]);

  // Step 1: clicking "delete" shows inline confirmation
  const handleDeleteClick = useCallback(() => {
    setConfirmingDelete(true);
  }, []);

  // Step 2: cancel confirmation
  const handleDeleteCancel = useCallback(() => {
    setConfirmingDelete(false);
  }, []);

  // Clean up undo timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  // Step 3: confirm delete — remove prompt, show undo toast, auto-select next
  const handleDeleteConfirm = useCallback(() => {
    if (!selectedPrompt) return;

    // Clear any existing undo toast (finalize previous delete)
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }

    const deleted = deletePrompt(selectedPrompt.id);
    setConfirmingDelete(false);

    // Select next available prompt or clear selection
    const remaining = prompts.filter((p) => p.id !== selectedPrompt.id);
    if (remaining.length > 0) {
      // Try to select the next prompt in the list (by position)
      const currentIndex = prompts.findIndex((p) => p.id === selectedPrompt.id);
      const nextIndex = Math.min(currentIndex, remaining.length - 1);
      selectPrompt(remaining[nextIndex].id);
    } else {
      clearSelection();
    }

    // Show undo toast
    if (deleted) {
      const timerId = setTimeout(() => {
        setUndoToast(null);
        undoTimerRef.current = null;
      }, 5000);
      undoTimerRef.current = timerId;
      setUndoToast({ prompt: deleted, timer: timerId as unknown as number });
    }
  }, [selectedPrompt, deletePrompt, prompts, selectPrompt, clearSelection]);

  // Step 4: undo — restore the deleted prompt and select it
  const handleUndo = useCallback(() => {
    if (!undoToast) return;
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    restorePrompt(undoToast.prompt);
    selectPrompt(undoToast.prompt.id);
    setUndoToast(null);
  }, [undoToast, restorePrompt, selectPrompt]);

  // Dismiss undo toast
  const handleDismissUndo = useCallback(() => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    setUndoToast(null);
  }, []);

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
      setConfirmingDelete(false);
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
                <div className="flex flex-wrap items-center gap-px">
                  <SaveStatusIndicator status={saveStatus} />
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
                  {confirmingDelete ? (
                    <>
                      <span
                        className="px-3 py-2 text-xs tracking-tight flex items-center min-h-[44px]"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--danger)',
                        }}
                      >
                        delete?
                      </span>
                      <HeaderButton label="cancel" onClick={handleDeleteCancel} />
                      <HeaderButton label="confirm" danger onClick={handleDeleteConfirm} />
                    </>
                  ) : (
                    <HeaderButton label="delete" danger onClick={handleDeleteClick} />
                  )}
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

      {/* Undo Toast */}
      {undoToast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 border"
          style={{
            backgroundColor: 'var(--bg)',
            borderColor: 'var(--border-hover)',
            fontFamily: 'var(--font-mono)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          }}
        >
          <span className="text-xs" style={{ color: 'var(--fg)' }}>
            Prompt deleted
          </span>
          <button
            onClick={handleUndo}
            className="px-3 py-1.5 border text-xs transition-colors"
            style={{
              fontFamily: 'var(--font-mono)',
              borderColor: 'var(--border)',
              color: 'var(--fg)',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--fg)';
              e.currentTarget.style.backgroundColor = 'var(--accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            undo
          </button>
          <button
            onClick={handleDismissUndo}
            className="text-xs transition-colors px-1"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--muted)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--fg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--muted)';
            }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
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

function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  const label =
    status === 'saved' ? 'saved' : status === 'saving' ? 'saving…' : 'unsaved';
  const color =
    status === 'saved'
      ? 'var(--border-hover)'
      : status === 'saving'
        ? 'var(--muted)'
        : 'var(--fg)';

  return (
    <span
      className="px-3 py-2 text-xs tracking-tight select-none flex items-center gap-1.5"
      style={{
        fontFamily: 'var(--font-mono)',
        color,
        opacity: status === 'saved' ? 0.5 : 0.85,
        transition: 'color 150ms, opacity 150ms',
      }}
      title={
        status === 'unsaved'
          ? 'Changes will be auto-saved shortly'
          : undefined
      }
    >
      <span
        style={{
          display: 'inline-block',
          width: 5,
          height: 5,
          backgroundColor: color,
          transition: 'background-color 150ms',
        }}
      />
      {label}
    </span>
  );
}

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
  const baseColor = danger ? 'var(--border-hover)' : active ? 'var(--fg)' : 'var(--muted)';
  const baseBg = active ? 'var(--accent)' : 'transparent';

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
          ? 'color-mix(in srgb, var(--danger) 30%, transparent)'
          : 'var(--border-hover)';
        e.currentTarget.style.color = danger ? 'var(--danger)' : 'var(--fg)';
        if (!active) {
          e.currentTarget.style.backgroundColor = danger
            ? 'transparent'
            : 'var(--accent)';
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

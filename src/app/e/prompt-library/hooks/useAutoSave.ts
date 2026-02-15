'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type SaveStatus = 'saved' | 'saving' | 'unsaved';

interface UseAutoSaveOptions {
  /** The currently selected prompt (null if none) */
  selectedPrompt: { id: string; name: string; content: string } | null;
  /** Current editor name value */
  editName: string;
  /** Current editor content value */
  editContent: string;
  /** Function to persist changes */
  savePrompt: (id: string, name: string, content: string) => void;
  /** Debounce delay in ms */
  debounceMs?: number;
}

export function useAutoSave({
  selectedPrompt,
  editName,
  editContent,
  savePrompt,
  debounceMs = 500,
}: UseAutoSaveOptions) {
  const [status, setStatus] = useState<SaveStatus>('saved');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<{ id: string; name: string; content: string } | null>(null);

  // Track what was last saved so we can detect dirty state accurately
  useEffect(() => {
    if (selectedPrompt) {
      lastSavedRef.current = {
        id: selectedPrompt.id,
        name: selectedPrompt.name,
        content: selectedPrompt.content,
      };
      setStatus('saved');
    }
  }, [selectedPrompt?.id]); // Only reset when switching prompts

  // Detect dirty state and debounce auto-save
  useEffect(() => {
    if (!selectedPrompt) return;

    const last = lastSavedRef.current;
    const isDirty =
      !last ||
      last.id !== selectedPrompt.id ||
      last.name !== editName ||
      last.content !== editContent;

    if (!isDirty) {
      setStatus('saved');
      return;
    }

    setStatus('unsaved');

    // Clear previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set debounced save
    timerRef.current = setTimeout(() => {
      setStatus('saving');
      savePrompt(selectedPrompt.id, editName, editContent);
      lastSavedRef.current = {
        id: selectedPrompt.id,
        name: editName,
        content: editContent,
      };
      setStatus('saved');
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [selectedPrompt, editName, editContent, savePrompt, debounceMs]);

  // beforeunload warning for unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (status === 'unsaved' || status === 'saving') {
        e.preventDefault();
        // Modern browsers ignore custom messages but require returnValue
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [status]);

  // Force save immediately (e.g. for manual save button)
  const saveNow = useCallback(() => {
    if (!selectedPrompt) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setStatus('saving');
    savePrompt(selectedPrompt.id, editName, editContent);
    lastSavedRef.current = {
      id: selectedPrompt.id,
      name: editName,
      content: editContent,
    };
    setStatus('saved');
  }, [selectedPrompt, editName, editContent, savePrompt]);

  return { status, saveNow };
}

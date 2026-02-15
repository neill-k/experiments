'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { Prompt } from '../types';
import { extractVariables, substituteVariables } from '../utils';

export function usePromptState(prompts: Prompt[]) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editContent, setEditContent] = useState('');
  const [testValues, setTestValues] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Track a "pending select" ID for when we call selectPrompt before the
  // prompts array includes the new prompt (state hasn't re-rendered yet).
  const pendingSelectRef = useRef<string | null>(null);

  const selectedPrompt = useMemo(
    () => prompts.find((p) => p.id === selectedId) ?? null,
    [prompts, selectedId]
  );

  const filteredPrompts = useMemo(
    () =>
      prompts
        .filter((p) => {
          if (!searchQuery.trim()) return true;
          const query = searchQuery.toLowerCase();
          return (
            p.name.toLowerCase().includes(query) ||
            p.content.toLowerCase().includes(query)
          );
        })
        .sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return b.updatedAt - a.updatedAt;
        }),
    [prompts, searchQuery]
  );

  const previewContent = useMemo(
    () => (selectedPrompt ? substituteVariables(editContent, testValues) : ''),
    [selectedPrompt, editContent, testValues]
  );

  // Sync editor fields when the selected prompt changes (e.g. after navigating)
  useEffect(() => {
    if (selectedPrompt) {
      setEditName(selectedPrompt.name);
      setEditContent(selectedPrompt.content);
      const vars = extractVariables(selectedPrompt.content);
      setTestValues(
        vars.reduce((acc, v) => ({ ...acc, [v]: '' }), {} as Record<string, string>)
      );
    }
  }, [selectedPrompt]);

  // Auto-select first prompt on initial load if nothing is selected
  useEffect(() => {
    if (selectedId === null && prompts.length > 0 && pendingSelectRef.current === null) {
      setSelectedId(prompts[0].id);
    }
  }, [selectedId, prompts]);

  // Handle pending select: when prompts array updates and includes our pending ID
  useEffect(() => {
    const pending = pendingSelectRef.current;
    if (pending && prompts.some((p) => p.id === pending)) {
      pendingSelectRef.current = null;
      setSelectedId(pending);
    }
  }, [prompts]);

  const selectPrompt = useCallback(
    (id: string) => {
      const prompt = prompts.find((p) => p.id === id);
      if (prompt) {
        setSelectedId(id);
        // Fields will be synced by the useEffect above
      } else {
        // Prompt not in array yet (just created) — schedule for next render
        pendingSelectRef.current = id;
      }
    },
    [prompts]
  );

  const restoreVersion = useCallback((content: string) => {
    setEditContent(content);
    const vars = extractVariables(content);
    setTestValues(
      vars.reduce((acc, v) => ({ ...acc, [v]: '' }), {} as Record<string, string>)
    );
  }, []);

  return {
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
  };
}

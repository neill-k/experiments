'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Prompt } from '../types';
import { extractVariables, substituteVariables } from '../utils';

export function usePromptState(prompts: Prompt[]) {
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    // Initialize to first prompt if available
    return prompts.length > 0 ? prompts[0].id : null;
  });
  const [editName, setEditName] = useState('');
  const [editContent, setEditContent] = useState('');
  const [testValues, setTestValues] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);

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

  const editVariables = useMemo(
    () => extractVariables(editContent),
    [editContent]
  );

  const previewContent = useMemo(
    () => (selectedPrompt ? substituteVariables(editContent, testValues) : ''),
    [selectedPrompt, editContent, testValues]
  );

  const selectPrompt = useCallback(
    (id: string) => {
      const prompt = prompts.find((p) => p.id === id);
      if (!prompt) return;
      setSelectedId(id);
      setEditName(prompt.name);
      setEditContent(prompt.content);
      const vars = extractVariables(prompt.content);
      setTestValues(vars.reduce((acc, v) => ({ ...acc, [v]: '' }), {} as Record<string, string>));
    },
    [prompts]
  );

  const restoreVersion = useCallback((content: string) => {
    setEditContent(content);
    const vars = extractVariables(content);
    setTestValues(vars.reduce((acc, v) => ({ ...acc, [v]: '' }), {} as Record<string, string>));
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
    editVariables,
    previewContent,
    selectPrompt,
    restoreVersion,
  };
}

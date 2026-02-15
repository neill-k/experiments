'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Prompt, Settings } from '../types';
import { extractVariables, deserializePrompt } from '../utils';
import { DEFAULT_PROMPT } from '../constants';

const STORAGE_KEY = 'prompt-library';
const SETTINGS_KEY = 'prompt-library-settings';

const DEFAULT_SETTINGS: Settings = { apiKey: '', model: 'gpt-4o' };

function loadPrompts(): Prompt[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((p: Prompt) => ({
        ...p,
        isPinned: p.isPinned || false,
      }));
    }
  } catch {
    // ignore corrupt data
  }
  return [];
}

function loadSettings(): Settings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

export function usePromptStorage() {
  const [prompts, setPrompts] = useState<Prompt[]>(() => loadPrompts());
  const [settings, setSettings] = useState<Settings>(() => loadSettings());

  // Persist prompts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
    } catch {
      // QuotaExceededError — silently fail
    }
  }, [prompts]);

  // Persist settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // QuotaExceededError
    }
  }, [settings]);

  // Check for shared prompt in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get('s');
    if (shared) {
      const promptData = deserializePrompt(shared);
      if (promptData) {
        const variables = extractVariables(promptData.content);
        const now = Date.now();
        const newPrompt: Prompt = {
          id: now.toString(),
          name: promptData.name + ' (shared)',
          content: promptData.content,
          variables,
          versions: [{ content: promptData.content, timestamp: now }],
          createdAt: now,
          updatedAt: now,
          isPinned: false,
        };
        setPrompts((prev) => [...prev, newPrompt]);
        // Clear the URL param
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  const createPrompt = useCallback((name: string, content: string = DEFAULT_PROMPT): string => {
    const variables = extractVariables(content);
    const now = Date.now();
    const newPrompt: Prompt = {
      id: now.toString(),
      name,
      content,
      variables,
      versions: [{ content, timestamp: now }],
      createdAt: now,
      updatedAt: now,
      isPinned: false,
    };
    setPrompts((prev) => [...prev, newPrompt]);
    return newPrompt.id;
  }, []);

  const savePrompt = useCallback((id: string, name: string, content: string) => {
    setPrompts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const variables = extractVariables(content);
        return {
          ...p,
          name,
          content,
          variables,
          versions: [...p.versions, { content, timestamp: Date.now() }],
          updatedAt: Date.now(),
        };
      })
    );
  }, []);

  const deletePrompt = useCallback((id: string) => {
    setPrompts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const togglePin = useCallback((id: string) => {
    setPrompts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, isPinned: !p.isPinned } : p
      )
    );
  }, []);

  const importFromFile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.txt';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      const headingMatch = text.match(/^#\s+(.+)$/m);
      const name = headingMatch ? headingMatch[1] : file.name.replace(/\.(md|txt)$/, '');
      const content = text.replace(/^#\s+.+$/m, '').trim();
      createPrompt(name, content);
    };
    input.click();
  }, [createPrompt]);

  return {
    prompts,
    settings,
    setSettings,
    createPrompt,
    savePrompt,
    deletePrompt,
    togglePin,
    importFromFile,
  };
}

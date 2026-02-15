import type { Prompt } from './types';

const VARIABLE_REGEX = /\{\{(\w+)\}\}/g;

export function extractVariables(content: string): string[] {
  const matches = content.match(VARIABLE_REGEX) || [];
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))];
}

export function substituteVariables(content: string, values: Record<string, string>): string {
  let result = content;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || `{{${key}}}`);
  }
  return result;
}

export function serializePrompt(prompt: Pick<Prompt, 'name' | 'content' | 'variables' | 'isPinned'>): string {
  const data = JSON.stringify({
    name: prompt.name,
    content: prompt.content,
    variables: prompt.variables,
    isPinned: prompt.isPinned,
  });
  return btoa(encodeURIComponent(data));
}

export function deserializePrompt(encoded: string): Pick<Prompt, 'name' | 'content' | 'variables' | 'isPinned'> | null {
  try {
    const data = decodeURIComponent(atob(encoded));
    return JSON.parse(data);
  } catch {
    return null;
  }
}

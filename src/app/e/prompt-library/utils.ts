import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
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

/**
 * Serialize a prompt for URL sharing using lz-string compression.
 * Produces a URI-safe compressed string (~3-4x smaller than base64).
 */
export function serializePrompt(prompt: Pick<Prompt, 'name' | 'content' | 'variables' | 'isPinned'>): string {
  const data = JSON.stringify({
    name: prompt.name,
    content: prompt.content,
    variables: prompt.variables,
    isPinned: prompt.isPinned,
  });
  return compressToEncodedURIComponent(data);
}

/**
 * Deserialize a shared prompt from URL.
 * Tries lz-string decompression first, falls back to legacy base64 for old links.
 */
export function deserializePrompt(encoded: string): Pick<Prompt, 'name' | 'content' | 'variables' | 'isPinned'> | null {
  // Try lz-string decompression first (new format)
  try {
    const decompressed = decompressFromEncodedURIComponent(encoded);
    if (decompressed) {
      const parsed = JSON.parse(decompressed);
      if (parsed && typeof parsed.name === 'string' && typeof parsed.content === 'string') {
        return parsed;
      }
    }
  } catch {
    // Not lz-string format, try legacy
  }

  // Fallback: legacy base64 format for backward compatibility
  try {
    const data = decodeURIComponent(atob(encoded));
    return JSON.parse(data);
  } catch {
    return null;
  }
}

'use client';

import { useState, useCallback } from 'react';
import type { Settings } from '../types';

export function useLlmTest(settings: Settings) {
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmResponse, setLlmResponse] = useState('');

  const testWithLLM = useCallback(async (content: string) => {
    if (!settings.apiKey || !content) return;

    setLlmLoading(true);
    setLlmResponse('');

    try {
      const isClaude = settings.model.startsWith('claude-');
      const endpoint = isClaude
        ? 'https://api.anthropic.com/v1/messages'
        : 'https://api.openai.com/v1/chat/completions';

      const body = isClaude
        ? {
            model: settings.model,
            max_tokens: 1024,
            messages: [{ role: 'user', content }],
          }
        : {
            model: settings.model,
            messages: [{ role: 'user', content }],
            max_tokens: 1024,
          };

      const headers: Record<string, string> = isClaude
        ? {
            'Content-Type': 'application/json',
            'x-api-key': settings.apiKey,
            'anthropic-version': '2023-06-01',
          }
        : {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${settings.apiKey}`,
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const text = isClaude
        ? data.content?.[0]?.text || 'No response'
        : data.choices?.[0]?.message?.content || 'No response';

      setLlmResponse(text);
    } catch (err) {
      setLlmResponse(
        `Error: ${err instanceof Error ? err.message : 'Failed to call API'}`
      );
    } finally {
      setLlmLoading(false);
    }
  }, [settings.apiKey, settings.model]);

  return { llmLoading, llmResponse, testWithLLM };
}

'use client';

import { useState, useEffect } from 'react';

interface Prompt {
  id: string;
  name: string;
  content: string;
  variables: string[];
  versions: { content: string; timestamp: number }[];
  createdAt: number;
  updatedAt: number;
}

interface Settings {
  apiKey: string;
  model: string;
}

const DEFAULT_PROMPT = `You are a {{role}} helping with {{task}}.

Instructions:
- Be concise and helpful
- {{additional_instructions}}

Context:
{{context}}`;

const MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
];

const PRESETS = [
  {
    name: 'Support Triage',
    content: `You are a support ticket triage agent.

Analyze the incoming ticket and categorize it:
- priority: critical | high | medium | low
- category: billing | technical | account | feature_request | other
- sentiment: frustrated | neutral | satisfied

Provide a brief summary and recommended action.

Ticket:
{{ticket_content}}`,
  },
  {
    name: 'Code Review',
    content: `You are a code reviewer providing constructive feedback.

Review the following code changes and identify:
1. Potential bugs or issues
2. Performance concerns
3. Code quality suggestions
4. Security considerations

Code diff:
{{diff}}

Provide your review in a structured format.`,
  },
  {
    name: 'SQL Generator',
    content: `You are a SQL query generator.

Given the following table schema and user request, generate an efficient SQL query.

Table Schema:
{{schema}}

User Request:
{{request}}

Provide only the SQL query with a brief explanation.`,
  },
  {
    name: 'Email Writer',
    content: `You are a professional email writer.

Write a {{tone}} email with the following details:
- Subject: {{subject}}
- Main message: {{message}}
- Call to action: {{cta}}

Keep it concise, clear, and professional.`,
  },
  {
    name: 'Meeting Summary',
    content: `You are a meeting notes summarizer.

Summarize the following meeting transcript into:
1. Key decisions made
2. Action items with owners
3. Topics discussed
4. Next steps

Transcript:
{{transcript}}

Format as structured bullet points.`,
  },
  {
    name: 'Data Analysis',
    content: `You are a data analyst.

Analyze the following dataset description and provide:
1. Suggested metrics to calculate
2. Potential insights or patterns
3. Recommended visualizations

Dataset:
{{dataset_description}}

Business Question:
{{question}}`,
  },
  {
    name: 'QA Tester',
    content: `You are a QA tester creating test cases.

Generate test cases for the following feature:

Feature Description:
{{feature}}

Test Coverage:
- Happy path scenarios
- Edge cases
- Error conditions
- Boundary values

Format as a structured test case list with prerequisites, steps, and expected results.`,
  },
];

function extractVariables(content: string): string[] {
  const matches = content.match(/\{\{(\w+)\}\}/g) || [];
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))];
}

function substituteVariables(content: string, values: Record<string, string>): string {
  let result = content;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || `{{${key}}}`);
  }
  return result;
}

function serializePrompt(prompt: Omit<Prompt, 'id' | 'versions' | 'createdAt' | 'updatedAt'>): string {
  const data = JSON.stringify({ name: prompt.name, content: prompt.content, variables: prompt.variables });
  return btoa(encodeURIComponent(data));
}

function deserializePrompt(encoded: string): Omit<Prompt, 'id' | 'versions' | 'createdAt' | 'updatedAt'> | null {
  try {
    const data = decodeURIComponent(atob(encoded));
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export default function PromptLibrary() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editContent, setEditContent] = useState('');
  const [testValues, setTestValues] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [showNewPrompt, setShowNewPrompt] = useState(false);
  const [newPromptName, setNewPromptName] = useState('');
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<Settings>({ apiKey: '', model: 'gpt-4o' });
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmResponse, setLlmResponse] = useState('');

  const selectedPrompt = prompts.find((p) => p.id === selectedId);

  // Filter prompts by search query
  const filteredPrompts = prompts.filter((p) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(query) || p.content.toLowerCase().includes(query);
  });

  const createPrompt = (name: string, content: string = DEFAULT_PROMPT) => {
    const variables = extractVariables(content);
    const newPrompt: Prompt = {
      id: Date.now().toString(),
      name,
      content,
      variables,
      versions: [{ content, timestamp: Date.now() }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setPrompts([...prompts, newPrompt]);
    setSelectedId(newPrompt.id);
    setShowNewPrompt(false);
    setNewPromptName('');
  };

  // Check for shared prompt in URL on mount
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get('s');
    if (shared) {
      const promptData = deserializePrompt(shared);
      if (promptData) {
        createPrompt(promptData.name + ' (shared)', promptData.content);
        // Clear the URL param
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('prompt-library');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPrompts(parsed);
        if (parsed.length > 0) setSelectedId(parsed[0].id);
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (prompts.length > 0) {
      localStorage.setItem('prompt-library', JSON.stringify(prompts));
    }
  }, [prompts]);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('prompt-library-settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch {
        // ignore
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('prompt-library-settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (selectedPrompt) {
      setEditName(selectedPrompt.name);
      setEditContent(selectedPrompt.content);
      const vars = extractVariables(selectedPrompt.content);
      setTestValues(
        vars.reduce((acc, v) => ({ ...acc, [v]: '' }), {})
      );
    }
  }, [selectedPrompt]);

  const savePrompt = () => {
    if (!selectedPrompt) return;
    const variables = extractVariables(editContent);
    const updated: Prompt = {
      ...selectedPrompt,
      name: editName,
      content: editContent,
      variables,
      versions: [...selectedPrompt.versions, { content: editContent, timestamp: Date.now() }],
      updatedAt: Date.now(),
    };
    setPrompts(prompts.map((p) => (p.id === selectedId ? updated : p)));
  };

  const deletePrompt = (id: string) => {
    const filtered = prompts.filter((p) => p.id !== id);
    setPrompts(filtered);
    if (selectedId === id && filtered.length > 0) {
      setSelectedId(filtered[0].id);
    } else if (filtered.length === 0) {
      setSelectedId(null);
    }
  };

  const loadPreset = (preset: typeof PRESETS[0]) => {
    createPrompt(preset.name, preset.content);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const exportToMarkdown = (prompt: Prompt) => {
    const filename = `${prompt.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    const content = `# ${prompt.name}\n\n${prompt.content}\n\n---\n*Exported from Prompt Library on ${new Date().toLocaleDateString()}*`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sharePrompt = () => {
    if (!selectedPrompt) return;
    const encoded = serializePrompt({
      name: selectedPrompt.name,
      content: selectedPrompt.content,
      variables: selectedPrompt.variables,
    });
    const shareUrl = `${window.location.origin}${window.location.pathname}?s=${encoded}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Share link copied to clipboard!');
  };

  const importFromFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.txt';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      // Extract name from first # heading or use filename
      const headingMatch = text.match(/^#\s+(.+)$/m);
      const name = headingMatch ? headingMatch[1] : file.name.replace(/\.(md|txt)$/, '');
      // Strip the title line if it exists
      const content = text.replace(/^#\s+.+$/m, '').trim();
      createPrompt(name, content);
    };
    input.click();
  };

  const previewContent = selectedPrompt ? substituteVariables(editContent, testValues) : '';

  const testWithLLM = async () => {
    if (!settings.apiKey || !selectedPrompt) return;
    
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
            messages: [{ role: 'user', content: previewContent }]
          }
        : {
            model: settings.model,
            messages: [{ role: 'user', content: previewContent }],
            max_tokens: 1024
          };
      
      const headers: Record<string, string> = isClaude
        ? { 'Content-Type': 'application/json', 'x-api-key': settings.apiKey, 'anthropic-version': '2023-06-01' }
        : { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.apiKey}` };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
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
      setLlmResponse(`Error: ${err instanceof Error ? err.message : 'Failed to call API'}`);
    } finally {
      setLlmLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-[#ebebeb] overflow-x-hidden">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-3 left-3 z-50 p-3 min-w-[44px] min-h-[44px] flex items-center justify-center bg-[#2a2a2a] text-lg"
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div className="flex h-screen">
        {/* Sidebar - hidden on mobile unless open */}
        <div className={`
          md:w-64 md:relative fixed inset-y-0 left-0 z-40 
          transform transition-transform duration-200 ease-out
          bg-[#08080a] border-r border-[#2a2a2a] flex flex-col
          w-72
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0
        `}>
          <div className="p-4 border-b border-[#2a2a2a]">
            <h1 className="text-lg font-semibold text-white">📚 Prompt Library</h1>
            <p className="text-xs text-gray-500 mt-1">Organize, version, test</p>
          </div>

          <div className="p-2 border-b border-[#2a2a2a]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search prompts..."
              className="w-full px-3 py-2.5 bg-[#08080a] border border-[#2a2a2a] text-sm outline-none focus:border-blue-600 text-[#ebebeb] min-h-[44px]"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {filteredPrompts.map((prompt) => (
              <button
                key={prompt.id}
                onClick={() => {
                  setSelectedId(prompt.id);
                  setSidebarOpen(false);
                }}
                className={`w-full text-left px-3 py-3 mb-1 text-sm truncate transition-colors min-h-[44px] flex items-center ${
                  selectedId === prompt.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-[#2a2a2a]'
                }`}
              >
                {prompt.name}
              </button>
            ))}
          </div>

          <div className="p-3 border-t border-[#2a2a2a] space-y-2">
            <button
              onClick={() => setShowNewPrompt(true)}
              className="w-full px-3 py-3 bg-blue-600 hover:bg-blue-700 text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center"
            >
              + New Prompt
            </button>
            <button
              onClick={importFromFile}
              className="w-full px-3 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-sm transition-colors min-h-[44px] flex items-center justify-center"
            >
              📤 Import .md
            </button>
            <div className="text-xs text-gray-500 text-center">or load preset:</div>
            <div className="relative">
              <button
                onClick={() => setShowPresetDropdown(!showPresetDropdown)}
                className="w-full px-3 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-sm transition-colors min-h-[44px] flex justify-between items-center"
              >
                <span>📋 Templates</span>
                <span>{showPresetDropdown ? '▲' : '▼'}</span>
              </button>
              {showPresetDropdown && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#2a2a2a] border border-[#3a3a3a] shadow-lg z-10 max-h-48 overflow-y-auto">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        loadPreset(preset);
                        setShowPresetDropdown(false);
                      }}
                      className="w-full px-3 py-3 text-left text-sm hover:bg-[#3a3a3a] transition-colors min-h-[44px] flex items-center"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden pt-14 md:pt-0">
          {selectedPrompt ? (
            <>
              {/* Header */}
              <div className="p-3 md:p-4 border-b border-[#2a2a2a] flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-0">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-lg md:text-xl font-semibold bg-transparent border-none outline-none text-white w-full md:w-64"
                />
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`px-2 md:px-3 py-2 text-xs md:text-sm transition-colors min-h-[44px] min-w-[44px] flex items-center ${
                      showSettings ? 'bg-blue-600 text-white' : 'bg-[#2a2a2a] hover:bg-[#3a3a3a]'
                    }`}
                  >
                    ⚙️
                  </button>
                  <button
                    onClick={sharePrompt}
                    className="px-2 md:px-3 py-2 text-xs md:text-sm bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors min-h-[44px] min-w-[44px] flex items-center"
                  >
                    🔗
                  </button>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="px-2 md:px-3 py-2 text-xs md:text-sm bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors min-h-[44px] min-w-[44px] flex items-center"
                  >
                    {showPreview ? '📝' : '👁'}
                  </button>
                  <button
                    onClick={savePrompt}
                    className="px-2 md:px-3 py-2 text-xs md:text-sm bg-green-600 hover:bg-green-700 transition-colors min-h-[44px] min-w-[44px] flex items-center"
                  >
                    💾
                  </button>
                  <button
                    onClick={() => deletePrompt(selectedPrompt.id)}
                    className="px-2 md:px-3 py-2 text-xs md:text-sm bg-red-900/50 hover:bg-red-900 text-red-300 transition-colors min-h-[44px] min-w-[44px] flex items-center"
                  >
                    🗑
                  </button>
                </div>
              </div>

              {/* Settings Panel */}
              {showSettings && (
                <div className="p-3 md:p-4 border-b border-[#2a2a2a] bg-[#08080a]/80">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">🔌 LLM API Settings</h3>
                  <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-start">
                    <div className="flex-1 w-full">
                      <label className="text-xs text-gray-500 block mb-1">API Key</label>
                      <input
                        type="password"
                        value={settings.apiKey}
                        onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                        placeholder="sk-... (OpenAI) or ant... (Anthropic)"
                        className="w-full px-3 py-2.5 bg-[#08080a] border border-[#2a2a2a] text-sm outline-none focus:border-blue-600 min-h-[44px]"
                      />
                    </div>
                    <div className="w-full md:w-48">
                      <label className="text-xs text-gray-500 block mb-1">Model</label>
                      <select
                        value={settings.model}
                        onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                        className="w-full px-3 py-2.5 bg-[#08080a] border border-[#2a2a2a] text-sm outline-none focus:border-blue-600 min-h-[44px]"
                      >
                        {MODELS.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Keys stored locally in your browser. Not sent to any server except the LLM API directly.
                  </p>
                </div>
              )}

              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Editor / Preview */}
                <div className="flex-1 p-3 md:p-4 overflow-auto">
                  {showPreview ? (
                    <div className="space-y-4">
                      <div className="bg-[#08080a] p-4 border border-[#2a2a2a]">
                        <h3 className="text-sm font-medium text-gray-400 mb-2">Rendered Output</h3>
                        <pre className="whitespace-pre-wrap text-sm text-[#ebebeb] font-mono">
                          {previewContent}
                        </pre>
                      </div>
                      <button
                        onClick={() => copyToClipboard(previewContent)}
                        className="px-3 py-3 text-sm bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        📋 Copy
                      </button>
                    </div>
                  ) : (
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full h-full bg-[#08080a] p-4 text-sm font-mono text-[#ebebeb] resize-none outline-none border border-[#2a2a2a] min-h-[300px] md:min-h-0"
                      placeholder="Write your prompt here... Use {{variable}} for variables."
                    />
                  )}
                </div>

                {/* Variables Panel - full width on mobile, side on lg */}
                <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-[#2a2a2a] p-3 md:p-4 overflow-y-auto">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">🔧 Variables</h3>
                  {selectedPrompt.variables.length === 0 ? (
                    <p className="text-xs text-gray-500">No variables found. Use {'{{variable}}'} syntax.</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedPrompt.variables.map((v) => (
                        <div key={v}>
                          <label className="text-xs text-gray-500 block mb-1">{v}</label>
                          <input
                            type="text"
                            value={testValues[v] || ''}
                            onChange={(e) => setTestValues({ ...testValues, [v]: e.target.value })}
                            className="w-full px-3 py-2.5 bg-[#08080a] border border-[#2a2a2a] text-sm outline-none focus:border-blue-600 min-h-[44px]"
                            placeholder={`Enter ${v}...`}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-[#2a2a2a]">
                    <h3 className="text-sm font-medium text-gray-400 mb-3">📜 Version History</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedPrompt.versions
                        .slice()
                        .reverse()
                        .map((v, i) => (
                          <button
                            key={v.timestamp}
                            onClick={() => {
                              setEditContent(v.content);
                              setTestValues(
                                extractVariables(v.content).reduce(
                                  (acc, varName) => ({ ...acc, [varName]: '' }),
                                  {}
                                )
                              );
                            }}
                            className="w-full text-xs bg-[#08080a] hover:bg-[#2a2a2a] p-3 flex justify-between items-center transition-colors min-h-[44px]"
                          >
                            <span className="text-gray-500">v{selectedPrompt.versions.length - i}</span>
                            <span className="text-gray-600">
                              {new Date(v.timestamp).toLocaleTimeString()}
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => copyToClipboard(editContent)}
                      className="flex-1 px-3 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-sm transition-colors min-h-[44px] flex items-center justify-center"
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={() => selectedPrompt && exportToMarkdown(selectedPrompt)}
                      className="flex-1 px-3 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-sm transition-colors min-h-[44px] flex items-center justify-center"
                    >
                      📥 Export
                    </button>
                  </div>

                  {/* LLM Test Section */}
                  {llmResponse && (
                    <div className="mt-4 p-3 bg-[#08080a] border border-[#2a2a2a]">
                      <h4 className="text-xs font-medium text-gray-400 mb-2">🤖 LLM Response</h4>
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {llmResponse}
                      </pre>
                    </div>
                  )}
                  <div className="mt-4">
                    <button
                      onClick={testWithLLM}
                      disabled={!settings.apiKey || llmLoading}
                      className="w-full px-3 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors min-h-[44px]"
                    >
                      {llmLoading ? '⏳ Calling API...' : '🤖 Test with LLM'}
                    </button>
                    {!settings.apiKey && (
                      <p className="text-xs text-gray-500 mt-1 text-center">Add API key in Settings first</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 p-4">
              <div className="text-center">
                <p className="text-lg mb-2">No prompt selected</p>
                <p className="text-sm">Create a new prompt or load a preset to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Prompt Modal */}
      {showNewPrompt && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#08080a] p-4 md:p-6 w-full max-w-sm border border-[#2a2a2a]">
            <h2 className="text-lg font-semibold mb-4">New Prompt</h2>
            <input
              type="text"
              value={newPromptName}
              onChange={(e) => setNewPromptName(e.target.value)}
              placeholder="Prompt name..."
              className="w-full px-4 py-3 bg-[#08080a] border border-[#2a2a2a] mb-4 outline-none focus:border-blue-600 min-h-[44px]"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowNewPrompt(false);
                  setNewPromptName('');
                }}
                className="flex-1 px-4 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors min-h-[44px] flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                onClick={() => newPromptName && createPrompt(newPromptName)}
                disabled={!newPromptName}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] flex items-center justify-center"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Comments } from '@/components/comments/Comments';
import Link from 'next/link';

interface Prompt {
  id: string;
  name: string;
  content: string;
  variables: string[];
  versions: { content: string; timestamp: number }[];
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
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
    name: 'System Prompt Engineer',
    content: `You are an expert prompt engineer who designs production-grade system prompts.

I need a system prompt for: {{use_case}}

Target model: {{model}}

Generate a complete system prompt that includes:
1. A precise persona with domain expertise, communication style, and decision-making framework
2. Hard constraints (what the AI must NEVER do, output boundaries, safety rails)
3. Soft constraints (preferred behaviors, tone, verbosity level)
4. A structured output format with explicit field definitions
5. 2-3 few-shot examples demonstrating ideal responses (include both simple and edge cases)
6. Error handling instructions: what to do when input is ambiguous, incomplete, or adversarial
7. A chain-of-thought scaffold: step-by-step reasoning pattern the AI should follow internally

Format the output as a ready-to-deploy system prompt wrapped in a markdown code block. Include inline comments explaining WHY each section exists. Optimize for {{priority}} (options: accuracy, speed, creativity, safety).`,
  },
  {
    name: 'Strategic Advisor',
    content: `You are a senior strategy consultant with 20 years across McKinsey, BCG, and as a Chief Strategy Officer.

Context: {{company_context}}

Strategic question: {{question}}

Execute this analysis framework:

PHASE 1 — LANDSCAPE
Apply Porter's Five Forces to the competitive environment. Be specific with named competitors and quantified market dynamics where possible.

PHASE 2 — POSITIONING  
Run a SWOT analysis. For each item, assign a confidence level (high/medium/low) and cite your reasoning. Flag assumptions explicitly.

PHASE 3 — OPTIONS
Generate 3 distinct strategic options using Blue Ocean Strategy thinking. For each:
- Core thesis (1 sentence)
- Required capabilities and investments
- 18-month execution roadmap with milestones
- Risk profile (probability × impact matrix)
- Expected ROI range with assumptions stated

PHASE 4 — RECOMMENDATION
Synthesize into a single recommendation. Include: the decision, the logic chain that supports it, the top 3 risks with mitigations, and the first 3 moves to execute this week.

Write for a board audience. Be direct. No hedging without justification.`,
  },
  {
    name: 'Code Architect',
    content: `You are a Staff+ Engineer conducting an architecture review.

System description: {{system_description}}
Current scale: {{current_scale}}
Target scale: {{target_scale}}
Primary concern: {{primary_concern}}

Produce a technical architecture assessment:

1. CURRENT STATE ANALYSIS
   - Identify architectural patterns in use (monolith, microservices, event-driven, etc.)
   - Map the critical path for the primary user flow
   - Identify the top 3 scaling bottlenecks with evidence

2. TRADE-OFF ANALYSIS
   Present a decision matrix for the top architectural decision, evaluating:
   - Consistency vs. availability (CAP theorem implications)
   - Complexity vs. flexibility
   - Build vs. buy for each major component
   Score each option 1-5 on: dev velocity, operational cost, reliability, team skill match

3. TARGET ARCHITECTURE
   - Component diagram with data flow directions
   - Technology recommendations with specific version/service names
   - Migration strategy: strangler fig, parallel run, or big bang — with justification

4. SCALING STRATEGY
   - Horizontal vs. vertical scaling decision per component
   - Caching strategy (what, where, TTL, invalidation)
   - Database strategy (read replicas, sharding key, connection pooling)

5. ROLLOUT PLAN
   Phased migration with rollback criteria at each phase. Include estimated team-weeks per phase.`,
  },
  {
    name: 'Socratic Debugger',
    content: `You are a senior engineer who teaches debugging through the Socratic method. You NEVER give the answer directly — instead, you ask precisely targeted questions that lead the developer to find the bug themselves.

The developer's problem: {{problem_description}}

Technology: {{tech_stack}}

Rules:
- Ask exactly ONE question at a time
- Each question must narrow the problem space by at least 50%
- Start broad (is it a logic error, data error, environment error, or timing error?)
- Then systematically narrow: which component? which function? which line? which variable?
- If the developer seems stuck after 3 questions on the same area, give a HINT (not the answer) — frame it as "What would happen if you checked X?"
- After each answer, briefly explain WHY you asked that question (teach the debugging methodology)
- Track the hypothesis space: maintain a running list of "ruled out" and "still possible" causes

Goal: The developer should find the bug AND learn a repeatable debugging framework. End by summarizing the debugging path taken and the general principle it illustrates.

Begin by asking your first diagnostic question.`,
  },
  {
    name: 'Creative Brief Generator',
    content: `You are a creative director at a top-tier agency (Wieden+Kennedy caliber) building a creative brief.

Product/Idea: {{product}}
Target market: {{target_market}}
Business objective: {{business_objective}}

Generate a comprehensive creative brief:

1. STRATEGIC FOUNDATION
   - Single-minded proposition (one sentence that captures the core value)
   - Positioning statement: For [audience] who [need], [product] is the [category] that [differentiator] because [reason to believe]
   - Brand personality: 5 adjectives with behavioral examples of each

2. AUDIENCE DEEP-DIVE
   - Primary segment: demographics, psychographics, media habits, purchase triggers
   - Audience tension: the internal conflict your brand resolves
   - "Day in the life" narrative (150 words) showing where the product fits

3. MESSAGING HIERARCHY
   - Headline message (7 words max)
   - Supporting messages (3, prioritized)
   - Proof points for each message
   - Tone spectrum: place on scales (formal↔casual, serious↔playful, premium↔accessible)

4. CREATIVE TERRITORY
   - 3 tagline options (with rationale for each)
   - Visual direction: color palette, typography mood, photographic style, layout principles
   - Mandatory elements and no-go zones

5. CHANNEL STRATEGY
   - Primary, secondary, and ambient channels with role of each
   - Content format recommendations per channel
   - Sequencing: what launches first and why`,
  },
  {
    name: 'Decision Matrix Builder',
    content: `You are a decision science expert who builds rigorous decision frameworks.

Decision to make: {{decision}}
Options being considered: {{options}}
Key stakeholders: {{stakeholders}}
Timeline: {{timeline}}

Build a complete decision matrix:

STEP 1 — CRITERIA EXTRACTION
Identify 6-10 evaluation criteria. For each:
- Name and definition (precise enough that two people would score the same way)
- Weight (must sum to 100%) with justification for the weighting
- Measurement method (quantitative where possible, defined rubric where not)

STEP 2 — SCORING
Score each option 1-5 on each criterion. Show your reasoning for every score in one sentence. Flag any score where you have low confidence.

STEP 3 — SENSITIVITY ANALYSIS
- Identify the top 2 criteria that, if re-weighted, would change the outcome
- Run the scenario: what happens if criterion X matters 2x more? What breaks?
- Identify the "regret minimization" option (which choice minimizes worst-case regret?)

STEP 4 — RECOMMENDATION
- Quantitative winner (highest weighted score)
- Qualitative assessment (does the math match your gut? If not, what's the model missing?)
- Final recommendation with confidence level and the ONE thing that would change your mind

Present the matrix as a clean table. Be specific, not generic.`,
  },
  {
    name: 'Technical RFC Writer',
    content: `You are a principal engineer writing a technical RFC/design document.

Idea (rough): {{idea}}
Team context: {{team_context}}
Constraints: {{constraints}}

Produce a complete RFC:

---
RFC: {{idea}}
Author: [your name]
Status: Draft
Date: [today]
Reviewers: [suggested reviewers based on scope]
---

## 1. Problem Statement
What is broken or missing? Who is affected? Quantify the impact (requests/day, hours wasted, error rate, revenue at risk). Include a concrete user story.

## 2. Proposed Solution
High-level approach in 3-5 sentences. Then a detailed technical design:
- Architecture changes (with before/after diagrams in ASCII)
- API contracts (request/response schemas)
- Data model changes (migration strategy)
- Key algorithms or logic flows (pseudocode for complex parts)

## 3. Alternatives Considered
For each alternative: what it is, why it's appealing, and the specific reason it was rejected. Minimum 2 alternatives.

## 4. Risks and Mitigations
| Risk | Probability | Impact | Mitigation |
For each: concrete mitigation, not just "we'll monitor it."

## 5. Rollout Plan
- Feature flag strategy
- Rollout phases (% of traffic)
- Rollback criteria (specific metrics and thresholds)
- Monitoring and alerting additions

## 6. Success Metrics
- Primary metric with target and measurement method
- Counter-metrics (what could get WORSE and how we'll watch for it)
- Timeline: when do we evaluate success?

## 7. Open Questions
Numbered list of unresolved decisions that need reviewer input.`,
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
  const data = JSON.stringify({ name: prompt.name, content: prompt.content, variables: prompt.variables, isPinned: prompt.isPinned });
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

  // Filter prompts by search query and sort pinned first
  const filteredPrompts = prompts
    .filter((p) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(query) || p.content.toLowerCase().includes(query);
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt - a.updatedAt;
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
      isPinned: false,
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
        // Handle backwards compatibility - add isPinned to old prompts
        const withPinned = parsed.map((p: Prompt) => ({
          ...p,
          isPinned: p.isPinned || false,
        }));
        setPrompts(withPinned);
        if (withPinned.length > 0) setSelectedId(withPinned[0].id);
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
      isPinned: selectedPrompt.isPinned,
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

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPrompts(prompts.map((p) => 
      p.id === id ? { ...p, isPinned: !p.isPinned } : p
    ));
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
      isPinned: selectedPrompt.isPinned,
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
        className="md:hidden fixed top-16 left-3 z-50 p-3 min-w-[44px] min-h-[44px] flex items-center justify-center border border-[#1a1a1a] bg-[#08080a] text-sm font-[family-name:var(--font-mono)] hover:border-[#333] transition-colors"
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? '\u00d7' : '\u2261'}
      </button>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex h-screen pt-14">
        {/* Sidebar */}
        <div className={`
          md:w-64 md:relative fixed inset-y-0 left-0 z-40
          transform transition-transform duration-200 ease-out
          bg-[#08080a] border-r border-[#1a1a1a] flex flex-col
          w-72 pt-14
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}>
          <div className="px-4 py-5 border-b border-[#1a1a1a]">
            <h1 className="text-base font-[family-name:var(--font-display)] text-[#ebebeb] tracking-tight">Prompt Library</h1>
            <p className="text-[11px] text-[#555] mt-1 font-[family-name:var(--font-body)] tracking-wide uppercase">Organize &middot; Version &middot; Test</p>
          </div>

          <div className="px-3 py-2 border-b border-[#1a1a1a]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search&#x2026;"
              className="w-full px-3 py-2.5 bg-transparent border border-[#1a1a1a] text-xs font-[family-name:var(--font-body)] outline-none focus:border-[#333] text-[#ebebeb] placeholder:text-[#444] min-h-[44px] transition-colors"
            />
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {filteredPrompts.map((prompt) => (
              <div key={prompt.id} className="w-full group px-2">
                <button
                  onClick={() => {
                    setSelectedId(prompt.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 mb-px text-sm font-[family-name:var(--font-body)] truncate transition-colors min-h-[44px] flex items-center justify-between ${
                    selectedId === prompt.id
                      ? 'bg-[#ebebeb]/[0.07] text-[#ebebeb] border-l-2 border-l-[#ebebeb]'
                      : 'text-[#777] hover:text-[#ebebeb] hover:bg-[#ebebeb]/[0.03] border-l-2 border-l-transparent'
                  }`}
                >
                  <span className="truncate">{prompt.name}</span>
                  <button
                    onClick={(e) => togglePin(prompt.id, e)}
                    className={`ml-2 text-xs transition-colors flex-shrink-0 ${
                      prompt.isPinned ? 'text-[#ebebeb]' : 'text-[#333] opacity-0 group-hover:opacity-100 hover:text-[#777]'
                    }`}
                    title={prompt.isPinned ? 'Unpin' : 'Pin to top'}
                  >
                    {prompt.isPinned ? '\u25cf' : '\u25cb'}
                  </button>
                </button>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-[#1a1a1a] space-y-1.5">
            <button
              onClick={() => setShowNewPrompt(true)}
              className="w-full px-3 py-2.5 border border-[#1a1a1a] hover:border-[#333] text-xs font-[family-name:var(--font-body)] tracking-wide uppercase transition-colors min-h-[44px] flex items-center justify-center text-[#ebebeb]"
            >
              New Prompt
            </button>
            <button
              onClick={importFromFile}
              className="w-full px-3 py-2.5 text-xs font-[family-name:var(--font-body)] text-[#555] hover:text-[#999] transition-colors min-h-[44px] flex items-center justify-center"
            >
              Import .md
            </button>
            <div className="relative">
              <button
                onClick={() => setShowPresetDropdown(!showPresetDropdown)}
                className="w-full px-3 py-2.5 text-xs font-[family-name:var(--font-body)] text-[#555] hover:text-[#999] transition-colors min-h-[44px] flex justify-between items-center"
              >
                <span>Templates</span>
                <span className="text-[10px]">{showPresetDropdown ? '\u25b2' : '\u25bc'}</span>
              </button>
              {showPresetDropdown && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#0c0c0e] border border-[#1a1a1a] shadow-2xl z-10 max-h-48 overflow-y-auto">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        loadPreset(preset);
                        setShowPresetDropdown(false);
                      }}
                      className="w-full px-3 py-2.5 text-left text-xs font-[family-name:var(--font-body)] text-[#777] hover:text-[#ebebeb] hover:bg-[#ebebeb]/[0.04] transition-colors min-h-[44px] flex items-center"
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
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedPrompt ? (
            <>
              {/* Header */}
              <div className="px-4 md:px-6 py-3 border-b border-[#1a1a1a] flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-0">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-lg md:text-xl font-[family-name:var(--font-display)] bg-transparent border-none outline-none text-[#ebebeb] w-full md:w-80 tracking-tight"
                />
                <div className="flex flex-wrap gap-px">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`px-3 py-2 text-xs font-[family-name:var(--font-mono)] tracking-tight transition-colors min-h-[44px] min-w-[44px] flex items-center border ${
                      showSettings ? 'border-[#333] text-[#ebebeb] bg-[#ebebeb]/[0.05]' : 'border-[#1a1a1a] text-[#555] hover:text-[#999] hover:border-[#333]'
                    }`}
                  >
                    settings
                  </button>
                  <button
                    onClick={sharePrompt}
                    className="px-3 py-2 text-xs font-[family-name:var(--font-mono)] tracking-tight border border-[#1a1a1a] text-[#555] hover:text-[#999] hover:border-[#333] transition-colors min-h-[44px] min-w-[44px] flex items-center"
                  >
                    share
                  </button>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className={`px-3 py-2 text-xs font-[family-name:var(--font-mono)] tracking-tight transition-colors min-h-[44px] min-w-[44px] flex items-center border ${
                      showPreview ? 'border-[#333] text-[#ebebeb] bg-[#ebebeb]/[0.05]' : 'border-[#1a1a1a] text-[#555] hover:text-[#999] hover:border-[#333]'
                    }`}
                  >
                    {showPreview ? 'edit' : 'preview'}
                  </button>
                  <button
                    onClick={savePrompt}
                    className="px-3 py-2 text-xs font-[family-name:var(--font-mono)] tracking-tight border border-[#1a1a1a] text-[#ebebeb] hover:bg-[#ebebeb]/[0.07] hover:border-[#333] transition-colors min-h-[44px] min-w-[44px] flex items-center"
                  >
                    save
                  </button>
                  <button
                    onClick={() => deletePrompt(selectedPrompt.id)}
                    className="px-3 py-2 text-xs font-[family-name:var(--font-mono)] tracking-tight border border-[#1a1a1a] text-[#444] hover:text-[#c33] hover:border-[#c33]/30 transition-colors min-h-[44px] min-w-[44px] flex items-center"
                  >
                    delete
                  </button>
                </div>
              </div>

              {/* Settings Panel */}
              {showSettings && (
                <div className="px-4 md:px-6 py-4 border-b border-[#1a1a1a]">
                  <h3 className="text-[11px] font-[family-name:var(--font-body)] tracking-widest uppercase text-[#555] mb-3">API Configuration</h3>
                  <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-start">
                    <div className="flex-1 w-full">
                      <label className="text-[11px] text-[#444] block mb-1 font-[family-name:var(--font-mono)]">api_key</label>
                      <input
                        type="password"
                        value={settings.apiKey}
                        onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                        placeholder="sk-&#x2026; or ant-&#x2026;"
                        className="w-full px-3 py-2.5 bg-transparent border border-[#1a1a1a] text-sm font-[family-name:var(--font-mono)] outline-none focus:border-[#333] min-h-[44px] text-[#ebebeb] placeholder:text-[#333] transition-colors"
                      />
                    </div>
                    <div className="w-full md:w-52">
                      <label className="text-[11px] text-[#444] block mb-1 font-[family-name:var(--font-mono)]">model</label>
                      <select
                        value={settings.model}
                        onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                        className="w-full px-3 py-2.5 bg-[#08080a] border border-[#1a1a1a] text-sm font-[family-name:var(--font-mono)] outline-none focus:border-[#333] min-h-[44px] text-[#ebebeb] transition-colors"
                      >
                        {MODELS.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#333] mt-3 font-[family-name:var(--font-mono)]">
                    Keys stored locally. Sent only to the provider API.
                  </p>
                </div>
              )}

              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Editor / Preview */}
                <div className="flex-1 p-4 md:p-6 overflow-auto">
                  {showPreview ? (
                    <div className="space-y-4">
                      <div className="p-5 border border-[#1a1a1a]">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-[11px] font-[family-name:var(--font-body)] tracking-widest uppercase text-[#555]">Rendered Output</h3>
                          <button
                            onClick={() => copyToClipboard(previewContent)}
                            className="text-[11px] font-[family-name:var(--font-mono)] text-[#444] hover:text-[#999] transition-colors"
                          >
                            copy
                          </button>
                        </div>
                        <pre className="whitespace-pre-wrap text-sm text-[#ccc] font-[family-name:var(--font-mono)] leading-relaxed">
                          {previewContent}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full h-full bg-transparent p-5 text-sm font-[family-name:var(--font-mono)] text-[#ccc] leading-relaxed resize-none outline-none border border-[#1a1a1a] focus:border-[#333] transition-colors min-h-[300px] md:min-h-0 placeholder:text-[#333]"
                      placeholder="Write your prompt here&#x2026; Use {{variable}} for variables."
                    />
                  )}
                </div>

                {/* Variables Panel */}
                <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-[#1a1a1a] p-4 md:p-5 overflow-y-auto">
                  <h3 className="text-[11px] font-[family-name:var(--font-body)] tracking-widest uppercase text-[#555] mb-4">Variables</h3>
                  {selectedPrompt.variables.length === 0 ? (
                    <p className="text-xs text-[#444] font-[family-name:var(--font-mono)]">No variables. Use {'{{variable}}'} syntax.</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedPrompt.variables.map((v) => (
                        <div key={v}>
                          <label className="text-[11px] text-[#444] block mb-1 font-[family-name:var(--font-mono)]">{v}</label>
                          <input
                            type="text"
                            value={testValues[v] || ''}
                            onChange={(e) => setTestValues({ ...testValues, [v]: e.target.value })}
                            className="w-full px-3 py-2.5 bg-transparent border border-[#1a1a1a] text-sm font-[family-name:var(--font-mono)] outline-none focus:border-[#333] min-h-[44px] text-[#ebebeb] placeholder:text-[#333] transition-colors"
                            placeholder={`${v}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-[#1a1a1a]">
                    <h3 className="text-[11px] font-[family-name:var(--font-body)] tracking-widest uppercase text-[#555] mb-3">Version History</h3>
                    <div className="space-y-px max-h-48 overflow-y-auto">
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
                            className="w-full text-xs font-[family-name:var(--font-mono)] hover:bg-[#ebebeb]/[0.04] p-3 flex justify-between items-center transition-colors min-h-[44px]"
                          >
                            <span className="text-[#555]">v{selectedPrompt.versions.length - i}</span>
                            <span className="text-[#333]">
                              {new Date(v.timestamp).toLocaleTimeString()}
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-px">
                    <button
                      onClick={() => copyToClipboard(editContent)}
                      className="flex-1 px-3 py-2.5 border border-[#1a1a1a] hover:border-[#333] text-xs font-[family-name:var(--font-mono)] text-[#555] hover:text-[#999] transition-colors min-h-[44px] flex items-center justify-center"
                    >
                      copy
                    </button>
                    <button
                      onClick={() => selectedPrompt && exportToMarkdown(selectedPrompt)}
                      className="flex-1 px-3 py-2.5 border border-[#1a1a1a] hover:border-[#333] text-xs font-[family-name:var(--font-mono)] text-[#555] hover:text-[#999] transition-colors min-h-[44px] flex items-center justify-center"
                    >
                      export
                    </button>
                  </div>

                  {/* LLM Test Section */}
                  {llmResponse && (
                    <div className="mt-4 p-4 border border-[#1a1a1a]">
                      <h4 className="text-[11px] font-[family-name:var(--font-body)] tracking-widest uppercase text-[#555] mb-2">Response</h4>
                      <pre className="text-xs text-[#999] font-[family-name:var(--font-mono)] whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">
                        {llmResponse}
                      </pre>
                    </div>
                  )}
                  <div className="mt-4">
                    <button
                      onClick={testWithLLM}
                      disabled={!settings.apiKey || llmLoading}
                      className="w-full px-3 py-2.5 border border-[#1a1a1a] hover:border-[#333] disabled:opacity-30 disabled:cursor-not-allowed text-xs font-[family-name:var(--font-mono)] text-[#ebebeb] transition-colors min-h-[44px]"
                    >
                      {llmLoading ? 'calling api\u2026' : 'test with llm'}
                    </button>
                    {!settings.apiKey && (
                      <p className="text-[11px] text-[#333] mt-2 text-center font-[family-name:var(--font-mono)]">Configure API key in settings</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center">
                <p className="text-base font-[family-name:var(--font-display)] text-[#555] mb-2 tracking-tight">No prompt selected</p>
                <p className="text-xs font-[family-name:var(--font-body)] text-[#333]">Create a new prompt or load a template to begin</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Prompt Modal */}
      {showNewPrompt && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0c0c0e] p-5 md:p-6 w-full max-w-sm border border-[#1a1a1a]">
            <h2 className="text-base font-[family-name:var(--font-display)] mb-4 tracking-tight text-[#ebebeb]">New Prompt</h2>
            <input
              type="text"
              value={newPromptName}
              onChange={(e) => setNewPromptName(e.target.value)}
              placeholder="Prompt name&#x2026;"
              className="w-full px-4 py-3 bg-transparent border border-[#1a1a1a] mb-4 outline-none focus:border-[#333] min-h-[44px] text-sm font-[family-name:var(--font-body)] text-[#ebebeb] placeholder:text-[#333] transition-colors"
              autoFocus
            />
            <div className="flex gap-px">
              <button
                onClick={() => {
                  setShowNewPrompt(false);
                  setNewPromptName('');
                }}
                className="flex-1 px-4 py-3 border border-[#1a1a1a] hover:border-[#333] text-xs font-[family-name:var(--font-mono)] text-[#555] hover:text-[#999] transition-colors min-h-[44px] flex items-center justify-center"
              >
                cancel
              </button>
              <button
                onClick={() => newPromptName && createPrompt(newPromptName)}
                disabled={!newPromptName}
                className="flex-1 px-4 py-3 border border-[#1a1a1a] hover:border-[#333] text-xs font-[family-name:var(--font-mono)] text-[#ebebeb] disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-h-[44px] flex items-center justify-center"
              >
                create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="mx-auto max-w-3xl px-4 pb-12">
        <Comments slug="prompt-library" />
      </div>
    </div>
  );
}

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
    name: 'Strategic Advisor',
    content: `You are a senior strategy partner at a top-tier consultancy. Your client needs a rigorous strategic analysis — not platitudes.

Industry/Company: {{company_or_industry}}
Strategic Question: {{strategic_question}}
Known Constraints: {{constraints}}

Execute this analysis in order:

1. SITUATION DECOMPOSITION: Break the strategic question into 3-5 sub-problems. For each, state what you know, what you'd need to validate, and your confidence level (high/medium/low).

2. FRAMEWORK APPLICATION: Apply the most relevant frameworks (Porter's Five Forces, SWOT, Blue Ocean Strategy Canvas, Ansoff Matrix — choose based on fit, not habit). Show your work. Identify where frameworks conflict and why.

3. COMPETITIVE DYNAMICS: Map the competitive landscape. Identify the 2-3 moves competitors are most likely to make in response to each strategic option. Think second-order effects.

4. OPTIONS MATRIX: Present 3 distinct strategic options. For each:
   - Core thesis (one sentence)
   - Required capabilities and investments
   - Key risks with mitigation strategies
   - Expected timeline to measurable impact
   - Confidence level with reasoning

5. RECOMMENDATION: Choose one option. Defend it against the strongest counterargument. Provide a 90-day action plan with specific milestones.

Be direct. Flag where you're speculating vs. reasoning from evidence. If the question is poorly framed, reframe it before answering.`,
  },
  {
    name: 'System Prompt Engineer',
    content: `You are an expert prompt engineer. Your task: take a rough, informal description of an AI behavior and produce a production-grade system prompt.

Rough description of desired AI behavior:
{{rough_description}}

Target model: {{target_model}}
Primary use case: {{use_case}}

Generate a complete system prompt that includes ALL of the following sections:

PERSONA & ROLE: Define who the AI is — not just a job title, but expertise level, communication style, and mental model. Ground it in a specific archetype (e.g., "seasoned staff engineer at a Series C startup" not "helpful coding assistant").

CORE INSTRUCTIONS: The 5-8 most critical behavioral rules. Use imperative mood. Be specific enough that compliance is unambiguous. Order by priority.

OUTPUT FORMAT: Exact structure of expected responses. Use a concrete example showing headers, formatting, length expectations. Specify what to include AND what to omit.

CONSTRAINTS & GUARDRAILS: What the AI must never do. What it should do when uncertain. How to handle out-of-scope requests. Edge cases and how to handle them.

CHAIN-OF-THOUGHT SCAFFOLDING: If the task requires reasoning, embed a thinking structure the AI should follow before responding. Make it explicit.

FEW-SHOT EXAMPLES: Include 2-3 input/output pairs that demonstrate ideal behavior, including at least one edge case. These should be realistic, not toy examples.

EVALUATION CRITERIA: How would you grade the AI's output? List 3-5 specific quality signals so the prompt user can assess if it's working.

Output the system prompt inside a markdown code block. After the prompt, add a "PROMPT DESIGN NOTES" section explaining your key decisions and trade-offs.`,
  },
  {
    name: 'Code Architect',
    content: `You are a staff-level software architect conducting an architecture review. Think in systems, not features.

System/Project: {{system_description}}
Current Scale: {{current_scale}}
Target Scale (12-18 months): {{target_scale}}
Primary Concern: {{primary_concern}}

Produce an architecture analysis covering:

1. SYSTEM TOPOLOGY: Describe the current architecture as you understand it. Draw out the dependency graph mentally. Identify the critical path, single points of failure, and hidden coupling. State your assumptions explicitly.

2. BOTTLENECK ANALYSIS: Where will this system break first as it scales? Distinguish between:
   - Vertical limits (single-node ceilings)
   - Horizontal limits (coordination costs, consistency boundaries)
   - Operational limits (deployment complexity, debugging difficulty)

3. TRADE-OFF MATRIX: For the primary concern, identify the key architectural trade-offs at play (consistency vs. availability, coupling vs. duplication, flexibility vs. complexity). State which side the current architecture leans toward and whether that's correct given the requirements.

4. RECOMMENDED CHANGES: Prioritized list of architectural changes. For each:
   - What changes and why
   - What you're trading away (be honest about costs)
   - Effort estimate (S/M/L) and risk level
   - Dependencies and ordering constraints

5. MIGRATION STRATEGY: A phased approach to implement changes without stopping feature development. Include:
   - Strangler fig patterns or parallel-run strategies where applicable
   - Data migration approach
   - Rollback plan for each phase
   - Feature flags and gradual rollout strategy

6. DECISION RECORDS: For the 2-3 most important decisions, write a brief ADR (Architecture Decision Record): context, decision, consequences.

Avoid: hand-wavy "use microservices" advice. Every recommendation must include the specific failure mode it prevents.`,
  },
  {
    name: 'Socratic Debugger',
    content: `You are a senior engineer pair-programming with a colleague who's stuck on a bug. Your approach: NEVER give the answer directly. Use the Socratic method to help them find it themselves.

Bug description: {{bug_description}}
What they've tried: {{what_theyve_tried}}
Tech stack: {{tech_stack}}

Follow this protocol:

PHASE 1 — REPRODUCE: Ask questions to establish exact reproduction steps. Don't assume their description is complete. Probe for: "What did you expect to happen? What actually happened? Is it deterministic?"

PHASE 2 — ISOLATE: Help them narrow the search space by 50% with each question. Use binary-search thinking: "Does the bug persist if you [remove/change X]?" Guide them toward the minimal reproduction case.

PHASE 3 — HYPOTHESIZE: Once the scope is narrow, ask them to form 2-3 hypotheses about root cause. For each, ask: "How would we test this hypothesis? What evidence would confirm or rule it out?"

PHASE 4 — VERIFY: Guide them to the definitive test. When they find the root cause, ask: "Why does this bug exist? What systemic issue allowed it? How would you prevent this class of bug in the future?"

RULES:
- Ask ONE question at a time. Wait for their response.
- If they're going down a dead end, don't say "that's wrong" — ask a question that reveals the contradiction.
- If they're frustrated, acknowledge it, then refocus: "Let's step back. What's the simplest thing we know for certain?"
- Resist the urge to teach. Your questions should create "aha" moments.
- If they explicitly ask for the answer after genuine effort, provide it — but explain the reasoning path they could have followed.

Start with Phase 1. Ask your first question.`,
  },
  {
    name: 'Creative Brief Generator',
    content: `You are a brand strategist with 15 years at agencies like Wieden+Kennedy and 72andSunny. You think in positioning, not features.

Product/Idea: {{product_or_idea}}
Target Market: {{target_market}}
Competitive Landscape: {{competitors}}
Budget Tier: {{budget_tier}}

Generate a comprehensive creative brief:

1. STRATEGIC FOUNDATION
   - Single-sentence positioning statement (format: "For [audience] who [need], [product] is the [category] that [key differentiator] because [reason to believe]")
   - Brand tension: What cultural or emotional tension does this brand resolve?
   - Enemy: What are you positioning against? (A competitor, a behavior, a belief — not just "the status quo")

2. AUDIENCE ARCHITECTURE
   - Primary audience: Demographics + psychographics + media diet + aspiration identity
   - Secondary audience: Who influences the primary?
   - Audience insight: One non-obvious truth about their relationship with this category. Start with "They say... but actually..."

3. MESSAGING HIERARCHY
   - Brand promise (emotional, 5 words or fewer)
   - Key messages (3, ordered by priority, each with a proof point)
   - Permission-to-believe chain: Why should a skeptic trust this?

4. TONE & VOICE
   - Voice character in 3 adjectives (with "but not" qualifiers, e.g., "Confident but not arrogant")
   - Vocabulary register: Words you'd use vs. words you'd never use
   - Sample sentence in the brand voice for: a headline, a push notification, an error message

5. CREATIVE TERRITORIES
   - 3 distinct creative directions, each with: a working tagline, visual mood (reference existing work/aesthetics), a sample execution concept
   - Rank by strategic fit vs. creative ambition

6. MEASUREMENT FRAMEWORK: What does success look like in 30/90/180 days? Be specific.`,
  },
  {
    name: 'Decision Matrix Builder',
    content: `You are a decision analyst. Help structure a complex decision using weighted-criteria analysis. No gut feelings — only structured reasoning.

Decision to make: {{decision}}
Options being considered: {{options}}
Key stakeholders: {{stakeholders}}
Decision deadline: {{deadline}}

Execute this analysis:

1. DECISION FRAMING: Restate the decision as a clear, unambiguous question. Identify: Is this a one-way door (irreversible) or two-way door (reversible)? What is the cost of delay vs. the cost of a wrong decision?

2. CRITERIA IDENTIFICATION: Generate 6-10 evaluation criteria. For each:
   - Name and precise definition (specific enough that two people would score the same way)
   - Weight (1-10) with explicit justification for the weighting
   - Measurement method (how do you actually score this?)
   Split into: must-have criteria (binary pass/fail) and differentiating criteria (scored).

3. SCORING MATRIX: Score each option against each criterion (1-10). Show a formatted table. Explain scores that aren't obvious. Flag any score where reasonable people might disagree and note the range.

4. SENSITIVITY ANALYSIS:
   - Which criteria weights, if changed, would flip the recommendation?
   - What new information would change the outcome?
   - Run a scenario where you double-weight the criterion you're least confident about.

5. RISK OVERLAY: For the top 2 options, identify:
   - Biggest downside risk and its probability
   - What's the "regret minimization" choice?
   - What would need to be true for the losing option to actually be the right call?

6. RECOMMENDATION: State your recommendation clearly. Provide a pre-mortem: "It's 12 months later and this decision failed — what went wrong?" Use that to define 2-3 early warning signals to monitor.

Present all numerical analysis in clean tables. Be explicit about uncertainty.`,
  },
  {
    name: 'Technical RFC Writer',
    content: `You are a principal engineer drafting an RFC for a technical proposal. Write for an audience of senior engineers who will poke holes in every claim.

Title: {{rfc_title}}
Problem Space: {{problem_description}}
Author/Team: {{author}}
Proposed Approach (rough): {{rough_approach}}

Generate a complete RFC in this structure:

## Status: Draft
## Author: {{author}}

### 1. Problem Statement
Define the problem precisely. Include: who is affected, how frequently, what's the current workaround, and what's the cost of inaction. Use concrete numbers where possible. Separate symptoms from root cause.

### 2. Goals and Non-Goals
- GOALS: What this RFC solves (measurable, time-bound)
- NON-GOALS: What this explicitly does NOT address and why. This section is as important as Goals.

### 3. Proposed Solution
Describe the approach in enough detail that another engineer could implement it. Include:
- System design with component interactions
- API contracts or interface changes
- Data model changes
- Key algorithms or logic flows
Avoid: hand-waving ("we'll figure out the caching layer later").

### 4. Alternatives Considered
For each alternative (minimum 2):
- Describe the approach fairly (steelman it)
- Why it was rejected — specific technical trade-offs, not vibes
- What conditions would make this alternative the better choice

### 5. Technical Risks & Mitigations
Enumerate risks. For each: likelihood, impact, detection strategy, and mitigation plan. Include at least one risk that's uncomfortable to talk about.

### 6. Rollout Plan
- Feature flag strategy
- Phased rollout stages with go/no-go criteria
- Rollback procedure with estimated rollback time
- Data migration approach (if applicable)

### 7. Success Metrics
- Primary metric with target and measurement method
- Guardrail metrics (things that should NOT change)
- Timeline for evaluation

### 8. Open Questions
List 3-5 unresolved questions that need input from reviewers. For each, state the current leading hypothesis and what information would resolve it.

Write clearly. Prefer concrete examples over abstract descriptions. Flag assumptions.`,
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

"use client";

import { useEffect, useMemo, useState } from "react";
import { generateSpecMarkdown, type SpecInput, type ToolContract, type EvalCase, EVAL_CATEGORIES } from "@/app/e/agent-spec-builder/lib/spec";
import { presets } from "@/app/e/agent-spec-builder/lib/presets";
import { Comments } from '@/components/comments/Comments';
import Link from 'next/link';
import { decodeSpecState, encodeSpecState } from "@/app/e/agent-spec-builder/lib/share";
import { lintSpec } from "@/app/e/agent-spec-builder/lib/lint";
import { evaluateQuality, qualityLabel, qualityColor, qualityTextColor } from "@/app/e/agent-spec-builder/lib/quality";
import { downloadExportPack } from "@/app/e/agent-spec-builder/lib/export-pack";
import { downloadPromptPack } from "@/app/e/agent-spec-builder/lib/prompt-pack";
import { getStats, trackEvent, trackSession, formatStatsSummary, type LocalStats } from "@/app/e/agent-spec-builder/lib/local-stats";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const empty: SpecInput = {
  appName: "Agent Spec",
  objective: "",
  primaryUsers: "",
  context: "",
  tools: "",
  dataSources: "",
  constraints: "",
  successMetrics: "",
  nonGoals: "",
  risks: "",
  p95Latency: "",
  maxCostPerDay: "",
  maxRetries: "",
  degradeTo: "",
  toolContracts: [],
  evalCases: [],
};

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [input, setInput] = useState<SpecInput>(empty);
  const [toast, setToast] = useState<string>("");
  const [stats, setStats] = useState<LocalStats | null>(null);

  // Track session on mount
  useEffect(() => {
    const s = trackSession();
    setStats(s);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);

    const shared = params.get("s");
    if (shared) {
      const decoded = decodeSpecState(shared);
      if (decoded) {
        setInput(decoded);
        return;
      }
    }

    const exampleId = params.get("example");
    if (!exampleId) return;
    const preset = presets.find((p) => p.id === exampleId);
    if (preset) setInput(preset.data);
  }, []);

  const md = useMemo(() => generateSpecMarkdown(input), [input]);
  const findings = useMemo(() => lintSpec(input), [input]);
  const quality = useMemo(() => evaluateQuality(input), [input]);
  const [previewMode, setPreviewMode] = useState<"raw" | "preview">("raw");

  async function copy() {
    try {
      await navigator.clipboard.writeText(md);
      setStats(trackEvent("copies"));
      setToast("Copied to clipboard.");
    } catch {
      setToast("Copy failed (browser blocked clipboard). Use manual copy.");
    } finally {
      window.setTimeout(() => setToast(""), 2500);
    }
  }

  async function copyShareLink() {
    try {
      const params = new URLSearchParams(window.location.search);
      params.delete("example");
      params.set("s", encodeSpecState(input));
      const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
      await navigator.clipboard.writeText(url);
      setStats(trackEvent("shares"));
      setToast("Share link copied.");
    } catch {
      setToast("Couldn\'t create share link (too long or browser blocked clipboard).");
    } finally {
      window.setTimeout(() => setToast(""), 2500);
    }
  }

  return (
    <div className="min-h-screen bg-[#08080a] text-[#ebebeb] overflow-x-hidden">
      <header className="border-b border-[#2a2a2a] bg-[#08080a]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Agent Spec Builder
            </h1>
            <p className="text-sm text-zinc-500">
              Turn an agent idea into an implementable Markdown spec (no backend —
              stays in your browser).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/examples"
              className="text-sm text-zinc-500 hover:text-[#ebebeb]"
            >
              Examples
            </a>
            <a
              href="https://github.com"
              className="text-sm text-zinc-500 hover:text-[#ebebeb]"
              target="_blank"
              rel="noreferrer"
              title="Repo link is in README after you deploy"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-6 grid-cols-1 lg:grid-cols-2 overflow-hidden">
        <section className="border border-[#2a2a2a] bg-[#08080a] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold">Inputs</h2>
              <p className="text-sm text-zinc-500">
                Keep it rough. The output is meant to be iterated with your team.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {presets.map((p) => (
                <button
                  key={p.id}
                  className="border border-[#2a2a2a] bg-[#08080a] px-3 py-1 text-sm text-zinc-400 hover:bg-[#2a2a2a] hover:text-[#ebebeb]"
                  onClick={() => {
                    setInput(p.data);
                    setStats(trackEvent("presetLoads"));
                  }}
                  type="button"
                >
                  {p.label}
                </button>
              ))}
              <button
                className="border border-[#2a2a2a] bg-[#08080a] px-3 py-1 text-sm text-zinc-400 hover:bg-[#2a2a2a] hover:text-[#ebebeb]"
                onClick={() => setInput(empty)}
                type="button"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Spec Quality Meter */}
          <div className="mt-4 border border-[#2a2a2a] bg-[#0a0a0c] p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-zinc-300">
                Spec completeness
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold tabular-nums ${qualityTextColor(quality.score)}`}>
                  {quality.score}%
                </span>
                <span className="text-xs text-zinc-500">
                  {qualityLabel(quality.score)}
                </span>
              </div>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden bg-[#1a1a1a] rounded-full">
              <div
                className={`h-full transition-all duration-500 ease-out rounded-full ${qualityColor(quality.score)}`}
                style={{ width: `${quality.score}%` }}
              />
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {quality.categories.map((cat) => (
                <span
                  key={cat.key}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium tracking-wide border ${
                    cat.filled
                      ? "border-emerald-800/40 bg-emerald-950/20 text-emerald-500"
                      : "border-[#2a2a2a] bg-[#08080a] text-zinc-600"
                  }`}
                  title={cat.suggestion || `${cat.label}: complete`}
                >
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${cat.filled ? "bg-emerald-500" : "bg-zinc-700"}`} />
                  {cat.label}
                </span>
              ))}
            </div>
            {quality.categories.some((c) => c.suggestion) && (
              <div className="mt-2 text-[11px] text-zinc-600 leading-snug">
                <span className="text-zinc-500">Next up:</span>{" "}
                {quality.categories.find((c) => c.suggestion && !c.filled)?.suggestion}
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-3">
            <Field
              label="App / Spec name"
              value={input.appName}
              onChange={(v) => setInput({ ...input, appName: v })}
              placeholder="e.g., Support Triage Agent Spec"
              hint="Use a descriptive name your team will recognize — this becomes the doc title."
            />
            <TextArea
              label="Objective"
              value={input.objective}
              onChange={(v) => setInput({ ...input, objective: v })}
              placeholder="What outcome does this agent deliver?"
              rows={3}
              hint='Good: "Reduce avg support response time from 4h to <15min for Tier 1 tickets." Avoid vague goals like "improve customer experience."'
            />
            <TextArea
              label="Problem / Context"
              value={input.context}
              onChange={(v) => setInput({ ...input, context: v })}
              placeholder="What triggers the agent? What environment does it run in?"
              rows={4}
              hint="Describe the trigger event, current pain point, and where this runs (Slack bot, API endpoint, cron job, etc.)."
            />
            <Field
              label="Primary users"
              value={input.primaryUsers}
              onChange={(v) => setInput({ ...input, primaryUsers: v })}
              placeholder="Who uses/depends on it?"
              hint="Be specific: roles, team sizes, or downstream systems (e.g., L1 support reps, 12-person team)."
            />
            <TextArea
              label="Tools (one per line)"
              value={input.tools}
              onChange={(v) => setInput({ ...input, tools: v })}
              placeholder={[
                "Slack: post message",
                "Jira: create ticket (requires approval)",
                "Docs search",
              ].join("\n")}
              rows={5}
              hint="Include permission level for each tool — e.g., read-only, requires human approval, fully autonomous."
            />

            <div className="border border-[#2a2a2a] bg-[#0a0a0c] p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm font-medium text-zinc-300">
                  Tool Contracts (structured)
                </div>
                <button
                  type="button"
                  className="bg-[#ebebeb] px-2 py-1 text-xs font-medium text-[#08080a] hover:bg-white"
                  onClick={() => {
                    const newContract: ToolContract = {
                      id: crypto.randomUUID(),
                      name: "",
                      purpose: "",
                      auth: "",
                      rateLimit: "",
                      inputs: "",
                      outputs: "",
                      failureModes: "",
                      piiHandling: "",
                      idempotent: false,
                    };
                    setInput({
                      ...input,
                      toolContracts: [...(input.toolContracts || []), newContract],
                    });
                  }}
                >
                  + Add tool
                </button>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Add structured contracts for each tool (auth, rate limits, error modes, PII, idempotency).
              </p>

              {input.toolContracts && input.toolContracts.length > 0 && (
                <div className="mt-3 space-y-3">
                  {input.toolContracts.map((tc, idx) => (
                    <div
                      key={tc.id}
                      className="border border-[#2a2a2a] bg-[#08080a] p-3"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          value={tc.name}
                          onChange={(e) => {
                            const updated = [...input.toolContracts];
                            updated[idx] = { ...tc, name: e.target.value };
                            setInput({ ...input, toolContracts: updated });
                          }}
                          placeholder="Tool name (e.g., Slack: post message)"
                          className="flex-1 w-full min-w-0 border border-[#2a2a2a] bg-[#0a0a0c] px-2 py-1 text-sm text-[#ebebeb]"
                        />
                        <button
                          type="button"
                          className="text-xs text-red-500 hover:text-red-400"
                          onClick={() => {
                            const updated = input.toolContracts.filter(
                              (_, i) => i !== idx
                            );
                            setInput({ ...input, toolContracts: updated });
                          }}
                        >
                          Remove
                        </button>
                      </div>
                      <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                        <input
                          value={tc.purpose}
                          onChange={(e) => {
                            const updated = [...input.toolContracts];
                            updated[idx] = { ...tc, purpose: e.target.value };
                            setInput({ ...input, toolContracts: updated });
                          }}
                          placeholder="Purpose (what does this tool do?)"
                          className="w-full border border-[#2a2a2a] bg-[#0a0a0c] px-2 py-1 text-xs text-[#ebebeb]"
                        />
                        <input
                          value={tc.auth}
                          onChange={(e) => {
                            const updated = [...input.toolContracts];
                            updated[idx] = { ...tc, auth: e.target.value };
                            setInput({ ...input, toolContracts: updated });
                          }}
                          placeholder="Auth (e.g., OAuth2, API key, user-approved)"
                          className="w-full border border-[#2a2a2a] bg-[#0a0a0c] px-2 py-1 text-xs text-[#ebebeb]"
                        />
                        <input
                          value={tc.rateLimit}
                          onChange={(e) => {
                            const updated = [...input.toolContracts];
                            updated[idx] = { ...tc, rateLimit: e.target.value };
                            setInput({ ...input, toolContracts: updated });
                          }}
                          placeholder="Rate limit (e.g., 100 req/min)"
                          className="w-full border border-[#2a2a2a] bg-[#0a0a0c] px-2 py-1 text-xs text-[#ebebeb]"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={tc.idempotent}
                            onChange={(e) => {
                              const updated = [...input.toolContracts];
                              updated[idx] = { ...tc, idempotent: e.target.checked };
                              setInput({ ...input, toolContracts: updated });
                            }}
                            className="h-4 w-4"
                          />
                          <span className="text-xs text-zinc-400">Idempotent</span>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                        <textarea
                          value={tc.inputs}
                          onChange={(e) => {
                            const updated = [...input.toolContracts];
                            updated[idx] = { ...tc, inputs: e.target.value };
                            setInput({ ...input, toolContracts: updated });
                          }}
                          placeholder="Inputs (what data does it need?)"
                          rows={2}
                          className="w-full border border-[#2a2a2a] bg-[#0a0a0c] px-2 py-1 text-xs text-[#ebebeb]"
                        />
                        <textarea
                          value={tc.outputs}
                          onChange={(e) => {
                            const updated = [...input.toolContracts];
                            updated[idx] = { ...tc, outputs: e.target.value };
                            setInput({ ...input, toolContracts: updated });
                          }}
                          placeholder="Outputs (what does it return?)"
                          rows={2}
                          className="w-full border border-[#2a2a2a] bg-[#0a0a0c] px-2 py-1 text-xs text-[#ebebeb]"
                        />
                      </div>
                      <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                        <textarea
                          value={tc.failureModes}
                          onChange={(e) => {
                            const updated = [...input.toolContracts];
                            updated[idx] = { ...tc, failureModes: e.target.value };
                            setInput({ ...input, toolContracts: updated });
                          }}
                          placeholder="Failure modes (what can go wrong?)"
                          rows={2}
                          className="w-full border border-[#2a2a2a] bg-[#0a0a0c] px-2 py-1 text-xs text-[#ebebeb]"
                        />
                        <textarea
                          value={tc.piiHandling}
                          onChange={(e) => {
                            const updated = [...input.toolContracts];
                            updated[idx] = { ...tc, piiHandling: e.target.value };
                            setInput({ ...input, toolContracts: updated });
                          }}
                          placeholder="PII handling (any personal data?)"
                          rows={2}
                          className="w-full border border-[#2a2a2a] bg-[#0a0a0c] px-2 py-1 text-xs text-[#ebebeb]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <TextArea
              label="Data sources (one per line)"
              value={input.dataSources}
              onChange={(v) => setInput({ ...input, dataSources: v })}
              placeholder={["Knowledge base", "CRM (read-only)", "Runbooks"].join(
                "\n"
              )}
              rows={4}
              hint="List every data source the agent reads from. Note access patterns (real-time vs. batch, read vs. write)."
            />
            <TextArea
              label="Constraints (one per line)"
              value={input.constraints}
              onChange={(v) => setInput({ ...input, constraints: v })}
              placeholder={[
                "No external sends without approval",
                "PII must not be logged",
              ].join("\n")}
              rows={4}
              hint="Think: compliance, security, rate limits, cost caps, and human-in-the-loop requirements."
            />

            <div className="mt-1 border border-[#2a2a2a] bg-[#0a0a0c] p-3">
              <div className="text-sm font-medium text-zinc-300">
                Cost / latency budget (optional)
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                <Field
                  label="p95 latency"
                  value={input.p95Latency}
                  onChange={(v) => setInput({ ...input, p95Latency: v })}
                  placeholder="e.g., <= 10s"
                  hint="95th percentile — the worst acceptable wait for most users."
                />
                <Field
                  label="Max cost/day"
                  value={input.maxCostPerDay}
                  onChange={(v) => setInput({ ...input, maxCostPerDay: v })}
                  placeholder="e.g., <= $50/day"
                  hint="Include LLM tokens, API calls, and infrastructure."
                />
                <Field
                  label="Max retries"
                  value={input.maxRetries}
                  onChange={(v) => setInput({ ...input, maxRetries: v })}
                  placeholder="e.g., 2"
                  hint="How many times the agent retries before giving up or escalating."
                />
                <Field
                  label="Degrade to"
                  value={input.degradeTo}
                  onChange={(v) => setInput({ ...input, degradeTo: v })}
                  placeholder="e.g., human handoff / safer mode"
                  hint="What happens when the agent fails — silent fallback, alert, or queue for human?"
                />
              </div>
            </div>

            <TextArea
              label="Success metrics (one per line)"
              value={input.successMetrics}
              onChange={(v) => setInput({ ...input, successMetrics: v })}
              placeholder={["Time saved / week", "Accuracy", "CSAT"].join("\n")}
              rows={4}
              hint='Make metrics measurable: "Reduce manual triage from 200 tickets/day to <20" beats "improve efficiency."'
            />
            <TextArea
              label="Non-goals (one per line)"
              value={input.nonGoals}
              onChange={(v) => setInput({ ...input, nonGoals: v })}
              placeholder={["Fully autonomous actions", "Model training"].join(
                "\n"
              )}
              rows={3}
              hint="Explicitly scoping out features prevents scope creep and sets expectations with stakeholders."
            />
            <TextArea
              label="Risks / Open questions (one per line)"
              value={input.risks}
              onChange={(v) => setInput({ ...input, risks: v })}
              placeholder={[
                "Hallucinations without citations",
                "Over-escalation",
              ].join("\n")}
              rows={4}
              hint="Flag unknowns early: model accuracy gaps, missing data, regulatory gray areas, or untested edge cases."
            />

            {/* Eval Rubric Builder */}
            <div className="border border-[#2a2a2a] bg-[#0a0a0c] p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-medium text-zinc-300">
                    Eval Rubric
                  </div>
                  <p className="mt-0.5 text-[11px] text-zinc-600 leading-snug">
                    Define test cases before building — what does "working correctly" look like?
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="bg-[#ebebeb] px-2 py-1 text-xs font-medium text-[#08080a] hover:bg-white"
                    onClick={() => {
                      const newCase: EvalCase = {
                        id: crypto.randomUUID(),
                        category: "accuracy",
                        scenario: "",
                        input: "",
                        expectedBehavior: "",
                        passCriteria: "",
                      };
                      setInput({
                        ...input,
                        evalCases: [...(input.evalCases || []), newCase],
                      });
                    }}
                  >
                    + Add case
                  </button>
                  {(input.evalCases?.length ?? 0) === 0 && (
                    <button
                      type="button"
                      className="border border-emerald-700/50 bg-emerald-950/30 px-2 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-900/40 hover:text-emerald-300"
                      onClick={() => {
                        const starters: EvalCase[] = [
                          {
                            id: crypto.randomUUID(),
                            category: "hallucination",
                            scenario: "Agent asked about unknown topic",
                            input: "User asks a question outside the agent's knowledge base",
                            expectedBehavior: "Agent says it doesn't know or escalates — no fabricated answers",
                            passCriteria: "Response contains no invented facts; cites sources or declines",
                          },
                          {
                            id: crypto.randomUUID(),
                            category: "tool-failure",
                            scenario: "External API returns 500 error",
                            input: "Agent tries to call a tool that is temporarily down",
                            expectedBehavior: "Agent retries once, then gracefully informs the user or escalates",
                            passCriteria: "No crash; user gets a clear fallback message within timeout",
                          },
                          {
                            id: crypto.randomUUID(),
                            category: "compliance",
                            scenario: "User asks agent to perform restricted action",
                            input: "Request that violates a constraint (e.g., send data externally without approval)",
                            expectedBehavior: "Agent refuses and explains why, or requests human approval",
                            passCriteria: "No restricted action taken; constraint respected 100%",
                          },
                          {
                            id: crypto.randomUUID(),
                            category: "accuracy",
                            scenario: "Happy-path task completion",
                            input: "Standard use case with valid inputs",
                            expectedBehavior: "Agent completes the task correctly and efficiently",
                            passCriteria: "Output matches expected result; correct tools called in right order",
                          },
                          {
                            id: crypto.randomUUID(),
                            category: "cost",
                            scenario: "Agent handles a complex multi-step request",
                            input: "Request that could trigger many LLM calls or tool invocations",
                            expectedBehavior: "Agent completes within token/cost budget",
                            passCriteria: "Total tokens < budget; no runaway loops",
                          },
                        ];
                        setInput({ ...input, evalCases: starters });
                      }}
                    >
                      Start with 5 common cases
                    </button>
                  )}
                </div>
              </div>

              {input.evalCases && input.evalCases.length > 0 && (
                <div className="mt-3 space-y-3">
                  {input.evalCases.map((ec, idx) => (
                    <div
                      key={ec.id}
                      className="border border-[#2a2a2a] bg-[#08080a] p-3"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="shrink-0 font-mono text-[10px] text-zinc-600 tabular-nums">
                            #{idx + 1}
                          </span>
                          <select
                            value={ec.category}
                            onChange={(e) => {
                              const updated = [...input.evalCases];
                              updated[idx] = { ...ec, category: e.target.value as EvalCase["category"] };
                              setInput({ ...input, evalCases: updated });
                            }}
                            className="border border-[#2a2a2a] bg-[#0a0a0c] px-2 py-1 text-xs text-[#ebebeb]"
                          >
                            {EVAL_CATEGORIES.map((cat) => (
                              <option key={cat.value} value={cat.value}>
                                {cat.label}
                              </option>
                            ))}
                          </select>
                          <span className="text-[10px] text-zinc-600 truncate hidden sm:inline">
                            {EVAL_CATEGORIES.find(c => c.value === ec.category)?.description}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="text-xs text-red-500 hover:text-red-400 shrink-0"
                          onClick={() => {
                            const updated = input.evalCases.filter((_, i) => i !== idx);
                            setInput({ ...input, evalCases: updated });
                          }}
                        >
                          Remove
                        </button>
                      </div>
                      <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                        <input
                          value={ec.scenario}
                          onChange={(e) => {
                            const updated = [...input.evalCases];
                            updated[idx] = { ...ec, scenario: e.target.value };
                            setInput({ ...input, evalCases: updated });
                          }}
                          placeholder="Scenario (what situation is being tested?)"
                          className="w-full border border-[#2a2a2a] bg-[#0a0a0c] px-2 py-1 text-xs text-[#ebebeb]"
                        />
                        <input
                          value={ec.input}
                          onChange={(e) => {
                            const updated = [...input.evalCases];
                            updated[idx] = { ...ec, input: e.target.value };
                            setInput({ ...input, evalCases: updated });
                          }}
                          placeholder="Input (what triggers this test?)"
                          className="w-full border border-[#2a2a2a] bg-[#0a0a0c] px-2 py-1 text-xs text-[#ebebeb]"
                        />
                      </div>
                      <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                        <input
                          value={ec.expectedBehavior}
                          onChange={(e) => {
                            const updated = [...input.evalCases];
                            updated[idx] = { ...ec, expectedBehavior: e.target.value };
                            setInput({ ...input, evalCases: updated });
                          }}
                          placeholder="Expected behavior (what should the agent do?)"
                          className="w-full border border-[#2a2a2a] bg-[#0a0a0c] px-2 py-1 text-xs text-[#ebebeb]"
                        />
                        <input
                          value={ec.passCriteria}
                          onChange={(e) => {
                            const updated = [...input.evalCases];
                            updated[idx] = { ...ec, passCriteria: e.target.value };
                            setInput({ ...input, evalCases: updated });
                          }}
                          placeholder="Pass criteria (how do you know it passed?)"
                          className="w-full border border-[#2a2a2a] bg-[#0a0a0c] px-2 py-1 text-xs text-[#ebebeb]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="border border-[#2a2a2a] bg-[#08080a] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold">Generated Spec</h2>
              <p className="text-sm text-zinc-500">
                Copy/paste into a repo, doc, ticket, or PRD.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex border border-[#2a2a2a] bg-[#0a0a0c] p-1">
                <button
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    previewMode === "raw"
                      ? "bg-[#2a2a2a] text-[#ebebeb]"
                      : "text-zinc-500 hover:text-[#ebebeb]"
                  }`}
                  onClick={() => setPreviewMode("raw")}
                  type="button"
                >
                  Raw
                </button>
                <button
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    previewMode === "preview"
                      ? "bg-[#2a2a2a] text-[#ebebeb]"
                      : "text-zinc-500 hover:text-[#ebebeb]"
                  }`}
                  onClick={() => setPreviewMode("preview")}
                  type="button"
                >
                  Preview
                </button>
              </div>
              <button
                className="bg-[#ebebeb] px-3 py-2 text-sm font-medium text-[#08080a] hover:bg-white"
                onClick={copy}
                type="button"
              >
                Copy
              </button>
              <button
                className="border border-[#2a2a2a] bg-[#08080a] px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-[#2a2a2a] hover:text-[#ebebeb]"
                onClick={copyShareLink}
                type="button"
                title="Copy a shareable link that includes the current inputs"
              >
                Share link
              </button>
              <button
                className="border border-[#2a2a2a] bg-[#08080a] px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-[#2a2a2a] hover:text-[#ebebeb]"
                onClick={() => {
                  downloadText(
                    `${(input.appName || "agent-spec")
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/(^-|-$)/g, "")}.md`,
                    md
                  );
                  setStats(trackEvent("downloads"));
                }}
                type="button"
              >
                Download .md
              </button>
              <button
                className="border border-emerald-700/50 bg-emerald-950/30 px-3 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-900/40 hover:text-emerald-300"
                onClick={async () => {
                  try {
                    await downloadExportPack(input);
                    setStats(trackEvent("exports"));
                    setToast("Export pack downloaded.");
                  } catch {
                    setToast("Failed to generate export pack.");
                  }
                  window.setTimeout(() => setToast(""), 2500);
                }}
                type="button"
                title="Download a ZIP with SPEC.md, EVAL_PLAN.md, and SECURITY_NOTES.md"
              >
                Export Pack (.zip)
              </button>
              <button
                className="border border-amber-700/50 bg-amber-950/30 px-3 py-2 text-sm font-medium text-amber-400 hover:bg-amber-900/40 hover:text-amber-300"
                onClick={() => {
                  try {
                    downloadPromptPack(input);
                    setStats(trackEvent("promptPacks"));
                    setToast("Prompt pack downloaded.");
                  } catch {
                    setToast("Failed to generate prompt pack.");
                  }
                  window.setTimeout(() => setToast(""), 2500);
                }}
                type="button"
                title="Download 5-10 realistic test prompts tailored to this spec"
              >
                Prompt Pack
              </button>
            </div>
          </div>

          {toast ? (
            <div className="mt-3 border border-[#2a2a2a] bg-[#0a0a0c] px-3 py-2 text-sm text-zinc-400">
              {toast}
            </div>
          ) : null}

          <div className="mt-4 border border-[#2a2a2a] bg-[#0a0a0c] p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-medium text-zinc-300">Spec lint</div>
              <div className="text-xs text-zinc-500">
                {findings.length === 0
                  ? "No obvious gaps"
                  : `${findings.length} suggestion${findings.length === 1 ? "" : "s"}`}
              </div>
            </div>
            {findings.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-zinc-400">
                {findings.map((f) => (
                  <li key={f.id}>
                    <span className="font-medium text-zinc-300">{f.title}</span>
                    {f.detail ? (
                      <span className="text-zinc-500"> — {f.detail}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-2 text-xs text-zinc-500">
                Looks decent for an MVP. If you're handing this to an engineer,
                add one or two concrete eval cases next.
              </div>
            )}
          </div>

          {previewMode === "raw" ? (
            <pre className="mt-4 max-h-[60vh] overflow-auto border border-[#2a2a2a] bg-[#0a0a0c] p-4 text-xs leading-5 text-zinc-300 whitespace-pre-wrap break-words">
              <code>{md}</code>
            </pre>
          ) : (
            <div className="mt-4 max-h-[60vh] overflow-auto border border-[#2a2a2a] bg-[#08080a] p-4 prose prose-sm prose-invert max-w-none break-words">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
            </div>
          )}

          <div className="mt-4 text-xs text-zinc-600">
            MVP note: this tool intentionally avoids calling an LLM. It encodes a
            good structure so humans (or your own model setup) can fill in the
            details.
          </div>
        </section>
      </main>

      <footer className="border-t border-[#2a2a2a] bg-[#08080a]">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 text-xs text-zinc-600">
          <div>
            Built with Next.js + TypeScript + Tailwind. Client-only. No tracking.
          </div>
          <div>
            Tip: Add a small set of &ldquo;golden&rdquo; eval cases early; it prevents agent
            projects from drifting.
          </div>
          {stats && formatStatsSummary(stats) && (
            <div className="mt-1 flex items-center gap-1.5 text-zinc-700">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-700" />
              <span>Your local usage: {formatStatsSummary(stats)}</span>
            </div>
          )}
        </div>
      </footer>

      {/* Comments */}
      <div className="mx-auto max-w-3xl px-4 pb-12">
        <Comments slug="agent-spec-builder" />
      </div>
    </div>
  );
}

function Field(props: {
  label: string;
  value: string;
  placeholder?: string;
  hint?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="grid gap-1">
      <div className="text-sm font-medium text-zinc-400">{props.label}</div>
      {props.hint && (
        <div className="text-[11px] text-zinc-600 leading-snug">{props.hint}</div>
      )}
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        className="h-10 w-full border border-[#2a2a2a] bg-[#0a0a0c] px-3 text-sm text-[#ebebeb] outline-none ring-zinc-700 focus:ring-2"
      />
    </label>
  );
}

function TextArea(props: {
  label: string;
  value: string;
  placeholder?: string;
  hint?: string;
  rows?: number;
  onChange: (v: string) => void;
}) {
  return (
    <label className="grid gap-1">
      <div className="text-sm font-medium text-zinc-400">{props.label}</div>
      {props.hint && (
        <div className="text-[11px] text-zinc-600 leading-snug">{props.hint}</div>
      )}
      <textarea
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        rows={props.rows ?? 4}
        className="w-full border border-[#2a2a2a] bg-[#0a0a0c] px-3 py-2 text-sm text-[#ebebeb] outline-none ring-zinc-700 focus:ring-2"
      />
    </label>
  );
}

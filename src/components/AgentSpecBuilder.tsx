"use client";

import { useEffect, useMemo, useState } from "react";
import { generateSpecMarkdown, type SpecInput, type ToolContract } from "@/lib/agent-spec/spec";
import { presets } from "@/lib/agent-spec/presets";
import { decodeSpecState, encodeSpecState } from "@/lib/agent-spec/share";
import { lintSpec } from "@/lib/agent-spec/lint";
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

export function AgentSpecBuilder() {
  const [input, setInput] = useState<SpecInput>(empty);
  const [toast, setToast] = useState<string>("");

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
  const [previewMode, setPreviewMode] = useState<"raw" | "preview">("raw");

  async function copy() {
    try {
      await navigator.clipboard.writeText(md);
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
      setToast("Share link copied.");
    } catch {
      setToast("Couldnt create share link (too long or browser blocked clipboard).");
    } finally {
      window.setTimeout(() => setToast(""), 2500);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Inputs Section */}
      <section className="border-none border border-[#2a2a2a] bg-white/[0.02] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">Inputs</h2>
            <p className="text-sm text-white/60">
              Keep it rough. The output is meant to be iterated with your team.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {presets.map((p) => (
              <button
                key={p.id}
                className="border-none border border-[#2a2a2a] bg-white/5 px-3 py-1 text-sm text-white/80 hover:bg-white/10"
                onClick={() => setInput(p.data)}
                type="button"
              >
                {p.label}
              </button>
            ))}
            <button
              className="border-none border border-[#2a2a2a] bg-white/5 px-3 py-1 text-sm text-white/80 hover:bg-white/10"
              onClick={() => setInput(empty)}
              type="button"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          <Field
            label="App / Spec name"
            value={input.appName}
            onChange={(v) => setInput({ ...input, appName: v })}
            placeholder="e.g., Support Triage Agent Spec"
          />
          <TextArea
            label="Objective"
            value={input.objective}
            onChange={(v) => setInput({ ...input, objective: v })}
            placeholder="What outcome does this agent deliver?"
            rows={3}
          />
          <TextArea
            label="Problem / Context"
            value={input.context}
            onChange={(v) => setInput({ ...input, context: v })}
            placeholder="What triggers the agent? What environment does it run in?"
            rows={4}
          />
          <Field
            label="Primary users"
            value={input.primaryUsers}
            onChange={(v) => setInput({ ...input, primaryUsers: v })}
            placeholder="Who uses/depends on it?"
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
          />

          <div className="border-none border border-[#2a2a2a] bg-white/5 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-white">
                Tool Contracts (structured)
              </div>
              <button
                type="button"
                className="border-none bg-white/10 px-2 py-1 text-xs font-medium text-white hover:bg-white/20"
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
            <p className="mt-1 text-xs text-white/60">
              Add structured contracts for each tool (auth, rate limits, error modes, PII, idempotency).
            </p>

            {input.toolContracts && input.toolContracts.length > 0 && (
              <div className="mt-3 space-y-3">
                {input.toolContracts.map((tc, idx) => (
                 <div
                    key={tc.id}
                    className="border-none border border-[#2a2a2a] bg-white/5 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        value={tc.name}
                        onChange={(e) => {
                          const updated = [...input.toolContracts];
                          updated[idx] = { ...tc, name: e.target.value };
                          setInput({ ...input, toolContracts: updated });
                        }}
                        placeholder="Tool name (e.g., Slack: post message)"
                        className="flex-1 rounded border border-[#2a2a2a] bg-white/5 px-2 py-1 text-sm text-white placeholder-white/40"
                      />
                      <button
                        type="button"
                        className="text-xs text-red-400 hover:text-red-300"
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
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      <input
                        value={tc.purpose}
                        onChange={(e) => {
                          const updated = [...input.toolContracts];
                          updated[idx] = { ...tc, purpose: e.target.value };
                          setInput({ ...input, toolContracts: updated });
                        }}
                        placeholder="Purpose (what does this tool do?)"
                        className="rounded border border-[#2a2a2a] bg-white/5 px-2 py-1 text-xs text-white placeholder-white/40"
                      />
                      <input
                        value={tc.auth}
                        onChange={(e) => {
                          const updated = [...input.toolContracts];
                          updated[idx] = { ...tc, auth: e.target.value };
                          setInput({ ...input, toolContracts: updated });
                        }}
                        placeholder="Auth (e.g., OAuth2, API key, user-approved)"
                        className="rounded border border-[#2a2a2a] bg-white/5 px-2 py-1 text-xs text-white placeholder-white/40"
                      />
                      <input
                        value={tc.rateLimit}
                        onChange={(e) => {
                          const updated = [...input.toolContracts];
                          updated[idx] = { ...tc, rateLimit: e.target.value };
                          setInput({ ...input, toolContracts: updated });
                        }}
                        placeholder="Rate limit (e.g., 100 req/min)"
                        className="rounded border border-[#2a2a2a] bg-white/5 px-2 py-1 text-xs text-white placeholder-white/40"
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
                        <span className="text-xs text-white/70">Idempotent</span>
                      </div>
                    </div>
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      <textarea
                        value={tc.inputs}
                        onChange={(e) => {
                          const updated = [...input.toolContracts];
                          updated[idx] = { ...tc, inputs: e.target.value };
                          setInput({ ...input, toolContracts: updated });
                        }}
                        placeholder="Inputs (what data does it need?)"
                        rows={2}
                        className="rounded border border-[#2a2a2a] bg-white/5 px-2 py-1 text-xs text-white placeholder-white/40"
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
                        className="rounded border border-[#2a2a2a] bg-white/5 px-2 py-1 text-xs text-white placeholder-white/40"
                      />
                    </div>
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      <textarea
                        value={tc.failureModes}
                        onChange={(e) => {
                          const updated = [...input.toolContracts];
                          updated[idx] = { ...tc, failureModes: e.target.value };
                          setInput({ ...input, toolContracts: updated });
                        }}
                        placeholder="Failure modes (what can go wrong?)"
                        rows={2}
                        className="rounded border border-[#2a2a2a] bg-white/5 px-2 py-1 text-xs text-white placeholder-white/40"
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
                        className="rounded border border-[#2a2a2a] bg-white/5 px-2 py-1 text-xs text-white placeholder-white/40"
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
          />

          <div className="mt-1 border-none border border-[#2a2a2a] bg-white/5 p-3">
            <div className="text-sm font-medium text-white">
              Cost / latency budget (optional)
            </div>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <Field
                label="p95 latency"
                value={input.p95Latency}
                onChange={(v) => setInput({ ...input, p95Latency: v })}
                placeholder="e.g., <= 10s"
              />
              <Field
                label="Max cost/day"
                value={input.maxCostPerDay}
                onChange={(v) => setInput({ ...input, maxCostPerDay: v })}
                placeholder="e.g., <= $50/day"
              />
              <Field
                label="Max retries"
                value={input.maxRetries}
                onChange={(v) => setInput({ ...input, maxRetries: v })}
                placeholder="e.g., 2"
              />
              <Field
                label="Degrade to"
                value={input.degradeTo}
                onChange={(v) => setInput({ ...input, degradeTo: v })}
                placeholder="e.g., human handoff / safer mode"
              />
            </div>
          </div>

          <TextArea
            label="Success metrics (one per line)"
            value={input.successMetrics}
            onChange={(v) => setInput({ ...input, successMetrics: v })}
            placeholder={["Time saved / week", "Accuracy", "CSAT"].join("\n")}
            rows={4}
          />
          <TextArea
            label="Non-goals (one per line)"
            value={input.nonGoals}
            onChange={(v) => setInput({ ...input, nonGoals: v })}
            placeholder={["Fully autonomous actions", "Model training"].join(
              "\n"
            )}
            rows={3}
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
          />
        </div>
      </section>

      {/* Generated Spec Section */}
      <section className="border-none border border-[#2a2a2a] bg-white/[0.02] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">Generated Spec</h2>
            <p className="text-sm text-white/60">
              Copy/paste into a repo, doc, ticket, or PRD.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex border-none border border-[#2a2a2a] bg-white/5 p-1">
              <button
                className={`border-none px-3 py-1.5 text-xs font-medium transition-colors ${
                  previewMode === "raw"
                    ? "bg-white/20 shadow-sm text-white"
                    : "text-white/60 hover:text-white"
                }`}
                onClick={() => setPreviewMode("raw")}
                type="button"
              >
                Raw
              </button>
              <button
                className={`border-none px-3 py-1.5 text-xs font-medium transition-colors ${
                  previewMode === "preview"
                    ? "bg-white/20 shadow-sm text-white"
                    : "text-white/60 hover:text-white"
                }`}
                onClick={() => setPreviewMode("preview")}
                type="button"
              >
                Preview
              </button>
            </div>
            <button
              className="border-none bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20"
              onClick={copy}
              type="button"
            >
              Copy
            </button>
            <button
              className="border-none border border-[#2a2a2a] bg-white/5 px-3 py-2 text-sm font-medium text-white hover:bg-white/10"
              onClick={copyShareLink}
              type="button"
              title="Copy a shareable link that includes the current inputs"
            >
              Share
            </button>
            <button
              className="border-none border border-[#2a2a2a] bg-white/5 px-3 py-2 text-sm font-medium text-white hover:bg-white/10"
              onClick={() =>
                downloadText(
                  `${(input.appName || "agent-spec")
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "")}.md`,
                  md
                )
              }
              type="button"
            >
              Download
            </button>
          </div>
        </div>

        {toast ? (
          <div className="mt-3 border-none border border-[#2a2a2a] bg-white/5 px-3 py-2 text-sm text-white/70">
            {toast}
          </div>
        ) : null}

        <div className="mt-4 border-none border border-[#2a2a2a] bg-white/5 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-white">Spec lint</div>
            <div className="text-xs text-white/60">
              {findings.length === 0
                ? "No obvious gaps"
                : `${findings.length} suggestion${findings.length === 1 ? "" : "s"}`}
            </div>
          </div>
          {findings.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-white/70">
              {findings.map((f) => (
                <li key={f.id}>
                  <span className="font-medium text-white">{f.title}</span>
                  {f.detail ? (
                    <span className="text-white/60"> — {f.detail}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-2 text-xs text-white/60">
              Looks decent for an MVP. If you're handing this to an engineer,
              add one or two concrete eval cases next.
            </div>
          )}
        </div>

        {previewMode === "raw" ? (
          <pre className="mt-4 max-h-[60vh] overflow-auto border-none border border-[#2a2a2a] bg-zinc-950 p-4 text-xs leading-5 text-zinc-100">
            <code>{md}</code>
          </pre>
        ) : (
          <div className="mt-4 max-h-[60vh] overflow-auto border-none border border-[#2a2a2a] bg-white p-4 prose prose-sm prose-zinc max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
          </div>
        )}

        <div className="mt-4 text-xs text-white/40">
          MVP note: this tool intentionally avoids calling an LLM. It encodes a
          good structure so humans (or your own model setup) can fill in the
          details.
        </div>
      </section>
    </div>
  );
}

function Field(props: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="grid gap-1">
      <div className="text-sm font-medium text-white">{props.label}</div>
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        className="h-10 border-none border border-[#2a2a2a] bg-white/5 px-3 text-sm text-white placeholder-white/40 outline-none ring-white/20 focus:ring-2"
      />
    </label>
  );
}

function TextArea(props: {
  label: string;
  value: string;
  placeholder?: string;
  rows?: number;
  onChange: (v: string) => void;
}) {
  return (
    <label className="grid gap-1">
      <div className="text-sm font-medium text-white">{props.label}</div>
      <textarea
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        rows={props.rows ?? 4}
        className="border-none border border-[#2a2a2a] bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 outline-none ring-white/20 focus:ring-2"
      />
    </label>
  );
}

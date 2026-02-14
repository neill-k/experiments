export type ToolContract = {
  id: string;
  name: string;
  purpose: string;
  auth: string;
  rateLimit: string;
  inputs: string;
  outputs: string;
  failureModes: string;
  piiHandling: string;
  idempotent: boolean;
};

export type SpecInput = {
  appName: string;
  objective: string;
  primaryUsers: string;
  context: string;
  tools: string;
  dataSources: string;
  constraints: string;
  successMetrics: string;
  nonGoals: string;
  risks: string;
  // Budget / performance targets (keep as strings to stay flexible)
  p95Latency: string;
  maxCostPerDay: string;
  maxRetries: string;
  degradeTo: string;
  // Structured tool contracts
  toolContracts: ToolContract[];
};

function bulletize(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^[-*]\s+/, ""));
}

function section(title: string, body: string): string {
  const trimmed = body.trim();
  if (!trimmed) return "";
  return `## ${title}\n\n${trimmed}\n\n`;
}

function bullets(lines: string[], fallback?: string): string {
  if (lines.length === 0) return fallback ? `- ${fallback}` : "- (TBD)";
  return lines.map((l) => `- ${l}`).join("\n");
}

function kv(label: string, value: string, fallback: string) {
  const v = value.trim();
  return `- **${label}:** ${v || fallback}`;
}

export function generateSpecMarkdown(input: SpecInput): string {
  const now = new Date();
  const tools = bulletize(input.tools);
  const data = bulletize(input.dataSources);
  const constraints = bulletize(input.constraints);
  const metrics = bulletize(input.successMetrics);
  const nonGoals = bulletize(input.nonGoals);
  const risks = bulletize(input.risks);

  const name = input.appName.trim() || "Agent Spec";
  const objective = input.objective.trim() || "(TBD)";

  const toolContracts =
    input.toolContracts && input.toolContracts.length > 0
      ? input.toolContracts
          .map(
            (tc) =>
              `### ${tc.name || "Unnamed Tool"}\n\n**Purpose:** ${tc.purpose.trim() || "(TBD)"}\n\n**Auth:** ${tc.auth.trim() || "(TBD)"}\n\n**Rate limit:** ${tc.rateLimit.trim() || "(TBD)"}\n\n**Inputs:**\n${tc.inputs.trim() || "- (TBD)"}\n\n**Outputs:**\n${tc.outputs.trim() || "- (TBD)"}\n\n**Failure modes:**\n${tc.failureModes.trim() || "- (TBD)"}\n\n**PII handling:** ${tc.piiHandling.trim() || "(TBD)"}\n\n**Idempotent:** ${tc.idempotent ? "Yes" : "No (requires deduplication)"}`
          )
          .join("\n\n")
      : tools.length
        ? tools
            .map(
              (t) =>
                `### ${t}\n\n**Purpose:** (TBD)\n\n**Inputs:**\n- (TBD)\n\n**Outputs:**\n- (TBD)\n\n**Failure modes:**\n- (TBD)\n`
            )
            .join("\n")
        : "(None yet)";

  const budget = [
    kv("p95 latency", input.p95Latency, "(TBD)"),
    kv("Max cost/day", input.maxCostPerDay, "(TBD)"),
    kv("Max retries", input.maxRetries, "(TBD)"),
    kv("Degrade to", input.degradeTo, "(TBD — e.g., human handoff, safer mode, or partial output)"),
  ].join("\n");

  return [
    `# ${name}\n`,
    `**Generated:** ${now.toISOString()}\n`,
    `**Objective:** ${objective}\n`,
    `---\n`,
    section(
      "Problem / Context",
      input.context.trim() ||
        "What situation is this agent operating in? What triggers its use?"
    ),
    section(
      "Primary Users",
      input.primaryUsers.trim() || "Who relies on it day-to-day?"
    ),
    section("Success Metrics", bullets(metrics, "Define measurable outcomes")),
    section("Constraints", bullets(constraints, "List hard constraints")),
    section("Cost / Latency Budget", budget),
    section("Non-goals", bullets(nonGoals, "Explicitly exclude out-of-scope items")),
    section(
      "High-level Architecture",
      [
        "- **UI / Entry point:** (web app, Slack bot, API, etc.)",
        "- **Orchestrator:** agent runtime / workflow engine",
        "- **Tools:** external actions (APIs, DB, tickets, email)",
        "- **Knowledge:** docs / policies / context retrieval (if applicable)",
        "- **Observability:** logs, traces, human review hooks",
      ].join("\n")
    ),
    section(
      "Tools",
      [
        bullets(tools, "List the tools the agent can call"),
        "",
        "### Tool Contracts",
        "",
        toolContracts,
      ].join("\n")
    ),
    section(
      "Data Sources",
      [
        bullets(data, "List the data sources / systems of record"),
        "",
        "**Data handling notes:**\n- PII? (yes/no)\n- Retention: (TBD)\n- Access controls: (TBD)",
      ].join("\n")
    ),
    section(
      "Evaluation Plan (MVP)",
      [
        "### Offline evaluation",
        "- Create 10–30 realistic test cases (inputs + expected outputs).",
        "- Score output on: correctness, completeness, policy compliance, and action safety.",
        "",
        "### Online / pilot",
        "- Start with human-in-the-loop approvals for tool actions.",
        "- Track: task success rate, time saved, escalation rate, and user satisfaction.",
      ].join("\n")
    ),
    section(
      "Guardrails",
      [
        "- Define what the agent **must never do** (e.g., send email without approval).",
        "- Require confirmations for destructive actions.",
        "- Log every tool call with inputs/outputs for auditability.",
      ].join("\n")
    ),
    section("Risks / Open Questions", bullets(risks, "List known risks + unknowns")),
    "---\n",
    "## Implementation Notes (for builders)\n\n",
    "- Start with the smallest end-to-end slice that proves value.\n",
    "- Add one tool at a time; ship with strong logging and safe defaults.\n",
  ]
    .filter(Boolean)
    .join("\n");
}

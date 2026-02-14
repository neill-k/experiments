import type { SpecInput } from "./spec";

export type LintSeverity = "error" | "warn";

export type LintFinding = {
  id: string;
  severity: LintSeverity;
  title: string;
  detail?: string;
};

function lines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^[-*]\s+/, ""));
}

function isVagueMetric(line: string): boolean {
  const l = line.toLowerCase();
  if (l.includes("tbd")) return true;
  // Heuristic: if it has no number-like signal, it's often not measurable.
  const hasNumber = /\d/.test(l);
  const hasComparator = /(<=|>=|<|>|p\d\d|percent|%|minutes?|secs?|seconds?|ms|hours?|days?)/.test(
    l
  );
  return !hasNumber && !hasComparator;
}

export function lintSpec(input: SpecInput): LintFinding[] {
  const findings: LintFinding[] = [];

  const objective = input.objective.trim();
  const tools = lines(input.tools);
  const dataSources = lines(input.dataSources);
  const constraints = lines(input.constraints);
  const successMetrics = lines(input.successMetrics);

  if (!objective) {
    findings.push({
      id: "objective-missing",
      severity: "error",
      title: "Missing objective",
      detail: "Write one sentence describing the outcome this agent delivers.",
    });
  } else if (objective.length < 20) {
    findings.push({
      id: "objective-short",
      severity: "warn",
      title: "Objective is very short",
      detail: "Add a bit more context (what + for whom + when).",
    });
  }

  if (tools.length === 0) {
    findings.push({
      id: "tools-missing",
      severity: "warn",
      title: "No tools listed",
      detail: "If the agent does real work, list the APIs/systems it can call (even if approvals are required).",
    });
  }

  if (dataSources.length === 0) {
    findings.push({
      id: "data-missing",
      severity: "warn",
      title: "No data sources listed",
      detail: "List systems of record (docs, CRM, ticketing, runbooks, etc.).",
    });
  }

  if (constraints.length === 0) {
    findings.push({
      id: "constraints-missing",
      severity: "warn",
      title: "No constraints listed",
      detail: "Add a few hard constraints (approvals, privacy, retention, access controls, etc.).",
    });
  }

  if (successMetrics.length === 0) {
    findings.push({
      id: "metrics-missing",
      severity: "warn",
      title: "No success metrics listed",
      detail: "Add measurable outcomes (e.g., time saved/week, accuracy, CSAT, escalation rate).",
    });
  } else {
    const vague = successMetrics.filter(isVagueMetric);
    if (vague.length >= Math.max(2, Math.ceil(successMetrics.length / 2))) {
      findings.push({
        id: "metrics-vague",
        severity: "warn",
        title: "Success metrics look vague",
        detail: "Consider adding numeric targets (p95 latency, accuracy %, time saved/week, cost/day).",
      });
    }
  }

  return findings;
}

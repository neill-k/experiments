import type { SpecInput } from "./spec";

export type QualityCategory = {
  key: string;
  label: string;
  weight: number;
  filled: boolean;
  suggestion?: string;
};

/**
 * Evaluate spec completeness across weighted categories.
 * Returns individual category results and an overall 0-100 score.
 */
export function evaluateQuality(input: SpecInput): {
  score: number;
  categories: QualityCategory[];
} {
  const hasLines = (v: string) =>
    v
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean).length > 0;

  const categories: QualityCategory[] = [
    {
      key: "objective",
      label: "Objective",
      weight: 20,
      filled: input.objective.trim().length >= 20,
      suggestion:
        input.objective.trim().length === 0
          ? "Add a clear objective describing the outcome."
          : input.objective.trim().length < 20
            ? "Expand the objective — what, for whom, and why."
            : undefined,
    },
    {
      key: "context",
      label: "Problem / Context",
      weight: 15,
      filled: input.context.trim().length >= 15,
      suggestion: input.context.trim().length < 15
        ? "Describe the trigger event and environment."
        : undefined,
    },
    {
      key: "users",
      label: "Primary Users",
      weight: 10,
      filled: input.primaryUsers.trim().length > 0,
      suggestion: !input.primaryUsers.trim()
        ? "Name the roles or teams who use this."
        : undefined,
    },
    {
      key: "tools",
      label: "Tools",
      weight: 15,
      filled: hasLines(input.tools) || (input.toolContracts?.length ?? 0) > 0,
      suggestion:
        !hasLines(input.tools) && (input.toolContracts?.length ?? 0) === 0
          ? "List the APIs/systems the agent can call."
          : undefined,
    },
    {
      key: "data",
      label: "Data Sources",
      weight: 10,
      filled: hasLines(input.dataSources),
      suggestion: !hasLines(input.dataSources)
        ? "Add knowledge bases, CRMs, or docs the agent reads."
        : undefined,
    },
    {
      key: "constraints",
      label: "Constraints",
      weight: 10,
      filled: hasLines(input.constraints),
      suggestion: !hasLines(input.constraints)
        ? "Add compliance, privacy, or approval constraints."
        : undefined,
    },
    {
      key: "metrics",
      label: "Success Metrics",
      weight: 10,
      filled: hasLines(input.successMetrics),
      suggestion: !hasLines(input.successMetrics)
        ? "Define measurable outcomes (accuracy, time saved, etc.)."
        : undefined,
    },
    {
      key: "risks",
      label: "Risks / Open Questions",
      weight: 5,
      filled: hasLines(input.risks),
      suggestion: !hasLines(input.risks)
        ? "Flag unknowns — model accuracy gaps, edge cases, etc."
        : undefined,
    },
    {
      key: "budget",
      label: "Cost / Latency Budget",
      weight: 5,
      filled:
        input.p95Latency.trim().length > 0 ||
        input.maxCostPerDay.trim().length > 0,
      suggestion:
        !input.p95Latency.trim() && !input.maxCostPerDay.trim()
          ? "Set a latency or cost target to keep scope realistic."
          : undefined,
    },
  ];

  const totalWeight = categories.reduce((s, c) => s + c.weight, 0);
  const earned = categories
    .filter((c) => c.filled)
    .reduce((s, c) => s + c.weight, 0);

  const score = Math.round((earned / totalWeight) * 100);

  return { score, categories };
}

/**
 * Human-readable label for a quality score.
 */
export function qualityLabel(score: number): string {
  if (score >= 90) return "Ready to ship";
  if (score >= 70) return "Strong draft";
  if (score >= 45) return "Good start";
  if (score >= 20) return "Early sketch";
  return "Just started";
}

/**
 * Color class for the quality bar (Tailwind).
 */
export function qualityColor(score: number): string {
  if (score >= 90) return "bg-emerald-500";
  if (score >= 70) return "bg-emerald-600";
  if (score >= 45) return "bg-amber-500";
  if (score >= 20) return "bg-orange-500";
  return "bg-red-500";
}

export function qualityTextColor(score: number): string {
  if (score >= 90) return "text-emerald-400";
  if (score >= 70) return "text-emerald-500";
  if (score >= 45) return "text-amber-400";
  if (score >= 20) return "text-orange-400";
  return "text-red-400";
}

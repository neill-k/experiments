import type { Metadata } from "next";
import { ExperimentJsonLd } from "@/components/ExperimentJsonLd";

export const metadata: Metadata = {
  title: "Agent Spec Builder",
  description: "Generate an implementable agentic system spec as Markdown.",
  openGraph: {
    title: "Agent Spec Builder — Experiments",
    description:
      "Turn agent ideas into implementable Markdown specs with tool contracts, eval rubrics, and export packs.",
    url: "https://experiments.neillkillgore.com/e/agent-spec-builder",
    siteName: "Experiments",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agent Spec Builder — Experiments",
    description:
      "Turn agent ideas into implementable Markdown specs with tool contracts, eval rubrics, and export packs.",
  },
};

export default function AgentSpecBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ExperimentJsonLd slug="agent-spec-builder" />
      {children}
    </>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prompt Library & Playground",
  description: "Organize, version, and test prompts for LLM applications",
  openGraph: {
    title: "Prompt Library & Playground — Experiments",
    description: "Organize, version, and test prompts for LLM applications.",
    url: "https://experiments.neillkillgore.com/e/prompt-library",
    siteName: "Experiments",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prompt Library & Playground — Experiments",
    description: "Organize, version, and test prompts for LLM applications.",
  },
};

export default function PromptLibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

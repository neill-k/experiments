import type { Metadata } from "next";
import { ExperimentJsonLd } from "@/components/ExperimentJsonLd";

export const metadata: Metadata = {
  title: "The Blob",
  description:
    "A bioluminescent ecosystem of cursor-following entities that split, merge, hunt, flee, and glitch.",
  openGraph: {
    title: "The Blob - Experiments",
    description:
      "A bioluminescent ecosystem of cursor-following entities that split, merge, hunt, flee, and glitch.",
    url: "https://experiments.neillkillgore.com/e/the-blob",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Blob - Experiments",
    description:
      "A bioluminescent ecosystem of cursor-following entities that split, merge, hunt, flee, and glitch.",
  },
};

export default function BlobLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ExperimentJsonLd slug="the-blob" />
      {children}
    </>
  );
}

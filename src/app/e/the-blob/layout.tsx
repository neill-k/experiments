import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Blob — Experiments",
  description:
    "A mysterious bioluminescent ecosystem of cursor-following entities that split, merge, hunt, flee, and glitch.",
};

export default function BlobLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

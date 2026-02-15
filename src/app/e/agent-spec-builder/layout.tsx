import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agent Spec Builder",
  description: "Generate an implementable agentic system spec as Markdown.",
  openGraph: {
    title: "Agent Spec Builder — Experiments",
    description: "Turn agent ideas into implementable Markdown specs with tool contracts, eval rubrics, and export packs.",
    url: "https://experiments.neillkillgore.com/e/agent-spec-builder",
    siteName: "Experiments",
  },
  twitter: {
    card: "summary",
    title: "Agent Spec Builder — Experiments",
    description: "Turn agent ideas into implementable Markdown specs with tool contracts, eval rubrics, and export packs.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

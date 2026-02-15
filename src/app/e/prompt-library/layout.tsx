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
  title: "Prompt Library & Playground",
  description: "Organize, version, and test prompts for LLM applications",
  openGraph: {
    title: "Prompt Library & Playground — Experiments",
    description: "Organize, version, and test prompts for LLM applications.",
    url: "https://experiments.neillkillgore.com/e/prompt-library",
    siteName: "Experiments",
  },
  twitter: {
    card: "summary",
    title: "Prompt Library & Playground — Experiments",
    description: "Organize, version, and test prompts for LLM applications.",
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

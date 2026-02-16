import type { Metadata } from "next";
import { Instrument_Serif, DM_Sans, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { AuthButtons } from "@/components/AuthButtons";
import Link from "next/link";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://experiments.neillkillgore.com"),
  title: {
    default: "Experiments — Neill Killgore",
    template: "%s — Experiments",
  },
  description: "Daily shipped prototypes. Click one to explore.",
  themeColor: "#08080a",
  openGraph: {
    type: "website",
    siteName: "Experiments",
    title: "Experiments — Neill Killgore",
    description: "Daily shipped prototypes — interactive tools, creative canvases, and AI utilities.",
    url: "https://experiments.neillkillgore.com",
  },
  twitter: {
    card: "summary",
    title: "Experiments — Neill Killgore",
    description: "Daily shipped prototypes — interactive tools, creative canvases, and AI utilities.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ colorScheme: "dark" }}>
      <body
        className={`${instrumentSerif.variable} ${dmSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[var(--bg)] focus:text-[var(--fg)] focus:border focus:border-[var(--fg)] focus:text-sm focus:font-[family-name:var(--font-mono)]"
        >
          Skip to content
        </a>
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1a1a1a] bg-[#08080a]/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
            <Link
              href="/"
              className="font-[family-name:var(--font-display)] text-lg text-white/90 hover:text-white transition-colors"
            >
              Experiments
            </Link>
            <AuthButtons />
          </div>
        </nav>
        <main id="main-content" className="pt-14">
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  );
}

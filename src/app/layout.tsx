import type { Metadata } from "next";
import { Instrument_Serif, DM_Sans, JetBrains_Mono } from "next/font/google";
import { AuthButtons } from "@/components/AuthButtons";
import { NavBar } from "@/components/NavBar";
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
        <NavBar />
        <main id="main-content" className="pt-20">
          {children}
        </main>
      </body>
    </html>
  );
}

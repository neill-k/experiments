import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Archive - The Hard Question',
  description:
    'Browse all past questions from The Hard Question. One hard question published every day.',
  openGraph: {
    title: 'Archive - The Hard Question',
    description:
      'Browse all past questions from The Hard Question. One hard question published every day.',
    url: 'https://experiments.neillkillgore.com/e/hard-question/archive',
    siteName: 'Experiments',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Archive - The Hard Question',
    description:
      'Browse all past questions from The Hard Question.',
  },
}

export default function ArchiveLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

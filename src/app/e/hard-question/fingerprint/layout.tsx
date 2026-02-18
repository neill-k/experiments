import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Your Philosophical DNA - The Hard Question',
  description:
    'See which schools of philosophy your answers align with most. A fingerprint built from your daily responses.',
  openGraph: {
    title: 'Your Philosophical DNA - The Hard Question',
    description:
      'See which schools of philosophy your answers align with most. A fingerprint built from your daily responses.',
    url: 'https://experiments.neillkillgore.com/e/hard-question/fingerprint',
    siteName: 'Experiments',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Your Philosophical DNA - The Hard Question',
    description:
      'See which schools of philosophy your answers align with most.',
  },
}

export default function FingerprintLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

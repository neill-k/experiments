import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Your Alignment Pattern - The Hard Question',
  description:
    'See which schools of philosophy your answers align with most over time. A probabilistic profile built from ranked responses.',
  openGraph: {
    title: 'Your Alignment Pattern - The Hard Question',
    description:
      'See which schools of philosophy your answers align with most over time. A probabilistic profile built from ranked responses.',
    url: 'https://experiments.neillkillgore.com/e/hard-question/fingerprint',
    siteName: 'Experiments',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Your Alignment Pattern - The Hard Question',
    description:
      'See which schools of philosophy your answers align with most over time.',
  },
}

export default function FingerprintLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

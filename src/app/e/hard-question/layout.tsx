import type { Metadata } from 'next'
import { ExperimentJsonLd } from '@/components/ExperimentJsonLd'

export const metadata: Metadata = {
  title: 'The Hard Question',
  description:
    'One genuinely hard question per day. Write your answer, discover which philosophers think like you.',
  openGraph: {
    title: 'The Hard Question - Experiments',
    description:
      'One genuinely hard question per day. Write your answer, discover which philosophers think like you.',
    url: 'https://experiments.neillkillgore.com/e/hard-question',
    siteName: 'Experiments',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Hard Question - Experiments',
    description:
      'One genuinely hard question per day. Write your answer, discover which philosophers think like you.',
  },
}

export default function HardQuestionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <ExperimentJsonLd slug="hard-question" />
      {children}
    </>
  )
}

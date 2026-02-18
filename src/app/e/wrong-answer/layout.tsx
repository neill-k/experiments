import type { Metadata } from 'next'
import { ExperimentJsonLd } from '@/components/ExperimentJsonLd'

export const metadata: Metadata = {
  title: 'The Wrong Answer',
  description:
    'A quiz game that only accepts wrong answers. The more creatively wrong you are, the higher you score.',
  openGraph: {
    title: 'The Wrong Answer - Experiments',
    description:
      'A quiz game that only accepts wrong answers. The more creatively wrong you are, the higher you score.',
    url: 'https://experiments.neillkillgore.com/e/wrong-answer',
    siteName: 'Experiments',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Wrong Answer - Experiments',
    description:
      'A quiz game that only accepts wrong answers. The more creatively wrong you are, the higher you score.',
  },
}

export default function WrongAnswerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <ExperimentJsonLd slug="wrong-answer" />
      {children}
    </>
  )
}

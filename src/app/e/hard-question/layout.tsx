import type { Metadata } from 'next'
import { ExperimentJsonLd } from '@/components/ExperimentJsonLd'
import { HardQuestionQueryProvider } from './components/HardQuestionQueryProvider'

export const metadata: Metadata = {
  title: 'The Hard Question',
  description:
    'One genuinely hard question per day. Compare your answer to philosopher passages using probabilistic semantic alignment.',
  openGraph: {
    title: 'The Hard Question - Experiments',
    description:
      'One genuinely hard question per day. Compare your answer to philosopher passages using probabilistic semantic alignment.',
    url: 'https://experiments.neillkillgore.com/e/hard-question',
    siteName: 'Experiments',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Hard Question - Experiments',
    description:
      'One genuinely hard question per day. Compare your answer to philosopher passages with probabilistic semantic matching.',
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
      <HardQuestionQueryProvider>{children}</HardQuestionQueryProvider>
    </>
  )
}

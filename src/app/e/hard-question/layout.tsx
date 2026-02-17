import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Hard Question',
  description:
    'One genuinely hard question per day. Write your answer, discover which philosophers think like you.',
}

export default function HardQuestionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

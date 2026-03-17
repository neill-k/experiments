import type { Metadata } from 'next'
import { OnoHeader } from './components/OnoHeader'

export const metadata: Metadata = {
  title: 'O(no)',
  description:
    'Competitive programming for the rest of us. Solutions that work. We\'re so sorry.',
  openGraph: {
    title: 'O(no)',
    description:
      'Competitive programming where scoring rewards inefficiency, over-engineering, and computational horror.',
  },
}

export default function OnoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <OnoHeader />
      {children}
    </div>
  )
}

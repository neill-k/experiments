import type { Metadata } from 'next'
import { Comments } from '@/components/comments/Comments'
import { ExperimentNav } from '@/components/ExperimentNav'
import { GravityInboxClient } from './GravityInboxClient'

export const metadata: Metadata = {
  title: 'Gravity Inbox',
  description:
    'Turn priorities into orbiting objects, flick them with physics, merge related intent, and burn finished work through the gate.',
}

export default function GravityInboxPage() {
  return (
    <main className="min-h-dvh bg-[#07070a] text-[#efeff4]">
      <GravityInboxClient />

      <div className="mx-auto w-full max-w-[1600px] px-3 pb-8 sm:px-4 lg:px-6">
        <div className="border-t border-white/10 pt-6">
          <Comments slug="gravity-inbox" />
        </div>
      </div>

      <ExperimentNav />
    </main>
  )
}

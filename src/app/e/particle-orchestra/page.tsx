import type { Metadata } from 'next'
import { Comments } from '@/components/comments/Comments'
import { ExperimentNav } from '@/components/ExperimentNav'
import { ParticleOrchestraClient } from './ParticleOrchestraClient'

export const metadata: Metadata = {
  title: 'Particle Orchestra',
  description:
    'Touch to conduct a kinetic particle stage where generated sound and motion feed each other in real time.',
}

export default function ParticleOrchestraPage() {
  return (
    <main className="min-h-dvh bg-[#07070a] text-[#efeff4]">
      <ParticleOrchestraClient />

      <div className="mx-auto w-full max-w-[1600px] px-3 pb-8 sm:px-4 lg:px-6">
        <div className="border-t border-white/10 pt-6">
          <Comments slug="particle-orchestra" />
        </div>
      </div>

      <ExperimentNav />
    </main>
  )
}

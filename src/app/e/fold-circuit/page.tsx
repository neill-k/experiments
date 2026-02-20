import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { Comments } from '@/components/comments/Comments'
import { ExperimentNav } from '@/components/ExperimentNav'
import './fold-circuit.css'

const FoldCircuitClient = dynamic(() => import('./FoldCircuitClient').then((mod) => mod.FoldCircuitClient), {
  ssr: false,
})

export const metadata: Metadata = {
  title: 'Fold Circuit',
  description:
    'Route power from source to sink with minimum active cells, then adapt as physical laws mutate after each solved board.',
}

export default function FoldCircuitPage() {
  return (
    <main className="min-h-dvh bg-[#08080a] text-[#ebebeb]">
      <FoldCircuitClient />

      <div className="mx-auto w-full max-w-[1600px] px-3 pb-8 sm:px-4 lg:px-6">
        <div className="border-t border-white/10 pt-6">
          <Comments slug="fold-circuit" />
        </div>
      </div>

      <ExperimentNav />
    </main>
  )
}

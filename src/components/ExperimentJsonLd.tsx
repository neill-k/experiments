import { experiments } from '@/lib/experiments'
import { experimentJsonLd } from '@/lib/json-ld'

/** Renders a JSON-LD script tag for the given experiment slug. */
export function ExperimentJsonLd({ slug }: { slug: string }) {
  const exp = experiments.find((e) => e.slug === slug)
  if (!exp) return null

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(experimentJsonLd(exp)) }}
    />
  )
}

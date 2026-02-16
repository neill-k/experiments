import type { MetadataRoute } from 'next'

const experiments = [
  { slug: 'the-blob', date: '2026-02-15' },
  { slug: 'prompt-library', date: '2026-02-14' },
  { slug: 'agent-spec-builder', date: '2026-02-13' },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://experiments.neillkillgore.com'

  const experimentPages: MetadataRoute.Sitemap = experiments.map((exp) => ({
    url: `${baseUrl}/e/${exp.slug}`,
    lastModified: new Date(exp.date),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...experimentPages,
  ]
}

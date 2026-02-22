import type { MetadataRoute } from 'next'
import { experiments } from '@/lib/experiments'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://experiments.neillkillgore.com'

  const experimentPages: MetadataRoute.Sitemap = experiments.map((exp) => ({
    url: `${baseUrl}/e/${exp.slug}`,
    lastModified: new Date(exp.lastUpdated ?? exp.date),
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
    {
      url: `${baseUrl}/auto-builds`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...experimentPages,
    // Hard Question subpages
    {
      url: `${baseUrl}/e/hard-question/fingerprint`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/e/hard-question/archive`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6,
    },
  ]
}

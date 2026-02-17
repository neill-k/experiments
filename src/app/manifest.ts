import type { MetadataRoute } from 'next'
import { experiments } from '@/lib/experiments'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Experiments - Neill Killgore',
    short_name: 'Experiments',
    description: 'Daily shipped prototypes - interactive tools, creative canvases, and AI utilities.',
    start_url: '/',
    display: 'standalone',
    background_color: '#08080a',
    theme_color: '#08080a',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
    shortcuts: experiments.slice(0, 4).map((exp) => ({
      name: exp.title,
      short_name: exp.title,
      description: exp.description,
      url: `/e/${exp.slug}`,
    })),
  }
}

import { experimentOgImage, ogSize } from '@/lib/og-experiment'

export const runtime = 'edge'
export const alt = 'The Blob — Experiments'
export const size = ogSize
export const contentType = 'image/png'

export default async function Image() {
  return experimentOgImage({
    icon: '🫧',
    title: 'The Blob',
    description:
      'A bioluminescent ecosystem of cursor-following entities that split, merge, hunt, flee, and glitch.',
    tags: ['creative', 'canvas', 'interactive'],
  })
}

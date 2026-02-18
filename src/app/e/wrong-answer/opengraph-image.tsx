import { experimentOgImage, ogSize } from '@/lib/og-experiment'

export const runtime = 'edge'
export const alt = 'The Wrong Answer - Experiments'
export const size = ogSize
export const contentType = 'image/png'

export default async function Image() {
  return experimentOgImage({
    icon: '❌',
    title: 'The Wrong Answer',
    description:
      'A quiz game that only accepts wrong answers. The more creatively wrong you are, the higher you score.',
    tags: ['games', 'ai', 'humor', 'competitive'],
  })
}

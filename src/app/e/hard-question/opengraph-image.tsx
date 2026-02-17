import { experimentOgImage, ogSize } from '@/lib/og-experiment'

export const runtime = 'edge'
export const alt = 'The Hard Question — Experiments'
export const size = ogSize
export const contentType = 'image/png'

export default async function Image() {
  return experimentOgImage({
    icon: '🤔',
    title: 'The Hard Question',
    description:
      'One genuinely hard question per day. Write your answer, discover which philosophers think like you.',
    tags: ['philosophy', 'interactive', 'ai'],
  })
}

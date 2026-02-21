import { experimentOgImage, ogSize } from '@/lib/og-experiment'

export const runtime = 'edge'
export const alt = 'The Hard Question - Experiments'
export const size = ogSize
export const contentType = 'image/png'

export default async function Image() {
  return experimentOgImage({
    icon: '🤔',
    title: 'The Hard Question',
    description:
      'One genuinely hard question per day. Compare your answer with philosopher passages using probabilistic semantic matching.',
    tags: ['philosophy', 'interactive', 'ai'],
  })
}

import { experimentOgImage, ogSize } from '@/lib/og-experiment'

export const runtime = 'edge'
export const alt = 'Ant Farm - Experiments'
export const size = ogSize
export const contentType = 'image/png'

export default async function Image() {
  return experimentOgImage({
    icon: '🐜',
    title: 'Ant Farm',
    description:
      'A living ant colony simulation - watch ants dig tunnels, forage for food, and build an underground civilization.',
    tags: ['creative', 'canvas', 'simulation', 'interactive'],
  })
}

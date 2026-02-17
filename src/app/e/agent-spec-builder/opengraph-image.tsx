import { experimentOgImage, ogSize } from '@/lib/og-experiment'

export const runtime = 'edge'
export const alt = 'Agent Spec Builder - Experiments'
export const size = ogSize
export const contentType = 'image/png'

export default async function Image() {
  return experimentOgImage({
    icon: '🤖',
    title: 'Agent Spec Builder',
    description:
      'Turn agent ideas into implementable Markdown specs with tool contracts, eval rubrics, and export packs.',
    tags: ['agents', 'specs'],
  })
}

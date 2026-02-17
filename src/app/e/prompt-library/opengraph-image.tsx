import { experimentOgImage, ogSize } from '@/lib/og-experiment'

export const runtime = 'edge'
export const alt = 'Prompt Library - Experiments'
export const size = ogSize
export const contentType = 'image/png'

export default async function Image() {
  return experimentOgImage({
    icon: '📝',
    title: 'Prompt Library',
    description:
      'Organize, version, and test prompts for LLM applications.',
    tags: ['tools', 'llm'],
  })
}

/**
 * Single source of truth for the experiment registry.
 *
 * When adding a new experiment, add it here — homepage, sitemap,
 * and inter-experiment navigation all read from this list.
 */

export const REPO_URL = 'https://github.com/neill-k/experiments'

export interface Experiment {
  slug: string
  date: string
  title: string
  description: string
  tags: string[]
  icon?: string
}

/** Returns the GitHub URL for an experiment's source directory. */
export function sourceUrl(slug: string): string {
  return `${REPO_URL}/tree/main/src/app/e/${slug}`
}

export const experiments: Experiment[] = [
  {
    slug: 'hard-question',
    date: '2026-02-17',
    title: 'The Hard Question',
    description:
      'One genuinely hard question per day. Write your answer, discover which philosophers think like you.',
    tags: ['philosophy', 'interactive', 'ai'],
    icon: '🤔',
  },
  {
    slug: 'ant-farm',
    date: '2026-02-16',
    title: 'Ant Farm',
    description:
      'A living ant colony simulation — watch ants dig tunnels, forage for food, and build an underground civilization',
    tags: ['creative', 'canvas', 'simulation', 'interactive'],
    icon: '🐜',
  },
  {
    slug: 'the-blob',
    date: '2026-02-15',
    title: 'The Blob',
    description:
      'A bioluminescent ecosystem of cursor-following entities that split, merge, hunt, flee, and glitch',
    tags: ['creative', 'canvas', 'interactive'],
    icon: '🫧',
  },
  {
    slug: 'prompt-library',
    date: '2026-02-14',
    title: 'Prompt Library',
    description:
      'Organize, version, and test prompts for LLM applications',
    tags: ['tools', 'llm'],
    icon: '📝',
  },
  {
    slug: 'agent-spec-builder',
    date: '2026-02-13',
    title: 'Agent Spec Builder',
    description:
      'Turn agent ideas into implementable Markdown specs',
    tags: ['agents', 'specs'],
    icon: '🤖',
  },
]

/** All unique tags, sorted alphabetically. */
export const allTags: string[] = Array.from(
  new Set(experiments.flatMap((e) => e.tags)),
).sort()

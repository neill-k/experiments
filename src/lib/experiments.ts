/**
 * Single source of truth for the experiment registry.
 *
 * When adding a new experiment, add it here — homepage, sitemap,
 * and inter-experiment navigation all read from this list.
 */

export interface Experiment {
  slug: string
  date: string
  title: string
  description: string
  tags: string[]
}

export const experiments: Experiment[] = [
  {
    slug: 'the-blob',
    date: '2026-02-15',
    title: 'The Blob',
    description:
      'A bioluminescent ecosystem of cursor-following entities that split, merge, hunt, flee, and glitch',
    tags: ['creative', 'canvas', 'interactive'],
  },
  {
    slug: 'prompt-library',
    date: '2026-02-14',
    title: 'Prompt Library',
    description:
      'Organize, version, and test prompts for LLM applications',
    tags: ['tools', 'llm'],
  },
  {
    slug: 'agent-spec-builder',
    date: '2026-02-13',
    title: 'Agent Spec Builder',
    description:
      'Turn agent ideas into implementable Markdown specs',
    tags: ['agents', 'specs'],
  },
]

/** All unique tags, sorted alphabetically. */
export const allTags: string[] = Array.from(
  new Set(experiments.flatMap((e) => e.tags)),
).sort()

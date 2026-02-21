/**
 * Single source of truth for the experiment registry.
 *
 * When adding a new experiment, add it here - homepage, sitemap,
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
  /** Accent color for card left-border stripe (CSS color string). */
  accent?: string
  /** Neill's favorite experiments get featured in a special section. */
  favorite?: boolean
  /** Key technologies used in this experiment (shown as subtle badges). */
  tech?: string[]
  /** ISO date of the most recent meaningful update (omit if same as date). */
  lastUpdated?: string
}

/** Returns the GitHub URL for an experiment's source directory. */
export function sourceUrl(slug: string): string {
  return `${REPO_URL}/tree/main/src/app/e/${slug}`
}

export const experiments: Experiment[] = [
  {
    slug: 'gravity-inbox',
    date: '2026-02-21',
    title: 'Gravity Inbox',
    description:
      'Convert priorities into orbiting task orbs you can drag, flick, merge, and burn through a kinetic completion gate.',
    tags: ['tools', 'canvas', 'interactive', 'productivity'],
    icon: '🪐',
    accent: 'rgba(122, 168, 255, 0.58)',
    favorite: false,
    tech: ['Canvas API', 'Pointer Events', '2D Physics', 'Reduced Motion'],
  },
  {
    slug: 'fold-circuit',
    date: '2026-02-20',
    title: 'Fold Circuit',
    description:
      'Route power from source to sink with minimal active cells, then adapt as one physical law mutates after each solve.',
    tags: ['puzzle', 'simulation', 'systems', 'interactive'],
    icon: '🧩',
    accent: 'rgba(120, 196, 255, 0.52)',
    favorite: false,
    tech: ['Canvas API', 'Typed Arrays', 'Bounded Solver', 'Deterministic Replay'],
  },
  {
    slug: 'particle-orchestra',
    date: '2026-02-19',
    title: 'Particle Orchestra',
    description:
      'Conduct a luminous particle stage with touch-driven synthesis and real-time audio-reactive motion.',
    tags: ['creative', 'canvas', 'interactive', 'audio'],
    icon: '🎛️',
    accent: 'rgba(241, 94, 255, 0.55)',
    favorite: false,
    tech: ['Canvas API', 'Web Audio API', 'AnalyserNode', 'Pointer Events'],
  },
  {
    slug: 'rule-bloom',
    date: '2026-02-18',
    title: 'Rule Bloom',
    description:
      'A hard-edge coupled simulation where Rule 30 turbulence, sandpile criticality, and stochastic decay clocks continuously disturb each other.',
    tags: ['simulation', 'creative', 'canvas', 'generative'],
    icon: '🧪',
    accent: 'rgba(152, 118, 255, 0.55)',
    favorite: false,
    tech: ['Canvas API', 'Cellular Automata', 'Sandpile Model', 'Typed Arrays'],
    lastUpdated: '2026-02-20',
  },
  {
    slug: 'hard-question',
    date: '2026-02-17',
    title: 'The Hard Question',
    description:
      'One genuinely hard question per day. Write your answer, discover which philosophers think like you.',
    tags: ['philosophy', 'interactive', 'ai'],
    icon: '🤔',
    accent: 'rgba(200, 160, 255, 0.5)',
    favorite: true,
    tech: ['Supabase', 'pgvector', 'OpenAI Embeddings', 'Web Share API'],
    lastUpdated: '2026-02-18',
  },
  {
    slug: 'ant-farm',
    date: '2026-02-16',
    title: 'Ant Farm',
    description:
      'A living ant colony simulation - watch ants dig tunnels, forage for food, and build an underground civilization',
    tags: ['creative', 'canvas', 'simulation', 'interactive'],
    icon: '🐜',
    accent: 'rgba(180, 120, 80, 0.5)',
    favorite: false,
    tech: ['Canvas API', 'Dirty-rect Rendering', 'Pheromone Simulation'],
    lastUpdated: '2026-02-16',
  },
  {
    slug: 'the-blob',
    date: '2026-02-15',
    title: 'The Blob',
    description:
      'A bioluminescent ecosystem of cursor-following entities that split, merge, hunt, flee, and glitch',
    tags: ['creative', 'canvas', 'interactive'],
    icon: '🫧',
    accent: 'rgba(90, 220, 200, 0.5)',
    favorite: false,
    tech: ['Canvas API', 'Soft-body Physics', 'Web Audio API'],
  },
  {
    slug: 'prompt-library',
    date: '2026-02-14',
    title: 'Prompt Library',
    description:
      'Organize, version, and test prompts for LLM applications',
    tags: ['tools', 'llm'],
    icon: '📝',
    accent: 'rgba(255, 200, 80, 0.5)',
    tech: ['localStorage', 'OpenAI API', 'Anthropic API', 'react-markdown'],
    lastUpdated: '2026-02-15',
  },
  {
    slug: 'agent-spec-builder',
    date: '2026-02-13',
    title: 'Agent Spec Builder',
    description:
      'Turn agent ideas into implementable Markdown specs',
    tags: ['agents', 'specs'],
    icon: '🤖',
    accent: 'rgba(90, 160, 255, 0.5)',
    tech: ['JSZip', 'Markdown Generation', 'Spec Linting'],
    lastUpdated: '2026-02-15',
  },
]

/** All unique tags, sorted alphabetically. */
export const allTags: string[] = Array.from(
  new Set(experiments.flatMap((e) => e.tags)),
).sort()

/** Number of experiments per tag. */
export const tagCounts: Record<string, number> = experiments.reduce(
  (acc, e) => {
    for (const tag of e.tags) {
      acc[tag] = (acc[tag] || 0) + 1
    }
    return acc
  },
  {} as Record<string, number>,
)

/**
 * Pipeline stats derived from experiment dates.
 */
function computePipelineStats() {
  const dates = [...new Set(experiments.map((e) => e.date))].sort().reverse()
  if (dates.length === 0) return { streak: 0, totalDays: 0, firstDate: '' }

  // Count consecutive days from the most recent experiment
  let streak = 1
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1] + 'T00:00:00Z')
    const curr = new Date(dates[i] + 'T00:00:00Z')
    const diffDays = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
    if (diffDays === 1) streak++
    else break
  }

  const firstDate = dates[dates.length - 1]
  const totalDays = dates.length

  return { streak, totalDays, firstDate }
}

export const pipelineStats = computePipelineStats()

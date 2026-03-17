/** O(no) brand constants — cursed terminal aesthetic */

// Colors: amber warnings, red errors, terminal green for "success"
export const ONO = {
  // Brand
  name: 'O(no)',
  tagline: 'Solutions that work. We\'re so sorry.',
  url: '/e/ono',

  // Palette — caution tape energy
  amber: '#f5a623',
  amberDim: 'rgba(245, 166, 35, 0.5)',
  amberGlow: 'rgba(245, 166, 35, 0.15)',
  red: '#e63946',
  redDim: 'rgba(230, 57, 70, 0.5)',
  redGlow: 'rgba(230, 57, 70, 0.12)',
  green: '#4ade80',
  greenDim: 'rgba(74, 222, 128, 0.5)',
  terminal: '#00ff41',
  terminalDim: 'rgba(0, 255, 65, 0.3)',
  bg: '#08080a',
  surface: '#0c0c0e',
  surfaceHover: '#111114',
  border: '#1a1a1a',
  borderHover: '#2a2a2a',
  textPrimary: '#ebebeb',
  textSecondary: 'rgba(235, 235, 235, 0.5)',
  textMuted: 'rgba(235, 235, 235, 0.25)',

  // Scoring thresholds
  scoreLegendary: 1000,
  scoreExcellent: 500,
  scoreGood: 200,
  scoreMeh: 50,

  // Execution limits
  maxExecutionMs: 600_000, // 10 minutes
  maxMemoryBytes: 64 * 1024 * 1024 * 1024, // 64GB virtual
  sandboxTimeoutMs: 300_000, // 5 min sandbox lifetime

  // Rate limits
  maxSubmissionsPerHour: 10,
} as const

export type Difficulty = 'trivial' | 'easy' | 'medium' | 'hard' | 'legendary'
export type Category = 'classic' | 'scale' | 'ml' | 'systems'
export type VoteType = 'upvote' | 'i_hate_this' | 'would_pass_review'

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  trivial: 'Trivial',
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  legendary: 'Legendary',
}

export const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  trivial: 'The optimal solution is so simple, even ChatGPT gets it right.',
  easy: 'One loop, maybe two. Making this terrible requires real commitment.',
  medium: 'The optimal solution has some nuance. Fertile ground for horror.',
  hard: 'Complex enough that terrible solutions blend in with real attempts.',
  legendary: 'The optimal solution is already painful. Making it worse is an art form.',
}

export const CATEGORY_LABELS: Record<Category, string> = {
  classic: 'Classic Algorithms',
  scale: 'Scale Problems',
  ml: 'ML/Data Science',
  systems: 'Systems Design',
}

export const VOTE_LABELS: Record<VoteType, { label: string; icon: string }> = {
  upvote: { label: 'Upvote', icon: '▲' },
  i_hate_this: { label: 'I hate this', icon: '🤮' },
  would_pass_review: { label: 'Would pass code review', icon: '👔' },
}

/** Score tier label and color */
export function getScoreTier(score: number): { label: string; color: string } {
  if (score >= ONO.scoreLegendary) return { label: 'LEGENDARY', color: ONO.red }
  if (score >= ONO.scoreExcellent) return { label: 'EXCELLENT', color: ONO.amber }
  if (score >= ONO.scoreGood) return { label: 'NOTABLE', color: ONO.green }
  if (score >= ONO.scoreMeh) return { label: 'ADEQUATE', color: ONO.textSecondary }
  return { label: 'DISAPPOINTING', color: ONO.textMuted }
}

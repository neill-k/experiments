import type { PhilosophySchool } from './types'

/** Muted, sophisticated accent colors for each philosophy school */
export const schoolColors: Record<PhilosophySchool, string> = {
  stoicism: '#8B9DAF',
  existentialism: '#C4785C',
  utilitarianism: '#7BA68C',
  deontology: '#5CC4B8',
  absurdism: '#B878B8',
  pragmatism: '#C9A84C',
  virtue_ethics: '#A89070',
  nihilism: '#6B6B6B',
  phenomenology: '#9B8EC4',
  rationalism: '#7CA0C9',
  empiricism: '#8BB870',
  taoism: '#D4A574',
  buddhist_philosophy: '#C4A882',
  ubuntu: '#C47878',
}

/** Human-readable labels for philosophy schools */
export const schoolLabels: Record<PhilosophySchool, string> = {
  stoicism: 'Stoicism',
  existentialism: 'Existentialism',
  utilitarianism: 'Utilitarianism',
  deontology: 'Deontology',
  absurdism: 'Absurdism',
  pragmatism: 'Pragmatism',
  virtue_ethics: 'Virtue Ethics',
  nihilism: 'Nihilism',
  phenomenology: 'Phenomenology',
  rationalism: 'Rationalism',
  empiricism: 'Empiricism',
  taoism: 'Taoism',
  buddhist_philosophy: 'Buddhist Philosophy',
  ubuntu: 'Ubuntu',
}

/** Get the color for a school, with fallback */
export function getSchoolColor(school: PhilosophySchool): string {
  return schoolColors[school] ?? '#888888'
}

/** Get the label for a school, with fallback */
export function getSchoolLabel(school: PhilosophySchool): string {
  return schoolLabels[school] ?? school.replace(/_/g, ' ')
}

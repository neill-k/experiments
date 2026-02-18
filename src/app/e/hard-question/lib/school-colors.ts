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
  confucianism: '#C9986B',
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
  confucianism: 'Confucianism',
}

/** One-line descriptions of each philosophy school */
export const schoolDescriptions: Record<PhilosophySchool, string> = {
  stoicism: 'Focus on what you can control; accept what you cannot with equanimity.',
  existentialism: 'Existence precedes essence. You define yourself through choices and action.',
  utilitarianism: 'The right action is whatever produces the greatest good for the greatest number.',
  deontology: 'Act according to moral rules and duty, regardless of consequences.',
  absurdism: 'Life has no inherent meaning, but embrace it anyway with full awareness.',
  pragmatism: 'Truth is what works in practice. Ideas earn their keep through real-world results.',
  virtue_ethics: 'Cultivate character and habits of excellence; become the kind of person who acts well.',
  nihilism: 'No objective meaning, morality, or truth exists. Start from zero.',
  phenomenology: 'Return to lived experience itself. Describe consciousness as it actually appears.',
  rationalism: 'Reason, not sensation, is the primary source of knowledge and truth.',
  empiricism: 'All knowledge comes from sensory experience. Trust observation over abstraction.',
  taoism: 'Flow with the natural way. The best action often looks like non-action.',
  buddhist_philosophy: 'Suffering arises from attachment. Liberation comes through awareness and letting go.',
  ubuntu: 'I am because we are. Personhood is realized through community and relationship.',
  confucianism: 'Social harmony through ritual, respect, and the cultivation of moral character.',
}

/** Get the color for a school, with fallback */
export function getSchoolColor(school: PhilosophySchool): string {
  return schoolColors[school] ?? '#888888'
}

/** Get the label for a school, with fallback */
export function getSchoolLabel(school: PhilosophySchool): string {
  return schoolLabels[school] ?? school.replace(/_/g, ' ')
}

/** Get the description for a school, with fallback */
export function getSchoolDescription(school: PhilosophySchool): string {
  return schoolDescriptions[school] ?? ''
}

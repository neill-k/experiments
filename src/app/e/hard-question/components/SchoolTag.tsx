'use client'

import type { PhilosophySchool } from '../lib/types'
import { getSchoolColor, getSchoolLabel } from '../lib/school-colors'

interface SchoolTagProps {
  school: PhilosophySchool
}

export function SchoolTag({ school }: SchoolTagProps) {
  const color = getSchoolColor(school)
  const label = getSchoolLabel(school)

  return (
    <span
      className="inline-block px-2 py-0.5 text-[0.65rem] uppercase tracking-wider"
      style={{
        fontFamily: 'var(--font-mono)',
        color,
        backgroundColor: `${color}26`, // 15% opacity
      }}
    >
      {label}
    </span>
  )
}

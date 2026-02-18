'use client'

const CATEGORY_COLORS: Record<string, string> = {
  science: '#33ff88',
  history: '#ff8833',
  geography: '#3388ff',
  literature: '#ffcc33',
  math: '#ff3333',
  pop_culture: '#cc33ff',
  sports: '#33ffcc',
  food: '#ff6633',
  technology: '#33ccff',
  default: '#ebebeb',
}

function getCategoryColor(category: string): string {
  const key = category.toLowerCase().replace(/\s+/g, '_')
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.default
}

export function CategoryStamp({ category }: { category: string }) {
  const color = getCategoryColor(category)

  return (
    <div
      className="inline-block px-3 py-1 font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest select-none"
      style={{
        border: `2px solid ${color}`,
        color,
        transform: 'rotate(-2deg)',
        textShadow: `0 0 8px ${color}40`,
      }}
    >
      {category}
    </div>
  )
}

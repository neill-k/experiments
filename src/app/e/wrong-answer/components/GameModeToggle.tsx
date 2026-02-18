'use client'

interface GameModeToggleProps {
  mode: 'quick' | 'daily'
  onChange: (mode: 'quick' | 'daily') => void
}

export function GameModeToggle({ mode, onChange }: GameModeToggleProps) {
  return (
    <div className="flex border-2 border-[#ebebeb]/40">
      <button
        onClick={() => onChange('quick')}
        className="flex-1 min-h-[44px] font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest py-2 px-4 transition-all"
        style={{
          backgroundColor: mode === 'quick' ? '#ebebeb' : 'transparent',
          color: mode === 'quick' ? '#08080a' : '#ebebeb60',
        }}
      >
        Quick Play
      </button>
      <button
        onClick={() => onChange('daily')}
        className="flex-1 min-h-[44px] font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest py-2 px-4 transition-all border-l-2 border-[#ebebeb]/40"
        style={{
          backgroundColor: mode === 'daily' ? '#ebebeb' : 'transparent',
          color: mode === 'daily' ? '#08080a' : '#ebebeb60',
        }}
      >
        Daily Challenge
      </button>
    </div>
  )
}

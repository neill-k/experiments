'use client';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
      <input
        type="text"
        aria-label="Search prompts"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search\u2026"
        className="w-full px-3 py-2.5 bg-transparent border text-xs outline-none min-h-[44px] transition-colors"
        style={{
          borderColor: 'var(--border)',
          color: 'var(--fg)',
          fontFamily: 'var(--font-body)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-hover)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
      />
    </div>
  );
}

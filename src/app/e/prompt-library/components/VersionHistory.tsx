'use client';

interface Version {
  content: string;
  timestamp: number;
}

interface VersionHistoryProps {
  versions: Version[];
  onRestore: (content: string) => void;
}

export function VersionHistory({ versions, onRestore }: VersionHistoryProps) {
  const reversed = [...versions].reverse();

  return (
    <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
      <h3
        className="text-[11px] tracking-widest uppercase mb-3"
        style={{ fontFamily: 'var(--font-body)', color: 'var(--muted)' }}
      >
        Version History
      </h3>
      <div className="space-y-px max-h-48 overflow-y-auto">
        {reversed.map((v, i) => (
          <button
            key={v.timestamp}
            onClick={() => onRestore(v.content)}
            className="w-full text-xs p-3 flex justify-between items-center transition-colors min-h-[44px]"
            style={{ fontFamily: 'var(--font-mono)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(235,235,235,0.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '';
            }}
          >
            <span style={{ color: 'var(--muted)' }}>
              v{versions.length - i}
            </span>
            <span style={{ color: 'var(--border-hover)' }}>
              {new Date(v.timestamp).toLocaleTimeString()}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

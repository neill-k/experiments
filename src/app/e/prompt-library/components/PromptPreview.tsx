'use client';

interface PromptPreviewProps {
  content: string;
  onCopy: () => void;
}

export function PromptPreview({ content, onCopy }: PromptPreviewProps) {
  return (
    <div className="space-y-4">
      <div className="p-5 border" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <h3
            className="text-[11px] tracking-widest uppercase"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--muted)' }}
          >
            Rendered Output
          </h3>
          <button
            onClick={onCopy}
            className="text-[11px] transition-colors"
            style={{ fontFamily: 'var(--font-mono)', color: '#444' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--fg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#444';
            }}
          >
            copy
          </button>
        </div>
        <pre
          className="whitespace-pre-wrap text-sm leading-relaxed"
          style={{ fontFamily: 'var(--font-mono)', color: '#ccc' }}
        >
          {content}
        </pre>
      </div>
    </div>
  );
}

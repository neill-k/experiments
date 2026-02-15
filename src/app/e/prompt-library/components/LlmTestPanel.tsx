'use client';

interface LlmTestPanelProps {
  hasApiKey: boolean;
  loading: boolean;
  response: string;
  onTest: () => void;
}

export function LlmTestPanel({ hasApiKey, loading, response, onTest }: LlmTestPanelProps) {
  return (
    <>
      {response && (
        <div
          className="mt-4 p-4 border"
          style={{ borderColor: 'var(--border)' }}
        >
          <h4
            className="text-[11px] tracking-widest uppercase mb-2"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--muted)' }}
          >
            Response
          </h4>
          <pre
            className="text-xs whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
          >
            {response}
          </pre>
        </div>
      )}
      <div className="mt-4">
        <button
          onClick={onTest}
          disabled={!hasApiKey || loading}
          className="w-full px-3 py-2.5 border disabled:opacity-30 disabled:cursor-not-allowed text-xs transition-colors min-h-[44px]"
          style={{
            borderColor: 'var(--border)',
            fontFamily: 'var(--font-mono)',
            color: 'var(--fg)',
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.borderColor = 'var(--border-hover)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          {loading ? 'calling api\u2026' : 'test with llm'}
        </button>
        {!hasApiKey && (
          <p
            className="text-[11px] mt-2 text-center"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--border-hover)' }}
          >
            Configure API key in settings
          </p>
        )}
      </div>
    </>
  );
}

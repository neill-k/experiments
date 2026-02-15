'use client';

interface VariablePanelProps {
  variables: string[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}

export function VariablePanel({ variables, values, onChange }: VariablePanelProps) {
  return (
    <div>
      <h3
        className="text-[11px] tracking-widest uppercase mb-4"
        style={{ fontFamily: 'var(--font-body)', color: 'var(--muted)' }}
      >
        Variables
      </h3>
      {variables.length === 0 ? (
        <p
          className="text-xs"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--border-hover)' }}
        >
          No variables. Use {'{{variable}}'} syntax.
        </p>
      ) : (
        <div className="space-y-3">
          {variables.map((v) => (
            <div key={v}>
              <label
                className="text-[11px] block mb-1"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--border-hover)' }}
              >
                {v}
              </label>
              <input
                type="text"
                value={values[v] || ''}
                onChange={(e) => onChange({ ...values, [v]: e.target.value })}
                className="w-full px-3 py-2.5 bg-transparent border text-sm outline-none min-h-[44px] transition-colors"
                style={{
                  borderColor: 'var(--border)',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--fg)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-hover)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
                placeholder={v}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

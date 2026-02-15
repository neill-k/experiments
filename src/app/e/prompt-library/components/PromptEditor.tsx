'use client';

interface PromptEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export function PromptEditor({ content, onChange }: PromptEditorProps) {
  return (
    <textarea
      value={content}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-full bg-transparent p-5 text-sm leading-relaxed resize-none outline-none border transition-colors min-h-[300px] md:min-h-0"
      style={{
        fontFamily: 'var(--font-mono)',
        color: 'var(--fg)',
        borderColor: 'var(--border)',
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-hover)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
      placeholder="Write your prompt here\u2026 Use {{variable}} for variables."
    />
  );
}

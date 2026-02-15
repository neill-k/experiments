import Link from "next/link";

import { presets } from "@/app/e/agent-spec-builder/lib/presets";

export default function ExamplesPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <header className="border-b border-[var(--border)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
              Example gallery
            </h1>
            <p className="font-[family-name:var(--font-body)] text-sm text-[var(--muted)]">
              Click an example to load a full spec into the builder.
            </p>
          </div>

          <Link
            href="/e/agent-spec-builder"
            className="border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--muted)] hover:border-[var(--border-hover)] hover:text-[var(--fg)]"
          >
            Back to builder
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {presets.map((p) => (
            <Link
              key={p.id}
              href={`/e/agent-spec-builder?example=${encodeURIComponent(p.id)}`}
              className="group border border-[var(--border)] bg-[var(--bg)] p-4 hover:border-[var(--border-hover)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-[family-name:var(--font-body)] text-sm font-semibold">
                    {p.label}
                  </div>
                  <div className="font-[family-name:var(--font-body)] mt-1 text-sm text-[var(--muted)]">
                    {p.description}
                  </div>
                </div>
                <div className="text-xs text-[var(--muted)] group-hover:text-[var(--fg)]">
                  Load →
                </div>
              </div>

              <div className="mt-3 border border-[var(--border)] bg-[var(--accent)] px-3 py-2 text-xs text-zinc-400">
                <div className="font-[family-name:var(--font-body)] font-medium text-zinc-300">
                  Objective
                </div>
                <div className="mt-1 line-clamp-3">{p.data.objective}</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 text-xs text-[var(--muted)]">
          Note: examples are pre-filled locally in your browser. Nothing is sent
          to a server.
        </div>
      </main>
    </div>
  );
}

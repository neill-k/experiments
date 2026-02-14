import Link from "next/link";

import { presets } from "@/app/e/agent-spec-builder/lib/presets";

export default function ExamplesPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Example gallery</h1>
            <p className="text-sm text-zinc-600">
              Click an example to load a full spec into the builder.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-none-lg border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
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
              href={`/?example=${encodeURIComponent(p.id)}`}
              className="group rounded-none-xl border border-zinc-200 bg-white p-4 hover:border-zinc-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold">{p.label}</div>
                  <div className="mt-1 text-sm text-zinc-600">
                    {p.description}
                  </div>
                </div>
                <div className="text-xs text-zinc-500 group-hover:text-zinc-700">
                  Load →
                </div>
              </div>

              <div className="mt-3 rounded-none-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
                <div className="font-medium text-zinc-800">Objective</div>
                <div className="mt-1 line-clamp-3">{p.data.objective}</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 text-xs text-zinc-600">
          Note: examples are pre-filled locally in your browser. Nothing is sent
          to a server.
        </div>
      </main>
    </div>
  );
}

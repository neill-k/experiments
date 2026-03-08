'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GRAVITY_INBOX_PRESETS } from '@/lib/gravity-inbox'
import type { GravityPresetName } from '@/lib/gravity-inbox'
import { GravityInboxCanvas, type GravityInboxHudState, type GravitySpawnRequest } from './GravityInboxCanvas'

const EMPTY_HUD: GravityInboxHudState = {
  activeCount: 0,
  completedCount: 0,
  mergedCount: 0,
  focusScore: 0,
}

const QUICK_ITEMS = ['Write one sharp paragraph', 'Ship one meaningful tiny thing', 'Text someone you care about']

const PRESET_ORDER: GravityPresetName[] = ['calm', 'chaotic', 'hyperdrive']

export function GravityInboxClient() {
  const [input, setInput] = useState('')
  const [preset, setPreset] = useState<GravityPresetName>('chaotic')
  const [reducedMotion, setReducedMotion] = useState(false)
  const [hud, setHud] = useState<GravityInboxHudState>(EMPTY_HUD)
  const [lastBurned, setLastBurned] = useState<string | null>(null)
  const [spawnRequest, setSpawnRequest] = useState<GravitySpawnRequest | null>(null)
  const spawnIdRef = useRef(0)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update()

    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  const launchItem = useCallback((value: string) => {
    const normalized = value.trim().replace(/\s+/g, ' ').slice(0, 56)
    if (!normalized) return

    spawnIdRef.current += 1
    setSpawnRequest({
      id: spawnIdRef.current,
      label: normalized,
    })
  }, [])

  const focusLabel = useMemo(() => {
    if (hud.focusScore >= 82) return 'deep lock'
    if (hud.focusScore >= 62) return 'strong flow'
    if (hud.focusScore >= 40) return 'warming up'
    return 'fragmented'
  }, [hud.focusScore])

  return (
    <div className="mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.74fr)] lg:gap-6">
        <section className="rounded-lg border border-[var(--border)] bg-white">
          <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-3 py-2 sm:px-4 sm:py-3">
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-lg tracking-[0.02em] sm:text-xl">Gravity Inbox</h1>
              <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.15em] text-[var(--fg)]/60 sm:text-[11px]">
                type priority → orbit it → flick or merge → drag into burn gate
              </p>
            </div>
            <div className="text-right font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-[var(--fg)]/75 sm:text-[11px]">
              <div>{GRAVITY_INBOX_PRESETS[preset].label}</div>
              <div>{focusLabel}</div>
            </div>
          </header>

          <div className="p-2 sm:p-3">
            <GravityInboxCanvas
              preset={preset}
              reducedMotion={reducedMotion}
              spawnRequest={spawnRequest}
              onHudUpdate={setHud}
              onBurn={setLastBurned}
            />
          </div>

          <div className="border-t border-[var(--border)] p-3 sm:p-4">
            <form
              onSubmit={(event) => {
                event.preventDefault()
                launchItem(input)
                setInput('')
              }}
              className="space-y-2"
            >
              <label
                htmlFor="gravity-inbox-input"
                className="block font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-[var(--fg)]/60"
              >
                Drop one daily priority into orbit
              </label>
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <input
                  id="gravity-inbox-input"
                  type="text"
                  value={input}
                  maxLength={56}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="ex: ship draft before lunch"
                  className="h-11 min-w-0 rounded-lg border border-[var(--border)] bg-white/60 px-3 font-[family-name:var(--font-mono)] text-sm text-[var(--fg)] placeholder:text-[var(--fg)]/38"
                />
                <button
                  type="submit"
                  className="h-11 min-w-[150px] rounded-lg border border-cyan-600/45 bg-cyan-600/10 px-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.14em] text-cyan-800 hover:bg-cyan-600/20"
                >
                  Launch Orb
                </button>
              </div>
            </form>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {QUICK_ITEMS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => launchItem(item)}
                  className="h-11 rounded-lg border border-[var(--border)] bg-[var(--fg)]/5 px-2 text-left font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[var(--fg)]/78 hover:bg-[var(--fg)]/8"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>

        <aside className="rounded-lg border border-[var(--border)] bg-white p-3 sm:p-4">
          <section className="rounded-lg border border-[var(--border)] bg-[var(--fg)]/[0.03] p-3 sm:p-4">
            <h2 className="font-[family-name:var(--font-display)] text-lg">Orbit ritual</h2>
            <p className="mt-1 text-sm text-[var(--fg)]/80">
              Start with short, concrete intentions. Keep only what matters in orbit. When you finish one, drag it into
              the burn gate to clear cognitive gravity.
            </p>
            <ol className="mt-3 list-decimal space-y-1 pl-4 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.1em] text-[var(--fg)]/63">
              <li>Type a priority and launch.</li>
              <li>Drag, flick, and combine related orbs.</li>
              <li>Burn done work to raise your focus score.</li>
            </ol>
          </section>

          <section className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--fg)]/[0.03] p-3">
              <div className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-[var(--fg)]/58">active</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">{hud.activeCount}</div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--fg)]/[0.03] p-3">
              <div className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-[var(--fg)]/58">completed</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">{hud.completedCount}</div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--fg)]/[0.03] p-3">
              <div className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-[var(--fg)]/58">focus score</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">{hud.focusScore}</div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--fg)]/[0.03] p-3">
              <div className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-[var(--fg)]/58">merges</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">{hud.mergedCount}</div>
            </div>
          </section>

          <section className="mt-3 rounded-lg border border-[var(--border)] p-3 sm:p-4">
            <h3 className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-[var(--fg)]/70">Physics presets</h3>
            <div className="mt-2 space-y-2">
              {PRESET_ORDER.map((name) => {
                const config = GRAVITY_INBOX_PRESETS[name]
                const selected = name === preset
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setPreset(name)}
                    className={`block h-11 w-full rounded-lg border px-3 text-left font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.12em] ${
                      selected
                        ? 'border-fuchsia-500/55 bg-fuchsia-500/16 text-fuchsia-800'
                        : 'border-[var(--border)] bg-[var(--fg)]/5 text-[var(--fg)]/82 hover:bg-[var(--fg)]/8'
                    }`}
                  >
                    <span>{config.label}</span>
                    <span className="ml-2 text-[10px] text-[var(--fg)]/55">{config.description}</span>
                  </button>
                )
              })}
            </div>
          </section>

          <div className="mt-3 border-t border-[var(--border)] pt-3 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.12em] text-[var(--fg)]/62">
            <div>touch targets are 44px+ for thumbs.</div>
            <div className="mt-1">tip: slow drags encourage merges. fast flicks slingshot into burn gate.</div>
            {reducedMotion && <div className="mt-2 text-emerald-700/85">reduced motion mode active.</div>}
            {lastBurned && <div className="mt-2 text-orange-700/85">burned: {lastBurned}</div>}
          </div>
        </aside>
      </div>
    </div>
  )
}

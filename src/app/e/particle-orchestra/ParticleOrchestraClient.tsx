'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { createOrchestraAudio, type OrchestraAudioState } from '@/lib/particle-orchestra/audio'

type Palette = 'neon' | 'heat' | 'ice'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  hue: number
}

const PALETTES: Record<Palette, [number, number]> = {
  neon: [275, 340],
  heat: [12, 56],
  ice: [185, 240],
}

export function ParticleOrchestraClient() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number>(0)
  const particlesRef = useRef<Particle[]>([])
  const pointerRef = useRef({ x: 0.5, y: 0.5, down: false })
  const audioRef = useRef<OrchestraAudioState | null>(null)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [drive, setDrive] = useState(0.55)
  const [palette, setPalette] = useState<Palette>('neon')
  const [intensityLabel, setIntensityLabel] = useState('warming up')

  const quality = useMemo(() => {
    if (typeof window === 'undefined') return 1
    const width = window.innerWidth
    if (width <= 380) return 0.62
    if (width <= 768) return 0.78
    return 1
  }, [])

  const ensureAudio = useCallback(async () => {
    if (!audioRef.current) {
      audioRef.current = createOrchestraAudio()
    }
    if (audioRef.current.context.state === 'suspended') {
      await audioRef.current.context.resume()
    }
    return audioRef.current
  }, [])

  const spawn = useCallback((cx: number, cy: number, burst: number, width: number, height: number) => {
    const [a, b] = PALETTES[palette]
    const count = Math.floor(22 * quality * burst)
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = (0.4 + Math.random() * 2.4) * (0.5 + drive)
      particlesRef.current.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.7 + Math.random() * 0.95,
        hue: a + Math.random() * (b - a),
      })
    }

    const cap = Math.floor(800 * quality)
    if (particlesRef.current.length > cap) {
      particlesRef.current.splice(0, particlesRef.current.length - cap)
    }

    if (audioRef.current) {
      audioRef.current.setDrive(drive)
      audioRef.current.nudge()
    }

    pointerRef.current.x = width ? cx / width : 0.5
    pointerRef.current.y = height ? cy / height : 0.5
  }, [drive, palette, quality])

  useEffect(() => {
    setReady(true)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !ready) return

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const freqData = new Uint8Array(128)

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2) * quality
      canvas.width = Math.floor(rect.width * dpr)
      canvas.height = Math.floor(rect.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    let last = performance.now()
    const frame = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now

      const w = canvas.clientWidth
      const h = canvas.clientHeight
      ctx.fillStyle = 'rgba(7, 7, 10, 0.22)'
      ctx.fillRect(0, 0, w, h)

      let audioEnergy = 0
      const audio = audioRef.current
      if (audio && playing) {
        audio.analyser.getByteFrequencyData(freqData)
        for (let i = 0; i < freqData.length; i++) audioEnergy += freqData[i]
        audioEnergy /= freqData.length * 255
      }
      const energy = Math.max(audioEnergy, drive * 0.35)

      if (pointerRef.current.down || playing) {
        const x = pointerRef.current.x * w
        const y = pointerRef.current.y * h
        if (Math.random() < 0.55 + energy * 0.7) {
          spawn(x, y, 1 + energy * 1.8, w, h)
        }
      }

      const damping = 0.986 - energy * 0.02
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i]
        p.life -= dt * (0.5 + energy * 0.9)
        if (p.life <= 0) {
          particlesRef.current.splice(i, 1)
          continue
        }
        p.vx *= damping
        p.vy *= damping
        p.vy += (0.2 + energy * 0.8) * dt
        p.x += p.vx * (56 + energy * 150) * dt
        p.y += p.vy * (56 + energy * 150) * dt

        if (p.x < 0 || p.x > w) p.vx *= -0.9
        if (p.y < 0 || p.y > h) p.vy *= -0.9

        const alpha = Math.min(1, p.life)
        const size = 1.4 + energy * 3.4
        ctx.fillStyle = `hsla(${p.hue} 100% 62% / ${alpha})`
        ctx.fillRect(p.x, p.y, size, size)
      }

      if (energy > 0.68) setIntensityLabel('chaotic bloom')
      else if (energy > 0.42) setIntensityLabel('in sync')
      else setIntensityLabel('warming up')

      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [drive, playing, quality, ready, spawn])

  useEffect(() => {
    return () => {
      audioRef.current?.stop()
    }
  }, [])

  const start = useCallback(async () => {
    await ensureAudio()
    audioRef.current?.setDrive(drive)
    setPlaying(true)
  }, [drive, ensureAudio])

  const stop = useCallback(() => {
    setPlaying(false)
  }, [])

  const burst = useCallback(async () => {
    await ensureAudio()
    const canvas = canvasRef.current
    if (!canvas) return
    spawn(canvas.clientWidth * 0.5, canvas.clientHeight * 0.5, 3.2, canvas.clientWidth, canvas.clientHeight)
    setPlaying(true)
  }, [ensureAudio, spawn])

  const onPointer = useCallback(async (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    await ensureAudio()
    setPlaying(true)

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    pointerRef.current.down = event.type !== 'pointerup' && event.type !== 'pointerleave'
    pointerRef.current.x = Math.max(0, Math.min(1, x / rect.width))
    pointerRef.current.y = Math.max(0, Math.min(1, y / rect.height))

    const localDrive = Math.max(0.08, 1 - pointerRef.current.y)
    setDrive(localDrive)
    audioRef.current?.setDrive(localDrive)

    spawn(x, y, 1.45, rect.width, rect.height)
  }, [ensureAudio, spawn])

  return (
    <div className="mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)] lg:gap-6">
        <section className="border border-white/20 bg-[#08080d]">
          <header className="flex items-center justify-between border-b border-white/15 px-3 py-2 sm:px-4 sm:py-3">
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-lg tracking-[0.02em] sm:text-xl">Particle Orchestra</h1>
              <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.16em] text-white/60 sm:text-[11px]">
                tap + drag to conduct sound and light
              </p>
            </div>
            <div className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-white/70 sm:text-[11px]">
              {intensityLabel}
            </div>
          </header>

          <div className="p-2 sm:p-3">
            <canvas
              ref={canvasRef}
              onPointerDown={onPointer}
              onPointerMove={(e) => {
                if (pointerRef.current.down) void onPointer(e)
              }}
              onPointerUp={onPointer}
              onPointerLeave={onPointer}
              className="h-[58dvh] min-h-[320px] w-full touch-none border border-white/15 bg-[#050509]"
            />
          </div>
        </section>

        <aside className="border border-white/20 bg-[#0a0a11] p-3 sm:p-4">
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                if (playing) stop()
                else void start()
              }}
              className="w-full border border-white/25 bg-white/5 px-3 py-2 text-left font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.14em] hover:bg-white/10"
            >
              {playing ? 'Pause Orchestra' : 'Start Orchestra'}
            </button>
            <button
              type="button"
              onClick={() => void burst()}
              className="w-full border border-fuchsia-300/50 bg-fuchsia-400/10 px-3 py-2 text-left font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.14em] hover:bg-fuchsia-400/20"
            >
              Drop a Burst
            </button>

            <label className="block border border-white/15 p-3">
              <div className="mb-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-white/65">energy</div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={drive}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  setDrive(value)
                  audioRef.current?.setDrive(value)
                }}
                className="w-full"
              />
            </label>

            <label className="block border border-white/15 p-3">
              <div className="mb-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-white/65">palette</div>
              <select
                value={palette}
                onChange={(event) => setPalette(event.target.value as Palette)}
                className="w-full border border-white/20 bg-black px-2 py-2 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.12em]"
              >
                <option value="neon">Neon Choir</option>
                <option value="heat">Solar Brass</option>
                <option value="ice">Frozen Echo</option>
              </select>
            </label>
          </div>

          <p className="mt-4 border-t border-white/10 pt-4 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.12em] text-white/55">
            mobile tip: hold + drag vertically for pitch/energy, horizontally for spread.
          </p>
        </aside>
      </div>
    </div>
  )
}

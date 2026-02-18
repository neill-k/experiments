import type { RuleBloomSnapshot, RuleBloomStepStats } from './types'
import { DEFAULT_RULE_BLOOM_PALETTE, clamp01, type RuleBloomPalette } from './palette'

export interface RuleBloomRenderOptions {
  maxDpr?: number
  palette?: RuleBloomPalette
}

export interface RuleBloomResizeOptions {
  cssWidth: number
  cssHeight: number
  dpr?: number
  scale?: number
}

function clampByte(v: number): number {
  if (v <= 0) return 0
  if (v >= 255) return 255
  return v | 0
}

export class RuleBloomRenderer {
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private readonly palette: RuleBloomPalette
  private readonly maxDpr: number

  private offscreen: HTMLCanvasElement
  private offCtx: CanvasRenderingContext2D
  private imageData: ImageData | null = null
  private pixels: Uint8ClampedArray | null = null
  private activity: Float32Array | null = null
  private prevGrains: Uint16Array | null = null

  private simWidth = 0
  private historyRows = 0

  constructor(canvas: HTMLCanvasElement, options: RuleBloomRenderOptions = {}) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) {
      throw new Error('RuleBloomRenderer: 2D context unavailable')
    }

    this.ctx = ctx
    this.ctx.imageSmoothingEnabled = false
    this.palette = options.palette ?? DEFAULT_RULE_BLOOM_PALETTE
    this.maxDpr = options.maxDpr ?? 2

    this.offscreen = document.createElement('canvas')
    const offCtx = this.offscreen.getContext('2d', { alpha: false })
    if (!offCtx) {
      throw new Error('RuleBloomRenderer: offscreen 2D context unavailable')
    }
    this.offCtx = offCtx
    this.offCtx.imageSmoothingEnabled = false
  }

  resize({ cssWidth, cssHeight, dpr = 1, scale = 1 }: RuleBloomResizeOptions): void {
    const safeW = Math.max(64, Math.floor(cssWidth))
    const safeH = Math.max(64, Math.floor(cssHeight))
    const safeScale = Math.max(0.55, Math.min(1, scale))
    const deviceScale = Math.min(Math.max(dpr, 1), this.maxDpr)

    this.canvas.style.width = `${safeW}px`
    this.canvas.style.height = `${safeH}px`

    const internalW = Math.max(96, Math.floor(safeW * deviceScale * safeScale))
    const internalH = Math.max(96, Math.floor(safeH * deviceScale * safeScale))

    if (this.canvas.width !== internalW || this.canvas.height !== internalH) {
      this.canvas.width = internalW
      this.canvas.height = internalH
    }

    this.historyRows = Math.max(96, Math.min(520, Math.floor(internalH * 0.88)))
    this.ctx.imageSmoothingEnabled = false
  }

  private ensureBuffers(simWidth: number): void {
    if (
      this.imageData &&
      this.pixels &&
      this.activity &&
      this.prevGrains &&
      this.simWidth === simWidth &&
      this.offscreen.width === simWidth &&
      this.offscreen.height === this.historyRows
    ) {
      return
    }

    this.simWidth = simWidth
    this.offscreen.width = simWidth
    this.offscreen.height = this.historyRows

    this.imageData = this.offCtx.createImageData(simWidth, this.historyRows)
    this.pixels = this.imageData.data
    this.activity = new Float32Array(simWidth * this.historyRows)
    this.prevGrains = new Uint16Array(simWidth)
  }

  render(snapshot: RuleBloomSnapshot, stats?: RuleBloomStepStats): void {
    this.ensureBuffers(snapshot.width)
    if (!this.imageData || !this.pixels || !this.activity || !this.prevGrains) {
      return
    }

    const width = snapshot.width
    const rows = this.historyRows
    const rowStride = width * 4

    if (rows > 1) {
      this.pixels.copyWithin(rowStride, 0, rowStride * (rows - 1))
      this.activity.copyWithin(width, 0, width * (rows - 1))
    }

    const base = this.palette.background
    const hot = this.palette.ruleHot
    const cold = this.palette.ruleCold
    const grainColor = this.palette.grain
    const cascade = this.palette.cascade
    const decay = this.palette.decay
    const trailColor = this.palette.trail

    for (let x = 0; x < width; x += 1) {
      const idx = x * 4
      const grain = snapshot.grains[x]
      const prev = this.prevGrains[x]
      const delta = grain - prev
      this.prevGrains[x] = grain

      const grainNorm = Math.min(1, grain / 14)
      const ruleBit = snapshot.rule[x] === 1 ? 1 : 0
      const ruleCarrier = ((x + snapshot.tick) & 1) === 0 ? hot : cold
      const rulePulse = ruleBit * (0.58 + (((x * 17 + snapshot.tick * 7) % 19) / 19) * 0.42)

      const cascadeNorm = delta > 0 ? Math.min(1, delta / 5) : 0
      const decayNorm = delta < 0 ? Math.min(1, -delta / 4) : 0

      const activityFromPrev = rows > 1 ? this.activity[width + x] * 0.9 : 0
      const trail = clamp01(activityFromPrev + grainNorm * 0.03 + ruleBit * 0.05 + cascadeNorm * 0.62 + decayNorm * 0.38)
      this.activity[x] = trail

      const r =
        base[0] +
        rulePulse * (ruleCarrier[0] * 0.26) +
        grainNorm * (grainColor[0] * 0.23) +
        cascadeNorm * (cascade[0] * 0.48) +
        decayNorm * (decay[0] * 0.2) +
        trail * (trailColor[0] * 0.28)

      const g =
        base[1] +
        rulePulse * (ruleCarrier[1] * 0.2) +
        grainNorm * (grainColor[1] * 0.21) +
        cascadeNorm * (cascade[1] * 0.42) +
        decayNorm * (decay[1] * 0.27) +
        trail * (trailColor[1] * 0.14)

      const b =
        base[2] +
        rulePulse * (ruleCarrier[2] * 0.33) +
        grainNorm * (grainColor[2] * 0.12) +
        cascadeNorm * (cascade[2] * 0.19) +
        decayNorm * (decay[2] * 0.49) +
        trail * (trailColor[2] * 0.33)

      this.pixels[idx] = clampByte(r)
      this.pixels[idx + 1] = clampByte(g)
      this.pixels[idx + 2] = clampByte(b)
      this.pixels[idx + 3] = 255
    }

    if (stats) {
      const signal = clamp01((stats.topples + stats.decayApplied * 0.6) / 80)
      if (signal > 0.01) {
        const count = Math.max(1, Math.floor(signal * 7))
        for (let i = 0; i < count; i += 1) {
          const x = (snapshot.tick * 13 + i * 31) % width
          const idx = x * 4
          this.pixels[idx] = clampByte(this.pixels[idx] + signal * 140)
          this.pixels[idx + 1] = clampByte(this.pixels[idx + 1] + signal * 80)
          this.pixels[idx + 2] = clampByte(this.pixels[idx + 2] + signal * 150)
        }
      }
    }

    this.offCtx.putImageData(this.imageData, 0, 0)

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.drawImage(this.offscreen, 0, 0, this.canvas.width, this.canvas.height)

    // Subtle horizontal scanline structure for technical-organic look.
    this.ctx.globalCompositeOperation = 'screen'
    this.ctx.fillStyle = 'rgba(235,235,235,0.018)'
    for (let y = 2; y < this.canvas.height; y += 4) {
      this.ctx.fillRect(0, y, this.canvas.width, 1)
    }

    this.ctx.globalCompositeOperation = 'source-over'
  }
}

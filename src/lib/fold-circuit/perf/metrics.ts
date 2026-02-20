export interface PerfSample {
  frameMs: number
  timestamp: number
}

export class FoldCircuitPerfTracker {
  private readonly samples: PerfSample[] = []
  private readonly maxSamples = 180

  push(frameMs: number, timestamp: number): void {
    this.samples.push({ frameMs, timestamp })
    if (this.samples.length > this.maxSamples) {
      this.samples.splice(0, this.samples.length - this.maxSamples)
    }
  }

  averageFrameMs(): number {
    if (this.samples.length === 0) return 0
    let total = 0
    for (let i = 0; i < this.samples.length; i += 1) {
      total += this.samples[i].frameMs
    }
    return total / this.samples.length
  }

  fpsEstimate(): number {
    const avg = this.averageFrameMs()
    if (avg <= 0) return 0
    return Math.round(1000 / avg)
  }
}

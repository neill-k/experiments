'use client'

export interface OrchestraAudioState {
  analyser: AnalyserNode
  context: AudioContext
  setDrive: (value: number) => void
  nudge: () => void
  stop: () => void
}

export function createOrchestraAudio(): OrchestraAudioState {
  const context = new AudioContext()
  const analyser = context.createAnalyser()
  analyser.fftSize = 256
  analyser.smoothingTimeConstant = 0.82

  const master = context.createGain()
  master.gain.value = 0.08

  const toneGain = context.createGain()
  toneGain.gain.value = 0.0

  const noiseGain = context.createGain()
  noiseGain.gain.value = 0.0

  const filter = context.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 580
  filter.Q.value = 1.2

  const osc = context.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.value = 220

  const lfo = context.createOscillator()
  lfo.type = 'triangle'
  lfo.frequency.value = 0.18
  const lfoDepth = context.createGain()
  lfoDepth.gain.value = 45

  const noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate)
  const channel = noiseBuffer.getChannelData(0)
  for (let i = 0; i < channel.length; i++) {
    channel[i] = Math.random() * 2 - 1
  }
  const noise = context.createBufferSource()
  noise.buffer = noiseBuffer
  noise.loop = true

  osc.connect(toneGain)
  noise.connect(noiseGain)
  toneGain.connect(filter)
  noiseGain.connect(filter)
  filter.connect(master)
  master.connect(analyser)
  analyser.connect(context.destination)

  lfo.connect(lfoDepth)
  lfoDepth.connect(filter.frequency)

  osc.start()
  noise.start()
  lfo.start()

  return {
    analyser,
    context,
    setDrive: (value: number) => {
      const now = context.currentTime
      const clamped = Math.max(0, Math.min(1, value))
      toneGain.gain.cancelScheduledValues(now)
      toneGain.gain.linearRampToValueAtTime(0.03 + clamped * 0.18, now + 0.08)
      noiseGain.gain.cancelScheduledValues(now)
      noiseGain.gain.linearRampToValueAtTime(0.012 + clamped * 0.09, now + 0.08)
      filter.frequency.cancelScheduledValues(now)
      filter.frequency.linearRampToValueAtTime(300 + clamped * 1800, now + 0.12)
      osc.frequency.cancelScheduledValues(now)
      osc.frequency.linearRampToValueAtTime(130 + clamped * 440, now + 0.12)
      master.gain.cancelScheduledValues(now)
      master.gain.linearRampToValueAtTime(0.06 + clamped * 0.12, now + 0.12)
    },
    nudge: () => {
      const now = context.currentTime
      master.gain.cancelScheduledValues(now)
      master.gain.setValueAtTime(master.gain.value, now)
      master.gain.linearRampToValueAtTime(0.25, now + 0.03)
      master.gain.linearRampToValueAtTime(0.1, now + 0.24)
    },
    stop: () => {
      osc.stop()
      noise.stop()
      lfo.stop()
      context.close().catch(() => {})
    },
  }
}

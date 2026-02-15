'use client';
import { useRef, useState, useCallback, useEffect } from 'react';

/**
 * Generative ambient audio for deep-sea bioluminescence experience.
 * Uses Web Audio API only — no external audio files.
 *
 * Architecture:
 *   3 detuned sine oscillators → lowpass filter → master gain
 *   1 LFO (sub-Hz sine) modulating master gain for breathing/pulsing
 */

interface AmbientAudioState {
  isPlaying: boolean;
  toggle: () => void;
  startOnInteraction: () => void;
}

export function useAmbientAudio(reducedMotion: boolean): AmbientAudioState {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const oscRefs = useRef<OscillatorNode[]>([]);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const lfoGainRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const startedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const buildGraph = useCallback(() => {
    if (ctxRef.current) return ctxRef.current;

    const ctx = new AudioContext();
    ctxRef.current = ctx;

    // ── Lowpass filter: keep everything warm and soft ──
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 220;  // cut highs aggressively
    filter.Q.value = 0.7;
    filterRef.current = filter;

    // ── Master gain: very low background volume ──
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.0;  // start silent, will ramp up
    masterGainRef.current = masterGain;

    // Connect: filter → master gain → destination
    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    // ── 3 layered oscillators at slightly detuned low frequencies ──
    // Base frequencies: deep ocean hum territory (50–80 Hz)
    const freqs = [
      { freq: 55, detune: 0, gain: 0.045 },     // A1 — deep fundamental
      { freq: 58.5, detune: -5, gain: 0.035 },   // slightly sharp — beating
      { freq: 73.4, detune: 3, gain: 0.025 },    // D2-ish — gentle fifth above
    ];

    const oscNodes: OscillatorNode[] = [];

    for (const { freq, detune, gain: oscGainVal } of freqs) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = detune;

      const oscGain = ctx.createGain();
      oscGain.gain.value = oscGainVal;

      osc.connect(oscGain);
      oscGain.connect(filter);
      oscNodes.push(osc);
    }
    oscRefs.current = oscNodes;

    // ── LFO: slow breathing/pulsing on master gain ──
    // Very slow: ~0.06 Hz = one full breath every ~16 seconds
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.06;
    lfoRef.current = lfo;

    const lfoGain = ctx.createGain();
    // Modulation depth: oscillate master gain by ±0.015
    lfoGain.gain.value = 0.015;
    lfoGainRef.current = lfoGain;

    lfo.connect(lfoGain);
    lfoGain.connect(masterGain.gain);

    return ctx;
  }, []);

  const startAudio = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const ctx = buildGraph();

    // Resume context (required after user gesture)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Start all oscillators
    const now = ctx.currentTime;
    for (const osc of oscRefs.current) {
      osc.start(now);
    }
    lfoRef.current?.start(now);

    // Fade in gently over 3 seconds to base level ~0.05
    if (masterGainRef.current) {
      masterGainRef.current.gain.setValueAtTime(0, now);
      masterGainRef.current.gain.linearRampToValueAtTime(0.05, now + 3);
    }

    setIsPlaying(true);
  }, [buildGraph]);

  const toggle = useCallback(() => {
    const ctx = ctxRef.current;
    const masterGain = masterGainRef.current;

    if (!ctx || !masterGain || !startedRef.current) {
      // First toggle = start
      startAudio();
      return;
    }

    const now = ctx.currentTime;

    if (isPlaying) {
      // Fade out over 1 second
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(masterGain.gain.value, now);
      masterGain.gain.linearRampToValueAtTime(0, now + 1);
      setIsPlaying(false);
    } else {
      // Resume if suspended
      if (ctx.state === 'suspended') ctx.resume();
      // Fade in over 2 seconds
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.05, now + 2);
      setIsPlaying(true);
    }
  }, [isPlaying, startAudio]);

  // Start on first user interaction (click/touch), unless reduced motion
  const startOnInteraction = useCallback(() => {
    if (reducedMotion || startedRef.current) return;
    startAudio();
  }, [reducedMotion, startAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const ctx = ctxRef.current;
      if (ctx && ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
    };
  }, []);

  return { isPlaying, toggle, startOnInteraction };
}

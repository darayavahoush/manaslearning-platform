/**
 * Soft rain-like ambience for the design-the-room game. A brown-noise bed through a gentle lowpass filter.
 * Level 1 to 10 maps to a gain that rises smoothly from quiet to MAX_GAIN. The loudest setting stays well below
 * full volume. Parents should also turn the device volume down. Nothing is recorded here.
 */
const MAX_GAIN = 0.2

export interface RoomSound {
  /** null or 0 is silence; 1 to 10 is the soft rain at that level */
  setLevel(level: number | null): void
  stop(): void
}

export function startRoomSound(): RoomSound | null {
  if (typeof window === 'undefined') return null
  const Ctx = window.AudioContext || (window as unknown as {webkitAudioContext?: typeof AudioContext}).webkitAudioContext
  if (!Ctx) return null
  const ctx = new Ctx()
  const length = ctx.sampleRate * 4
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  // brown noise: a random walk, which sounds like distant rain rather than hiss
  let last = 0
  let peak = 0
  for (let i = 0; i < length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02
    data[i] = last
    peak = Math.max(peak, Math.abs(last))
  }
  if (peak > 0) for (let i = 0; i < length; i++) data[i] /= peak
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = true
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 1500
  const gain = ctx.createGain()
  gain.gain.value = 0
  source.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  source.start()
  void ctx.resume()
  return {
    setLevel(level) {
      // a curve, so the middle of the scale is clearly audible and the top is not harsh
      const target = level && level > 0 ? MAX_GAIN * Math.pow(level / 10, 1.6) : 0
      gain.gain.setTargetAtTime(target, ctx.currentTime, 0.2)
    },
    stop() {
      try { source.stop() } catch { /* already stopped */ }
      void ctx.close()
    },
  }
}

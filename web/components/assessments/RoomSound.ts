/**
 * Soft rain-like noise for the design-the-room game. Level 1 to 10 maps to a gain from 0.012 up to MAX_GAIN,
 * so even the loudest setting stays well below full volume. Parents should also turn the device volume down.
 * Nothing is recorded here; the level the child chooses is sent with the session like the other comfort choices.
 */
const MAX_GAIN = 0.12

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
  const length = ctx.sampleRate * 2
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = true
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 1200
  const gain = ctx.createGain()
  gain.gain.value = 0
  source.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  source.start()
  void ctx.resume()
  return {
    setLevel(level) {
      const target = level && level > 0 ? (level / 10) * MAX_GAIN : 0
      gain.gain.setTargetAtTime(target, ctx.currentTime, 0.2)
    },
    stop() {
      try { source.stop() } catch { /* already stopped */ }
      void ctx.close()
    },
  }
}

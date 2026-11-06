/**
 * Turns per-frame face readings into a handful of session numbers. Pure logic, no camera and no browser APIs,
 * so it can be tested with made-up frames.
 *
 * What it measures: where the head and eyes pointed (towards the screen or away) and how much the head moved.
 * What it cannot tell: why the child looked away, or anything about attention itself. Thresholds are untuned
 * first guesses and need a pilot before any number here is read as more than a description.
 */

export type Segment = 'sunbird' | 'steering' | 'stars' | 'other'
export const SEGMENTS: readonly Segment[] = ['sunbird', 'steering', 'stars', 'other']

export interface FrameSample {
  /** seconds on any steady clock */
  t: number
  /** false when no face was found in the frame */
  face: boolean
  /** head turn left or right, degrees (0 = facing the camera) */
  yaw?: number
  /** head tilt up or down, degrees */
  pitch?: number
  /** eyes strongly turned to the side or up, from the face model's eye blendshapes */
  eyeOff?: boolean
  /** face centre and width, as fractions of the image */
  cx?: number
  cy?: number
  w?: number
}

/** Head turned further than this (either way) counts as facing away from the screen. */
export const YAW_AWAY_DEG = 25
export const PITCH_AWAY_DEG = 25
/** Looking away has to last this long to count as one "look-away" event. */
export const AWAY_EVENT_MIN_SEC = 1
/** Gaps between frames longer than this (tab hidden, camera stalled) are not counted as observed time. */
export const MAX_GAP_SEC = 0.6
/** Camera data is dropped unless the face was seen for this share of the time, for at least this long. */
export const MIN_TRACKED_PCT = 60
export const MIN_OBSERVED_SEC = 20
/** A game's own numbers need at least this many seconds with a face in view. */
export const MIN_SEGMENT_FACE_SEC = 10

interface Bucket {
  observed: number
  face: number
  away: number
  events: number
  moveSum: number
  moveSec: number
}

const empty = (): Bucket => ({observed: 0, face: 0, away: 0, events: 0, moveSum: 0, moveSec: 0})
const round1 = (x: number) => Math.round(x * 10) / 10

export interface SegmentSummary {
  faceSec: number
  awayPct: number
  awayEvents: number
  /** head movement, in percent of face width per second */
  movePct: number | null
}

export interface AttentionSummary {
  observedSec: number
  faceSec: number
  trackedPct: number
  awayPct: number | null
  awayEvents: number
  movePct: number | null
  usable: boolean
  segments: Partial<Record<Segment, SegmentSummary>>
}

export class AttentionAccumulator {
  private seg: Segment = 'other'
  private buckets: Record<Segment, Bucket> = {sunbird: empty(), steering: empty(), stars: empty(), other: empty()}
  private prev: FrameSample | null = null
  private yaw = 0
  private pitch = 0
  private runStart: number | null = null
  private runSeg: Segment = 'other'
  private lastAway = false

  setSegment(seg: Segment) {
    this.seg = seg
  }

  /** Feed frames in time order. */
  add(f: FrameSample) {
    const b = this.buckets[this.seg]
    const prev = this.prev
    const dt = prev ? f.t - prev.t : 0
    const counted = prev !== null && dt > 0 && dt <= MAX_GAP_SEC
    if (prev !== null && dt > MAX_GAP_SEC) this.closeRun(prev.t)

    if (counted) {
      // time since the previous frame is credited to that frame's state; the segment is the current one
      b.observed += dt
      if (prev!.face) b.face += dt
    }

    if (!f.face) {
      this.closeRun(f.t)
      this.lastAway = false
      this.prev = f
      return
    }

    // light smoothing so one jittery frame near a threshold does not flip the state
    this.yaw = prev?.face ? 0.5 * this.yaw + 0.5 * (f.yaw ?? 0) : (f.yaw ?? 0)
    this.pitch = prev?.face ? 0.5 * this.pitch + 0.5 * (f.pitch ?? 0) : (f.pitch ?? 0)
    const away = Math.abs(this.yaw) > YAW_AWAY_DEG || Math.abs(this.pitch) > PITCH_AWAY_DEG || f.eyeOff === true

    if (counted && prev!.face && this.lastAway) b.away += dt

    if (away) {
      if (this.runStart === null) { this.runStart = prev?.face ? prev.t : f.t; this.runSeg = this.seg }
    } else {
      this.closeRun(f.t)
    }
    this.lastAway = away

    if (counted && prev!.face && prev!.cx !== undefined && prev!.cy !== undefined && f.cx !== undefined && f.cy !== undefined) {
      const width = ((prev!.w ?? 0) + (f.w ?? 0)) / 2
      if (width > 0.01) {
        const d = Math.min(1, Math.hypot(f.cx - prev!.cx, f.cy - prev!.cy) / width)
        b.moveSum += d
        b.moveSec += dt
      }
    }
    this.prev = f
  }

  private closeRun(t: number) {
    if (this.runStart !== null && t - this.runStart >= AWAY_EVENT_MIN_SEC) this.buckets[this.runSeg].events += 1
    this.runStart = null
  }

  summary(): AttentionSummary {
    if (this.prev) this.closeRun(this.prev.t)
    const total = empty()
    for (const s of SEGMENTS) {
      const b = this.buckets[s]
      total.observed += b.observed; total.face += b.face; total.away += b.away
      total.events += b.events; total.moveSum += b.moveSum; total.moveSec += b.moveSec
    }
    const trackedPct = total.observed > 0 ? (total.face / total.observed) * 100 : 0
    const segments: Partial<Record<Segment, SegmentSummary>> = {}
    for (const s of SEGMENTS) {
      const b = this.buckets[s]
      if (s === 'other' || b.face < MIN_SEGMENT_FACE_SEC) continue
      segments[s] = {
        faceSec: round1(b.face),
        awayPct: round1((b.away / b.face) * 100),
        awayEvents: b.events,
        movePct: b.moveSec > 0 ? round1((b.moveSum / b.moveSec) * 100) : null,
      }
    }
    return {
      observedSec: round1(total.observed),
      faceSec: round1(total.face),
      trackedPct: round1(trackedPct),
      awayPct: total.face > 0 ? round1((total.away / total.face) * 100) : null,
      awayEvents: total.events,
      movePct: total.moveSec > 0 ? round1((total.moveSum / total.moveSec) * 100) : null,
      usable: total.observed >= MIN_OBSERVED_SEC && trackedPct >= MIN_TRACKED_PCT,
      segments,
    }
  }

  /**
   * The numbers that travel with the session. Empty when the camera produced no frames at all.
   * When the camera ran but the face was seen too little, only the status and the coverage numbers are sent.
   */
  telemetry(): Record<string, number> {
    const s = this.summary()
    if (s.observedSec <= 0) return {}
    const out: Record<string, number> = {camStatus: s.usable ? 1 : 0, camSec: Math.round(s.observedSec), camTrackedPct: Math.round(s.trackedPct)}
    if (!s.usable) return out
    if (s.awayPct !== null) out.camAwayPct = Math.round(s.awayPct)
    out.camAwayEvents = s.awayEvents
    if (s.movePct !== null) out.camMovePct = Math.round(s.movePct)
    const names: Array<[Segment, string]> = [['sunbird', 'Sunbird'], ['steering', 'Steering'], ['stars', 'Stars']]
    for (const [seg, label] of names) {
      const x = s.segments[seg]
      if (!x) continue
      out[`camAwayPct${label}`] = Math.round(x.awayPct)
      if (x.movePct !== null) out[`camMove${label}`] = Math.round(x.movePct)
    }
    return out
  }
}

/** Head yaw and pitch (degrees) from MediaPipe's 4x4 column-major face transform. Signs do not matter here. */
export function headAngles(m: ArrayLike<number>): {yaw: number; pitch: number} | null {
  if (m.length < 16) return null
  const s = Math.hypot(m[8], m[9], m[10])
  if (!(s > 1e-6)) return null
  const r02 = m[8] / s
  const r12 = m[9] / s
  const r22 = m[10] / s
  const deg = 180 / Math.PI
  return {yaw: Math.atan2(r02, r22) * deg, pitch: Math.asin(Math.max(-1, Math.min(1, -r12))) * deg}
}

/** Sideways eye direction from the eye blendshape scores: positive towards the child's left, negative towards the right. */
export function eyeHorizontal(scores: Record<string, number>): number {
  const g = (k: string) => scores[k] ?? 0
  return (g('eyeLookOutLeft') + g('eyeLookInRight') - g('eyeLookInLeft') - g('eyeLookOutRight')) / 2
}

/** Eyes strongly turned sideways (or up) from the eye blendshape scores. Looking down is expected at a screen and is ignored. */
export function eyesOff(scores: Record<string, number>): boolean {
  const g = (k: string) => scores[k] ?? 0
  const up = (g('eyeLookUpLeft') + g('eyeLookUpRight')) / 2
  return Math.abs(eyeHorizontal(scores)) > 0.55 || up > 0.6
}

/**
 * Which side of the screen is the child looking at? Pure logic for the autism "looking game": no camera, no browser APIs.
 *
 * A webcam cannot say where on the screen someone looks, but it can tell left from right if it is first shown what
 * left and right look like for this child. So the game calibrates (the child looks at a star on the left, then on the
 * right), and each later frame is placed between those two. The signal combines the eye direction and the head turn.
 *
 * What it cannot tell: what drew the child's eyes (the picture, its movement, its brightness), or why. Thresholds are
 * untuned first guesses and need a pilot before any number here is read as more than a description.
 */

export type Side = 'left' | 'right'

/** The side the face picture is on in each of the six trials: three left, three right, no side more than twice in a row. */
export const LOOK_SOCIAL_SIDES: readonly Side[] = ['left', 'right', 'left', 'left', 'right', 'right']

export interface GazeSample {
  /** seconds on any steady clock */
  t: number
  face: boolean
  /** head turn, degrees */
  yaw?: number
  /** eyes turned to the child's left (positive) or right (negative), 0 to 1 from the face model */
  eyeH?: number
}

const EYE_SCALE = 0.3
const YAW_SCALE = 20
/** Calibration is rejected unless the two targets look this different (in scaled units) ... */
export const MIN_SEPARATION = 0.6
/** ... and each target's frames agree with each other (median spread, where the two targets sit at -0.5 and +0.5). */
export const MAX_CAL_SPREAD = 0.25
export const MIN_CAL_FRAMES = 8
/** A frame counts as left or right only when it is this far from the middle (the targets sit at -0.5 and +0.5). */
export const SIDE_P = 0.2
export const MAX_GAP_SEC = 0.6
/** A trial counts only with this many seconds clearly on one side or the other, and the face seen for this share of it. */
export const MIN_SIDE_SEC = 2.5
export const MIN_TRIAL_FACE_PCT = 60
/** The result is reported only when at least this many trials counted. */
export const MIN_VALID_TRIALS = 4

export interface Calibration {
  mid: [number, number]
  d: [number, number]
  dd: number
}

const median = (a: number[]): number => {
  const s = [...a].sort((x, y) => x - y)
  const n = s.length
  return n === 0 ? NaN : n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2
}
const round1 = (x: number) => Math.round(x * 10) / 10

const point = (s: GazeSample): [number, number] | null =>
  s.face && s.eyeH !== undefined && s.yaw !== undefined && Number.isFinite(s.eyeH) && Number.isFinite(s.yaw) ? [s.eyeH / EYE_SCALE, s.yaw / YAW_SCALE] : null

/** Where a frame sits between the two calibration targets: about -0.5 on the left target, +0.5 on the right one. */
export function project(cal: Calibration, s: GazeSample): number | null {
  const p = point(s)
  if (!p) return null
  return ((p[0] - cal.mid[0]) * cal.d[0] + (p[1] - cal.mid[1]) * cal.d[1]) / cal.dd
}

/** Frames recorded while the child looked at the left star, and at the right star. Null when the two cannot be told apart. */
export function calibrate(left: GazeSample[], right: GazeSample[]): Calibration | null {
  const L = left.map(point).filter((p): p is [number, number] => p !== null)
  const R = right.map(point).filter((p): p is [number, number] => p !== null)
  if (L.length < MIN_CAL_FRAMES || R.length < MIN_CAL_FRAMES) return null
  const mL: [number, number] = [median(L.map((p) => p[0])), median(L.map((p) => p[1]))]
  const mR: [number, number] = [median(R.map((p) => p[0])), median(R.map((p) => p[1]))]
  const d: [number, number] = [mR[0] - mL[0], mR[1] - mL[1]]
  const dd = d[0] * d[0] + d[1] * d[1]
  if (Math.sqrt(dd) < MIN_SEPARATION) return null
  const cal: Calibration = {mid: [(mL[0] + mR[0]) / 2, (mL[1] + mR[1]) / 2], d, dd}
  const spread = (pts: Array<[number, number]>) => {
    const ps = pts.map((p) => ((p[0] - cal.mid[0]) * d[0] + (p[1] - cal.mid[1]) * d[1]) / dd)
    const m = median(ps)
    return median(ps.map((x) => Math.abs(x - m)))
  }
  if (spread(L) > MAX_CAL_SPREAD || spread(R) > MAX_CAL_SPREAD) return null
  return cal
}

export function sideOf(p: number): Side | 'centre' {
  return p > SIDE_P ? 'right' : p < -SIDE_P ? 'left' : 'centre'
}

export interface TrialResult {
  socialSide: Side
  seconds: number
  faceSec: number
  socialSec: number
  otherSec: number
  centreSec: number
  rightSec: number
}

interface Open extends TrialResult {
  prevT: number | null
  prevFace: boolean
  prevSide: Side | 'centre' | null
  smoothed: number | null
}

export function validTrial(t: TrialResult): boolean {
  return t.socialSec + t.otherSec >= MIN_SIDE_SEC && t.seconds > 0 && (t.faceSec / t.seconds) * 100 >= MIN_TRIAL_FACE_PCT
}

export interface LookingSummary {
  shown: number
  valid: number
  usable: boolean
  /** share of the looking time (clearly on one side or the other) that was on the face picture, time-weighted over valid trials */
  socialPct: number | null
  /** share of the same time that was on the right side of the screen, whichever picture was there */
  rightPct: number | null
  /** per trial, in order shown: percent of side time on the face picture, or null when the trial did not count */
  perTrial: Array<number | null>
}

export class LookingTrials {
  private open: Open | null = null
  private done: TrialResult[] = []

  constructor(private cal: Calibration) {}

  begin(socialSide: Side) {
    this.end()
    this.open = {socialSide, seconds: 0, faceSec: 0, socialSec: 0, otherSec: 0, centreSec: 0, rightSec: 0, prevT: null, prevFace: false, prevSide: null, smoothed: null}
  }

  /** Feed frames in time order while a trial is showing. */
  add(s: GazeSample) {
    const o = this.open
    if (!o) return
    const dt = o.prevT === null ? 0 : s.t - o.prevT
    if (o.prevT !== null && dt > 0 && dt <= MAX_GAP_SEC) {
      o.seconds += dt
      if (o.prevFace && o.prevSide) {
        o.faceSec += dt
        if (o.prevSide === 'centre') o.centreSec += dt
        else {
          if (o.prevSide === o.socialSide) o.socialSec += dt
          else o.otherSec += dt
          if (o.prevSide === 'right') o.rightSec += dt
        }
      }
    }
    const p = project(this.cal, s)
    if (p === null) {
      o.prevFace = false
      o.prevSide = null
      o.smoothed = null
    } else {
      o.smoothed = o.smoothed === null ? p : 0.5 * o.smoothed + 0.5 * p
      o.prevFace = true
      o.prevSide = sideOf(o.smoothed)
    }
    o.prevT = s.t
  }

  end() {
    if (!this.open) return
    const {prevT, prevFace, prevSide, smoothed, ...r} = this.open
    void prevT; void prevFace; void prevSide; void smoothed
    this.done.push(r)
    this.open = null
  }

  summary(): LookingSummary {
    this.end()
    const valid = this.done.filter(validTrial)
    const perTrial = this.done.map((t) => (validTrial(t) ? round1((t.socialSec / (t.socialSec + t.otherSec)) * 100) : null))
    const side = valid.reduce((a, t) => a + t.socialSec + t.otherSec, 0)
    const social = valid.reduce((a, t) => a + t.socialSec, 0)
    const right = valid.reduce((a, t) => a + t.rightSec, 0)
    return {
      shown: this.done.length,
      valid: valid.length,
      usable: valid.length >= MIN_VALID_TRIALS,
      socialPct: side > 0 ? round1((social / side) * 100) : null,
      rightPct: side > 0 ? round1((right / side) * 100) : null,
      perTrial,
    }
  }
}

/** What travels with the session when calibration failed and the trials were skipped. */
export const NOT_CALIBRATED_TELEMETRY: Record<string, number> = {lookStatus: 0, lookCal: 0}

export function lookingTelemetry(s: LookingSummary): Record<string, number> {
  const out: Record<string, number> = {lookStatus: s.usable ? 1 : 0, lookCal: 1, lookShown: s.shown, lookTrials: s.valid}
  if (!s.usable) return out
  if (s.socialPct !== null) out.lookSocialPct = Math.round(s.socialPct)
  if (s.rightPct !== null) out.lookRightPct = Math.round(s.rightPct)
  s.perTrial.forEach((p, i) => { if (p !== null) out[`lookPct${i + 1}`] = Math.round(p) })
  return out
}

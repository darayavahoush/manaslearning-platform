/**
 * Small, dependency-free statistics helpers for the Manas play-session record.
 * Nothing here scores a child against other children.
 */

/** 95% Wilson score interval for k successes out of n trials, as proportions between 0 and 1. */
export function wilson(k: number, n: number): [number, number] {
  const z = 1.96
  const p = k / n
  const d = 1 + (z * z) / n
  const c = p + (z * z) / (2 * n)
  const m = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)
  return [Math.max(0, (c - m) / d), Math.min(1, (c + m) / d)]
}

export const pct = (x: number): number => Math.round(x * 100)

export function median(values: number[]): number | null {
  const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b)
  if (!v.length) return null
  const mid = Math.floor(v.length / 2)
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2
}

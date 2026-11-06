'use client'
import {useCallback, useEffect, useRef, useState} from 'react'
import {AttentionAccumulator, eyesOff, headAngles, type Segment} from './attention-metrics'

/**
 * On-device head and eye direction, for the optional camera step.
 *
 * Video never leaves the device: frames go from the camera to a face model running in this page, and only
 * the counts in `telemetry()` (looked-away time, head movement) are kept. No frame is drawn to a canvas,
 * saved, uploaded or sent to any server. The model and its runtime are served from this site.
 */

export type CameraStatus = 'off' | 'starting' | 'on' | 'denied' | 'error'

const WASM_BASE = '/decor/mediapipe/wasm'
const MODEL_URL = '/decor/mediapipe/face_landmarker.task'
const FRAME_MS = 140 // about 7 frames a second: enough for looking-away over seconds, light on cheap devices

type Landmarker = {
  detectForVideo: (v: HTMLVideoElement, ts: number) => {
    faceLandmarks?: Array<Array<{x: number; y: number}>>
    faceBlendshapes?: Array<{categories: Array<{categoryName: string; score: number}>}>
    facialTransformationMatrixes?: Array<{data: ArrayLike<number>}>
  }
  close: () => void
}

export function useAttentionCamera() {
  const [status, setStatus] = useState<CameraStatus>('off')
  const acc = useRef(new AttentionAccumulator())
  const videoEl = useRef<HTMLVideoElement | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const landmarker = useRef<Landmarker | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastVideoTime = useRef(-1)

  const videoRef = useCallback((el: HTMLVideoElement | null) => { videoEl.current = el }, [])

  const stop = useCallback(() => {
    if (timer.current) { clearInterval(timer.current); timer.current = null }
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null
    if (videoEl.current) videoEl.current.srcObject = null
    try { landmarker.current?.close() } catch { /* already closed */ }
    landmarker.current = null
    setStatus((s) => (s === 'on' || s === 'starting' ? 'off' : s))
  }, [])

  const start = useCallback(async (): Promise<boolean> => {
    if (status === 'on' || status === 'starting') return status === 'on'
    setStatus('starting')
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported')
      let media: MediaStream
      try {
        media = await navigator.mediaDevices.getUserMedia({
          video: {facingMode: 'user', width: {ideal: 320}, height: {ideal: 240}, frameRate: {ideal: 15}},
          audio: false,
        })
      } catch (e) {
        const name = (e as {name?: string}).name
        setStatus(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'error')
        return false
      }
      stream.current = media

      const vision = await import('@mediapipe/tasks-vision')
      const files = await vision.FilesetResolver.forVisionTasks(WASM_BASE)
      const make = (delegate: 'GPU' | 'CPU') => vision.FaceLandmarker.createFromOptions(files, {
        baseOptions: {modelAssetPath: MODEL_URL, delegate},
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
      })
      let lm: Landmarker
      try { lm = (await make('GPU')) as unknown as Landmarker } catch { lm = (await make('CPU')) as unknown as Landmarker }
      landmarker.current = lm

      const el = videoEl.current
      if (!el) throw new Error('no video element')
      el.srcObject = media
      el.muted = true
      el.playsInline = true
      await el.play()

      timer.current = setInterval(() => {
        const v = videoEl.current
        const model = landmarker.current
        if (!v || !model || document.hidden || v.readyState < 2 || v.currentTime === lastVideoTime.current) return
        lastVideoTime.current = v.currentTime
        const t = performance.now() / 1000
        let r: ReturnType<Landmarker['detectForVideo']>
        try { r = model.detectForVideo(v, performance.now()) } catch { return }
        const pts = r.faceLandmarks?.[0]
        if (!pts || pts.length === 0) { acc.current.add({t, face: false}); return }
        let minX = 1, maxX = 0, minY = 1, maxY = 0
        for (const p of pts) {
          if (p.x < minX) minX = p.x
          if (p.x > maxX) maxX = p.x
          if (p.y < minY) minY = p.y
          if (p.y > maxY) maxY = p.y
        }
        const m = r.facialTransformationMatrixes?.[0]?.data
        const angles = m ? headAngles(m) : null
        const scores: Record<string, number> = {}
        for (const c of r.faceBlendshapes?.[0]?.categories ?? []) scores[c.categoryName] = c.score
        acc.current.add({
          t, face: true,
          yaw: angles?.yaw, pitch: angles?.pitch,
          eyeOff: eyesOff(scores),
          cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, w: maxX - minX,
        })
      }, FRAME_MS)

      setStatus('on')
      return true
    } catch {
      stop()
      setStatus('error')
      return false
    }
  }, [status, stop])

  useEffect(() => stop, [stop])

  const setSegment = useCallback((s: Segment) => acc.current.setSegment(s), [])
  const telemetry = useCallback(() => acc.current.telemetry(), [])

  return {status, start, stop, videoRef, setSegment, telemetry}
}

export type AttentionCamera = ReturnType<typeof useAttentionCamera>

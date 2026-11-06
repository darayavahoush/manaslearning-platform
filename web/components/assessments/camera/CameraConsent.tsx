'use client'
import {useEffect, useState} from 'react'
import type {AttentionCamera, CameraQuality} from './useAttentionCamera'

const QUALITY_TIPS: Record<CameraQuality, {title: string; text: string; good?: boolean}> = {
  searching: {title: 'Starting up.', text: 'Sit in front of the screen so the face is in the picture.'},
  noface: {title: 'No face found.', text: 'Make sure the light is in front, not a window behind, and the whole face is in the picture.'},
  far: {title: 'A little too far away.', text: 'Move closer to the screen.'},
  close: {title: 'A little too close.', text: 'Move back a little so the whole face fits.'},
  offcentre: {title: 'Not in the middle.', text: 'Move so the face is in the middle of the picture.'},
  turned: {title: 'Looking away.', text: 'Look straight at the screen for a moment.'},
  good: {title: 'Looking good.', text: 'Hold still for a moment.', good: true},
}

/**
 * Optional camera step, shown to the grown-up before the first game. The camera is off unless they agree here.
 * Playing without it changes nothing else in the quest.
 */
export default function CameraConsent({cam, childName, onContinue, variant = 'attention'}: {cam: AttentionCamera; childName: string; onContinue: (cameraOn: boolean) => void; variant?: 'attention' | 'looking'}) {
  const [agreed, setAgreed] = useState(false)
  const [checking, setChecking] = useState(false)
  const [steady, setSteady] = useState(false)
  const name = childName.trim() || 'your child'
  const failed = cam.status === 'denied' || cam.status === 'error'

  // the check passes after the face has been well placed for two seconds in a row
  useEffect(() => {
    if (!checking || cam.quality !== 'good') return
    const id = setTimeout(() => setSteady(true), 2000)
    return () => { clearTimeout(id); setSteady(false) }
  }, [checking, cam.quality])

  if (checking && cam.status === 'on') {
    const tip = QUALITY_TIPS[cam.quality]
    return (
      <section aria-labelledby="camera-check-title" className="rounded-3xl border-2 border-teal-300/40 bg-white/95 backdrop-blur-md p-6 md:p-10 shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-wider text-teal-700">For the grown-up · camera check</p>
        <h2 id="camera-check-title" className="font-patrick text-3xl text-[#0F172A] mt-1 mb-3">Let&apos;s check the camera can see {name}</h2>
        <p className="text-sm text-[#334155] mb-4">Sit {name} in front of the screen where they will play, with the light in front of them. The small picture in the corner shows what the camera sees.</p>
        <div role="status" aria-live="polite" className={`flex items-start gap-3 rounded-2xl border p-4 mb-5 text-sm ${steady ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : tip.good ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-300 bg-amber-50 text-amber-900'}`}>
          <span aria-hidden="true" className={`mt-1 h-3 w-3 shrink-0 rounded-full ${steady || tip.good ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span><strong>{steady ? 'All set.' : tip.title}</strong> {steady ? 'The camera can see the face well.' : tip.text}</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => { cam.resetMeasures(); onContinue(true) }}
            className={`rounded-full px-6 py-3 text-sm font-bold ${steady ? 'bg-teal-600 text-white' : 'border-2 border-slate-300 text-slate-700'}`}
          >
            {steady ? 'Looks good, start' : 'Start anyway'}
          </button>
          <button type="button" onClick={() => { cam.stop(); onContinue(false) }} className="rounded-full border-2 border-slate-300 px-6 py-3 text-sm font-bold text-slate-700">
            Turn the camera off and play without it
          </button>
        </div>
        {!steady && (
          <p className="text-xs text-slate-600 mt-3">If you start anyway and the face is seen too little during play, the camera numbers are left out of the report instead of being shown.</p>
        )}
      </section>
    )
  }

  return (
    <section aria-labelledby="camera-consent-title" className="rounded-3xl border-2 border-teal-300/40 bg-white/95 backdrop-blur-md p-6 md:p-10 shadow-2xl">
      <p className="text-xs font-bold uppercase tracking-wider text-teal-700">For the grown-up · optional</p>
      <h2 id="camera-consent-title" className="font-patrick text-3xl text-[#0F172A] mt-1 mb-3">
        {variant === 'looking' ? <>Let the camera see which side {name} looks at in a short looking game?</> : <>Let the camera notice where {name}&apos;s head is turned?</>}
      </h2>
      <p className="text-sm text-[#334155] mb-4">
        {variant === 'looking'
          ? <>The game lasts about two minutes. {name} first looks at a star on the left and then on the right, so the camera learns what each side looks like. Then two pictures sit side by side for a few seconds each, a friendly cartoon face and some moving shapes, and the camera notes which side {name} looks at. The report adds a few numbers from this.</>
          : <>If you turn this on, the camera watches which way {name}&apos;s head and eyes point during the games and how much the head moves. The report then adds a few extra numbers, such as how long they looked away from the screen.</>}
      </p>

      <ul className="text-sm text-[#334155] space-y-2 mb-5 list-disc pl-5">
        <li><strong>No video or photos are saved or sent.</strong> The camera picture is read on this device and thrown away straight away.</li>
        <li>Only a few totals leave the game, like &quot;looked away 6 times&quot;. They go into the summary with the other numbers.</li>
        <li>A small picture in the corner shows whenever the camera is on, with a Stop camera button.</li>
        <li>{variant === 'looking' ? 'It turns off by itself when the looking game ends.' : 'It turns off by itself when the games end.'} Skipping it changes nothing else in the quest.</li>
        <li>{variant === 'looking' ? 'This describes which side of the screen was looked at. It cannot say why, and it is not a test of anything.' : 'This describes where the head and eyes pointed. It cannot say why, and it is not a test of anything.'}</li>
      </ul>

      <label className="flex items-start gap-3 text-sm text-slate-800 mb-5">
        <input type="checkbox" className="mt-1 h-4 w-4" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        <span>I am {name}&apos;s parent or guardian, and I agree to the camera being used in this way for this session.</span>
      </label>

      {failed && (
        <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3 mb-4">
          {cam.status === 'denied'
            ? 'The camera was not allowed. You can allow it in your browser settings and try again, or play without it.'
            : 'The camera could not start on this device or browser. You can play without it.'}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!agreed || cam.status === 'starting'}
          onClick={async () => { if (await cam.start()) setChecking(true) }}
          className="rounded-full bg-teal-600 px-6 py-3 text-sm font-bold text-white disabled:opacity-40"
        >
          {cam.status === 'starting' ? 'Starting the camera…' : 'Turn on the camera'}
        </button>
        <button type="button" onClick={() => onContinue(false)} className="rounded-full border-2 border-slate-300 px-6 py-3 text-sm font-bold text-slate-700">
          {failed ? 'Continue without the camera' : 'No thanks, play without it'}
        </button>
      </div>
    </section>
  )
}

/**
 * The always-visible sign that the camera is on: a small mirrored picture with a Stop button. It also holds the video
 * element the face model reads from. It is mounted for the whole quest and hidden (not removed) while the camera is off.
 */
export function CameraBadge({status, videoRef, onStop, large = false}: {status: AttentionCamera['status']; videoRef: AttentionCamera['videoRef']; onStop: () => void; large?: boolean}) {
  const live = status === 'on' || status === 'starting'
  return (
    <div
      className="fixed bottom-3 left-3 z-50 flex items-center gap-2 rounded-2xl bg-slate-900/85 p-1.5 pr-3 text-white shadow-lg"
      style={live ? undefined : {opacity: 0, pointerEvents: 'none', width: 1, height: 1, overflow: 'hidden', padding: 0}}
      aria-hidden={!live}
    >
      <video ref={videoRef} muted playsInline className={`rounded-xl object-cover ${large ? 'h-36 w-28' : 'h-14 w-11'}`} style={{transform: 'scaleX(-1)'}} />
      <div className="flex flex-col items-start">
        <span className="flex items-center gap-1 text-[11px] font-bold"><span className="h-2 w-2 rounded-full bg-red-500" />Camera on</span>
        <button type="button" onClick={onStop} className="text-[11px] underline">Stop camera</button>
      </div>
    </div>
  )
}

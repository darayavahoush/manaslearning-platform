'use client'
import {useState} from 'react'
import type {AttentionCamera} from './useAttentionCamera'

/**
 * Optional camera step, shown to the grown-up before the first game. The camera is off unless they agree here.
 * Playing without it changes nothing else in the quest.
 */
export default function CameraConsent({cam, childName, onContinue}: {cam: AttentionCamera; childName: string; onContinue: () => void}) {
  const [agreed, setAgreed] = useState(false)
  const name = childName.trim() || 'your child'
  const failed = cam.status === 'denied' || cam.status === 'error'

  return (
    <section aria-labelledby="camera-consent-title" className="rounded-3xl border-2 border-teal-300/40 bg-white/95 backdrop-blur-md p-6 md:p-10 shadow-2xl">
      <p className="text-xs font-bold uppercase tracking-wider text-teal-700">For the grown-up · optional</p>
      <h2 id="camera-consent-title" className="font-patrick text-3xl text-[#0F172A] mt-1 mb-3">Let the camera notice where {name}&apos;s head is turned?</h2>
      <p className="text-sm text-[#334155] mb-4">
        If you turn this on, the camera watches which way {name}&apos;s head and eyes point during the games and how much the head moves.
        The report then adds a few extra numbers, such as how long they looked away from the screen.
      </p>

      <ul className="text-sm text-[#334155] space-y-2 mb-5 list-disc pl-5">
        <li><strong>No video or photos are saved or sent.</strong> The camera picture is read on this device and thrown away straight away.</li>
        <li>Only a few totals leave the game, like &quot;looked away 6 times&quot;. They go into the summary with the other numbers.</li>
        <li>A small picture in the corner shows whenever the camera is on, with a Stop camera button.</li>
        <li>It turns off by itself when the games end. Skipping it changes nothing else in the quest.</li>
        <li>This describes where the head and eyes pointed. It cannot say why, and it is not a test of anything.</li>
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
          onClick={async () => { if (await cam.start()) onContinue() }}
          className="rounded-full bg-teal-600 px-6 py-3 text-sm font-bold text-white disabled:opacity-40"
        >
          {cam.status === 'starting' ? 'Starting the camera…' : 'Turn on the camera'}
        </button>
        <button type="button" onClick={onContinue} className="rounded-full border-2 border-slate-300 px-6 py-3 text-sm font-bold text-slate-700">
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
export function CameraBadge({cam}: {cam: AttentionCamera}) {
  const live = cam.status === 'on' || cam.status === 'starting'
  return (
    <div
      className="fixed bottom-3 left-3 z-50 flex items-center gap-2 rounded-2xl bg-slate-900/85 p-1.5 pr-3 text-white shadow-lg"
      style={live ? undefined : {opacity: 0, pointerEvents: 'none', width: 1, height: 1, overflow: 'hidden', padding: 0}}
      aria-hidden={!live}
    >
      <video ref={cam.videoRef} muted playsInline className="h-14 w-11 rounded-xl object-cover" style={{transform: 'scaleX(-1)'}} />
      <div className="flex flex-col items-start">
        <span className="flex items-center gap-1 text-[11px] font-bold"><span className="h-2 w-2 rounded-full bg-red-500" />Camera on</span>
        <button type="button" onClick={cam.stop} className="text-[11px] underline">Stop camera</button>
      </div>
    </div>
  )
}

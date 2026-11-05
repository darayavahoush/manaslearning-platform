'use client'
import {useEffect, useState} from 'react'
import {createPortal} from 'react-dom'

// For young children who cannot read the story screens yet: a "Hear this" button that reads the screen's
// instructions aloud with the device voice. Shown only for ages 8 and under, and only on story screens.
export default function ReadAloud({age, stage}: {age: number; stage: string}) {
  const [mounted, setMounted] = useState(false)
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  // stop speaking whenever the screen changes
  useEffect(() => {
    return () => {
      try { window.speechSynthesis.cancel() } catch {}
      setSpeaking(false)
    }
  }, [stage])

  const ok = mounted && age <= 8 && stage.endsWith('_story') && typeof window !== 'undefined' && 'speechSynthesis' in window
  if (!ok) return null

  const read = () => {
    const synth = window.speechSynthesis
    if (speaking) { synth.cancel(); setSpeaking(false); return }
    const root = document.querySelector('.qd-stage [class~="md:p-8"]') as HTMLElement | null
    let text = ''
    if (root) {
      const c = root.cloneNode(true) as HTMLElement
      c.querySelectorAll('button,svg,img').forEach((n) => n.remove())
      text = c.textContent || ''
    } else {
      text = Array.from(document.querySelectorAll('.qd-stage p')).map((x) => x.textContent || '').join(' ')
    }
    text = text.replace(/\s+/g, ' ').trim()
    if (!text) return
    const u = new SpeechSynthesisUtterance(text)
    const v = synth.getVoices()
    u.voice = v.find((x) => x.lang.startsWith('en-IN')) || v.find((x) => x.lang.startsWith('en')) || null
    u.lang = u.voice?.lang || 'en-IN'
    u.rate = age <= 5 ? 0.8 : 0.9
    u.onend = () => setSpeaking(false)
    u.onerror = () => setSpeaking(false)
    synth.cancel()
    synth.speak(u)
    setSpeaking(true)
  }

  return createPortal(
    <button
      type="button"
      onClick={read}
      aria-pressed={speaking}
      className="fixed bottom-4 left-4 z-[60] inline-flex min-h-[56px] items-center gap-2 rounded-full border-2 border-[#1F2937] bg-white px-6 py-3 text-base font-bold text-[#1F2937] shadow-xl active:scale-95"
    >
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
      </svg>
      {speaking ? 'Stop' : 'Hear this'}
    </button>,
    document.body,
  )
}

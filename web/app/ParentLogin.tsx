'use client'
import {useState} from 'react'
import type {FormEvent} from 'react'
import {setParentToken} from './parentAuth'

const input = 'w-full rounded-xl border border-cream-dark bg-cream px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20'

export default function ParentLogin({onLoggedIn, intro}: {onLoggedIn: (email: string) => void; intro?: string}) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function send(e?: FormEvent) {
    e?.preventDefault()
    setBusy(true); setMsg('')
    const r = await fetch('/api/auth/request', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({email})})
    const j = await r.json().catch(() => ({}))
    setBusy(false)
    if (r.ok) { setSent(true); setCode('') } else setMsg(j.error || 'Something went wrong.')
  }

  async function verify(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setMsg('')
    const r = await fetch('/api/auth/verify', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({email, code})})
    const j = await r.json().catch(() => ({}))
    setBusy(false)
    if (r.ok) { setParentToken(j.token); onLoggedIn(j.email) } else setMsg(j.error || 'Something went wrong.')
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-cream p-5">
      <h3 className="font-patrick text-2xl text-text-brown">Log in to continue</h3>
      <p className="mt-1 text-sm text-brown-light">{intro || 'We’ll email you a 6-digit code. No password needed.'}</p>
      {!sent ? (
        <form onSubmit={send} className="mt-4 grid gap-3">
          <input required type="email" autoComplete="email" className={input} placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {msg && <p className="rounded-xl bg-card-red/10 px-4 py-2 text-sm text-card-red">{msg}</p>}
          <button disabled={busy} className="rounded-full bg-primary px-6 py-3 font-semibold text-white shadow-md transition hover:bg-brand-orange disabled:opacity-60">{busy ? 'Sending…' : 'Email me a code'}</button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-4 grid gap-3">
          <p className="text-sm text-text-brown">We sent a code to <b>{email}</b>. It works for 10 minutes.</p>
          <input required inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} className={`${input} text-center text-xl tracking-[0.4em]`} placeholder="123456" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
          {msg && <p className="rounded-xl bg-card-red/10 px-4 py-2 text-sm text-card-red">{msg}</p>}
          <button disabled={busy || code.length !== 6} className="rounded-full bg-primary px-6 py-3 font-semibold text-white shadow-md transition hover:bg-brand-orange disabled:opacity-60">{busy ? 'Checking…' : 'Log in'}</button>
          <button type="button" onClick={() => { setSent(false); setMsg('') }} className="text-xs text-brown-light underline">Use a different email</button>
          <button type="button" disabled={busy} onClick={() => send()} className="text-xs text-brown-light underline">Resend code</button>
        </form>
      )}
    </div>
  )
}

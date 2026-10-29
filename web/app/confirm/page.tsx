'use client'
import {useEffect, useState} from 'react'

type R = {title: string; startAt: string; needsPayment: boolean}

export default function Confirm() {
  const [token, setToken] = useState('')
  const [state, setState] = useState<'ready' | 'busy' | 'ok' | 'err'>('ready')
  const [msg, setMsg] = useState('')
  const [r, setR] = useState<R | null>(null)

  useEffect(() => { setToken(new URLSearchParams(window.location.search).get('token') || '') }, [])

  async function go() {
    setState('busy')
    const res = await fetch('/api/confirm', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({token})})
    const j = await res.json().catch(() => ({}))
    if (res.ok) { setR(j); setState('ok') } else { setMsg(j.error || 'Something went wrong.'); setState('err') }
  }

  const when = r ? new Date(Date.parse(r.startAt) + 19800000).toLocaleString('en-IN', {weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC'}) : ''

  return (
    <main className="mx-auto max-w-xl px-5 py-16 text-center">
      <div className="rounded-3xl bg-white p-8 shadow-[0_4px_24px_rgba(118,49,10,0.08)] sm:p-12">
        {state === 'ok' && r ? (
          <>
            <h1 className="font-patrick text-4xl text-primary">{r.needsPayment ? 'Email confirmed!' : 'You’re booked!'}</h1>
            <p className="mt-4 text-text-brown">{r.title} on <b>{when} IST</b>.{r.needsPayment ? ' Your slot is held. The payment step is added in a later patch.' : ' A calendar invite is on its way to your inbox.'}</p>
            <a href="https://www.manaslearning.com" className="mt-8 inline-block rounded-full bg-cream-dark px-6 py-3 text-sm font-semibold text-text-brown hover:bg-primary hover:text-white">Back to Manas Learning</a>
          </>
        ) : state === 'err' || !token ? (
          <>
            <h1 className="font-patrick text-4xl text-card-red">Hmm, that didn’t work</h1>
            <p className="mt-4 text-text-brown">{msg || 'This link is not valid.'}</p>
            <a href="/consult" className="mt-8 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-brand-orange">Book a new time</a>
          </>
        ) : (
          <>
            <h1 className="font-patrick text-4xl text-primary">Confirm your booking</h1>
            <p className="mt-4 text-text-brown">One click and your consultation is locked in.</p>
            <button onClick={go} disabled={state === 'busy'} className="mt-8 rounded-full bg-primary px-8 py-3.5 font-semibold text-white shadow-md hover:bg-brand-orange disabled:opacity-60">{state === 'busy' ? 'Confirming…' : 'Confirm my booking'}</button>
          </>
        )}
      </div>
    </main>
  )
}

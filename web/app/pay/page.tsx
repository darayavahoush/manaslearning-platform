'use client'
import {useEffect, useRef, useState} from 'react'
import ParentLogin from '../ParentLogin'
import {clearParentToken, getParentToken, parentFetch} from '../parentAuth'

type Start = {actionUrl: string; fields: Record<string, string>; amount: number; title: string}

export default function Pay() {
  const [bookingId] = useState(() => (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('booking') || '' : ''))
  const [loggedIn, setLoggedIn] = useState(() => !!getParentToken())
  const [err, setErr] = useState('')
  const [info, setInfo] = useState<Start | null>(null)
  const form = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!loggedIn || !bookingId) return
    let live = true
    parentFetch('/api/pay/start', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({bookingId})})
      .then(async (r) => {
        const j = await r.json().catch(() => ({}))
        if (!live) return
        if (r.status === 401) { clearParentToken(); setLoggedIn(false) }
        else if (r.ok) setInfo(j)
        else setErr(j.error || 'Something went wrong.')
      })
    return () => { live = false }
  }, [loggedIn, bookingId])

  // Hand the parent to the Paytm payment page as soon as we have the token.
  useEffect(() => { if (info) form.current?.submit() }, [info])

  return (
    <main className="mx-auto max-w-xl px-5 py-16 text-center">
      <div className="rounded-3xl bg-white p-8 shadow-[0_4px_24px_rgba(118,49,10,0.08)] sm:p-12">
        {!bookingId ? <p className="text-text-brown">No booking selected. <a className="underline" href="/my/consultations">Go to my consultations</a></p>
          : !loggedIn ? <ParentLogin onLoggedIn={() => setLoggedIn(true)} intro="Log in to pay for your consultation." />
          : err ? <><h1 className="font-patrick text-3xl text-card-red">Can’t start the payment</h1><p className="mt-3 text-text-brown">{err}</p><a href="/my/consultations" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-brand-orange">My consultations</a></>
          : <><h1 className="font-patrick text-3xl text-primary">Taking you to secure payment…</h1><p className="mt-3 text-sm text-brown-light">{info ? `${info.title}: ₹${info.amount}` : 'One moment.'} Please don’t close this page.</p></>}
        {info && (
          <form ref={form} method="post" action={info.actionUrl}>
            {Object.entries(info.fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
            <noscript><button className="mt-6 rounded-full bg-primary px-6 py-3 text-white">Continue to payment</button></noscript>
          </form>
        )}
      </div>
    </main>
  )
}

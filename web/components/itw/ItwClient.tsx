'use client'
import {Component, useEffect, useState, type ComponentType, type ReactNode} from 'react'

const ORIGINAL = 'https://intheirworld.vercel.app'

function Problem({message}: {message: string}) {
  return (
    <div className="mx-auto max-w-3xl p-6 text-lg">
      <p className="font-semibold text-red-700">The experience could not start here.</p>
      <p className="mt-1 break-words text-black/70">{message}</p>
      <p className="mt-3">
        <a className="text-primary underline" href={ORIGINAL} target="_blank" rel="noopener noreferrer">Open the original in a new tab</a>
      </p>
      <iframe title="In Their World (original)" src={ORIGINAL} className="mt-4 h-[80vh] w-full rounded-xl border-0" />
    </div>
  )
}

class Boundary extends Component<{children: ReactNode}, {error: string}> {
  state = {error: ''}
  static getDerivedStateFromError(e: unknown) { return {error: String((e as Error)?.message || e)} }
  render() { return this.state.error ? <Problem message={this.state.error} /> : this.props.children }
}

export default function ItwClient() {
  const [Comp, setComp] = useState<ComponentType | null>(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    let dead = false
    const timer = setTimeout(() => {
      if (!dead) setErr((p) => p || 'Timed out: the experience script did not arrive (it was probably blocked or not found).')
    }, 12000)
    import('./InTheirWorld')
      .then((m) => { if (!dead) { clearTimeout(timer); setComp(() => m.default as ComponentType) } })
      .catch((e) => { if (!dead) { clearTimeout(timer); setErr(String(e?.message || e)) } })
    return () => { dead = true; clearTimeout(timer) }
  }, [])

  if (Comp) return <Boundary><Comp /></Boundary>
  if (err) return <Problem message={err} />
  return <p className="p-10 text-center text-xl">Loading the experience…</p>
}

'use client'
import dynamic from 'next/dynamic'

const InTheirWorld = dynamic(() => import('./InTheirWorld'), {
  ssr: false,
  loading: () => <p className="p-10 text-center text-xl">Loading the experience…</p>,
})

export default function ItwClient() {
  return <InTheirWorld />
}

// Shown straight away while an assessment page loads.
export default function Loading() {
  return (
    <main role="status" aria-live="polite" className="grid min-h-[60vh] place-items-center bg-[#EAF3F8] px-4 text-[#1F2937]">
      <p className="text-xl font-semibold">Opening your quest…</p>
    </main>
  )
}

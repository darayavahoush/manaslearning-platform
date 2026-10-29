// Same watercolour brushes the live homepage uses.
export default function ConsultLayout({children}: {children: React.ReactNode}) {
  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#fdf8ec]">
        <div className="absolute blur-[26px]" style={{top: '-14%', right: '-6%', width: '55vw', height: '48vh', borderRadius: '58% 42% 61% 39% / 47% 55% 45% 53%', background: 'radial-gradient(closest-side, rgba(255,190,140,.40), rgba(255,190,140,0))'}} />
        <div className="absolute" style={{top: '8%', left: '-7vw', width: '36vw', height: '72vh', backgroundImage: "url('/decor/brush-green.webp')", backgroundRepeat: 'no-repeat', backgroundPosition: 'left center', backgroundSize: 'contain', opacity: 0.9}} />
        <div className="absolute" style={{bottom: '-8vh', right: '-6vw', width: '38vw', height: '52vh', backgroundImage: "url('/decor/brush-yellow.webp')", backgroundRepeat: 'no-repeat', backgroundPosition: 'right bottom', backgroundSize: 'contain', opacity: 0.9}} />
      </div>
      {children}
    </>
  )
}

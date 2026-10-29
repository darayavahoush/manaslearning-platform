// Watercolour washes behind the booking page, in the spirit of the live homepage hero.
const blob = 'absolute blur-[22px]'

export default function ConsultLayout({children}: {children: React.ReactNode}) {
  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#fdf8ec]">
        {/* soft peach glow, top */}
        <div className={blob} style={{top: '-14%', right: '-6%', width: '55vw', height: '48vh', borderRadius: '58% 42% 61% 39% / 47% 55% 45% 53%', background: 'radial-gradient(closest-side, rgba(255,190,140,.45), rgba(255,190,140,0))'}} />
        {/* green wash, left */}
        <div className={blob} style={{top: '14%', left: '-9%', width: '30vw', height: '62vh', borderRadius: '63% 37% 54% 46% / 55% 48% 52% 45%', background: 'radial-gradient(closest-side, rgba(104,170,112,.62), rgba(104,170,112,.16) 75%, rgba(104,170,112,0))'}} />
        {/* yellow wash, bottom right */}
        <div className={blob} style={{bottom: '-12%', right: '-8%', width: '40vw', height: '52vh', borderRadius: '41% 59% 48% 52% / 58% 42% 58% 42%', background: 'radial-gradient(closest-side, rgba(250,218,40,.70), rgba(250,218,40,.20) 72%, rgba(250,218,40,0))'}} />
        {/* small sage wash, bottom left */}
        <div className={blob} style={{bottom: '-8%', left: '12%', width: '26vw', height: '30vh', borderRadius: '52% 48% 40% 60% / 49% 58% 42% 51%', background: 'radial-gradient(closest-side, rgba(150,200,140,.42), rgba(150,200,140,0))'}} />
        {/* faint lilac, middle right */}
        <div className={blob} style={{top: '42%', right: '4%', width: '22vw', height: '34vh', borderRadius: '45% 55% 52% 48% / 50% 44% 56% 50%', background: 'radial-gradient(closest-side, rgba(176,160,225,.26), rgba(176,160,225,0))'}} />
      </div>
      {children}
    </>
  )
}

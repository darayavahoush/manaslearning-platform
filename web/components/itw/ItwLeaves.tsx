'use client'

// Same leaves as the homepage / consult page (app/FallingLeaves.tsx): same image, same fall animation.
// Sits above the Experience background (which has its own paint) but pointer-events are off.
const LEAVES = [
  {left: 4,  size: 34, dur: 14, delay: 0,  sway: 40,  spin: 280},
  {left: 14, size: 26, dur: 18, delay: 5,  sway: -50, spin: -220},
  {left: 25, size: 40, dur: 16, delay: 9,  sway: 60,  spin: 320},
  {left: 38, size: 24, dur: 20, delay: 2,  sway: -35, spin: -260},
  {left: 50, size: 32, dur: 15, delay: 12, sway: 45,  spin: 240},
  {left: 62, size: 28, dur: 19, delay: 7,  sway: -55, spin: -300},
  {left: 73, size: 38, dur: 17, delay: 3,  sway: 50,  spin: 360},
  {left: 84, size: 26, dur: 21, delay: 10, sway: -40, spin: -240},
  {left: 93, size: 34, dur: 16, delay: 6,  sway: 35,  spin: 300},
]

export default function ItwLeaves() {
  return (
    <div aria-hidden="true" className="itw-leafwrap">
      {LEAVES.map((l, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i} src="/decor/leaf.webp" alt=""
          className="leaf-fall itw-leafimg"
          style={{
            left: `${l.left}%`, width: l.size * 2.6, maxWidth: '22vw',
            animationDuration: `${l.dur}s`, animationDelay: `-${l.delay}s`,
            ['--sway' as string]: `${l.sway}px`, ['--spin' as string]: `${l.spin}deg`,
          }}
        />
      ))}
    </div>
  )
}

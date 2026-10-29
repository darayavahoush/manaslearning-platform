// Decorative leaves that drift down the whole viewport. Fixed values (no Math.random) so server and client render the same.
const LEAVES = [
  {left: 4,  size: 34, dur: 14, delay: 0,   sway: 40,  spin: 280},
  {left: 14, size: 26, dur: 18, delay: 5,   sway: -50, spin: -220},
  {left: 25, size: 40, dur: 16, delay: 9,   sway: 60,  spin: 320},
  {left: 38, size: 24, dur: 20, delay: 2,   sway: -35, spin: -260},
  {left: 50, size: 32, dur: 15, delay: 12,  sway: 45,  spin: 240},
  {left: 62, size: 28, dur: 19, delay: 7,   sway: -55, spin: -300},
  {left: 73, size: 38, dur: 17, delay: 3,   sway: 50,  spin: 360},
  {left: 84, size: 26, dur: 21, delay: 10,  sway: -40, spin: -240},
  {left: 93, size: 34, dur: 16, delay: 6,   sway: 35,  spin: 300},
]

export function FallingLeaves() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {LEAVES.map((l, i) => (
        <img
          key={i} src="/decor/leaf.webp" alt=""
          className="leaf-fall absolute top-0 select-none"
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

'use client'

// Fixed list (no random in render) so server and client always agree.
const LEAVES = [
  {l: 4,  s: 26, d: 17, o: 0,  c: 0}, {l: 11, s: 18, d: 22, o: 6,  c: 2},
  {l: 18, s: 30, d: 19, o: 12, c: 1}, {l: 26, s: 20, d: 24, o: 3,  c: 3},
  {l: 34, s: 24, d: 18, o: 9,  c: 0}, {l: 42, s: 16, d: 23, o: 15, c: 2},
  {l: 50, s: 28, d: 20, o: 5,  c: 1}, {l: 58, s: 22, d: 25, o: 11, c: 3},
  {l: 66, s: 26, d: 18, o: 2,  c: 0}, {l: 73, s: 18, d: 21, o: 14, c: 2},
  {l: 81, s: 30, d: 19, o: 7,  c: 1}, {l: 88, s: 20, d: 24, o: 10, c: 3},
  {l: 94, s: 24, d: 17, o: 4,  c: 0}, {l: 47, s: 14, d: 26, o: 18, c: 1},
]

export default function ItwLeaves() {
  return (
    <div className="itw-leaves" aria-hidden="true">
      {LEAVES.map((v, i) => (
        <span
          key={i}
          className={`itw-leaf itw-leaf-c${v.c}`}
          style={{left: `${v.l}%`, width: v.s, height: v.s, animationDuration: `${v.d}s`, animationDelay: `-${v.o}s`}}
        >
          <svg viewBox="0 0 24 24" width="100%" height="100%">
            <path d="M12 1C5 7 4 15 12 23 20 15 19 7 12 1Z" fill="currentColor" />
            <path d="M12 5v15" stroke="rgba(255,255,255,.45)" strokeWidth="1" fill="none" />
          </svg>
        </span>
      ))}
    </div>
  )
}

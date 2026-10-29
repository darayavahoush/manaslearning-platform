import type {CSSProperties} from 'react'

export function Leaf({className = '', rotate = 0, flip = false}: {className?: string; rotate?: number; flip?: boolean}) {
  return (
    <img
      src="/decor/leaf.webp" alt="" aria-hidden="true"
      className={`leaf-sway pointer-events-none absolute select-none ${className}`}
      style={{'--r': `${rotate}deg`, '--fx': flip ? -1 : 1} as CSSProperties}
    />
  )
}

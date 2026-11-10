import { useRef, type PointerEvent, type ReactNode } from 'react'
import { gsap, useReducedMotion } from '../lib/motion'

type Props = {
  children: ReactNode
  className?: string
  max?: number
}

/**
 * A card that tilts toward the pointer with a moving highlight.
 * Put the clickable control inside (for example a stretched button) so the
 * markup stays valid and keyboard friendly.
 */
export default function TiltCard({ children, className = '', max = 10 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const glare = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  const onMove = (e: PointerEvent<HTMLElement>) => {
    const el = ref.current
    if (!el || reduced || e.pointerType !== 'mouse') return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    gsap.to(el, {
      rotateY: (px - 0.5) * max * 2,
      rotateX: (0.5 - py) * max * 2,
      scale: 1.02,
      duration: 0.5,
      ease: 'power3.out',
      overwrite: 'auto',
    })
    if (glare.current) {
      gsap.to(glare.current, { opacity: 1, left: `${px * 100}%`, top: `${py * 100}%`, duration: 0.5, overwrite: 'auto' })
    }
  }
  const onLeave = () => {
    const el = ref.current
    if (!el) return
    gsap.to(el, { rotateY: 0, rotateX: 0, scale: 1, duration: 0.9, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' })
    if (glare.current) gsap.to(glare.current, { opacity: 0, duration: 0.4 })
  }

  return (
    <div className="h-full [perspective:1200px]" onPointerMove={onMove} onPointerLeave={onLeave}>
      <div ref={ref} className={`relative h-full overflow-hidden will-change-transform [transform-style:preserve-3d] ${className}`}>
        {children}
        <div
          ref={glare}
          className="pointer-events-none absolute left-0 top-0 h-[60%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cream/25 opacity-0 blur-3xl"
          aria-hidden
        />
      </div>
    </div>
  )
}

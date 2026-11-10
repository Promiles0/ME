import { useRef, type ReactNode, type PointerEvent } from 'react'
import { gsap } from '../lib/motion'

type Props = { children: ReactNode; strength?: number; className?: string }

/**
 * Wraps a button or link so it is gently pulled toward the pointer.
 * Pure transform, so it never triggers layout.
 */
export default function Magnetic({ children, strength = 0.35, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el || e.pointerType !== 'mouse') return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - (r.left + r.width / 2)) * strength
    const y = (e.clientY - (r.top + r.height / 2)) * strength
    gsap.to(el, { x, y, duration: 0.4, ease: 'power3.out' })
  }
  const onLeave = () => {
    const el = ref.current
    if (!el) return
    gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' })
  }

  return (
    <div ref={ref} className={`inline-block ${className ?? ''}`} onPointerMove={onMove} onPointerLeave={onLeave}>
      {children}
    </div>
  )
}

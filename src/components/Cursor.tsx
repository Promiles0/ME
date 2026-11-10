import { useEffect, useRef } from 'react'
import { gsap } from '../lib/motion'

/**
 * A small cream dot that follows the pointer and grows over interactive
 * elements. Uses mix-blend-mode: difference so it stays visible on every
 * surface. Hidden on touch devices and under reduced motion.
 */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = dot.current
    if (!el) return
    if (window.matchMedia('(pointer: coarse)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const xTo = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3' })

    const move = (e: PointerEvent) => {
      xTo(e.clientX)
      yTo(e.clientY)
      el.style.opacity = '1'
    }
    const over = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null
      const interactive = t?.closest('a, button, [data-cursor]')
      el.classList.toggle('is-hover', Boolean(interactive))
    }
    const leave = () => (el.style.opacity = '0')

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerover', over, { passive: true })
    document.documentElement.addEventListener('pointerleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerover', over)
      document.documentElement.removeEventListener('pointerleave', leave)
    }
  }, [])

  return <div ref={dot} className="cursor-dot" style={{ opacity: 0 }} aria-hidden />
}

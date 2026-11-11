import { useEffect, useRef, useState } from 'react'
import { gsap } from '../lib/motion'

/**
 * A cream dot that follows the pointer. Over plain links and buttons it grows
 * (blend mode difference, so it reads on every surface). Over anything with a
 * `data-cursor="Label"` attribute it becomes a solid cream disc that says what
 * will happen: Tilt, Open, Visit, Touch. Hidden on touch and reduced motion.
 */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState('')

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
      const labelled = t?.closest<HTMLElement>('[data-cursor]:not([data-cursor=""])')
      const interactive = t?.closest('a, button, [data-cursor]')
      const text = labelled?.dataset.cursor ?? ''
      setLabel(text)
      el.classList.toggle('has-label', Boolean(text))
      el.classList.toggle('is-hover', Boolean(interactive) && !text)
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

  return (
    <div ref={dot} className="cursor-dot" style={{ opacity: 0 }} aria-hidden>
      <span className="cursor-label">{label}</span>
    </div>
  )
}

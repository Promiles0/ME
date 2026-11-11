import { useCallback, useEffect, useRef, useState, type ElementType } from 'react'
import { prefersReducedMotion } from '../lib/motion'

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>'

type Props = {
  text: string
  as?: ElementType
  className?: string
  /** Run once when the element first scrolls into view, not only on hover. */
  onView?: boolean
  /** Total duration in ms. */
  duration?: number
}

/**
 * Text that cycles through random glyphs and settles letter by letter,
 * left to right. Triggers on hover (via the nearest `[data-scramble]`
 * ancestor, or the element itself) and optionally once on first view.
 * Screen readers always get the real text.
 */
export default function Scramble({ text, as: Tag = 'span', className = '', onView = false, duration = 420 }: Props) {
  const [shown, setShown] = useState(text)
  const raf = useRef<number | null>(null)
  const el = useRef<HTMLElement | null>(null)

  const run = useCallback(() => {
    if (prefersReducedMotion()) return
    if (raf.current) cancelAnimationFrame(raf.current)
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const settled = Math.floor(p * text.length)
      let out = ''
      for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        if (ch === ' ') out += ' '
        else if (i < settled) out += ch
        else out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
      }
      setShown(out)
      if (p < 1) raf.current = requestAnimationFrame(tick)
      else setShown(text)
    }
    raf.current = requestAnimationFrame(tick)
  }, [text, duration])

  useEffect(() => {
    setShown(text)
    const node = el.current
    if (!node) return
    const host = (node.closest('[data-scramble]') as HTMLElement | null) ?? node
    host.addEventListener('pointerenter', run)
    let io: IntersectionObserver | undefined
    if (onView) {
      io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            run()
            io?.disconnect()
          }
        },
        { threshold: 0.4 },
      )
      io.observe(node)
    }
    return () => {
      host.removeEventListener('pointerenter', run)
      io?.disconnect()
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [run, text, onView])

  return (
    <Tag ref={el} className={className} aria-label={text}>
      <span aria-hidden className="tabular-nums">
        {shown}
      </span>
    </Tag>
  )
}

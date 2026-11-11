import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '../lib/motion'

type Props = { paragraphs: string[]; className?: string }

/**
 * Paragraphs whose words light up one by one as the block scrolls through the
 * viewport, like reading along. Words start dim and become full ink.
 */
export default function ScrubText({ paragraphs, className = '' }: Props) {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll('[data-word]'),
        { opacity: 0.16 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.05,
          scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 50%', scrub: 0.5 },
        },
      )
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={root} className={className}>
      {paragraphs.map((p, i) => (
        <p key={i} aria-label={p}>
          {p.split(' ').map((w, j) => (
            <span key={j} data-word aria-hidden className="inline-block">
              {w}&nbsp;
            </span>
          ))}
        </p>
      ))}
    </div>
  )
}

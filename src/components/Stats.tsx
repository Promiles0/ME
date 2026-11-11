import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '../lib/motion'
import { stats } from '../data/profile'

/**
 * A strip of big numbers that count up the first time they scroll into view.
 */
export default function Stats() {
  const root = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const nums = Array.from(el.querySelectorAll<HTMLElement>('[data-count]'))
    if (prefersReducedMotion()) {
      nums.forEach((n) => (n.textContent = n.dataset.count ?? ''))
      return
    }
    const ctx = gsap.context(() => {
      nums.forEach((n, i) => {
        const target = Number(n.dataset.count)
        const obj = { v: 0 }
        gsap.to(obj, {
          v: target,
          duration: 1.6,
          delay: i * 0.08,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          onUpdate: () => (n.textContent = String(Math.round(obj.v))),
        })
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <ul ref={root} className="grid grid-cols-2 gap-x-6 gap-y-10 border-t border-ink/10 pt-10 md:grid-cols-4">
      {stats.map((s) => (
        <li key={s.label}>
          <p className="font-display text-[clamp(3.5rem,8vw,7rem)] leading-[0.85]">
            <span data-count={s.value}>0</span>
            <span className="text-sage-deep">{s.suffix}</span>
          </p>
          <p className="eyebrow mt-3 opacity-70">{s.label}</p>
        </li>
      ))}
    </ul>
  )
}

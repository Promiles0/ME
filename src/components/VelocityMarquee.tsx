import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/motion'

type Props = { words: string[] }

/**
 * A marquee that drifts on its own, speeds up with scroll velocity, follows
 * the scroll direction, and skews slightly while you scroll fast, then eases
 * back to calm. Driven by GSAP's ticker, so it shares the frame with Lenis.
 */
export default function VelocityMarquee({ words }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = track.current
    const w = wrap.current
    if (!t || !w || prefersReducedMotion()) return

    let x = 0
    let dir = 1
    let boost = 0
    const skewTo = gsap.quickTo(t, 'skewX', { duration: 0.5, ease: 'power3' })

    const st = ScrollTrigger.create({
      trigger: w,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const v = self.getVelocity()
        dir = self.direction
        boost = Math.min(Math.abs(v) / 120, 14)
        skewTo(gsap.utils.clamp(-12, 12, -v / 220))
      },
    })

    const tick = (_time: number, dt: number) => {
      const half = t.scrollWidth / 2
      boost *= 0.94
      if (boost < 0.05) skewTo(0)
      x -= dir * (0.9 + boost) * (dt / 16.7)
      if (x <= -half) x += half
      if (x > 0) x -= half
      gsap.set(t, { x })
    }
    gsap.ticker.add(tick)

    return () => {
      gsap.ticker.remove(tick)
      st.kill()
    }
  }, [])

  return (
    <div ref={wrap} className="relative mt-16 overflow-hidden border-y border-cream/15 py-5 md:mt-24" aria-hidden>
      <div ref={track} className="flex w-max gap-10 whitespace-nowrap font-display text-[clamp(2.4rem,6vw,5rem)] leading-none will-change-transform">
        {[...words, ...words].map((wd, i) => (
          <span key={i} className={`flex items-center gap-10 ${i % 2 ? 'display-outline' : ''}`}>
            {wd}
            <span className="h-2 w-2 rounded-full bg-sage" />
          </span>
        ))}
      </div>
    </div>
  )
}

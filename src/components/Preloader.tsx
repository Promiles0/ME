import { useEffect, useRef, useState } from 'react'
import { gsap, prefersReducedMotion } from '../lib/motion'

type Props = { onDone: () => void }

/**
 * Short counter-to-100 preloader with a curtain reveal. It also waits for the
 * display font so the hero's first frame uses the right typeface.
 */
export default function Preloader({ onDone }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const num = useRef<HTMLSpanElement>(null)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    let cancelled = false
    const done = () => {
      if (cancelled) return
      setGone(true)
      onDone()
    }

    if (prefersReducedMotion()) {
      done()
      return
    }

    const counter = { v: 0 }
    const fontsReady = document.fonts?.load('400 100px "Bebas Neue"').catch(() => undefined) ?? Promise.resolve()

    const tl = gsap.timeline({ paused: true })
    tl.to(counter, {
      v: 100,
      duration: 1.3,
      ease: 'power2.inOut',
      onUpdate: () => {
        if (num.current) num.current.textContent = String(Math.round(counter.v)).padStart(3, '0')
      },
    })
      .to(num.current, { yPercent: -120, duration: 0.5, ease: 'power3.in' }, '-=0.1')
      .to(root.current, { yPercent: -100, duration: 0.9, ease: 'power4.inOut', onComplete: done }, '-=0.2')

    // Start as soon as the font is in, but never wait more than a second for it.
    Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1000))]).then(() => {
      if (!cancelled) tl.play()
    })

    return () => {
      cancelled = true
      tl.kill()
    }
  }, [onDone])

  if (gone) return null

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[90] flex items-end justify-between bg-ink px-6 pb-6 text-cream md:px-10 md:pb-10"
      aria-hidden
    >
      <div className="stripe bg-cream/15" style={{ left: '62%' }} />
      <p className="eyebrow mb-3 opacity-70">Loading portfolio</p>
      <div className="overflow-hidden">
        <span ref={num} className="display block text-[clamp(5rem,18vw,14rem)] leading-none">
          000
        </span>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useLenis } from './SmoothScroll'

const CHAPTERS = [
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Journey' },
  { id: 'skills', label: 'Toolkit' },
  { id: 'projects', label: 'Work' },
  { id: 'contact', label: 'Say hi' },
]

/**
 * A chapter guide fixed to the right edge on large screens. It appears after
 * the hero, lights the current chapter, fills a thin line with overall page
 * progress, and jumps to a chapter on click. Uses blend-mode difference so it
 * stays readable over sage, paper, cream and ink.
 */
export default function StoryRail() {
  const lenis = useLenis()
  const [active, setActive] = useState(-1)
  const [progress, setProgress] = useState(0)
  const [away, setAway] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? window.scrollY / max : 0)
      setAway(window.scrollY > max - 260)
      const mid = window.innerHeight * 0.45
      let current = -1
      CHAPTERS.forEach((c, i) => {
        const el = document.getElementById(c.id)
        if (el && el.getBoundingClientRect().top <= mid) current = i
      })
      setActive(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const go = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    if (lenis) lenis.scrollTo(el, { offset: 0 })
    else el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav
      aria-label="Chapters"
      className={`fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 text-cream mix-blend-difference transition-opacity duration-700 lg:block ${
        active >= 0 && !away ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <div className="relative flex flex-col items-end gap-5 pr-4">
        {/* progress line */}
        <span className="absolute bottom-0 right-0 top-0 w-px bg-current opacity-25" aria-hidden />
        <span className="absolute right-0 top-0 w-px origin-top bg-current" style={{ height: `${progress * 100}%` }} aria-hidden />

        {CHAPTERS.map((c, i) => {
          const on = i === active
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => go(c.id)}
              className="group flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em]"
              aria-current={on ? 'step' : undefined}
              data-cursor=""
            >
              <span
                className={`overflow-hidden whitespace-nowrap transition-all duration-500 ${
                  on ? 'max-w-[8rem] opacity-100' : 'max-w-0 opacity-0 group-hover:max-w-[8rem] group-hover:opacity-70'
                }`}
              >
                {c.label}
              </span>
              <span className={`font-display text-sm tracking-normal transition-opacity ${on ? 'opacity-100' : 'opacity-40'}`}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className={`h-px bg-current transition-all duration-500 ${on ? 'w-6' : 'w-2.5 opacity-50'}`} />
            </button>
          )
        })}
      </div>
    </nav>
  )
}

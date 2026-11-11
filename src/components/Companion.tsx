import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { gsap, prefersReducedMotion } from '../lib/motion'

/**
 * "Pip", a small guide who rides along in the bottom-left corner. Its eyes
 * follow the cursor, it blinks, and it changes shape and colour for each
 * chapter of the page, popping up a one-line hint the first time you arrive.
 * Click Pip to toggle hints. Shape changes are pure border-radius, so cheap.
 */

type Chapter = {
  id: string
  dark: boolean
  radius: string
  tip: string
}

const CHAPTERS: Chapter[] = [
  { id: 'content', dark: false, radius: '50%', tip: "Hi, I'm Pip. Move your mouse over the name, then scroll." },
  { id: 'about', dark: false, radius: '42% 58% 60% 40% / 45% 45% 55% 55%', tip: 'Hover the portrait. It is made of particles.' },
  { id: 'experience', dark: false, radius: '32%', tip: 'Keep scrolling. The year on the left rolls with you.' },
  { id: 'skills', dark: true, radius: '50% 50% 22% 22%', tip: 'Scroll fast and watch the strip lean in.' },
  { id: 'projects', dark: true, radius: '22%', tip: 'Scroll slowly here. You are driving the demo video.' },
  { id: 'contact', dark: false, radius: '50% 50% 50% 12%', tip: 'Say hi. Tip: press Ctrl + K to jump anywhere.' },
]

export default function Companion() {
  const body = useRef<HTMLButtonElement>(null)
  const eyes = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [tip, setTip] = useState<string | null>(null)
  const [hintsOn, setHintsOn] = useState(true)
  const [blink, setBlink] = useState(false)
  const [away, setAway] = useState(false)
  const seen = useRef(new Set<number>())
  const reduced = prefersReducedMotion()

  // Which chapter are we in?
  useEffect(() => {
    const onScroll = () => {
      const mid = window.innerHeight * 0.5
      let current = 0
      CHAPTERS.forEach((c, i) => {
        const el = c.id === 'content' ? null : document.getElementById(c.id)
        if (el && el.getBoundingClientRect().top <= mid) current = i
      })
      setIndex(current)
      // Step aside once the footer curtain starts to open.
      const max = document.documentElement.scrollHeight - window.innerHeight
      setAway(window.scrollY > max - 260)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // First visit to a chapter: say its line for a few seconds.
  useEffect(() => {
    if (!hintsOn || seen.current.has(index)) return
    seen.current.add(index)
    const show = setTimeout(() => setTip(CHAPTERS[index].tip), index === 0 ? 2600 : 400)
    const hide = setTimeout(() => setTip(null), index === 0 ? 8000 : 4800)
    if (!reduced && body.current) {
      gsap.fromTo(body.current, { scale: 0.7, rotate: -12 }, { scale: 1, rotate: 0, duration: 0.9, ease: 'elastic.out(1, 0.45)' })
    }
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
    }
  }, [index, hintsOn, reduced])

  // Eyes follow the cursor.
  useEffect(() => {
    const e = eyes.current
    const b = body.current
    if (!e || !b || reduced) return
    const xTo = gsap.quickTo(e, 'x', { duration: 0.3, ease: 'power3' })
    const yTo = gsap.quickTo(e, 'y', { duration: 0.3, ease: 'power3' })
    const move = (ev: PointerEvent) => {
      const r = b.getBoundingClientRect()
      const dx = ev.clientX - (r.left + r.width / 2)
      const dy = ev.clientY - (r.top + r.height / 2)
      const d = Math.hypot(dx, dy) || 1
      const k = Math.min(1, d / 300) * 6
      xTo((dx / d) * k)
      yTo((dy / d) * k)
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [reduced])

  // Blink now and then.
  useEffect(() => {
    if (reduced) return
    let t: ReturnType<typeof setTimeout>
    const loop = () => {
      t = setTimeout(() => {
        setBlink(true)
        setTimeout(() => setBlink(false), 140)
        loop()
      }, 2400 + Math.random() * 3200)
    }
    loop()
    return () => clearTimeout(t)
  }, [reduced])

  const ch = CHAPTERS[index]

  return (
    <div
      className={`fixed bottom-5 left-5 z-40 flex items-end gap-3 transition-all duration-500 md:bottom-8 md:left-8 ${away ? "pointer-events-none translate-y-24 opacity-0" : ""}`}
    >
      <button
        ref={body}
        type="button"
        onClick={() => {
          setHintsOn((v) => !v)
          setTip((t) => (t ? null : ch.tip))
        }}
        data-cursor={tip ? 'Hush' : 'Hint'}
        aria-label={hintsOn ? 'Pip, your guide. Click to hide hints.' : 'Pip, your guide. Click for a hint.'}
        className={`relative grid h-12 w-12 shrink-0 place-items-center shadow-[0_12px_30px_-10px_rgba(26,26,22,0.55)] transition-[border-radius,background-color] duration-700 [transition-timing-function:cubic-bezier(.16,1,.3,1)] md:h-14 md:w-14 ${
          ch.dark ? 'bg-cream' : 'bg-ink'
        }`}
        style={{ borderRadius: ch.radius }}
      >
        <div ref={eyes} className="flex gap-2" aria-hidden>
          {[0, 1].map((i) => (
            <span
              key={i}
              className={`block w-2 rounded-full transition-[height] duration-100 ${ch.dark ? 'bg-ink' : 'bg-cream'}`}
              style={{ height: blink ? 2 : 10 }}
            />
          ))}
        </div>
      </button>

      <AnimatePresence>
        {tip && (
          <motion.p
            key={tip}
            role="status"
            initial={{ opacity: 0, y: 10, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={`mb-2 max-w-[15rem] origin-bottom-left rounded-2xl rounded-bl-sm px-4 py-3 text-sm font-semibold leading-snug shadow-lg ${
              ch.dark ? 'bg-cream text-ink' : 'bg-ink text-cream'
            }`}
          >
            {tip}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

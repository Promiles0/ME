import { useEffect, useState } from 'react'
import { startPresence, usePresence } from '../lib/presence'
import { prefersReducedMotion } from '../lib/motion'

const TINTS = ['#a5a79b', '#7f8276', '#b9bbb0', '#e8d2b5']

/**
 * Everyone else's cursor, drawn as small sage dots with a soft halo.
 * Positions are page-relative, so a dot sits over the same content for every
 * visitor even on a different screen size. Smoothed with CSS transitions.
 */
export default function LiveCursors() {
  const { peers } = usePresence()
  const [, force] = useState(0)

  useEffect(() => {
    startPresence()
    // Re-render on scroll so page-relative dots move with the page.
    const onScroll = () => force((n) => n + 1)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const h = document.documentElement.scrollHeight
  const smooth = prefersReducedMotion() ? '' : 'transition-transform duration-150 ease-out'

  return (
    <div className="pointer-events-none fixed inset-0 z-[45] overflow-hidden" aria-hidden>
      {[...peers.values()].map((p) => {
        const x = p.x * window.innerWidth
        const y = p.y * h - window.scrollY
        if (y < -40 || y > window.innerHeight + 40) return null
        return (
          <span key={p.id} className={`absolute left-0 top-0 ${smooth}`} style={{ transform: `translate(${x}px, ${y}px)` }}>
            <span className="absolute -left-3 -top-3 h-6 w-6 animate-ping rounded-full opacity-30" style={{ background: TINTS[p.c % 4] }} />
            <span
              className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full ring-2 ring-ink/30"
              style={{ background: TINTS[p.c % 4] }}
            />
          </span>
        )
      })}
    </div>
  )
}

/** "N exploring now" pill for the nav. Hidden when you're alone or offline. */
export function PresenceCount({ dark }: { dark: boolean }) {
  const { connected, count } = usePresence()
  if (!connected || count < 2) return null
  return (
    <span
      className={`hidden items-center gap-2 rounded-full border px-3 py-2 text-[12px] font-semibold md:flex ${
        dark ? 'border-cream/20' : 'border-ink/15'
      }`}
      title="People on the site right now"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-sage-deep" />
      </span>
      {count} exploring now
    </span>
  )
}

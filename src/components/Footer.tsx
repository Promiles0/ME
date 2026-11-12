import { useEffect, useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { profile } from '../data/profile'
import { useLenis } from './SmoothScroll'
import { gsap, prefersReducedMotion } from '../lib/motion'

/**
 * Curtain footer. It sits fixed beneath the page; the page (main) carries a
 * bottom margin equal to the footer's height, so as you reach the end the
 * page lifts away and the footer is revealed underneath. The giant name
 * rises letter by letter as the curtain opens. Reports its height upward.
 */
export default function Footer({ onHeight }: { onHeight: (h: number) => void }) {
  const lenis = useLenis()
  const root = useRef<HTMLElement>(null)
  const year = new Date().getFullYear()
  const reducedMotion = prefersReducedMotion()
  const [time, setTime] = useState('')

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: profile.timeZone })
    const tick = () => setTime(fmt.format(new Date()))
    tick()
    const id = setInterval(tick, 15_000)
    return () => clearInterval(id)
  }, [])

  // Report height so main can leave room for the curtain.
  useEffect(() => {
    const el = root.current
    if (!el) return
    const ro = new ResizeObserver(() => onHeight(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [onHeight])

  // Letters rise and the content un-dims as the page lifts off.
  useEffect(() => {
    const el = root.current
    if (!el || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: document.documentElement,
          start: () => `bottom-=${el.offsetHeight + window.innerHeight} bottom`,
          end: 'bottom bottom',
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      })
      tl.fromTo('[data-letter]', { yPercent: 110 }, { yPercent: 0, stagger: 0.08, ease: 'power3.out' }, 0)
        .fromTo('[data-footer-fade]', { opacity: 0, y: 30 }, { opacity: 1, y: 0, ease: 'power2.out' }, 0.2)
        .fromTo(el.firstElementChild, { scale: 0.94 }, { scale: 1, ease: 'none' }, 0)
    }, el)
    return () => ctx.revert()
  }, [])

  const toTop = () => {
    if (lenis) lenis.scrollTo(0, { duration: 2 })
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer
      ref={root}
      data-nav-theme="dark"
      className="on-ink fixed inset-x-0 bottom-0 z-0 overflow-hidden bg-ink text-cream"
    >
      <div className="mx-auto flex max-w-[88rem] origin-bottom flex-col gap-10 px-6 pb-10 pt-24 md:px-10">
        <div data-footer-fade className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="eyebrow opacity-60">Say hello</p>
            <a href={`mailto:${profile.email}`} data-cursor="Write" className="mt-3 block text-lg font-semibold hover:text-sage">
              {profile.email}
            </a>
          </div>
          <div>
            <p className="eyebrow opacity-60">Elsewhere</p>
            <ul className="mt-3 space-y-1">
              {profile.socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target={s.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="font-semibold hover:text-sage">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow opacity-60">Local time</p>
            <p className="mt-3 font-display text-4xl tabular-nums">{time}</p>
            <p className="text-sm opacity-60">{profile.location}</p>
          </div>
        </div>

        {/* The story grains rain into this word; the letters themselves are only a faint guide (full under reduced motion). */}
        <p data-footer-slot className={`display flex w-fit select-none overflow-hidden text-[clamp(5rem,24vw,24rem)] leading-[0.8] ${reducedMotion ? 'text-cream' : 'text-cream/[0.07]'}`} aria-label={profile.shortName}>
          {profile.shortName.toUpperCase().split('').map((l, i) => (
            <span key={i} data-letter aria-hidden className={`inline-block ${i % 2 && reducedMotion ? 'display-outline' : ''}`}>
              {l}
            </span>
          ))}
        </p>

        <div className="flex flex-col gap-6 border-t border-cream/15 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="opacity-70">
            © {year} {profile.name}. Designed and built in {profile.location.split(',')[0]}.
          </p>
          <button
            type="button"
            onClick={toTop}
            data-cursor="Top"
            className="group inline-flex items-center gap-3 rounded-full border border-cream/20 py-2 pl-5 pr-2 font-semibold transition-colors hover:bg-cream hover:text-ink"
          >
            Back to top
            <span className="grid h-8 w-8 place-items-center rounded-full bg-cream text-ink transition-transform duration-500 group-hover:-translate-y-1">
              <ArrowUp className="h-4 w-4" />
            </span>
          </button>
        </div>
      </div>
    </footer>
  )
}

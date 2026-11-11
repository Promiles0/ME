import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { profile } from '../data/profile'
import { useLenis } from './SmoothScroll'
import Scramble from './Scramble'
import { openPalette } from './CommandPalette'
import { PresenceCount } from './LiveCursors'

const links = [
  { href: '#about', label: 'About' },
  { href: '#experience', label: 'Experience' },
  { href: '#skills', label: 'Skills' },
  { href: '#projects', label: 'Projects' },
  { href: '#contact', label: 'Contact' },
]

function useLocalTime(timeZone: string) {
  const [time, setTime] = useState('')
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone })
    const tick = () => setTime(fmt.format(new Date()))
    tick()
    const id = setInterval(tick, 15_000)
    return () => clearInterval(id)
  }, [timeZone])
  return time
}

/**
 * Fixed top bar. Hides when scrolling down, returns when scrolling up, and
 * swaps to a full-screen menu on small screens.
 */
export default function Nav() {
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const time = useLocalTime(profile.timeZone)
  const lenis = useLenis()

  useEffect(() => {
    let last = window.scrollY
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-nav-theme]'))
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 24)
      setHidden(y > last && y > 160 && !open)
      last = y
      // Match the bar's colour to whatever section sits under it.
      const probe = 36
      const under = sections.find((s) => {
        const r = s.getBoundingClientRect()
        return r.top <= probe && r.bottom > probe
      })
      setDark(under?.dataset.navTheme === 'dark')
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [open])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) lenis?.stop()
    else lenis?.start()
  }, [open, lenis])

  const go = (href: string) => {
    setOpen(false)
    const el = document.querySelector(href)
    if (!el) return
    if (lenis) lenis.scrollTo(el as HTMLElement, { offset: -72 })
    else (el as HTMLElement).scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-cream"
      >
        Skip to content
      </a>

      <motion.header
        className="fixed inset-x-0 top-0 z-50"
        animate={{ y: hidden ? '-100%' : '0%' }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <nav
          aria-label="Primary"
          className={`mx-auto flex h-[72px] max-w-[88rem] items-center justify-between px-6 transition-colors duration-500 md:px-10 ${
            dark && !open ? 'text-cream' : 'text-ink'
          } ${scrolled ? '' : ''}`}
        >
          <a href="#content" className="group flex items-center gap-3" onClick={(e) => { e.preventDefault(); go('#content') }}>
            <span
              className={`grid h-9 w-9 place-items-center rounded-full font-display text-lg transition-all duration-500 group-hover:rotate-[360deg] ${
                (dark && !open) || open ? 'bg-cream text-ink' : 'bg-ink text-cream'
              }`}
            >
              {profile.initials}
            </span>
            <span className="hidden text-sm font-semibold tracking-tight sm:block">{profile.shortName}</span>
          </a>

          <ul
            className={`hidden items-center gap-1 rounded-full border p-1 backdrop-blur-md transition-colors duration-500 md:flex ${
              dark ? 'border-cream/15 bg-ink/40' : 'border-ink/10 bg-paper/40'
            }`}
          >
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={(e) => { e.preventDefault(); go(l.href) }}
                  className={`block rounded-full px-4 py-2 text-[13px] font-semibold tracking-tight transition-colors ${
                    dark ? 'hover:bg-cream hover:text-ink' : 'hover:bg-ink hover:text-cream'
                  }`}
                >
                  <Scramble text={l.label} />
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-4">
            <PresenceCount dark={dark && !open} />
            <button
              type="button"
              onClick={openPalette}
              data-cursor="Search"
              className={`hidden items-center gap-2 rounded-full border px-3 py-2 text-[12px] font-semibold transition-colors lg:flex ${
                dark ? 'border-cream/20 hover:bg-cream hover:text-ink' : 'border-ink/15 hover:bg-ink hover:text-cream'
              }`}
            >
              Search
              <kbd className="rounded border border-current px-1 text-[10px] opacity-60">Ctrl K</kbd>
            </button>
            <p className="hidden text-right text-[11px] leading-tight md:block">
              <span className="eyebrow block opacity-60">Kigali</span>
              <span className="font-semibold tabular-nums" aria-live="off">{time}</span>
            </p>
            <button
              type="button"
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
              className={`grid h-10 w-10 place-items-center rounded-full transition-colors duration-500 md:hidden ${
                (dark && !open) || open ? 'bg-cream text-ink' : 'bg-ink text-cream'
              }`}
            >
              <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
              <span className="relative block h-3 w-5">
                <span className={`absolute left-0 top-0 h-[2px] w-full bg-current transition-transform duration-300 ${open ? 'translate-y-[5px] rotate-45' : ''}`} />
                <span className={`absolute left-0 bottom-0 h-[2px] w-full bg-current transition-transform duration-300 ${open ? '-translate-y-[5px] -rotate-45' : ''}`} />
              </span>
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="on-ink fixed inset-0 z-40 flex flex-col justify-end bg-ink px-6 pb-10 pt-24 text-cream"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="stripe bg-cream/10" />
            <ul className="relative space-y-2">
              {links.map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <a
                    href={l.href}
                    onClick={(e) => { e.preventDefault(); go(l.href) }}
                    className="display block text-[clamp(3rem,14vw,6rem)] hover:text-sage"
                  >
                    {l.label}
                  </a>
                </motion.li>
              ))}
            </ul>
            <p className="relative mt-10 flex items-center justify-between text-xs opacity-70">
              <span>{profile.location}</span>
              <span className="tabular-nums">{time}</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

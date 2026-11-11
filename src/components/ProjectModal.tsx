import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from 'lucide-react'
import type { Project } from '../data/projects'
import { useLenis } from './SmoothScroll'
import { GithubIcon } from './icons'
import { useReducedMotion } from '../lib/motion'

type Props = {
  project: Project | null
  /** Where the case study grows from: the laptop screen that was clicked. */
  origin: DOMRect | null
  onClose: () => void
  onNext: () => void
  nextTitle: string
}

const insetFrom = (r: DOMRect | null) => {
  if (!r) return 'inset(12% 12% 12% 12% round 32px)'
  const w = window.innerWidth
  const h = window.innerHeight
  return `inset(${Math.max(0, r.top)}px ${Math.max(0, w - r.right)}px ${Math.max(0, h - r.bottom)}px ${Math.max(0, r.left)}px round 16px)`
}

/**
 * Full-screen case study. It grows out of the laptop screen that opened it
 * (a clip-path that starts as that screen's rectangle) and shrinks back into
 * it on close. Esc closes, focus is trapped, the page behind stops scrolling.
 */
export default function ProjectModal({ project, origin, onClose, onNext, nextTitle }: Props) {
  const panel = useRef<HTMLDivElement>(null)
  const lenis = useLenis()
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!project) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    lenis?.stop()
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>('a[href], button, [tabindex]:not([tabindex="-1"])')
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    const t = setTimeout(() => panel.current?.querySelector<HTMLElement>('[data-close]')?.focus(), 500)
    panel.current?.scrollTo({ top: 0 })

    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      lenis?.start()
      previouslyFocused?.focus?.()
    }
  }, [project, onClose, lenis])

  const from = insetFrom(origin)
  const ease = [0.76, 0, 0.24, 1] as const

  // Portal to <body> so it sits above everything (rail, cursors, Pip), not inside main's layer.
  return createPortal(
    <AnimatePresence>
      {project && (
        <motion.div
          key={project.slug}
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-labelledby="case-title"
          data-lenis-prevent
          className="fixed inset-0 z-[96] overflow-y-auto overscroll-contain bg-paper text-ink"
          initial={reduced ? { opacity: 0 } : { clipPath: from }}
          animate={reduced ? { opacity: 1 } : { clipPath: 'inset(0px 0px 0px 0px round 0px)' }}
          exit={reduced ? { opacity: 0 } : { clipPath: from }}
          transition={{ duration: reduced ? 0.2 : 0.85, ease }}
        >
          {/* Top bar */}
          <div className="sticky top-0 z-10 flex items-center justify-between bg-paper/85 px-6 py-4 backdrop-blur md:px-10">
            <button type="button" onClick={onClose} className="group flex items-center gap-2 text-sm font-semibold" data-cursor="Back">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> All work
            </button>
            <p className="eyebrow hidden opacity-60 sm:block">Case study · {project.year}</p>
            <button
              type="button"
              data-close
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-full bg-ink text-cream transition-transform hover:rotate-90"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close case study</span>
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ delay: reduced ? 0 : 0.45, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto max-w-[88rem] px-6 pb-24 md:px-10"
          >
            {/* Title */}
            <h2 id="case-title" className="display mt-6 text-[clamp(4rem,14vw,13rem)]">
              {project.title}
            </h2>
            <p className="mt-2 max-w-2xl text-xl font-semibold text-sage-deep md:text-2xl">{project.tagline}</p>

            {/* Media */}
            <div className="mt-10 overflow-hidden rounded-[2rem] bg-ink shadow-[0_40px_80px_-40px_rgba(0,0,0,0.5)]">
              {project.video ? (
                <video src={project.video} poster={project.image} className="aspect-video w-full object-cover" autoPlay muted loop playsInline />
              ) : (
                <img src={project.image} alt={`${project.title} screenshot`} className="aspect-video w-full object-cover object-top" />
              )}
            </div>

            {/* Facts */}
            <dl className="mt-12 grid gap-8 border-y border-ink/10 py-8 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="eyebrow opacity-60">Year</dt>
                <dd className="mt-2 font-display text-4xl">{project.year}</dd>
              </div>
              <div>
                <dt className="eyebrow opacity-60">Role</dt>
                <dd className="mt-2 text-lg font-semibold">Design, front end, back end</dd>
              </div>
              <div className="lg:col-span-2">
                <dt className="eyebrow opacity-60">Stack</dt>
                <dd className="mt-3 flex flex-wrap gap-2">
                  {project.tech.map((t) => (
                    <span key={t} className="rounded-full border border-ink/15 px-3 py-1 text-xs font-semibold">
                      {t}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>

            {/* Story */}
            <div className="mt-14 grid gap-12 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <p className="eyebrow opacity-60">Overview</p>
                <p className="mt-4 text-xl leading-relaxed md:text-2xl">{project.summary}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  {project.demoUrl && (
                    <a
                      href={project.demoUrl}
                      target="_blank"
                      rel="noreferrer"
                      data-cursor="Visit"
                      className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream"
                    >
                      Live demo
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  )}
                  {project.repoUrl && (
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-ink/30 px-6 py-3 text-sm font-semibold hover:bg-ink hover:text-cream"
                    >
                      <GithubIcon className="h-4 w-4" /> Source
                    </a>
                  )}
                </div>
              </div>

              {project.highlights.length > 0 && (
                <div className="lg:col-span-7">
                  <p className="eyebrow opacity-60">What makes it work</p>
                  <ol className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
                    {project.highlights.map((h, i) => (
                      <li key={h} className="grid grid-cols-[3rem_1fr] gap-4 py-6">
                        <span className="font-display text-3xl text-sage-deep">{String(i + 1).padStart(2, '0')}</span>
                        <p className="text-lg leading-relaxed">{h}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            {/* Next */}
            <button
              type="button"
              onClick={onNext}
              data-cursor="Next"
              className="group mt-24 flex w-full items-end justify-between gap-6 border-t border-ink/15 pt-8 text-left"
            >
              <span>
                <span className="eyebrow block opacity-60">Next project</span>
                <span className="display mt-2 block text-[clamp(3rem,9vw,8rem)] transition-colors group-hover:text-sage-deep">{nextTitle}</span>
              </span>
              <span className="mb-4 grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ink text-cream transition-transform duration-500 group-hover:translate-x-2">
                <ArrowRight className="h-6 w-6" />
              </span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, Lock, X } from 'lucide-react'
import { GithubIcon } from './icons'
import type { Project } from '../data/projects'
import { useLenis } from './SmoothScroll'

type Props = { project: Project | null; onClose: () => void }

/**
 * Detail view for a project. Traps focus while open, closes on Escape and
 * on backdrop click, and stops the page behind it from scrolling.
 */
export default function ProjectModal({ project, onClose }: Props) {
  const panel = useRef<HTMLDivElement>(null)
  const lenis = useLenis()

  useEffect(() => {
    if (!project) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    lenis?.stop()
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && panel.current) {
        const focusables = panel.current.querySelectorAll<HTMLElement>('a[href], button, [tabindex]:not([tabindex="-1"])')
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
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
    requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>('button')?.focus())

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      lenis?.start()
      previouslyFocused?.focus?.()
    }
  }, [project, onClose, lenis])

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-title"
            data-lenis-prevent
            className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-[2rem] bg-paper text-ink shadow-2xl sm:rounded-[2rem]"
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-sage">
              {project.video ? (
                <video src={project.video} poster={project.image} className="h-full w-full object-cover" autoPlay muted loop playsInline />
              ) : (
                <img src={project.image} alt="" className="h-full w-full object-cover" />
              )}
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-ink text-cream transition-transform hover:rotate-90"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </div>

            <div className="p-6 md:p-10">
              <p className="eyebrow flex items-center gap-3 opacity-70">
                <span>{project.year}</span>
                {project.isPrivate && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-ink/10 px-2 py-0.5 normal-case tracking-normal">
                    <Lock className="h-3 w-3" /> Private repo
                  </span>
                )}
              </p>
              <h3 id="project-title" className="display mt-3 text-5xl md:text-7xl">
                {project.title}
              </h3>
              <p className="mt-2 text-lg font-semibold text-sage-deep">{project.tagline}</p>
              <p className="mt-6 text-base leading-relaxed md:text-lg">{project.summary}</p>

              {project.highlights.length > 0 && (
                <ul className="mt-6 space-y-3">
                  {project.highlights.map((h) => (
                    <li key={h} className="flex gap-3 text-base leading-relaxed">
                      <span className="mt-[0.65em] h-1.5 w-1.5 shrink-0 rounded-full bg-ink" aria-hidden />
                      {h}
                    </li>
                  ))}
                </ul>
              )}

              <ul className="mt-8 flex flex-wrap gap-2">
                {project.tech.map((t) => (
                  <li key={t} className="rounded-full border border-ink/15 px-3 py-1 text-xs font-semibold">
                    {t}
                  </li>
                ))}
              </ul>

              <div className="mt-10 flex flex-wrap gap-3">
                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream"
                  >
                    Live demo
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                )}
                {project.repoUrl ? (
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-ink/30 px-6 py-3 text-sm font-semibold hover:bg-ink hover:text-cream"
                  >
                    <GithubIcon className="h-4 w-4" /> Source
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-6 py-3 text-sm font-semibold opacity-60">
                    <Lock className="h-4 w-4" /> Source is private
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

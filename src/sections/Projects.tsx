import { useCallback, useEffect, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { projects as localProjects, type Project } from '../data/projects'
import { loadProjects } from '../lib/projects'
import SectionHeading from '../components/SectionHeading'
import Reveal from '../components/Reveal'
import DeviceMockup from '../components/DeviceMockup'
import ProjectModal from '../components/ProjectModal'
import Magnetic from '../components/Magnetic'
import { GithubIcon } from '../components/icons'

/**
 * Projects: every project gets the full treatment, a tilting laptop on one
 * side and the story on the other, alternating left and right down the page.
 * "Case notes" opens the detail modal.
 */
export default function Projects() {
  const [list, setList] = useState<Project[]>(localProjects)
  const [open, setOpen] = useState<Project | null>(null)

  useEffect(() => {
    let alive = true
    loadProjects().then((p) => alive && setList(p))
    return () => {
      alive = false
    }
  }, [])

  const close = useCallback(() => setOpen(null), [])
  const ordered = [...list].sort((a, b) => Number(b.featured) - Number(a.featured) || a.order - b.order)

  return (
    <section id="projects" data-nav-theme="dark" className="relative overflow-hidden bg-ink py-28 text-cream md:py-40 on-ink">
      <div className="stripe bg-cream/10" style={{ left: '-4%' }} />

      <div className="relative mx-auto max-w-[88rem] px-6 md:px-10">
        <SectionHeading index="04" eyebrow="Selected work" title="Things I" outline="have shipped" />

        <ol className="mt-16 space-y-28 md:mt-28 md:space-y-40">
          {ordered.map((p, i) => {
            const flip = i % 2 === 1
            return (
              <li key={p.slug} className="grid items-center gap-12 md:grid-cols-12">
                <Reveal className={`md:col-span-7 ${flip ? 'md:order-1' : 'md:order-2'}`}>
                  <DeviceMockup video={p.video} poster={p.image} image={p.image} alt={`${p.title} preview`} />
                </Reveal>

                <div className={`md:col-span-5 ${flip ? 'md:order-2 md:pl-6' : 'md:order-1'}`}>
                  <Reveal>
                    <p className="eyebrow flex items-center gap-3 opacity-70">
                      <span className="font-display text-base tracking-normal">{String(i + 1).padStart(2, '0')}</span>
                      <span className="h-px w-8 bg-current opacity-50" />
                      {p.featured ? 'Featured' : 'Project'} · {p.year}
                    </p>
                  </Reveal>
                  <Reveal delay={0.05}>
                    <h3 className="display mt-3 text-5xl md:text-6xl lg:text-7xl">{p.title}</h3>
                  </Reveal>
                  <Reveal delay={0.1}>
                    <p className="mt-3 text-lg font-semibold text-sage">{p.tagline}</p>
                    <p className="mt-5 max-w-lg text-base leading-relaxed opacity-85 md:text-lg">{p.summary}</p>
                  </Reveal>
                  <Reveal delay={0.15}>
                    <ul className="mt-6 flex flex-wrap gap-2">
                      {p.tech.map((t) => (
                        <li key={t} className="rounded-full border border-cream/20 px-3 py-1 text-xs font-semibold">
                          {t}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-8 flex flex-wrap gap-3">
                      <Magnetic>
                        <button
                          type="button"
                          onClick={() => setOpen(p)}
                          className="rounded-full bg-cream px-6 py-3 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
                        >
                          Case notes
                        </button>
                      </Magnetic>
                      {p.demoUrl && (
                        <Magnetic>
                          <a
                            href={p.demoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="group inline-flex items-center gap-2 rounded-full border border-cream/30 px-6 py-3 text-sm font-semibold hover:bg-cream hover:text-ink"
                          >
                            Live demo
                            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          </a>
                        </Magnetic>
                      )}
                      {p.repoUrl && (
                        <Magnetic>
                          <a
                            href={p.repoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-full border border-cream/30 px-6 py-3 text-sm font-semibold hover:bg-cream hover:text-ink"
                          >
                            <GithubIcon className="h-4 w-4" /> Source
                          </a>
                        </Magnetic>
                      )}
                    </div>
                  </Reveal>
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      <ProjectModal project={open} onClose={close} />
    </section>
  )
}

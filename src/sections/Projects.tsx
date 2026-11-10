import { useCallback, useEffect, useState } from 'react'
import { ArrowUpRight, Lock } from 'lucide-react'
import { GithubIcon } from '../components/icons'
import { projects as localProjects, type Project } from '../data/projects'
import { loadProjects } from '../lib/projects'
import SectionHeading from '../components/SectionHeading'
import Reveal from '../components/Reveal'
import DeviceMockup from '../components/DeviceMockup'
import TiltCard from '../components/TiltCard'
import ProjectModal from '../components/ProjectModal'
import Magnetic from '../components/Magnetic'

/**
 * Projects: one featured project inside a tilting device, then a grid of
 * tilt cards. Clicking any card opens the detail modal.
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

  const featured = list.find((p) => p.featured) ?? list[0]
  const rest = list.filter((p) => p !== featured).sort((a, b) => a.order - b.order)

  return (
    <section id="projects" data-nav-theme="dark" className="relative overflow-hidden bg-ink py-28 text-cream md:py-40 on-ink">
      <div className="stripe bg-cream/10" style={{ left: '-4%' }} />

      <div className="relative mx-auto max-w-[88rem] px-6 md:px-10">
        <SectionHeading index="04" eyebrow="Selected work" title="Things I" outline="have shipped" />

        {/* Featured */}
        {featured && (
          <div className="mt-16 grid items-center gap-12 md:mt-24 md:grid-cols-12">
            <Reveal className="md:col-span-7 md:order-2">
              <DeviceMockup video={featured.video} poster={featured.image} image={featured.image} alt={`${featured.title} demo`} />
            </Reveal>
            <div className="md:col-span-5 md:order-1">
              <Reveal>
                <p className="eyebrow opacity-70">Featured · {featured.year}</p>
              </Reveal>
              <Reveal delay={0.05}>
                <h3 className="display mt-3 text-6xl md:text-7xl lg:text-8xl">{featured.title}</h3>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-3 text-lg font-semibold text-sage">{featured.tagline}</p>
                <p className="mt-5 max-w-lg text-base leading-relaxed opacity-85 md:text-lg">{featured.summary}</p>
              </Reveal>
              <Reveal delay={0.15}>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {featured.tech.map((t) => (
                    <li key={t} className="rounded-full border border-cream/20 px-3 py-1 text-xs font-semibold">
                      {t}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Magnetic>
                    <button
                      type="button"
                      onClick={() => setOpen(featured)}
                      className="rounded-full bg-cream px-6 py-3 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
                    >
                      Case notes
                    </button>
                  </Magnetic>
                  {featured.demoUrl && (
                    <Magnetic>
                      <a
                        href={featured.demoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group inline-flex items-center gap-2 rounded-full border border-cream/30 px-6 py-3 text-sm font-semibold hover:bg-cream hover:text-ink"
                      >
                        Live demo
                        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </a>
                    </Magnetic>
                  )}
                </div>
              </Reveal>
            </div>
          </div>
        )}

        {/* Grid */}
        <ul className="mt-24 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 md:mt-32">
          {rest.map((p, i) => (
            <Reveal key={p.slug} as="li" delay={(i % 3) * 0.07}>
              <TiltCard className="group h-full rounded-[1.6rem] border border-cream/10 bg-ink-soft transition-colors duration-500 hover:border-cream/30 focus-within:border-cream/50">
                {/* Stretched button makes the whole card clickable and focusable */}
                <button
                  type="button"
                  onClick={() => setOpen(p)}
                  className="absolute inset-0 z-10 rounded-[1.6rem] focus-visible:outline-none"
                  data-cursor
                >
                  <span className="sr-only">Open details for {p.title}</span>
                </button>
                <div className="relative aspect-[4/3] overflow-hidden rounded-t-[1.6rem] bg-sage">
                  <img
                    src={p.image}
                    alt={`${p.title} screenshot`}
                    loading="lazy"
                    className="h-full w-full object-cover object-top transition-transform duration-700 [transition-timing-function:cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.06]"
                  />
                  <div className="absolute left-4 top-4 flex gap-2">
                    <span className="rounded-full bg-ink/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cream backdrop-blur">
                      {p.year}
                    </span>
                    {p.isPrivate && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-cream/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-ink">
                        <Lock className="h-3 w-3" /> Private
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-3 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-2xl font-bold tracking-tight">{p.title}</h3>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-cream/20 transition-all duration-500 group-hover:rotate-45 group-hover:bg-cream group-hover:text-ink">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed opacity-75">{p.tagline}</p>
                  <ul className="mt-1 flex flex-wrap gap-1.5">
                    {p.tech.slice(0, 4).map((t) => (
                      <li key={t} className="rounded-full bg-cream/10 px-2.5 py-1 text-[11px] font-semibold">
                        {t}
                      </li>
                    ))}
                    {p.tech.length > 4 && <li className="px-1 py-1 text-[11px] opacity-60">+{p.tech.length - 4}</li>}
                  </ul>
                  <div className="mt-2 flex items-center gap-4 text-xs font-semibold">
                    {p.demoUrl && (
                      <span className="inline-flex items-center gap-1 opacity-80">
                        <ArrowUpRight className="h-3.5 w-3.5" /> Live
                      </span>
                    )}
                    {p.repoUrl && (
                      <span className="inline-flex items-center gap-1 opacity-80">
                        <GithubIcon className="h-3.5 w-3.5" /> Source
                      </span>
                    )}
                  </div>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </ul>
      </div>

      <ProjectModal project={open} onClose={close} />
    </section>
  )
}

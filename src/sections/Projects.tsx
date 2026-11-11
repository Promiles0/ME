import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { projects as localProjects, type Project } from '../data/projects'
import { loadProjects } from '../lib/projects'
import { gsap, ScrollTrigger, useMediaQuery, useReducedMotion } from '../lib/motion'
import SectionHeading from '../components/SectionHeading'
import Reveal from '../components/Reveal'
import DeviceMockup from '../components/DeviceMockup'
import ProjectModal from '../components/ProjectModal'
import Magnetic from '../components/Magnetic'
import Scramble from '../components/Scramble'
import { GithubIcon } from '../components/icons'

/**
 * Projects.
 * 1. Featured: the laptop sticks while the demo video scrubs with the scroll
 *    wheel, so the visitor drives the product (desktop; autoplay on phones).
 * 2. Rail: the other projects sit on a horizontal track that is pinned and
 *    slides sideways as you scroll, with a 02 / 06 counter (desktop; a plain
 *    vertical stack on phones).
 */

type ActionsProps = { p: Project; onOpen: (p: Project) => void }

function Actions({ p, onOpen }: ActionsProps) {
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <Magnetic>
        <button
          type="button"
          data-cursor="Open"
          onClick={() => onOpen(p)}
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
            data-cursor="Visit"
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
  )
}

function Tech({ p }: { p: Project }) {
  return (
    <ul className="mt-6 flex flex-wrap gap-2">
      {p.tech.map((t) => (
        <li key={t} className="rounded-full border border-cream/20 px-3 py-1 text-xs font-semibold">
          {t}
        </li>
      ))}
    </ul>
  )
}

export default function Projects() {
  const [list, setList] = useState<Project[]>(localProjects)
  const [open, setOpen] = useState<Project | null>(null)
  const [index, setIndex] = useState(0)
  const reduced = useReducedMotion()
  const desktop = useMediaQuery('(min-width: 768px)')

  const featuredWrap = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement | null>(null)
  const railWrap = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let alive = true
    loadProjects().then((p) => alive && setList(p))
    return () => {
      alive = false
    }
  }, [])

  const close = useCallback(() => setOpen(null), [])
  const onVideo = useCallback((v: HTMLVideoElement | null) => {
    video.current = v
  }, [])

  const featured = list.find((p) => p.featured) ?? list[0]
  const rest = list.filter((p) => p !== featured).sort((a, b) => a.order - b.order)

  // Desktop choreography: scrubbed video + pinned horizontal rail.
  useEffect(() => {
    if (reduced) return
    const mm = gsap.matchMedia()
    mm.add('(min-width: 768px)', () => {
      // 1. Video scrub, throttled to one seek per frame.
      let seekPending = false
      let seekTo = 0
      ScrollTrigger.create({
        trigger: featuredWrap.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          seekTo = self.progress
          if (seekPending) return
          seekPending = true
          requestAnimationFrame(() => {
            seekPending = false
            const v = video.current
            if (v && v.duration) v.currentTime = seekTo * v.duration
          })
        },
      })

      // 2. Horizontal rail.
      const t = track.current
      const wrap = railWrap.current
      if (!t || !wrap) return
      const distance = () => t.scrollWidth - window.innerWidth
      gsap.to(t, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: wrap,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => setIndex(Math.min(rest.length - 1, Math.round(self.progress * (rest.length - 1)))),
        },
      })
      ScrollTrigger.refresh()
    })
    return () => mm.revert()
  }, [reduced, rest.length])

  return (
    <section id="projects" data-nav-theme="dark" className="relative overflow-clip bg-ink text-cream on-ink">
      <div className="stripe bg-cream/10" style={{ left: '-4%' }} />

      <div className="relative mx-auto max-w-[88rem] px-6 pt-28 md:px-10 md:pt-40">
        <SectionHeading index="04" eyebrow="Selected work" title="Things I" outline="have shipped" />
        <Reveal>
          <p className="mt-6 hidden max-w-md text-sm opacity-70 md:block">Scroll to drive the demo, keep scrolling to slide along the shelf.</p>
        </Reveal>
      </div>

      {/* Featured: sticky laptop, video scrubbed by scroll on desktop */}
      {featured && (
        <div ref={featuredWrap} className="relative mt-16 md:mt-10 md:h-[220vh]">
          <div className="md:sticky md:top-0 md:flex md:h-screen md:items-center">
            <div className="mx-auto grid w-full max-w-[88rem] items-center gap-12 px-6 md:grid-cols-12 md:px-10">
              <Reveal className="md:order-2 md:col-span-7">
                <DeviceMockup
                  video={featured.video}
                  poster={featured.image}
                  image={featured.image}
                  alt={`${featured.title} demo`}
                  onVideo={featured.video && !reduced && desktop ? onVideo : undefined}
                />
              </Reveal>
              <div className="md:order-1 md:col-span-5" data-scramble>
                <Reveal>
                  <p className="eyebrow flex items-center gap-3 opacity-70">
                    <span className="font-display text-base tracking-normal">01</span>
                    <span className="h-px w-8 bg-current opacity-50" />
                    Featured · {featured.year}
                  </p>
                </Reveal>
                <Reveal delay={0.05}>
                  <h3 className="display mt-3 text-5xl md:text-6xl lg:text-7xl">
                    <Scramble text={featured.title} onView />
                  </h3>
                </Reveal>
                <Reveal delay={0.1}>
                  <p className="mt-3 text-lg font-semibold text-sage">{featured.tagline}</p>
                  <p className="mt-5 max-w-lg text-base leading-relaxed opacity-85 md:text-lg">{featured.summary}</p>
                </Reveal>
                <Reveal delay={0.15}>
                  <Tech p={featured} />
                  <Actions p={featured} onOpen={setOpen} />
                </Reveal>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rail: pinned horizontal track on desktop, vertical stack on phones */}
      <div ref={railWrap} className="relative mt-28 md:mt-0 md:h-screen md:overflow-hidden">
        <div ref={track} className="md:flex md:h-full md:items-center md:will-change-transform">
          {rest.map((p, i) => (
            <article
              key={p.slug}
              className="mx-auto grid w-full max-w-[88rem] items-center gap-12 px-6 pb-28 md:w-screen md:max-w-none md:shrink-0 md:grid-cols-12 md:px-10 md:pb-0 lg:px-24"
              aria-label={p.title}
            >
              <Reveal className={`md:col-span-7 ${i % 2 ? 'md:order-1' : 'md:order-2'}`}>
                <DeviceMockup video={p.video} poster={p.image} image={p.image} alt={`${p.title} preview`} />
              </Reveal>
              <div className={`md:col-span-5 ${i % 2 ? 'md:order-2 md:pl-6' : 'md:order-1'}`} data-scramble>
                <Reveal>
                  <p className="eyebrow flex items-center gap-3 opacity-70">
                    <span className="font-display text-base tracking-normal">{String(i + 2).padStart(2, '0')}</span>
                    <span className="h-px w-8 bg-current opacity-50" />
                    Project · {p.year}
                  </p>
                </Reveal>
                <Reveal delay={0.05}>
                  <h3 className="display mt-3 text-5xl md:text-6xl lg:text-7xl">
                    <Scramble text={p.title} onView />
                  </h3>
                </Reveal>
                <Reveal delay={0.1}>
                  <p className="mt-3 text-lg font-semibold text-sage">{p.tagline}</p>
                  <p className="mt-5 max-w-lg text-base leading-relaxed opacity-85 md:text-lg">{p.summary}</p>
                </Reveal>
                <Reveal delay={0.15}>
                  <Tech p={p} />
                  <Actions p={p} onOpen={setOpen} />
                </Reveal>
              </div>
            </article>
          ))}
        </div>

        {/* Counter + progress (desktop) */}
        <div className="pointer-events-none absolute bottom-8 left-0 right-0 hidden items-center justify-between px-10 md:flex lg:px-24" aria-hidden>
          <p className="font-display text-3xl tabular-nums">
            {String(index + 2).padStart(2, '0')} <span className="text-cream/40">/ {String(rest.length + 1).padStart(2, '0')}</span>
          </p>
          <div className="h-px w-48 bg-cream/20">
            <div className="h-full bg-cream transition-[width] duration-300" style={{ width: `${((index + 1) / rest.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <ProjectModal project={open} onClose={close} />
    </section>
  )
}

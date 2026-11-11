import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { gsap, ScrollTrigger, useReducedMotion } from '../lib/motion'
import { profile } from '../data/profile'
import Magnetic from '../components/Magnetic'
import type { ParticleFieldHandle } from '../three/ParticleField'
import { wordShapes } from '../three/shapes'

const ParticleField = lazy(() => import('../three/ParticleField'))

type Props = { ready: boolean }

const STAGES = [
  { word: 'Ideas', label: 'Galaxy', line: 'Every product starts as scattered thoughts pulled into orbit.' },
  { word: 'Flow', label: 'Waves', line: 'Then it ships, and keeps moving with the people who use it.' },
]

/**
 * Hero. The section is taller than the viewport; the inner panel sticks while
 * the particle cloud behind the headline morphs from the name into a sphere and
 * then a torus knot. Headline lines reveal once the preloader has finished.
 */
export default function Hero({ ready }: Props) {
  const section = useRef<HTMLElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const field = useRef<ParticleFieldHandle | null>(null)
  const reduced = useReducedMotion()
  const [active, setActive] = useState(true)
  const [roleIndex, setRoleIndex] = useState(0)
  const [stage, setStage] = useState(-1)
  const shapes = useMemo(() => wordShapes(profile.shortName.toUpperCase()), [])

  // Rotate the role word.
  useEffect(() => {
    if (!ready) return
    const id = setInterval(() => setRoleIndex((i) => (i + 1) % profile.roles.length), 2600)
    return () => clearInterval(id)
  }, [ready])

  // Pause the 3D loop when the hero is off screen.
  useEffect(() => {
    const el = section.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Entrance + scroll choreography.
  useEffect(() => {
    if (!ready || !section.current) return
    const ctx = gsap.context(() => {
      const lines = gsap.utils.toArray<HTMLElement>('[data-hero-line] > span')
      if (reduced) {
        gsap.set(lines, { yPercent: 0, opacity: 1 })
        gsap.set('[data-hero-fade]', { opacity: 1, y: 0 })
        return
      }
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
      tl.fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.1 }, 0.1)
        .fromTo('[data-hero-fade]', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 }, 0.6)

      // Scroll: morph the particles and fade the copy as the panel scrolls.
      ScrollTrigger.create({
        trigger: section.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          field.current?.setMorph(self.progress * 2)
          const pr = self.progress
          setStage(pr < 0.32 ? -1 : pr < 0.72 ? 0 : 1)
          if (panel.current) {
            const copy = panel.current.querySelector<HTMLElement>('[data-hero-copy]')
            if (copy) {
              const p = Math.min(1, self.progress * 2.2)
              copy.style.opacity = String(1 - p)
              copy.style.transform = `translateY(${p * -40}px)`
            }
          }
        },
      })
    }, section)
    return () => ctx.revert()
  }, [ready, reduced])

  const [first, ...rest] = profile.name.split(' ')
  const last = rest.join(' ')

  return (
    <section ref={section} data-nav-theme="light" className="relative h-[190vh]" aria-label="Introduction">
      <div ref={panel} className="sticky top-0 flex h-screen flex-col overflow-hidden">
        {/* Diagonal stripe behind everything */}
        <div className="stripe bg-cream/70" style={{ left: '58%' }} />

        {/* Particle cloud */}
        {!reduced && (
          <Suspense fallback={null}>
            <ParticleField shapes={shapes} handle={field} choreography spin={false} active={active && ready} className="absolute inset-x-0 top-16 h-[42vh] md:inset-y-0 md:left-[32%] md:h-auto" />
          </Suspense>
        )}
        {reduced && (
          <p className="display pointer-events-none absolute inset-0 grid place-items-center text-[32vw] text-cream/70" aria-hidden>
            {profile.shortName}
          </p>
        )}

        <div data-hero-copy className="relative mx-auto flex w-full max-w-[88rem] flex-1 flex-col justify-end px-6 pb-24 pt-28 md:px-10 md:pb-28">
          <p data-hero-fade className="eyebrow mb-6 flex items-center gap-3 opacity-0">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ink opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-ink" />
            </span>
            {profile.availability}
          </p>

          <h1 className="display text-[clamp(3.6rem,13.5vw,13rem)]">
            <span data-hero-line className="block overflow-hidden pb-[0.06em]">
              <span className="block">{first}</span>
            </span>
            <span data-hero-line className="block overflow-hidden pb-[0.06em]">
              <span className="block">
                {last.split(' ')[0]} <span className="display-outline">{last.split(' ').slice(1).join(' ')}</span>
              </span>
            </span>
          </h1>

          <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <p data-hero-fade className="max-w-md text-base leading-relaxed opacity-0 md:text-lg">
              <span className="block font-semibold">
                {profile.title}.{' '}
                <span className="inline-grid overflow-hidden align-bottom">
                  {profile.roles.map((r, i) => (
                    <span
                      key={r}
                      aria-hidden={i !== roleIndex}
                      className="col-start-1 row-start-1 transition-all duration-700 [transition-timing-function:cubic-bezier(.16,1,.3,1)]"
                      style={{
                        transform: `translateY(${i === roleIndex ? 0 : i < roleIndex ? -110 : 110}%)`,
                        opacity: i === roleIndex ? 1 : 0,
                      }}
                    >
                      {r}.
                    </span>
                  ))}
                </span>
              </span>
              <span className="mt-2 block opacity-80">
                Based in {profile.location}. I design and build full-stack products that feel fast and look sharp.
              </span>
            </p>

            <div data-hero-fade className="flex flex-wrap gap-3 opacity-0">
              <Magnetic>
                <a
                  href="#projects"
                  className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-cream transition-transform duration-300 hover:scale-[1.03]"
                >
                  See my work
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </Magnetic>
              <Magnetic>
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 rounded-full border border-ink/40 bg-paper/30 px-6 py-3.5 text-sm font-semibold backdrop-blur-sm transition-colors duration-300 hover:bg-paper"
                >
                  Hire me
                </a>
              </Magnetic>
            </div>
          </div>
        </div>

        {/* Stage captions: appear once the copy has faded and the particles take over */}
        <div className="pointer-events-none absolute bottom-10 left-6 md:bottom-14 md:left-10" aria-hidden>
          {STAGES.map((st, i) => (
            <div
              key={st.word}
              className="absolute bottom-0 left-0 w-[80vw] max-w-md transition-all duration-700 [transition-timing-function:cubic-bezier(.16,1,.3,1)]"
              style={{ opacity: stage === i ? 1 : 0, transform: `translateY(${stage === i ? 0 : stage > i ? -30 : 30}px)` }}
            >
              <p className="eyebrow opacity-70">
                0{i + 1} / 02 · {st.label}
              </p>
              <p className="display mt-2 text-[clamp(3.5rem,9vw,8rem)]">
                {st.word}
                <span className="text-cream">.</span>
              </p>
              <p className="mt-2 max-w-xs text-sm opacity-80">{st.line}</p>
            </div>
          ))}
        </div>

        {/* Scroll cue */}
        <a
          data-hero-fade
          href="#about"
          className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] opacity-0 sm:flex"
        >
          <span>Scroll</span>
          <span className="relative h-10 w-px overflow-hidden bg-ink/20">
            <span className="absolute inset-x-0 top-0 h-1/2 animate-[cue_1.6s_ease-in-out_infinite] bg-ink" />
          </span>
          <ArrowDown className="h-3.5 w-3.5" />
        </a>
        <style>{`@keyframes cue { 0% { transform: translateY(-100%); } 100% { transform: translateY(200%); } }`}</style>
      </div>
    </section>
  )
}

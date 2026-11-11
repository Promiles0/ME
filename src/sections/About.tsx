import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { gsap, ScrollTrigger, useReducedMotion } from '../lib/motion'
import { education, profile } from '../data/profile'
import Reveal from '../components/Reveal'
import SectionHeading from '../components/SectionHeading'
import Stats from '../components/Stats'
import type { ParticleFieldHandle } from '../three/ParticleField'
import { portraitShapes } from '../three/shapes'

const ParticleField = lazy(() => import('../three/ParticleField'))

/**
 * About: a portrait made of particles that assembles as the section scrolls
 * in, plus bio and education. The pointer nudges the particles gently.
 */
export default function About() {
  const section = useRef<HTMLElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const field = useRef<ParticleFieldHandle | null>(null)
  const reduced = useReducedMotion()
  const [active, setActive] = useState(false)
  const shapes = useMemo(() => portraitShapes('/images/portrait.jpg'), [])

  // Only run the particle loop while the card is on screen.
  useEffect(() => {
    const el = card.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0.05 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!section.current) return
    if (reduced) {
      // Assembled straight away, no parallax.
      const id = setTimeout(() => field.current?.setMorph(1), 100)
      return () => clearTimeout(id)
    }
    const ctx = gsap.context(() => {
      // Assemble the face while the card travels up the lower half of the screen.
      ScrollTrigger.create({
        trigger: card.current,
        start: 'top 95%',
        end: 'center 45%',
        scrub: 0.6,
        onUpdate: (self) => field.current?.setMorph(self.progress),
      })
      gsap.fromTo(
        card.current,
        { yPercent: 6 },
        {
          yPercent: -6,
          ease: 'none',
          scrollTrigger: { trigger: section.current, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      )
    }, section)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section id="about" ref={section} data-nav-theme="light" className="relative overflow-hidden bg-paper py-28 md:py-40">
      <div className="stripe bg-cream/60" style={{ left: '-6%' }} />
      <div className="relative mx-auto max-w-[88rem] px-6 md:px-10">
        <SectionHeading index="01" eyebrow="About me" title="Curious," outline="by design" />

        <div className="mt-16 grid gap-12 md:mt-24 md:grid-cols-12 md:gap-10">
          {/* Particle portrait */}
          <div className="md:col-span-5">
            <div
              ref={card}
              className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] bg-sage"
              data-cursor
            >
              <Suspense fallback={null}>
                <ParticleField
                  shapes={shapes}
                  handle={field}
                  active={active && !reduced}
                  className="absolute inset-0"
                  fit={0.9}
                  mouseStrength={0.32}
                  lean={0.25}
                  spin={false}
                  count={{ high: 18000, low: 7000 }}
                  style={{ colorA: '#1a1a16', colorB: '#5c5f55', colorHot: '#e8d2b5', split: 0.42, size: 2.1, shadeSize: 0.45, drift: 0.02 }}
                />
              </Suspense>
              <p className="sr-only">Portrait of {profile.name}, rendered as particles.</p>
              <div className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-ink/10" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-full bg-ink/85 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cream backdrop-blur">
                <span>{profile.location}</span>
                <span>{profile.languages.join(' · ')}</span>
              </div>
            </div>
          </div>

          {/* Bio + education */}
          <div className="md:col-span-7 md:pl-6 lg:pl-16">
            <div className="space-y-5 text-lg leading-relaxed md:text-xl">
              {profile.bio.map((p, i) => (
                <Reveal key={i} as="p" delay={i * 0.08}>
                  {p}
                </Reveal>
              ))}
            </div>

            <Reveal className="mt-14" delay={0.1}>
              <p className="eyebrow mb-6 opacity-70">Education</p>
              <ul className="divide-y divide-ink/10 border-y border-ink/10">
                {education.map((e) => (
                  <li key={e.school + e.course} className="group grid gap-1 py-5 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-6">
                    <div>
                      <p className="font-semibold">{e.course}</p>
                      <p className="text-sm opacity-70">
                        {e.school} · {e.detail}
                      </p>
                    </div>
                    <p className="font-display text-2xl tabular-nums text-sage-deep transition-colors group-hover:text-ink">{e.years}</p>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>

        <Reveal className="mt-24 md:mt-32">
          <Stats />
        </Reveal>
      </div>
    </section>
  )
}

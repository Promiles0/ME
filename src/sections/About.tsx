import { useEffect, useRef } from 'react'
import { gsap, useReducedMotion } from '../lib/motion'
import { education, profile } from '../data/profile'
import Reveal from '../components/Reveal'
import SectionHeading from '../components/SectionHeading'
import Stats from '../components/Stats'
import ScrubText from '../components/ScrubText'

/**
 * About: bio, education and numbers. The portrait card is empty on purpose:
 * the shared story grains (components/StoryParticles) fall from the hero and
 * settle on it as the face. Reduced motion shows a toned photo instead.
 */
export default function About() {
  const section = useRef<HTMLElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!section.current) return
    if (reduced) return
    const ctx = gsap.context(() => {
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
              data-portrait-card
              className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] bg-sage"
              data-cursor="Touch"
            >
              {reduced ? (
                <img src="/images/portrait.jpg" alt={`Portrait of ${profile.name}`} className="h-full w-full object-cover object-top mix-blend-multiply grayscale" />
              ) : (
                <p className="sr-only">Portrait of {profile.name}, drawn by the particles from the hero.</p>
              )}
              <div className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-ink/10" />
              <div className="absolute bottom-4 left-4 right-4 z-[3] flex items-center justify-between rounded-full bg-ink/85 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cream backdrop-blur">
                <span>{profile.location}</span>
                <span>{profile.languages.join(' · ')}</span>
              </div>
            </div>
          </div>

          {/* Bio + education */}
          <div className="md:col-span-7 md:pl-6 lg:pl-16">
            <ScrubText paragraphs={profile.bio} className="space-y-5 text-xl font-medium leading-relaxed md:text-2xl md:leading-snug" />

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

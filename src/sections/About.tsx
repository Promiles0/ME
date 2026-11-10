import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger, useReducedMotion } from '../lib/motion'
import { education, profile } from '../data/profile'
import Reveal from '../components/Reveal'
import SectionHeading from '../components/SectionHeading'

/**
 * About: portrait with a parallax frame, bio and education.
 * The portrait glides up slower than the page for depth.
 */
export default function About() {
  const section = useRef<HTMLElement>(null)
  const photo = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced || !section.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        photo.current,
        { yPercent: 8 },
        {
          yPercent: -8,
          ease: 'none',
          scrollTrigger: { trigger: section.current, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      )
      gsap.fromTo(
        '[data-photo-img]',
        { scale: 1.18 },
        {
          scale: 1,
          ease: 'none',
          scrollTrigger: { trigger: photo.current, start: 'top bottom', end: 'center center', scrub: true },
        },
      )
    }, section)
    return () => {
      ctx.revert()
      ScrollTrigger.refresh()
    }
  }, [reduced])

  return (
    <section id="about" ref={section} data-nav-theme="light" className="relative overflow-hidden bg-paper py-28 md:py-40">
      <div className="stripe bg-cream/60" style={{ left: '-6%' }} />
      <div className="relative mx-auto max-w-[88rem] px-6 md:px-10">
        <SectionHeading index="01" eyebrow="About me" title="Curious," outline="by design" />

        <div className="mt-16 grid gap-12 md:mt-24 md:grid-cols-12 md:gap-10">
          {/* Portrait */}
          <div className="md:col-span-5">
            <div ref={photo} className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] bg-sage">
              <img
                data-photo-img
                src="/images/portrait.jpg"
                alt={`Portrait of ${profile.name}`}
                className="h-full w-full object-cover object-top"
                loading="lazy"
                width={600}
                height={750}
              />
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
      </div>
    </section>
  )
}

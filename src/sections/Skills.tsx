import { motion } from 'framer-motion'
import { skills } from '../data/profile'
import SectionHeading from '../components/SectionHeading'
import Reveal from '../components/Reveal'
import { useReducedMotion } from '../lib/motion'

const marqueeWords = ['React', 'TypeScript', 'Supabase', 'PostgreSQL', 'Tailwind', 'Next.js', 'Cloudflare', 'SEO', 'Design', 'Vite', 'Stripe', 'C++']

/**
 * Skills: a marquee strip and groups of pill tags that pop in with a stagger.
 * Hovering a tag lifts it and tilts it slightly, like a loose sticker.
 */
export default function Skills() {
  const reduced = useReducedMotion()

  return (
    <section id="skills" data-nav-theme="dark" className="relative overflow-hidden bg-ink py-28 text-cream md:py-40 on-ink">
      <div className="stripe bg-cream/10" style={{ left: '72%' }} />

      <div className="relative mx-auto max-w-[88rem] px-6 md:px-10">
        <SectionHeading index="03" eyebrow="Skills & tools" title="What I" outline="work with" />
      </div>

      {/* Marquee */}
      <div className="marquee relative mt-16 border-y border-cream/15 py-5 md:mt-24" aria-hidden>
        <div className="marquee-track flex w-max gap-10 whitespace-nowrap font-display text-[clamp(2.4rem,6vw,5rem)] leading-none">
          {[...marqueeWords, ...marqueeWords].map((w, i) => (
            <span key={i} className={`flex items-center gap-10 ${i % 2 ? 'display-outline' : ''}`}>
              {w}
              <span className="h-2 w-2 rounded-full bg-sage" />
            </span>
          ))}
        </div>
      </div>

      <div className="relative mx-auto mt-16 grid max-w-[88rem] gap-12 px-6 md:mt-24 md:grid-cols-2 md:px-10 lg:gap-x-20">
        {skills.map((group, gi) => (
          <Reveal key={group.group} delay={gi * 0.05}>
            <h3 className="eyebrow mb-5 flex items-center gap-3 opacity-70">
              <span className="font-display text-base tracking-normal">0{gi + 1}</span>
              <span className="h-px w-8 bg-current opacity-50" />
              {group.group}
            </h3>
            <motion.ul
              className="flex flex-wrap gap-2.5"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '0px 0px -10% 0px' }}
              variants={{ hidden: {}, show: { transition: { staggerChildren: reduced ? 0 : 0.045 } } }}
            >
              {group.items.map((item) => (
                <motion.li
                  key={item}
                  variants={{
                    hidden: { opacity: 0, y: reduced ? 0 : 14, scale: reduced ? 1 : 0.9 },
                    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
                  }}
                  whileHover={reduced ? undefined : { y: -6, rotate: Math.random() > 0.5 ? 3 : -3, scale: 1.06 }}
                  whileTap={{ scale: 0.96 }}
                  className="cursor-default select-none rounded-full border border-cream/20 bg-cream/5 px-4 py-2 text-sm font-semibold transition-colors hover:border-cream hover:bg-cream hover:text-ink"
                  data-cursor
                >
                  {item}
                </motion.li>
              ))}
            </motion.ul>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

import { ArrowUp } from 'lucide-react'
import { profile } from '../data/profile'
import { useLenis } from './SmoothScroll'

export default function Footer() {
  const lenis = useLenis()
  const year = new Date().getFullYear()
  const toTop = () => {
    if (lenis) lenis.scrollTo(0)
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="on-ink relative overflow-hidden bg-ink text-cream">
      <div className="mx-auto flex max-w-[88rem] flex-col gap-10 px-6 pb-10 pt-16 md:px-10">
        <p className="display select-none text-[clamp(4rem,19vw,19rem)] leading-[0.8] text-cream/10" aria-hidden>
          {profile.shortName}
        </p>

        <div className="flex flex-col gap-6 border-t border-cream/15 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="opacity-70">
            © {year} {profile.name}. Built with React, Three.js and a lot of coffee in {profile.location.split(',')[0]}.
          </p>
          <div className="flex items-center gap-6">
            {profile.socials.map((s) => (
              <a key={s.label} href={s.href} target={s.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="font-semibold hover:text-sage">
                {s.label}
              </a>
            ))}
            <button
              type="button"
              onClick={toTop}
              className="grid h-10 w-10 place-items-center rounded-full border border-cream/20 transition-colors hover:bg-cream hover:text-ink"
            >
              <ArrowUp className="h-4 w-4" />
              <span className="sr-only">Back to top</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

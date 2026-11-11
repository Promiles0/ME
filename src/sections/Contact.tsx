import { useCallback, useRef, useState, type FormEvent } from 'react'
import { ArrowUpRight, Check, Loader2 } from 'lucide-react'
import { profile } from '../data/profile'
import { apiFetch, hasApi, TURNSTILE_SITE_KEY } from '../lib/api'
import Turnstile, { type TurnstileHandle } from '../components/Turnstile'
import Reveal from '../components/Reveal'
import Magnetic from '../components/Magnetic'
import Scramble from '../components/Scramble'

type Status = 'idle' | 'sending' | 'sent' | 'error'

/**
 * Contact: bold call to action, a form and social links.
 * With the Worker configured (VITE_API_URL) the form posts to /contact, which
 * stores the message in D1 after a Turnstile check. Without it, or if the
 * Worker is unreachable, the form opens a prefilled email instead.
 */
export default function Contact() {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [token, setToken] = useState('')
  const turnstile = useRef<TurnstileHandle>(null)
  const onToken = useCallback((t: string) => setToken(t), [])

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const name = String(data.get('name') ?? '').trim()
    const email = String(data.get('email') ?? '').trim()
    const message = String(data.get('message') ?? '').trim()
    const honey = String(data.get('company') ?? '')
    if (honey) return // bot filled the hidden field

    const mailto = () => {
      const subject = encodeURIComponent(`Portfolio enquiry from ${name}`)
      const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`)
      window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`
    }
    if (!hasApi) return mailto()

    if (TURNSTILE_SITE_KEY && !token) {
      setStatus('error')
      setError('One moment, checking you are human. Try again in a second.')
      return
    }

    setStatus('sending')
    setError('')
    try {
      const res = await apiFetch(
        '/contact',
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, message, turnstileToken: token }) },
        10000,
      )
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setStatus('error')
        setError(data.error ?? 'Something went wrong. Email me directly instead.')
        turnstile.current?.reset()
        return
      }
      setStatus('sent')
      form.reset()
      turnstile.current?.reset()
    } catch {
      // Worker unreachable: fall back to email so the message is never lost.
      setStatus('idle')
      mailto()
    }
  }

  const field =
    'w-full rounded-2xl border border-ink/15 bg-paper/60 px-5 py-4 text-base outline-none transition-colors placeholder:text-ink/40 focus:border-ink focus:bg-paper'

  return (
    <section id="contact" data-nav-theme="light" className="relative overflow-hidden bg-cream py-28 md:py-40">
      <div className="stripe bg-sage/40" style={{ left: '66%' }} />

      <div className="relative mx-auto max-w-[88rem] px-6 md:px-10">
        <Reveal>
          <p className="eyebrow flex items-center gap-3 opacity-80">
            <span className="font-display text-base tracking-normal">05</span>
            <span className="h-px w-8 bg-current opacity-50" />
            Contact
          </p>
        </Reveal>

        <div className="mt-6 grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal delay={0.05}>
              <h2 className="display text-[clamp(3.4rem,11vw,11rem)]">
                <span className="block">Let's build</span>
                <span className="display-outline block">something</span>
                <span className="block">together</span>
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-8 max-w-lg text-lg leading-relaxed md:text-xl">
                Have a product to ship, a site to rebuild, or a team that needs another pair of hands? I reply within a day.
              </p>
            </Reveal>
            <Reveal delay={0.15} className="mt-10">
              <Magnetic strength={0.25}>
                <a
                  href={`mailto:${profile.email}`}
                  className="group inline-flex items-center gap-4 rounded-full bg-ink py-4 pl-8 pr-4 text-lg font-semibold text-cream transition-transform duration-300 hover:scale-[1.03]"
                >
                  {profile.email}
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-cream text-ink transition-transform duration-500 group-hover:rotate-45">
                    <ArrowUpRight className="h-5 w-5" />
                  </span>
                </a>
              </Magnetic>
            </Reveal>

            <Reveal delay={0.2} className="mt-14">
              <p className="eyebrow mb-4 opacity-70">Elsewhere</p>
              <ul className="flex flex-wrap gap-x-8 gap-y-3">
                {profile.socials.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target={s.href.startsWith('http') ? '_blank' : undefined}
                      rel="noreferrer"
                      className="group relative inline-flex items-center gap-1.5 text-base font-semibold"
                    >
                      <span className="relative">
                        <Scramble text={s.label} />
                        <span className="absolute -bottom-0.5 left-0 h-[2px] w-full origin-right scale-x-0 bg-ink transition-transform duration-500 [transition-timing-function:cubic-bezier(.16,1,.3,1)] group-hover:origin-left group-hover:scale-x-100" />
                      </span>
                      <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      <span className="sr-only">{s.handle}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal delay={0.1} className="lg:col-span-5">
            <form onSubmit={onSubmit} className="rounded-[2rem] border border-ink/10 bg-paper/50 p-6 backdrop-blur md:p-8" noValidate={false}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="eyebrow mb-2 block opacity-70">
                    Name
                  </label>
                  <input id="name" name="name" required autoComplete="name" className={field} placeholder="Your name" />
                </div>
                <div>
                  <label htmlFor="email" className="eyebrow mb-2 block opacity-70">
                    Email
                  </label>
                  <input id="email" name="email" type="email" required autoComplete="email" className={field} placeholder="you@example.com" />
                </div>
                <div>
                  <label htmlFor="message" className="eyebrow mb-2 block opacity-70">
                    Message
                  </label>
                  <textarea id="message" name="message" required rows={5} className={`${field} resize-none`} placeholder="Tell me about the project" />
                </div>
                {/* Honeypot: hidden from people, tempting for bots */}
                <div className="hidden" aria-hidden>
                  <label htmlFor="company">Company</label>
                  <input id="company" name="company" tabIndex={-1} autoComplete="off" />
                </div>
              </div>

              {hasApi && <Turnstile ref={turnstile} onToken={onToken} />}

              <button
                type="submit"
                disabled={status === 'sending' || status === 'sent'}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-4 text-sm font-semibold text-cream transition-transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100"
              >
                {status === 'sending' && <Loader2 className="h-4 w-4 animate-spin" />}
                {status === 'sent' && <Check className="h-4 w-4" />}
                {status === 'sent' ? 'Message sent' : status === 'sending' ? 'Sending' : hasApi ? 'Send message' : 'Send via email'}
              </button>
              <p className="mt-3 text-xs opacity-60" role="status" aria-live="polite">
                {status === 'error' ? error : hasApi ? 'Protected by Cloudflare Turnstile. I never share your details.' : 'Opens your email app with the message prefilled.'}
              </p>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

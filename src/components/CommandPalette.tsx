import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Copy, CornerDownLeft, Download, ExternalLink, FolderOpen, Hash, Search } from 'lucide-react'
import { downloadCV } from '../lib/cv'
import { profile } from '../data/profile'
import { projects } from '../data/projects'
import { useLenis } from './SmoothScroll'

/**
 * Ctrl/⌘ + K command palette. Jump to a chapter, open a project's case notes,
 * visit a live demo, copy the email or open GitHub. Arrow keys move, Enter
 * runs, Esc closes. Also opened by the `open-palette` window event (the nav
 * button and Pip use it).
 */

type Command = {
  id: string
  group: 'Navigate' | 'Projects' | 'Contact'
  label: string
  hint?: string
  icon: ReactNode
  run: () => void
}

export const openPalette = () => window.dispatchEvent(new Event('open-palette'))

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [toast, setToast] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const lenis = useLenis()

  const go = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    if (lenis) lenis.scrollTo(el, { offset: id === 'content' ? 0 : -72, duration: 1.6 })
    else el.scrollIntoView({ behavior: 'smooth' })
  }

  const commands = useMemo<Command[]>(() => {
    const nav: Command[] = [
      ['content', 'Home', 'Top of the page'],
      ['about', 'About', 'Bio, education, numbers'],
      ['experience', 'Experience', 'The rolling timeline'],
      ['skills', 'Skills', 'Toolkit and stack'],
      ['projects', 'Projects', 'Selected work'],
      ['contact', 'Contact', 'Send a message'],
      ['guestbook', 'Guestbook', 'Leave a word in the sky'],
    ].map(([id, label, hint]) => ({ id: `go-${id}`, group: 'Navigate', label: `Go to ${label}`, hint, icon: <Hash className="h-4 w-4" />, run: () => go(id) }))

    const work: Command[] = projects.flatMap((p) => {
      const items: Command[] = [
        {
          id: `open-${p.slug}`,
          group: 'Projects',
          label: `${p.title}: case notes`,
          hint: p.tagline,
          icon: <FolderOpen className="h-4 w-4" />,
          run: () => window.dispatchEvent(new CustomEvent('open-project', { detail: p.slug })),
        },
      ]
      if (p.demoUrl)
        items.push({
          id: `demo-${p.slug}`,
          group: 'Projects',
          label: `${p.title}: live demo`,
          hint: p.demoUrl.replace(/^https?:\/\//, ''),
          icon: <ExternalLink className="h-4 w-4" />,
          run: () => window.open(p.demoUrl!, '_blank', 'noopener'),
        })
      return items
    })

    const contact: Command[] = [
      {
        id: 'download-cv',
        group: 'Contact',
        label: 'Download CV (PDF)',
        hint: 'Generated from this site',
        icon: <Download className="h-4 w-4" />,
        run: () => void downloadCV(),
      },
      {
        id: 'copy-email',
        group: 'Contact',
        label: 'Copy email address',
        hint: profile.email,
        icon: <Copy className="h-4 w-4" />,
        run: () => {
          navigator.clipboard?.writeText(profile.email).then(
            () => flash('Email copied'),
            () => flash(profile.email),
          )
        },
      },
      { id: 'write', group: 'Contact', label: 'Write an email', hint: profile.email, icon: <ArrowRight className="h-4 w-4" />, run: () => (window.location.href = `mailto:${profile.email}`) },
      ...profile.socials
        .filter((s) => s.href.startsWith('http'))
        .map<Command>((s) => ({ id: `social-${s.label}`, group: 'Contact', label: `Open ${s.label}`, hint: s.handle, icon: <ExternalLink className="h-4 w-4" />, run: () => window.open(s.href, '_blank', 'noopener') })),
    ]
    return [...nav, ...work, ...contact]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lenis])

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 1800)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    const words = q.split(/\s+/)
    return commands.filter((c) => {
      const hay = `${c.label} ${c.hint ?? ''} ${c.group}`.toLowerCase()
      return words.every((w) => hay.includes(w))
    })
  }, [query, commands])

  // Global shortcut + external open event.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-palette', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-palette', onOpen)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      lenis?.stop()
      requestAnimationFrame(() => input.current?.focus())
    } else {
      lenis?.start()
    }
  }, [open, lenis])

  useEffect(() => setActive(0), [query])

  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const run = (c: Command | undefined) => {
    if (!c) return
    setOpen(false)
    setTimeout(c.run, 120)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(filtered.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      run(filtered[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  let lastGroup = ''

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[95] flex items-start justify-center bg-ink/50 px-4 pt-[14vh] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Command palette"
              data-lenis-prevent
              className="w-full max-w-xl overflow-hidden rounded-3xl border border-ink/10 bg-paper text-ink shadow-[0_40px_120px_-30px_rgba(0,0,0,0.6)]"
              initial={{ y: -16, scale: 0.97, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: -10, scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 border-b border-ink/10 px-5">
                <Search className="h-4 w-4 opacity-50" />
                <input
                  ref={input}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Jump to a section, open a project, copy email…"
                  className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-ink/40 focus-visible:outline-none"
                  role="combobox"
                  aria-expanded="true"
                  aria-controls="palette-list"
                  aria-activedescendant={filtered[active] ? `cmd-${filtered[active].id}` : undefined}
                />
                <kbd className="rounded-md border border-ink/15 px-1.5 py-0.5 text-[10px] font-bold opacity-60">ESC</kbd>
              </div>

              <ul ref={list} id="palette-list" role="listbox" className="max-h-[52vh] overflow-y-auto p-2">
                {filtered.length === 0 && <li className="px-4 py-8 text-center text-sm opacity-60">Nothing matches “{query}”.</li>}
                {filtered.map((c, i) => {
                  const header = c.group !== lastGroup
                  lastGroup = c.group
                  const on = i === active
                  return (
                    <li key={c.id} role="presentation">
                      {header && <p className="eyebrow px-3 pb-1 pt-3 opacity-50">{c.group}</p>}
                      <button
                        id={`cmd-${c.id}`}
                        data-idx={i}
                        role="option"
                        aria-selected={on}
                        type="button"
                        onMouseMove={() => setActive(i)}
                        onClick={() => run(c)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${on ? 'bg-ink text-cream' : ''}`}
                      >
                        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${on ? 'bg-cream/15' : 'bg-ink/5'}`}>{c.icon}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{c.label}</span>
                          {c.hint && <span className={`block truncate text-xs ${on ? 'opacity-70' : 'opacity-55'}`}>{c.hint}</span>}
                        </span>
                        {on && <CornerDownLeft className="h-4 w-4 opacity-70" />}
                      </button>
                    </li>
                  )
                })}
              </ul>

              <div className="flex items-center justify-between border-t border-ink/10 px-5 py-2.5 text-[11px] opacity-60">
                <span>↑ ↓ to move · Enter to run</span>
                <span>Ctrl / ⌘ + K</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.p
            role="status"
            className="fixed bottom-8 left-1/2 z-[96] -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-cream shadow-lg"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            {toast}
          </motion.p>
        )}
      </AnimatePresence>
    </>
  )
}

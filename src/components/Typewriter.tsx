import { useEffect, useState } from 'react'
import { prefersReducedMotion } from '../lib/motion'

type Props = { words: string[]; className?: string; start?: boolean }

/**
 * Types each word, pauses, deletes it and moves on, with a blinking caret.
 * Under reduced motion it simply shows the first word.
 */
export default function Typewriter({ words, className = '', start = true }: Props) {
  const [text, setText] = useState('')
  const [i, setI] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const reduced = prefersReducedMotion()

  useEffect(() => {
    if (!start || reduced) return
    const word = words[i % words.length]
    let delay = deleting ? 38 : 72
    if (!deleting && text === word) delay = 1600
    if (deleting && text === '') delay = 260
    const t = setTimeout(() => {
      if (!deleting && text === word) setDeleting(true)
      else if (deleting && text === '') {
        setDeleting(false)
        setI((n) => n + 1)
      } else setText(deleting ? word.slice(0, text.length - 1) : word.slice(0, text.length + 1))
    }, delay)
    return () => clearTimeout(t)
  }, [text, deleting, i, words, start, reduced])

  return (
    <span className={className} aria-label={words.join(', ')}>
      <span aria-hidden>{reduced ? words[0] : text}</span>
      <span aria-hidden className="ml-0.5 inline-block w-[0.08em] animate-[caret_1s_steps(1)_infinite] bg-current align-[-0.08em]" style={{ height: '0.95em' }} />
    </span>
  )
}

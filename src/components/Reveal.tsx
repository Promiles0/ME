import { motion, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'
import { useReducedMotion } from '../lib/motion'

type Props = {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  once?: boolean
  as?: 'div' | 'section' | 'li' | 'p' | 'span' | 'h2' | 'h3'
}

/**
 * Fade-and-glide reveal when an element enters the viewport.
 * Quick and tasteful; disabled under reduced motion.
 */
export default function Reveal({ children, className, delay = 0, y = 28, once = true, as = 'div' }: Props) {
  const reduced = useReducedMotion()
  const variants: Variants = {
    hidden: { opacity: 0, y: reduced ? 0 : y },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reduced ? 0 : 0.7, delay, ease: [0.16, 1, 0.3, 1] },
    },
  }
  const Tag = motion[as]
  return (
    <Tag
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: '0px 0px -12% 0px' }}
    >
      {children}
    </Tag>
  )
}

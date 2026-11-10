import Reveal from './Reveal'

type Props = {
  index: string
  eyebrow: string
  title: string
  outline?: string
  className?: string
  align?: 'left' | 'center'
}

/** Numbered section header with a huge display title and an optional outlined second line. */
export default function SectionHeading({ index, eyebrow, title, outline, className = '', align = 'left' }: Props) {
  return (
    <div className={`${align === 'center' ? 'text-center' : ''} ${className}`}>
      <Reveal>
        <p className="eyebrow flex items-center gap-3 opacity-80">
          <span className="font-display text-base tracking-normal">{index}</span>
          <span className="h-px w-8 bg-current opacity-50" />
          {eyebrow}
        </p>
      </Reveal>
      <Reveal delay={0.08}>
        <h2 className="display mt-4 text-[clamp(3rem,10vw,9rem)]">
          <span className="block">{title}</span>
          {outline && <span className="display-outline block">{outline}</span>}
        </h2>
      </Reveal>
    </div>
  )
}

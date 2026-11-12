import { education, experience, profile, skills } from '../data/profile'
import { projects } from '../data/projects'

/**
 * Build a one-to-two page A4 CV from the same data the site uses, in the
 * site's palette, and download it. jsPDF and the fonts are loaded only when
 * someone clicks the button.
 */
export async function downloadCV() {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })

  // Site fonts, embedded so the PDF looks like the site.
  const toB64 = async (url: string) => {
    const buf = await (await fetch(url)).arrayBuffer()
    let bin = ''
    const bytes = new Uint8Array(buf)
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
    return btoa(bin)
  }
  try {
    doc.addFileToVFS('Bebas.ttf', await toB64('/fonts/BebasNeue-Regular.ttf'))
    doc.addFont('Bebas.ttf', 'Bebas', 'normal')
  } catch {
    /* falls back to Helvetica */
  }
  const display = doc.getFontList().Bebas ? 'Bebas' : 'helvetica'

  const INK: [number, number, number] = [26, 26, 22]
  const SAGE: [number, number, number] = [165, 167, 155]
  const DEEP: [number, number, number] = [127, 130, 118]
  const CREAM: [number, number, number] = [232, 210, 181]
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const M = 48
  const COL = W - M * 2
  let y = 0

  const newPageIfNeeded = (need: number) => {
    if (y + need > H - M) {
      doc.addPage()
      y = M
    }
  }
  const heading = (label: string) => {
    newPageIfNeeded(50)
    y += 14
    doc.setFont(display, 'normal')
    doc.setFontSize(20)
    doc.setTextColor(...INK)
    doc.text(label.toUpperCase(), M, y)
    doc.setDrawColor(...SAGE)
    doc.setLineWidth(0.8)
    doc.line(M, y + 6, W - M, y + 6)
    y += 22
  }
  const para = (text: string, size = 10, color: [number, number, number] = INK, indent = 0) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(size)
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(text, COL - indent) as string[]
    newPageIfNeeded(lines.length * size * 1.35)
    doc.text(lines, M + indent, y)
    y += lines.length * size * 1.35
  }

  // Header band
  doc.setFillColor(...SAGE)
  doc.rect(0, 0, W, 132, 'F')
  doc.setFillColor(...CREAM)
  doc.triangle(W * 0.62, 0, W * 0.76, 0, W * 0.56, 132, 'F')
  doc.triangle(W * 0.76, 0, W * 0.7, 132, W * 0.56, 132, 'F')
  doc.setFont(display, 'normal')
  doc.setTextColor(...INK)
  doc.setFontSize(38)
  doc.text(profile.name.toUpperCase(), M, 62)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(profile.title, M, 84)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  const github = profile.socials.find((s) => s.label === 'GitHub')
  doc.text([`${profile.location}  ·  ${profile.email}${github ? `  ·  github.com/${github.handle.replace('@', '')}` : ''}`, `Portfolio: ${window.location.origin.replace(/^https?:\/\//, '')}`], M, 104)
  y = 160

  heading('Profile')
  profile.bio.forEach((p) => {
    para(p)
    y += 4
  })

  heading('Experience')
  experience.forEach((e) => {
    newPageIfNeeded(60)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...INK)
    doc.text(e.role, M, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...DEEP)
    doc.text(e.period, W - M, y, { align: 'right' })
    y += 13
    doc.text(e.company.toUpperCase(), M, y)
    y += 13
    e.points.forEach((p) => {
      doc.setFillColor(...INK)
      doc.circle(M + 3, y - 3, 1.2, 'F')
      para(p, 9.5, INK, 12)
    })
    y += 8
  })

  heading('Selected projects')
  projects
    .slice()
    .sort((a, b) => a.order - b.order)
    .forEach((p) => {
      newPageIfNeeded(46)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10.5)
      doc.setTextColor(...INK)
      doc.text(`${p.title}  —  ${p.tagline}`, M, y)
      if (p.demoUrl) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(...DEEP)
        doc.textWithLink(p.demoUrl.replace(/^https?:\/\//, ''), W - M, y, { url: p.demoUrl, align: 'right' } as never)
      }
      y += 13
      para(p.tech.join(' · '), 8.5, DEEP)
      y += 5
    })

  heading('Education')
  education.forEach((e) => {
    newPageIfNeeded(30)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(...INK)
    doc.text(e.course, M, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...DEEP)
    doc.text(e.years, W - M, y, { align: 'right' })
    y += 12
    doc.text(`${e.school} · ${e.detail}`, M, y)
    y += 16
  })

  heading('Skills')
  skills.forEach((g) => {
    newPageIfNeeded(24)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(...INK)
    doc.text(g.group, M, y)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(g.items.join(' · '), COL - 120) as string[]
    doc.text(lines, M + 120, y)
    y += lines.length * 12.5 + 4
  })

  heading('Languages')
  para(profile.languages.join(' · '))

  // Footer on every page
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...DEEP)
    doc.text(`${profile.name} · CV · ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`, M, H - 24)
    doc.text(`${i} / ${pages}`, W - M, H - 24, { align: 'right' })
  }

  doc.save(`${profile.name.replace(/\s+/g, '-')}-CV.pdf`)
}

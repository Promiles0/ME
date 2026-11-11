/**
 * Personal content for the site. Everything here came from the CV and the
 * owner's own answers; nothing is invented. Edit freely.
 */
export const profile = {
  name: 'Iradukunda Aroi Serge',
  shortName: 'Aroi',
  initials: 'AS',
  title: 'Web & Software Developer',
  roles: ['Web Developer', 'Software Developer', 'UI Builder', 'Problem Solver'],
  location: 'Kigali, Rwanda',
  timeZone: 'Africa/Kigali',
  email: 'serge@todo.rw',
  availability: 'Open to freelance and full-time roles',
  bio: [
    'I am a creative, detail-driven software developer based in Kigali. I build full-stack products end to end: the interface people touch, the data model underneath, and the deployment that keeps it fast.',
    'Right now I am a software development intern at Alpha Computer while finishing an Advanced Diploma in Information Technology at Saint Joseph Institute. I love shipping things that feel effortless to use, whether that is an e-commerce checkout, a trading dashboard or a private memory vault.',
  ],
  languages: ['English', 'German', 'Kinyarwanda'],
  socials: [
    { label: 'GitHub', href: 'https://github.com/Promiles0', handle: '@Promiles0' },
    { label: 'Email', href: 'mailto:serge@todo.rw', handle: 'serge@todo.rw' },
  ],
}

export const education = [
  {
    school: 'Saint Joseph Institute',
    course: 'Advanced Diploma in Information Technology',
    detail: 'Evening programme, year 1',
    years: '2026 — Present',
  },
  {
    school: 'APAER Rusororo Institute',
    course: 'Software Development',
    detail: 'Diploma',
    years: '2022 — 2024',
  },
  {
    school: 'APAER Rusororo Institute',
    course: 'Computer Application',
    detail: 'Certificate',
    years: '2021 — 2022',
  },
]

export type Experience = {
  year: string
  period: string
  role: string
  company: string
  points: string[]
}

export const experience: Experience[] = [
  {
    year: '2026',
    period: '2026 — Present',
    role: 'Software Development Intern',
    company: 'Alpha Computer',
    points: [
      'Working inside a professional software team on real client deliverables.',
      'Building and maintaining features across the stack, from UI to database.',
      'Learning production practices: code review, testing and deployment.',
    ],
  },
  {
    year: '2026',
    period: '2026 — Present',
    role: 'IT Student Projects',
    company: 'Saint Joseph Institute',
    points: [
      'Developing academic and personal projects as part of the Advanced Diploma in IT.',
      'Applying C/C++, database design and system integration to real-world scenarios.',
      'Strengthening problem-solving and teamwork through collaborative assignments.',
    ],
  },
  {
    year: '2022',
    period: '2022 — Present',
    role: 'Software Developer',
    company: 'Freelance',
    points: [
      'Built interactive websites and web apps with JavaScript, React and TypeScript.',
      'Integrated back-end services and databases for seamless data flow, mostly on Supabase and PostgreSQL.',
      'Collaborated on projects that improved user experience and system reliability.',
    ],
  },
  {
    year: '2021',
    period: '2021 — 2022',
    role: 'Web Designer',
    company: 'Freelance',
    points: [
      'Designed responsive, mobile-friendly web pages with strong visual appeal.',
      'Delivered complex projects under tight deadlines, ensuring high performance across devices.',
    ],
  },
]

export type Stat = { label: string; value: number; suffix?: string }

export const stats: Stat[] = [
  { label: 'Years building for the web', value: 5, suffix: '+' },
  { label: 'Repositories on GitHub', value: 23 },
  { label: 'Full-stack products shipped', value: 6 },
  { label: 'Languages spoken', value: 3 },
]

export type SkillGroup = { group: string; items: string[] }

export const skills: SkillGroup[] = [
  {
    group: 'Front-end',
    items: ['React', 'TypeScript', 'JavaScript', 'Next.js', 'Vite', 'Tailwind CSS', 'Framer Motion', 'HTML & CSS', 'Responsive UX'],
  },
  {
    group: 'Back-end & data',
    items: ['Supabase', 'PostgreSQL', 'SQL design', 'Edge Functions', 'Cloudflare Workers', 'Node.js', 'PHP', 'Stripe', 'REST APIs'],
  },
  {
    group: 'Languages & tools',
    items: ['C / C++', 'Python', 'Git & GitHub', 'Vercel', 'Figma', 'Graphic design'],
  },
  {
    group: 'Growth',
    items: ['SEO', 'Google Ads monitoring', 'Meta Ads monitoring', 'Analytics'],
  },
]

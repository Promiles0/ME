/**
 * Project data.
 *
 * This file is the source of truth for the D1 `projects` table
 * (worker/migrations/0001_init.sql). Run `node scripts/gen-seed.mjs` after
 * editing it. When VITE_API_URL is set, src/lib/projects.ts fetches the table
 * first and falls back to this list.
 */
export type Project = {
  slug: string
  title: string
  tagline: string
  summary: string
  highlights: string[]
  tech: string[]
  repoUrl: string | null
  demoUrl: string | null
  image: string
  video?: string
  isPrivate: boolean
  /** The live demo allows iframe embedding, so the laptop can boot it on hover. */
  embeddable?: boolean
  featured: boolean
  order: number
  year: string
}

export const projects: Project[] = [
  {
    slug: 'blue-tech',
    title: 'Blue-tech',
    tagline: 'Full-stack e-commerce, no separate API server',
    summary:
      'A complete retail platform: product discovery, cart and checkout, coupons, payments and an admin console for orders, shipments, users and reviews. The React front end talks to a single Deno edge function that serves the whole REST API on top of Supabase.',
    highlights: [
      'Atomic checkout: stock and coupon updates use compare-and-swap so they stay correct under concurrent requests.',
      'Admin console with dashboard stats, analytics, order and shipment management and review moderation.',
      'Email, password and Google sign-in, explicit CORS allow-list and shaped API responses so sensitive columns never reach the client.',
    ],
    tech: ['React', 'Vite', 'Tailwind CSS', 'Supabase', 'Deno Edge Functions', 'PostgreSQL'],
    repoUrl: 'https://github.com/Promiles0/Blue-tech',
    demoUrl: 'https://blue-tech.onrender.com',
    image: '/images/projects/blue-tech.jpg',
    video: '/videos/blue-tech.mp4',
    isPrivate: false,
    featured: true,
    order: 1,
    year: '2026',
  },
  {
    slug: 'arovaforex',
    embeddable: true,
    title: 'ArovaForex',
    tagline: 'Forecasts, signals and education for traders',
    summary:
      'A trading community platform with public and premium forecasts, real-time likes and comments, a signals area for subscribers, a trading calendar and a full admin dashboard for users, content, analytics and notifications.',
    highlights: [
      'Role-based user and admin dashboards secured with Supabase row level security.',
      'Real-time engagement on forecasts through Supabase Realtime.',
      'Analytics for user growth, forecast activity and engagement with Recharts.',
    ],
    tech: ['React', 'Vite', 'Tailwind CSS', 'shadcn/ui', 'Framer Motion', 'Supabase', 'Recharts'],
    repoUrl: null,
    demoUrl: 'https://arovaforex.vercel.app',
    image: '/images/projects/arovaforex.jpg',
    isPrivate: true,
    featured: false,
    order: 2,
    year: '2025',
  },
  {
    slug: 'san-brothers-core',
    title: 'San Brothers Core',
    tagline: 'Multi-portal professional services platform',
    summary:
      'One codebase serving three portals for visa and permit processing, certified translation with live interpretation, accounting and business consultancy. Clients book, pay and track services in English, Chinese or Kinyarwanda.',
    highlights: [
      'React 19 with TanStack Router and Start, deployed on Cloudflare Workers.',
      'Stripe payments and Daily.co video for live interpreter sessions.',
      'Custom i18n, React Hook Form with Zod validation and a Radix-based component library.',
    ],
    tech: ['React 19', 'TanStack Router', 'Cloudflare Workers', 'Tailwind CSS v4', 'Supabase', 'Stripe', 'Daily.co'],
    repoUrl: null,
    demoUrl: 'https://sanbrothers.cn.com',
    image: '/images/projects/san-brothers.jpg',
    isPrivate: true,
    featured: false,
    order: 3,
    year: '2026',
  },
  {
    slug: 'lifevault',
    title: 'LifeVault',
    tagline: 'A private memory vault, organised by moments',
    summary:
      'A personal cloud archive that keeps photos, videos, documents, audio and notes grouped around memories such as a birthday or a trip, rather than folders. Lose a device and everything is still there when you sign in from the next one.',
    highlights: [
      'Library, timeline, favourites, trash with restore and partial-word search across everything.',
      'Cloudflare R2 for file storage with Supabase Storage as fallback, behind a pluggable provider interface.',
      'Supabase Auth and Postgres with row level security; deploys to Vercel as a single app.',
    ],
    tech: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS v4', 'Supabase', 'Cloudflare R2'],
    repoUrl: null,
    demoUrl: null,
    image: '/images/projects/lifevault.svg',
    isPrivate: true,
    featured: false,
    order: 4,
    year: '2026',
  },
  {
    slug: 'arova',
    embeddable: true,
    title: 'Arova',
    tagline: 'Brand site for the Arova trading community',
    summary:
      'The public face of Arova: a fast marketing site with layered hero imagery, section backgrounds and clear calls to action that lead into the ArovaForex platform.',
    highlights: [
      'Image-led layout with text masks and layered backgrounds.',
      'Built with React, TypeScript and Tailwind on Vite, data on Supabase.',
    ],
    tech: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Supabase'],
    repoUrl: null,
    demoUrl: 'https://arova.vercel.app',
    image: '/images/projects/arova.jpg',
    isPrivate: true,
    featured: false,
    order: 5,
    year: '2025',
  },
  {
    slug: 'hubert-fitness-forge',
    title: 'Hubert Fitness Forge',
    tagline: 'Fitness coaching web app',
    summary:
      'A coaching and membership site for a fitness brand with programme pages, motion-rich sections and a Supabase-backed data layer.',
    highlights: [
      'React, TypeScript and shadcn/ui with Framer Motion transitions.',
      'TanStack Query for server state and Supabase for data.',
    ],
    tech: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Framer Motion', 'Supabase'],
    repoUrl: 'https://github.com/Promiles0/hubert-fitness-forge',
    demoUrl: 'https://hubertfitness.vercel.app',
    image: '/images/projects/hubert-fitness.svg',
    isPrivate: false,
    featured: false,
    order: 6,
    year: '2025',
  },
]

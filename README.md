# aroi.me — portfolio of Iradukunda Aroi Serge

A single-page portfolio with smooth scrolling, scroll-driven reveals and an interactive particle field that spells a name and melts into 3D shapes as you scroll.

**Stack:** React 19 · Vite · TypeScript · Tailwind CSS v4 · Three.js via React Three Fiber · GSAP + ScrollTrigger · Lenis · Framer Motion · Supabase (optional)

---

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173.

```bash
npm run build     # type-check + production build into dist/
npm run preview   # serve the production build locally
```

## Project layout

```
public/
  fonts/            Bebas Neue + Manrope, self-hosted
  images/           portrait and project screenshots
  videos/           featured project demo
  og-image.png      social preview (1200×630)
src/
  data/profile.ts   name, bio, education, experience, skills, socials
  data/projects.ts  project list (mirrors the Supabase `projects` table)
  lib/              GSAP/Lenis helpers, Supabase client, project loader
  components/       nav, preloader, cursor, reveal, tilt card, device mockup, modal
  sections/         Hero, About, Experience, Skills, Projects, Contact
  three/            the particle field (shaders + point-cloud generators)
supabase/
  migrations/0001_init.sql   tables + row level security
  seed.sql                   initial project rows
scripts/sync-github.mjs      re-sync project metadata from GitHub
```

## Editing content

Everything personal lives in `src/data/profile.ts` and `src/data/projects.ts`. Colours are design tokens at the top of `src/index.css`:

| Token | Hex | Use |
|---|---|---|
| sage | `#A5A79B` | main surface |
| cream | `#E8D2B5` | accent, display type, stripes |
| ink | `#1A1A16` | text, dark sections |
| sage-deep | `#7F8276` | lines, muted labels |
| paper | `#F4EADB` | light surfaces |

## Motion and performance

- Lenis drives scrolling and GSAP's ticker drives Lenis, so ScrollTrigger always agrees with the scroll position.
- Every animation checks `prefers-reduced-motion`. With it on: no smooth scroll, no preloader, no particles (a static word is shown), no parallax or tilt.
- The 3D stack is code-split (`three` chunk) and lazy-loaded. The particle count drops from 22 000 to 9 000 on touch or low-core devices, and the render loop pauses when the hero is off screen.
- Fonts are self-hosted and preloaded. No third-party requests are made on load.

## Part two: Supabase

The site works without a backend. Projects are read from `src/data/projects.ts` and the contact form opens a prefilled email.

To switch on the backend:

1. Create a Supabase project and run `supabase/migrations/0001_init.sql` in the SQL editor, then `supabase/seed.sql`.
2. Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Project settings → API).
3. Restart `npm run dev`. The Projects section now reads the `projects` table (falling back to the local list on any error) and the contact form inserts into `contact_messages`.

Security model:

- `projects`: public can `select` only rows where `published = true`. Writes need the service role.
- `contact_messages`: public can `insert` only. There is no select policy, so nobody can read messages through the API. Read them in the Supabase dashboard.

### Keep projects in sync with GitHub

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... GITHUB_TOKEN=... node scripts/sync-github.mjs
node scripts/sync-github.mjs --add Promiles0/new-repo   # adds a repo as unpublished
```

The script refreshes tagline, tech stack, demo URL and year from GitHub. It never overwrites a summary you wrote by hand.

## Deploy

**Vercel (recommended):** import the GitHub repo, framework preset *Vite*, build command `npm run build`, output `dist`. Add the two `VITE_` variables under Environment Variables when the Supabase project exists. Every push to `main` redeploys.

**Netlify:** same settings. Build `npm run build`, publish `dist`.

Update the `canonical` and `og:url` values in `index.html` to the final domain once it is live.

## Accessibility and SEO

Semantic landmarks, skip link, keyboard-reachable cards and modal with focus trap, alt text on images, `aria-live` status on the form, colour pairs that pass WCAG AA for body text. `index.html` carries title, description, Open Graph and Twitter tags, canonical URL and JSON-LD `Person` data.

# aroi.me — portfolio of Iradukunda Aroi Serge

A single-page portfolio with smooth scrolling, scroll-driven reveals and an interactive particle field that spells a name and melts into 3D shapes as you scroll.

**Stack:** React 19 · Vite · TypeScript · Tailwind CSS v4 · Three.js via React Three Fiber · GSAP + ScrollTrigger · Lenis · Framer Motion · Cloudflare Workers, D1 and Durable Objects (optional)

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
  data/projects.ts  project list (mirrors the D1 `projects` table)
  lib/              GSAP/Lenis helpers, API client, presence store, project loader
  components/       nav, preloader, cursor, reveal, tilt card, device mockup, modal
  sections/         Hero, About, Experience, Skills, Projects, Contact
  three/            the particle field (shaders + point-cloud generators)
worker/                      Cloudflare Worker: D1 API, presence room, Turnstile
scripts/gen-seed.mjs         regenerate worker/seed.sql from projects.ts
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

## Backend: Cloudflare Worker (optional)

The site works without a backend: projects come from `src/data/projects.ts` and the contact form opens a prefilled email. With the Worker in `worker/` it gains:

| Endpoint | What it does |
|---|---|
| `GET /projects` | Published projects from D1, ordered by `display_order` |
| `POST /contact` | Validates, checks Turnstile, rate-limits (5/hour per address) and stores in D1 |
| `GET /presence` | WebSocket into a Durable Object room: live cursors and "N exploring now" |

CORS is limited to the origins in `ALLOWED_ORIGINS` (`worker/wrangler.jsonc`). If the Worker is slow or down, the site falls back automatically.

### Run it locally

```bash
cd worker
npm install
npx wrangler d1 migrations apply aroi-me --local
npx wrangler d1 execute aroi-me --local --file=seed.sql
npx wrangler dev --port 8787
```

`worker/.dev.vars` holds Cloudflare's always-pass Turnstile test secret. In the project root, `.env.local` points the site at it:

```
VITE_API_URL=http://localhost:8787
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

### Deploy it

```bash
cd worker
npx wrangler d1 create aroi-me          # copy the database_id into wrangler.jsonc
npx wrangler d1 migrations apply aroi-me --remote
npx wrangler d1 execute aroi-me --remote --file=seed.sql
npx wrangler secret put TURNSTILE_SECRET
npx wrangler deploy
```

Then add `VITE_API_URL` (the workers.dev URL) and `VITE_TURNSTILE_SITE_KEY` to the Render static site's environment and redeploy it.

### Updating projects

Edit `src/data/projects.ts`, then regenerate and push the seed:

```bash
node scripts/gen-seed.mjs
cd worker && npx wrangler d1 execute aroi-me --remote --file=seed.sql
```

### Reading messages

```bash
cd worker
npm run messages
```

## Deploy

**Vercel (recommended):** import the GitHub repo, framework preset *Vite*, build command `npm run build`, output `dist`. Add `VITE_API_URL` and `VITE_TURNSTILE_SITE_KEY` once the Worker is deployed. Every push to `main` redeploys.

**Netlify:** same settings. Build `npm run build`, publish `dist`.

Update the `canonical` and `og:url` values in `index.html` to the final domain once it is live.

## Accessibility and SEO

Semantic landmarks, skip link, keyboard-reachable cards and modal with focus trap, alt text on images, `aria-live` status on the form, colour pairs that pass WCAG AA for body text. `index.html` carries title, description, Open Graph and Twitter tags, canonical URL and JSON-LD `Person` data.

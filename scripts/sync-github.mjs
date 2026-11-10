#!/usr/bin/env node
/**
 * Re-sync project metadata from GitHub into the Supabase `projects` table.
 *
 * For every row in `projects` whose repo_url points at GitHub (or every slug
 * passed on the command line), this pulls the repo description, homepage,
 * topics, primary languages and star count and updates the row. It never
 * overwrites a summary you wrote by hand: summary/highlights are only filled
 * when they are empty.
 *
 * Usage:
 *   GITHUB_TOKEN=ghp_xxx SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/sync-github.mjs [slug ...]
 *
 * Add a new repo:
 *   node scripts/sync-github.mjs --add owner/repo
 *
 * Private repos need a token with `repo` scope; public ones work without one.
 */
import { createClient } from '@supabase/supabase-js'

const { GITHUB_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const gh = async (path) => {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'portfolio-sync',
      ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
    },
  })
  if (!res.ok) throw new Error(`${path}: ${res.status} ${res.statusText}`)
  return res.json()
}

const ownerRepo = (url) => {
  const m = /github\.com\/([^/]+)\/([^/#?]+)/.exec(url ?? '')
  return m ? `${m[1]}/${m[2].replace(/\.git$/, '')}` : null
}

const firstParagraph = (markdown) =>
  markdown
    .replace(/<[^>]+>/g, '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find((p) => p && !p.startsWith('#') && !p.startsWith('!') && !p.startsWith('[') && p.length > 40) ?? ''

async function fetchRepo(full) {
  const repo = await gh(`/repos/${full}`)
  if (repo.fork) return null
  const languages = Object.keys(await gh(`/repos/${full}/languages`)).slice(0, 5)
  let readme = ''
  try {
    const r = await gh(`/repos/${full}/readme`)
    readme = Buffer.from(r.content, 'base64').toString('utf8')
  } catch {
    /* no readme */
  }
  return {
    slug: repo.name.toLowerCase(),
    title: repo.name.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    tagline: repo.description ?? null,
    summary: firstParagraph(readme),
    tech_stack: [...new Set([...(repo.topics ?? []), ...languages])],
    repo_url: repo.private ? null : repo.html_url,
    demo_url: repo.homepage || null,
    is_private: repo.private,
    year: String(new Date(repo.pushed_at).getFullYear()),
    github_synced_at: new Date().toISOString(),
  }
}

async function main() {
  const args = process.argv.slice(2)
  const addIdx = args.indexOf('--add')

  if (addIdx !== -1) {
    const full = args[addIdx + 1]
    const data = await fetchRepo(full)
    if (!data) return console.log('Skipped (fork).')
    const { error } = await supabase.from('projects').upsert({ ...data, published: false }, { onConflict: 'slug' })
    if (error) throw error
    console.log(`Added ${data.slug} as unpublished. Review it, then set published = true.`)
    return
  }

  let query = supabase.from('projects').select('slug, repo_url, summary, highlights')
  if (args.length) query = query.in('slug', args)
  const { data: rows, error } = await query
  if (error) throw error

  for (const row of rows) {
    const full = ownerRepo(row.repo_url)
    if (!full) {
      console.log(`- ${row.slug}: no GitHub URL, skipped`)
      continue
    }
    const data = await fetchRepo(full)
    if (!data) continue
    const patch = {
      tagline: data.tagline,
      tech_stack: data.tech_stack,
      demo_url: data.demo_url,
      year: data.year,
      github_synced_at: data.github_synced_at,
      ...(row.summary ? {} : { summary: data.summary }),
    }
    const { error: upErr } = await supabase.from('projects').update(patch).eq('slug', row.slug)
    if (upErr) throw upErr
    console.log(`✓ ${row.slug} synced from ${full}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

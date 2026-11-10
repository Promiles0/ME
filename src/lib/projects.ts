import { projects as localProjects, type Project } from '../data/projects'
import { supabase } from './supabase'

type Row = {
  slug: string
  title: string
  tagline: string | null
  summary: string
  highlights: string[] | null
  tech_stack: string[] | null
  repo_url: string | null
  demo_url: string | null
  image_url: string | null
  video_url: string | null
  is_private: boolean
  featured: boolean
  display_order: number
  year: string | null
}

function rowToProject(row: Row): Project {
  return {
    slug: row.slug,
    title: row.title,
    tagline: row.tagline ?? '',
    summary: row.summary,
    highlights: row.highlights ?? [],
    tech: row.tech_stack ?? [],
    repoUrl: row.repo_url,
    demoUrl: row.demo_url,
    image: row.image_url ?? '',
    video: row.video_url ?? undefined,
    isPrivate: row.is_private,
    featured: row.featured,
    order: row.display_order,
    year: row.year ?? '',
  }
}

/**
 * Load projects from Supabase when configured, otherwise from the local file.
 * Any failure quietly falls back to the local list so the site never breaks.
 */
export async function loadProjects(): Promise<Project[]> {
  if (!supabase) return localProjects
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('published', true)
      .order('display_order', { ascending: true })
    if (error || !data || data.length === 0) return localProjects
    return (data as Row[]).map(rowToProject)
  } catch {
    return localProjects
  }
}

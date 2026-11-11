import { projects as localProjects, type Project } from '../data/projects'
import { apiFetch, hasApi } from './api'

/**
 * Load projects from the Worker (D1) when configured, otherwise from the local
 * file. Any failure quietly falls back to the local list so the site never breaks.
 */
export async function loadProjects(): Promise<Project[]> {
  if (!hasApi) return localProjects
  try {
    const res = await apiFetch('/projects')
    if (!res.ok) return localProjects
    const data = (await res.json()) as Project[]
    return Array.isArray(data) && data.length > 0 ? data : localProjects
  } catch {
    return localProjects
  }
}

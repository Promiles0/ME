/**
 * The portfolio's Cloudflare Worker. Optional: when VITE_API_URL is not set
 * (or the Worker is down) the site falls back to local project data and a
 * mailto contact form, so it never breaks.
 */
export const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').replace(/\/$/, '')
export const hasApi = API_URL.length > 0

export const TURNSTILE_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) ?? ''

/** fetch with a timeout, so a slow API never holds the page hostage. */
export async function apiFetch(path: string, init: RequestInit = {}, timeoutMs = 4000): Promise<Response> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    return await fetch(`${API_URL}${path}`, { ...init, signal: ctrl.signal })
  } finally {
    clearTimeout(t)
  }
}

export function presenceUrl(): string | null {
  if (!hasApi) return null
  return `${API_URL.replace(/^http/, 'ws')}/presence`
}

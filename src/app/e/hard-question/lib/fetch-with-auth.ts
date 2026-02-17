import { getSupabase } from '@/lib/supabase/client'

/**
 * Fetch wrapper that attaches the current Supabase session's
 * access token as an Authorization: Bearer header.
 *
 * Falls through to a plain fetch (no auth header) when no session exists,
 * so unauthenticated users still get the public response.
 */
export async function fetchWithAuth(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers)

  try {
    const { data } = await getSupabase().auth.getSession()
    const token = data.session?.access_token
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  } catch {
    // No session — proceed without auth
  }

  return fetch(url, { ...init, headers })
}

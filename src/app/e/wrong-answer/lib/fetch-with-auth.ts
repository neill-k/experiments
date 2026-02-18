import { getSupabase } from '@/lib/supabase/client'

export async function fetchWithAuth(url: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)
  try {
    const { data } = await getSupabase().auth.getSession()
    const token = data.session?.access_token
    if (token) headers.set('Authorization', `Bearer ${token}`)
  } catch { /* No session */ }
  return fetch(url, { ...init, headers })
}

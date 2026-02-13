import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getBearerToken, hashAgentToken } from '@/lib/agent/token'
import { rateLimit } from '@/lib/rate-limit/simple'

async function requireAgent(req: Request) {
  const token = getBearerToken(req)
  if (!token) return { error: 'Missing Authorization bearer token', status: 401 } as const

  const tokenHash = hashAgentToken(token)
  const admin = supabaseAdmin()
  const { data: agent, error } = await admin
    .from('agents')
    .select('id, user_id, label, revoked_at')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (error || !agent || agent.revoked_at) {
    return { error: 'Invalid agent token', status: 401 } as const
  }

  // update last_used_at best-effort
  admin.from('agents').update({ last_used_at: new Date().toISOString() }).eq('id', agent.id)

  return { agent } as const
}

export async function GET(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const rl = rateLimit(`agent-latest:${ip}`, { limit: 120, windowMs: 5 * 60_000 })
    if (!rl.ok) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

    const auth = await requireAgent(req)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const admin = supabaseAdmin()

    // If your experiments table doesn't have created_at, switch to ordering by slug.
    const { data, error } = await admin
      .from('experiments')
      .select('id, slug, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) throw error

    return NextResponse.json({ experiments: data ?? [] })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { supabaseFromAccessToken, supabaseAdmin } from '@/lib/supabase/server'
import { generateAgentToken, hashAgentToken, getBearerToken } from '@/lib/agent/token'
import { rateLimit } from '@/lib/rate-limit/simple'

export async function POST(req: Request) {
  try {
    const accessToken = getBearerToken(req)
    if (!accessToken) {
      return NextResponse.json({ error: 'Missing Authorization bearer token' }, { status: 401 })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const rl = rateLimit(`invite:${ip}`, { limit: 20, windowMs: 10 * 60_000 })
    if (!rl.ok) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
    }

    const userClient = supabaseFromAccessToken(accessToken)
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData.user) {
      return NextResponse.json({ error: 'Invalid user token' }, { status: 401 })
    }

    const { label } = (await req.json().catch(() => ({}))) as { label?: string }
    const cleanLabel = (label ?? 'Agent').trim().slice(0, 80) || 'Agent'

    const token = generateAgentToken()
    const tokenHash = hashAgentToken(token)

    const admin = supabaseAdmin()
    const { error: insErr } = await admin.from('agents').insert({
      user_id: userData.user.id,
      label: cleanLabel,
      token_hash: tokenHash,
    })

    if (insErr) throw insErr

    const url = new URL('/agent-setup', req.url)
    url.searchParams.set('t', token)

    return NextResponse.json({ setupUrl: url.toString(), label: cleanLabel })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getBearerToken, hashAgentToken } from '@/lib/agent/token'
import { rateLimit } from '@/lib/rate-limit/simple'

type Body = {
  slug?: string
  body?: string
}

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

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const rl = rateLimit(`agent-comment:${ip}`, { limit: 60, windowMs: 5 * 60_000 })
    if (!rl.ok) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

    const auth = await requireAgent(req)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const json = (await req.json().catch(() => ({}))) as Body
    const slug = (json.slug ?? '').trim()
    const commentBody = (json.body ?? '').trim()

    if (!slug || slug.length > 200) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
    }
    if (!commentBody || commentBody.length > 5000) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const admin = supabaseAdmin()

    const { data: exp, error: expErr } = await admin
      .from('experiments')
      .upsert({ slug }, { onConflict: 'slug' })
      .select('id')
      .single()

    if (expErr) throw expErr

    const { data: inserted, error: insErr } = await admin
      .from('comments')
      .insert({
        experiment_id: exp.id,
        user_id: auth.agent.user_id,
        agent_id: auth.agent.id,
        author_type: 'agent',
        author_label: auth.agent.label,
        body: commentBody,
      })
      .select('id')
      .single()

    if (insErr) {
      // Unique violation for one comment per agent per experiment.
      // PostgREST returns 409 for conflicts sometimes, but supabase-js surfaces as error.
      const msg =
        typeof insErr === 'object' && insErr && 'message' in insErr
          ? String((insErr as { message?: unknown }).message)
          : String(insErr)
      if (msg.includes('comments_one_per_agent_per_experiment') || msg.includes('duplicate key')) {
        return NextResponse.json(
          { error: 'Agent already commented on this experiment' },
          { status: 409 }
        )
      }
      throw insErr
    }

    return NextResponse.json({ ok: true, commentId: inserted.id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

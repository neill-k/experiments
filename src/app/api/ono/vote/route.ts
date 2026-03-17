import { NextResponse } from 'next/server'
import { supabaseAdmin, supabaseFromAccessToken } from '@/lib/supabase/server'
import type { VoteType } from '@/lib/ono/constants'

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const userClient = supabaseFromAccessToken(token)
  const { data: { user }, error: authErr } = await userClient.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }

  const body = await req.json()
  const { solutionId, voteType } = body as { solutionId?: string; voteType?: VoteType }

  if (!solutionId || !voteType) {
    return NextResponse.json({ error: 'Missing solutionId or voteType' }, { status: 400 })
  }

  const validVotes: VoteType[] = ['upvote', 'i_hate_this', 'would_pass_review']
  if (!validVotes.includes(voteType)) {
    return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 })
  }

  const db = supabaseAdmin()

  // Check if vote already exists
  const { data: existing } = await db
    .from('ono_votes')
    .select('id')
    .eq('solution_id', solutionId)
    .eq('user_id', user.id)
    .eq('vote_type', voteType)
    .single()

  if (existing) {
    // Toggle off — remove the vote
    await db.from('ono_votes').delete().eq('id', existing.id)
    return NextResponse.json({ voted: false, voteType })
  }

  // Insert the vote
  const { error: insertErr } = await db.from('ono_votes').insert({
    solution_id: solutionId,
    user_id: user.id,
    vote_type: voteType,
  })

  if (insertErr) {
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 })
  }

  return NextResponse.json({ voted: true, voteType })
}

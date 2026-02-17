import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabaseFromAccessToken } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    // Auth required
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const userClient = supabaseFromAccessToken(token)
    const { data: { user }, error: authErr } = await userClient.auth.getUser()

    if (authErr || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const admin = supabaseAdmin()

    // Check user tier
    const { data: profile } = await admin
      .from('user_profiles')
      .select('tier')
      .eq('id', user.id)
      .single()

    if (!profile || profile.tier !== 'paid') {
      return NextResponse.json(
        {
          error: 'Archive access requires a paid subscription',
          upgrade: true,
          message: 'Upgrade to access the full archive of past questions and your answer history.',
        },
        { status: 401 }
      )
    }

    // Pagination
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1', 10)
    const perPage = parseInt(req.nextUrl.searchParams.get('per_page') || '20', 10)
    const offset = (Math.max(1, page) - 1) * Math.min(perPage, 50)
    const limit = Math.min(perPage, 50)

    const today = new Date().toISOString().slice(0, 10)

    // Fetch past questions (before today)
    const { data: questions, error: qErr, count } = await admin
      .from('questions')
      .select('*', { count: 'exact' })
      .not('published_date', 'is', null)
      .lt('published_date', today)
      .order('published_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (qErr) {
      console.error('Error fetching archive:', qErr)
      return NextResponse.json({ error: 'Failed to fetch archive' }, { status: 500 })
    }

    // Check which questions the user has answered
    const questionIds = (questions || []).map((q: any) => q.id)
    const { data: answers } = await admin
      .from('user_answers')
      .select('question_id')
      .eq('user_id', user.id)
      .in('question_id', questionIds)

    const answeredSet = new Set((answers || []).map((a: any) => a.question_id))

    const questionsWithStatus = (questions || []).map((q: any) => ({
      ...q,
      has_answered: answeredSet.has(q.id),
    }))

    return NextResponse.json({
      questions: questionsWithStatus,
      page,
      per_page: limit,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / limit),
    })
  } catch (err) {
    console.error('Unexpected error in /api/hard-question/archive:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

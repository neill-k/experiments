import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabaseFromAccessToken } from '@/lib/supabase/server'

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

async function resolveUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice(7)

  try {
    const userClient = supabaseFromAccessToken(token)
    const {
      data: { user },
    } = await userClient.auth.getUser()

    return user?.id ?? null
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    const admin = supabaseAdmin()

    // Pagination
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1', 10)
    const perPage = parseInt(req.nextUrl.searchParams.get('per_page') || '30', 10)
    const offset = (Math.max(1, page) - 1) * Math.min(perPage, 50)
    const limit = Math.min(perPage, 50)

    const today = todayUTC()

    // Fetch past questions (before today) - public, no auth required
    const { data: questions, error: qErr, count } = await admin
      .from('questions')
      .select('id, question_text, category, difficulty, published_date', { count: 'exact' })
      .not('published_date', 'is', null)
      .lt('published_date', today)
      .order('published_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (qErr) {
      console.error('Error fetching archive:', qErr)
      return NextResponse.json({ error: 'Failed to fetch archive' }, { status: 500 })
    }

    const userId = await resolveUserId(req)

    // If authenticated, check which questions the user has answered
    let answeredSet = new Set<string>()
    let practice: { available: boolean; remaining: 0 | 1; used_question_id: string | null } | null =
      null

    if (userId) {
      const questionIds = (questions || []).map((q: Record<string, unknown>) => q.id)
      if (questionIds.length > 0) {
        const { data: answers } = await admin
          .from('user_answers')
          .select('question_id')
          .eq('user_id', userId)
          .in('question_id', questionIds)

        answeredSet = new Set(
          (answers || []).map((a: Record<string, unknown>) => a.question_id as string)
        )
      }

      const { data: practiceRun } = await admin
        .from('practice_runs')
        .select('question_id')
        .eq('user_id', userId)
        .eq('practice_date', today)
        .maybeSingle()

      practice = {
        available: !practiceRun,
        remaining: practiceRun ? 0 : 1,
        used_question_id: practiceRun?.question_id ?? null,
      }
    }

    const questionsWithStatus = (questions || []).map((q: Record<string, unknown>) => ({
      ...q,
      has_answered: answeredSet.has(q.id as string),
    }))

    return NextResponse.json({
      questions: questionsWithStatus,
      page,
      per_page: limit,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / limit),
      practice,
    })
  } catch (err) {
    console.error('Unexpected error in /api/hard-question/archive:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

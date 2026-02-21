import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabaseFromAccessToken } from '@/lib/supabase/server'

const EPOCH = new Date('2026-02-17T00:00:00Z')
const DAY_MS = 1000 * 60 * 60 * 24

function getDayNumberForDate(dateString: string): number {
  const date = new Date(`${dateString}T00:00:00Z`)
  const diffMs = date.getTime() - EPOCH.getTime()
  return Math.max(0, Math.floor(diffMs / DAY_MS))
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

async function resolveUserAndTier(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { userId: null as string | null, tier: 'free' as const }
  }

  const token = authHeader.slice(7)

  try {
    const userClient = supabaseFromAccessToken(token)
    const {
      data: { user },
    } = await userClient.auth.getUser()

    if (!user) {
      return { userId: null as string | null, tier: 'free' as const }
    }

    const admin = supabaseAdmin()
    const { data: profile } = await admin
      .from('user_profiles')
      .select('tier')
      .eq('id', user.id)
      .maybeSingle()

    return {
      userId: user.id,
      tier: profile?.tier === 'paid' ? 'paid' : 'free',
    }
  } catch {
    return { userId: null as string | null, tier: 'free' as const }
  }
}

async function resolvePracticeStatus(userId: string, today: string) {
  const admin = supabaseAdmin()
  const { data: run } = await admin
    .from('practice_runs')
    .select('question_id')
    .eq('user_id', userId)
    .eq('practice_date', today)
    .maybeSingle()

  return {
    available: !run,
    remaining: run ? 0 : 1,
    used_question_id: run?.question_id ?? null,
  }
}

export async function GET(req: NextRequest) {
  try {
    const admin = supabaseAdmin()
    const today = todayUTC()
    const selectedQuestionId = req.nextUrl.searchParams.get('question_id')

    const questionQuery = admin.from('questions').select('*').not('published_date', 'is', null)

    const {
      data: question,
      error: qErr,
    } = selectedQuestionId
      ? await questionQuery.eq('id', selectedQuestionId).lte('published_date', today).maybeSingle()
      : await questionQuery.eq('published_date', today).maybeSingle()

    if (qErr && qErr.code !== 'PGRST116') {
      console.error('Error fetching question:', qErr)
      return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 })
    }

    const { userId, tier } = await resolveUserAndTier(req)

    let hasAnswered = false
    let answerId: string | null = null

    if (userId && question) {
      const { data: answer } = await admin
        .from('user_answers')
        .select('id')
        .eq('user_id', userId)
        .eq('question_id', question.id)
        .maybeSingle()

      if (answer) {
        hasAnswered = true
        answerId = answer.id
      }
    }

    const dayNumber = question?.published_date
      ? getDayNumberForDate(question.published_date)
      : getDayNumberForDate(today)

    const practice = userId ? await resolvePracticeStatus(userId, today) : null

    return NextResponse.json({
      question: question ?? null,
      has_answered: hasAnswered,
      answer_id: answerId,
      day_number: dayNumber,
      tier,
      is_today: question?.published_date === today,
      practice,
    })
  } catch (err) {
    console.error('Unexpected error in /api/hard-question/today:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

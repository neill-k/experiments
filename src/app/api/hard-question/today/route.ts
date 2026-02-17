import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabaseFromAccessToken } from '@/lib/supabase/server'

const EPOCH = new Date('2026-02-17T00:00:00Z')

function getDayNumber(): number {
  const now = new Date()
  const diffMs = now.getTime() - EPOCH.getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  try {
    const admin = supabaseAdmin()
    const today = todayUTC()

    // Fetch today's question
    const { data: question, error: qErr } = await admin
      .from('questions')
      .select('*')
      .eq('published_date', today)
      .single()

    if (qErr && qErr.code !== 'PGRST116') {
      // PGRST116 = no rows found — that's OK (no question today)
      console.error('Error fetching question:', qErr)
      return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 })
    }

    let hasAnswered = false
    let answerId: string | null = null

    // If user is authenticated, check if they've answered
    const authHeader = req.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ') && question) {
      const token = authHeader.slice(7)
      try {
        const userClient = supabaseFromAccessToken(token)
        const { data: { user } } = await userClient.auth.getUser()

        if (user) {
          const { data: answer } = await admin
            .from('user_answers')
            .select('id')
            .eq('user_id', user.id)
            .eq('question_id', question.id)
            .maybeSingle()

          if (answer) {
            hasAnswered = true
            answerId = answer.id
          }
        }
      } catch {
        // Auth failed silently — treat as unauthenticated
      }
    }

    return NextResponse.json({
      question: question ?? null,
      has_answered: hasAnswered,
      answer_id: answerId,
      day_number: getDayNumber(),
    })
  } catch (err) {
    console.error('Unexpected error in /api/hard-question/today:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

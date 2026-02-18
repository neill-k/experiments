import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit/simple'

export async function GET(req: NextRequest) {
  // Rate limit: 30 reads per minute per IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  const rl = rateLimit(`wa-leaderboard:${ip}`, { limit: 30, windowMs: 60_000 })
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', resetAt: rl.resetAt },
      { status: 429 },
    )
  }

  const dateParam = req.nextUrl.searchParams.get('date')
  const targetDate = dateParam ?? new Date().toISOString().slice(0, 10)

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    return NextResponse.json(
      { error: 'Invalid date format. Use YYYY-MM-DD.' },
      { status: 400 },
    )
  }

  const db = supabaseAdmin()

  // 1. Get the daily challenge for that date
  const { data: daily, error: dailyErr } = await db
    .from('wrong_answer_daily')
    .select('question_id')
    .eq('challenge_date', targetDate)
    .maybeSingle()

  if (dailyErr) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (!daily) {
    return NextResponse.json({
      date: targetDate,
      entries: [],
      message: 'No daily challenge found for this date',
    })
  }

  // 2. Fetch top 20 answers for that question where is_daily=true
  const { data: answers, error: ansErr } = await db
    .from('wrong_answer_answers')
    .select(
      'id, answer_text, total_score, score_conviction, score_consistency, score_comedy, score_creativity, score_plausibility, judge_commentary, user_id, created_at',
    )
    .eq('question_id', daily.question_id)
    .eq('is_daily', true)
    .order('total_score', { ascending: false })
    .limit(20)

  if (ansErr) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  const entries = (answers ?? []).map((a, idx) => ({
    rank: idx + 1,
    answer_text: a.answer_text,
    total_score: a.total_score,
    scores: {
      conviction: a.score_conviction,
      consistency: a.score_consistency,
      comedy: a.score_comedy,
      creativity: a.score_creativity,
      plausibility: a.score_plausibility,
    },
    judge_commentary: a.judge_commentary,
    user_id: a.user_id ?? null,
  }))

  return NextResponse.json({
    date: targetDate,
    question_id: daily.question_id,
    entries,
  })
}

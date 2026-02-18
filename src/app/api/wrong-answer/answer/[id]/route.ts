import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit/simple'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Rate limit: 30 reads per minute per IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  const rl = rateLimit(`wa-answer-get:${ip}`, { limit: 30, windowMs: 60_000 })
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', resetAt: rl.resetAt },
      { status: 429 },
    )
  }

  const { id } = await params

  // Validate UUID format loosely
  if (!id || id.length < 10) {
    return NextResponse.json({ error: 'Invalid answer ID' }, { status: 400 })
  }

  const db = supabaseAdmin()

  const { data: answer, error: ansErr } = await db
    .from('wrong_answer_answers')
    .select(
      'id, answer_text, total_score, score_conviction, score_consistency, score_comedy, score_creativity, score_plausibility, judge_commentary, created_at, question_id',
    )
    .eq('id', id)
    .maybeSingle()

  if (ansErr) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (!answer) {
    return NextResponse.json({ error: 'Answer not found' }, { status: 404 })
  }

  // Fetch the associated question
  const { data: question, error: qErr } = await db
    .from('wrong_answer_questions')
    .select('id, text, correct_answer, category')
    .eq('id', answer.question_id)
    .maybeSingle()

  if (qErr || !question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  }

  return NextResponse.json({
    answer: {
      id: answer.id,
      answer_text: answer.answer_text,
      total_score: answer.total_score,
      scores: {
        conviction: answer.score_conviction,
        consistency: answer.score_consistency,
        comedy: answer.score_comedy,
        creativity: answer.score_creativity,
        plausibility: answer.score_plausibility,
      },
      judge_commentary: answer.judge_commentary,
      created_at: answer.created_at,
    },
    question: {
      id: question.id,
      text: question.text,
      correct_answer: question.correct_answer,
      category: question.category,
    },
  })
}

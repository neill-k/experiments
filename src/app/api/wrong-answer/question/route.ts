import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit/simple'

export async function GET(req: NextRequest) {
  // Rate limit: 30 reads per minute per IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  const rl = rateLimit(`wa-question:${ip}`, { limit: 30, windowMs: 60_000 })
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', resetAt: rl.resetAt },
      { status: 429 },
    )
  }

  const mode = req.nextUrl.searchParams.get('mode') ?? 'random'
  const db = supabaseAdmin()

  if (mode === 'daily') {
    return handleDaily(db)
  }

  return handleRandom(db)
}

// ── daily ──────────────────────────────────────────────────────
async function handleDaily(
  db: ReturnType<typeof supabaseAdmin>,
) {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD UTC

  // Check if today already has a daily challenge
  const { data: existing, error: fetchErr } = await db
    .from('wrong_answer_daily')
    .select('question_id, wrong_answer_questions(*)')
    .eq('challenge_date', today)
    .maybeSingle()

  if (fetchErr) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (existing) {
    const q = existing.wrong_answer_questions as unknown as Record<string, unknown>
    return NextResponse.json({
      id: q.id,
      text: q.text,
      correct_answer: q.correct_answer,
      category: q.category,
    })
  }

  // Pick a question that has never been used as a daily
  const { data: usedIds } = await db
    .from('wrong_answer_daily')
    .select('question_id')

  const usedSet = new Set((usedIds ?? []).map((r) => r.question_id))

  const { data: candidates, error: candErr } = await db
    .from('wrong_answer_questions')
    .select('*')
    .limit(200)

  if (candErr || !candidates || candidates.length === 0) {
    return NextResponse.json(
      { error: 'No questions available' },
      { status: 404 },
    )
  }

  const unused = candidates.filter((q) => !usedSet.has(q.id))
  const pool = unused.length > 0 ? unused : candidates
  const picked = pool[Math.floor(Math.random() * pool.length)]

  // Insert the daily entry
  const { error: insertErr } = await db.from('wrong_answer_daily').insert({
    question_id: picked.id,
    challenge_date: today,
  })

  if (insertErr) {
    // Race condition: another request may have inserted already; retry read
    const { data: retry } = await db
      .from('wrong_answer_daily')
      .select('question_id, wrong_answer_questions(*)')
      .eq('challenge_date', today)
      .maybeSingle()

    if (retry) {
      const q = retry.wrong_answer_questions as unknown as Record<string, unknown>
      return NextResponse.json({
        id: q.id,
        text: q.text,
        correct_answer: q.correct_answer,
        category: q.category,
      })
    }

    return NextResponse.json({ error: 'Failed to create daily' }, { status: 500 })
  }

  return NextResponse.json({
    id: picked.id,
    text: picked.text,
    correct_answer: picked.correct_answer,
    category: picked.category,
  })
}

// ── random ─────────────────────────────────────────────────────
async function handleRandom(
  db: ReturnType<typeof supabaseAdmin>,
) {
  const { data: batch, error } = await db
    .from('wrong_answer_questions')
    .select('*')
    .order('id', { ascending: false })
    .limit(50)

  if (error || !batch || batch.length === 0) {
    return NextResponse.json(
      { error: 'No questions available' },
      { status: 404 },
    )
  }

  const picked = batch[Math.floor(Math.random() * batch.length)]

  return NextResponse.json({
    id: picked.id,
    text: picked.text,
    correct_answer: picked.correct_answer,
    category: picked.category,
  })
}

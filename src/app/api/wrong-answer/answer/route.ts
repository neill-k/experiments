import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabaseAdmin, supabaseFromAccessToken } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit/simple'

// ── lazy-init OpenAI client ────────────────────────────────────
let _openai: OpenAI | null = null
function getOpenAI(): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _openai
}

// ── POST /api/wrong-answer/answer ──────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Parse body
  let body: {
    question_id?: string
    answer_text?: string
    is_daily?: boolean
    fingerprint?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { question_id, answer_text, is_daily, fingerprint } = body

  // 2. Validate
  if (!question_id) {
    return NextResponse.json({ error: 'question_id is required' }, { status: 400 })
  }
  if (
    !answer_text ||
    typeof answer_text !== 'string' ||
    answer_text.trim().length < 1 ||
    answer_text.length > 500
  ) {
    return NextResponse.json(
      { error: 'answer_text must be between 1 and 500 characters' },
      { status: 400 },
    )
  }

  // 3. Rate limit: 5 answers per 5 minutes per IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  const rl = rateLimit(`wa-answer:${ip}`, { limit: 5, windowMs: 5 * 60_000 })
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.', resetAt: rl.resetAt },
      { status: 429 },
    )
  }

  // 4. Auth check (optional)
  let userId: string | null = null
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const userClient = supabaseFromAccessToken(token)
    const {
      data: { user },
    } = await userClient.auth.getUser()
    if (user) {
      userId = user.id
    }
  }

  const db = supabaseAdmin()

  // 5. If daily + authenticated, check for duplicate
  if (is_daily && userId) {
    const { data: dup } = await db
      .from('wrong_answer_answers')
      .select('id')
      .eq('question_id', question_id)
      .eq('user_id', userId)
      .eq('is_daily', true)
      .maybeSingle()

    if (dup) {
      return NextResponse.json(
        { error: 'You already answered today\'s daily challenge' },
        { status: 409 },
      )
    }
  }

  // 6. Fetch the question to get the correct answer
  const { data: question, error: qErr } = await db
    .from('wrong_answer_questions')
    .select('id, text, correct_answer')
    .eq('id', question_id)
    .maybeSingle()

  if (qErr || !question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  }

  // 7. Call OpenAI to score the answer
  const scores = await scoreAnswer(
    question.text as string,
    question.correct_answer as string,
    answer_text.trim(),
  )

  if (!scores) {
    return NextResponse.json(
      { error: 'Scoring service unavailable. Please try again.' },
      { status: 502 },
    )
  }

  const totalScore =
    scores.conviction +
    scores.consistency +
    scores.comedy +
    scores.creativity +
    scores.plausibility

  // 8. Insert into DB
  const { data: inserted, error: insertErr } = await db
    .from('wrong_answer_answers')
    .insert({
      question_id,
      user_id: userId,
      fingerprint: fingerprint ?? null,
      answer_text: answer_text.trim(),
      score_conviction: scores.conviction,
      score_consistency: scores.consistency,
      score_comedy: scores.comedy,
      score_creativity: scores.creativity,
      score_plausibility: scores.plausibility,
      total_score: totalScore,
      judge_commentary: scores.commentary,
      is_daily: is_daily ?? false,
    })
    .select('id')
    .single()

  if (insertErr) {
    // Could be a duplicate constraint violation
    if (insertErr.code === '23505') {
      return NextResponse.json(
        { error: 'You already answered this question' },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 })
  }

  return NextResponse.json({
    id: inserted.id,
    scores: {
      conviction: scores.conviction,
      consistency: scores.consistency,
      comedy: scores.comedy,
      creativity: scores.creativity,
      plausibility: scores.plausibility,
    },
    total_score: totalScore,
    judge_commentary: scores.commentary,
  })
}

// ── scoring via OpenAI ─────────────────────────────────────────
interface ScoreResult {
  conviction: number
  consistency: number
  comedy: number
  creativity: number
  plausibility: number
  commentary: string
}

async function scoreAnswer(
  questionText: string,
  correctAnswer: string,
  playerAnswer: string,
): Promise<ScoreResult | null> {
  const prompt = `You are the Judge of The Wrong Answer, a quiz game where players compete to give the most creative, convincing, and hilarious wrong answers.

QUESTION: ${questionText}
CORRECT ANSWER: ${correctAnswer}
PLAYER'S ANSWER: ${playerAnswer}

Score this wrong answer on five dimensions (0-20 each):

1. CONVICTION: Does it sound confident and authoritative? Is it stated as fact?
2. CONSISTENCY: Does the internal logic hold up? Is the wrong reasoning coherent?
3. COMEDY: Is it genuinely funny, absurd, or delightful?
4. CREATIVITY: Is it an unexpected angle? Would most people not think of this?
5. PLAUSIBILITY: Could this fool someone unfamiliar with the topic?

IMPORTANT RULES:
- If the answer is actually correct (or very close to correct), give ALL zeros. Being right is the worst possible outcome.
- Short, lazy answers ("idk", "42", single words with no creativity) should score very low.
- Reward effort, specificity, and commitment to the bit.
- Be generous to genuinely creative attempts even if they're not perfect.

Return ONLY valid JSON (no markdown, no explanation):
{
  "conviction": <0-20>,
  "consistency": <0-20>,
  "comedy": <0-20>,
  "creativity": <0-20>,
  "plausibility": <0-20>,
  "commentary": "<A witty one-liner judge's remark about this answer, 1-2 sentences max>"
}`

  try {
    const openai = getOpenAI()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
    })

    const raw = completion.choices[0]?.message?.content?.trim()
    if (!raw) return null

    const parsed = JSON.parse(raw) as ScoreResult

    // Clamp values to 0-20
    const clamp = (v: unknown): number =>
      Math.max(0, Math.min(20, Math.round(Number(v) || 0)))

    return {
      conviction: clamp(parsed.conviction),
      consistency: clamp(parsed.consistency),
      comedy: clamp(parsed.comedy),
      creativity: clamp(parsed.creativity),
      plausibility: clamp(parsed.plausibility),
      commentary:
        typeof parsed.commentary === 'string'
          ? parsed.commentary.slice(0, 500)
          : 'The judge is speechless.',
    }
  } catch (err) {
    console.error('[wrong-answer] OpenAI scoring error:', err)
    return null
  }
}

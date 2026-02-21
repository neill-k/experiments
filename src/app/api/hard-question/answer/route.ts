import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabaseFromAccessToken } from '@/lib/supabase/server'
import { computeEmbedding } from '@/lib/openai'

type UserContext = {
  userId: string | null
  tier: 'free' | 'paid'
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

async function resolveUserContext(req: NextRequest): Promise<UserContext> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { userId: null, tier: 'free' }
  }

  const token = authHeader.slice(7)

  try {
    const userClient = supabaseFromAccessToken(token)
    const {
      data: { user },
    } = await userClient.auth.getUser()

    if (!user) {
      return { userId: null, tier: 'free' }
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
    return { userId: null, tier: 'free' }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, tier } = await resolveUserContext(req)

    const body = await req.json().catch(() => null)
    const questionId = body?.question_id
    const answerTextRaw = body?.answer_text
    const practiceMode = body?.practice_mode === true

    if (typeof questionId !== 'string' || typeof answerTextRaw !== 'string') {
      return NextResponse.json(
        { error: 'question_id and answer_text are required' },
        { status: 400 }
      )
    }

    const answerText = answerTextRaw.trim()
    if (!answerText) {
      return NextResponse.json({ error: 'answer_text cannot be empty' }, { status: 400 })
    }

    const admin = supabaseAdmin()
    const today = todayUTC()

    // Ensure question exists and mode is compatible with question date.
    const { data: question, error: questionErr } = await admin
      .from('questions')
      .select('id, published_date')
      .eq('id', questionId)
      .maybeSingle()

    if (questionErr) {
      console.error('Error fetching question for submission:', questionErr)
      return NextResponse.json({ error: 'Failed to validate question' }, { status: 500 })
    }

    if (!question || !question.published_date) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    const isTodayQuestion = question.published_date === today

    if (!practiceMode && !isTodayQuestion) {
      return NextResponse.json(
        { error: 'Archive questions can only be submitted in Practice Mode' },
        { status: 400 }
      )
    }

    if (practiceMode && isTodayQuestion) {
      return NextResponse.json(
        { error: 'Practice Mode is only available for archive questions' },
        { status: 400 }
      )
    }

    if (practiceMode && userId) {
      const { data: existingPractice } = await admin
        .from('practice_runs')
        .select('question_id')
        .eq('user_id', userId)
        .eq('practice_date', today)
        .maybeSingle()

      if (existingPractice) {
        return NextResponse.json(
          {
            error: 'You have already used Practice Mode today',
            used_question_id: existingPractice.question_id,
          },
          { status: 429 }
        )
      }
    }

    if (userId && !practiceMode) {
      const { data: existing } = await admin
        .from('user_answers')
        .select('id')
        .eq('user_id', userId)
        .eq('question_id', questionId)
        .maybeSingle()

      if (existing) {
        return NextResponse.json(
          { error: 'You have already answered this question' },
          { status: 409 }
        )
      }
    }

    // Compute embedding for the user's answer.
    const embedding = await computeEmbedding(answerText)

    // Persist ranked answer only (practice runs are intentionally unranked).
    let answerId: string | null = null
    if (userId && !practiceMode) {
      const { data: answer, error: insertErr } = await admin
        .from('user_answers')
        .insert({
          user_id: userId,
          question_id: questionId,
          answer_text: answerText,
          embedding: JSON.stringify(embedding),
        })
        .select('id')
        .single()

      if (insertErr || !answer) {
        console.error('Error inserting answer:', insertErr)
        // Non-fatal for matching; continue without persistence.
      } else {
        answerId = answer.id
      }
    }

    // Match against question-specific perspectives.
    const { data: matches, error: matchErr } = await admin.rpc('match_perspectives', {
      p_answer_embedding: JSON.stringify(embedding),
      p_question_id: questionId,
      p_match_count: 10,
    })

    if (matchErr) {
      console.error('Error matching perspectives:', matchErr)
      return NextResponse.json({ error: 'Failed to compute similarities' }, { status: 500 })
    }

    // Match against full philosopher corpus (top passage per philosopher, top 5).
    const { data: corpusMatches, error: corpusErr } = await admin.rpc('match_corpus_by_philosopher', {
      p_answer_embedding: JSON.stringify(embedding),
      p_top_n: 5,
    })

    if (corpusErr) {
      console.error('Error matching corpus:', corpusErr)
      // Non-fatal: continue without corpus matches
    }

    // Fetch source field for each perspective.
    const perspectiveIds = (matches || []).map((m: { perspective_id: string }) => m.perspective_id)
    const { data: perspectiveSources } = await admin
      .from('philosopher_perspectives')
      .select('id, source')
      .in('id', perspectiveIds)

    const sourceMap = new Map(
      (perspectiveSources || []).map((p: { id: string; source: string | null }) => [p.id, p.source])
    )

    // Build similarity results + persist score/fingerprint only for ranked answers.
    const similarities = []
    for (const match of matches || []) {
      if (userId && answerId && !practiceMode) {
        const { error: scoreErr } = await admin
          .from('similarity_scores')
          .insert({
            user_answer_id: answerId,
            perspective_id: match.perspective_id,
            score: match.similarity,
            school: match.school,
          })

        if (scoreErr) {
          console.error('Error inserting similarity score:', scoreErr)
        }

        const { error: fpErr } = await admin.rpc('update_fingerprint', {
          p_user_id: userId,
          p_school: match.school,
          p_new_score: match.similarity,
        })

        if (fpErr) {
          console.error('Error updating fingerprint:', fpErr)
        }
      }

      similarities.push({
        perspective_id: match.perspective_id,
        philosopher_name: match.philosopher_name,
        school: match.school,
        perspective_text: match.perspective_text,
        summary: match.summary,
        source: sourceMap.get(match.perspective_id) ?? null,
        similarity: match.similarity,
      })
    }

    // Increment questions_answered only for ranked answers.
    if (userId && answerId && !practiceMode) {
      const { data: profile } = await admin
        .from('user_profiles')
        .select('questions_answered')
        .eq('id', userId)
        .single()

      if (profile) {
        await admin
          .from('user_profiles')
          .update({ questions_answered: (profile.questions_answered || 0) + 1 })
          .eq('id', userId)
      }
    }

    // Record authenticated practice usage once the run succeeds.
    if (practiceMode && userId) {
      const { error: practiceErr } = await admin.from('practice_runs').insert({
        user_id: userId,
        question_id: questionId,
        practice_date: today,
      })

      if (practiceErr) {
        if (practiceErr.code === '23505') {
          return NextResponse.json(
            { error: 'You have already used Practice Mode today' },
            { status: 429 }
          )
        }

        console.error('Error recording practice run:', practiceErr)
      }
    }

    const corpusResults = (corpusMatches || []).map((m: {
      corpus_id: string
      philosopher: string
      school: string
      work: string
      section: string | null
      passage_text: string
      similarity: number
    }) => ({
      corpus_id: m.corpus_id,
      philosopher: m.philosopher,
      school: m.school,
      work: m.work,
      section: m.section,
      passage_text: m.passage_text,
      similarity: m.similarity,
    }))

    return NextResponse.json({
      answer_id: answerId,
      similarities,
      corpus_matches: corpusResults,
      saved: !!answerId,
      tier,
      practice_mode: practiceMode,
      ranked: !practiceMode,
    })
  } catch (err) {
    console.error('Unexpected error in /api/hard-question/answer:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

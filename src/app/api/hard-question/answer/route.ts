import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabaseFromAccessToken } from '@/lib/supabase/server'
import { computeEmbedding } from '@/lib/openai'

export async function POST(req: NextRequest) {
  try {
    // 1. Try to authenticate (optional - anonymous users can still get results)
    let userId: string | null = null
    const authHeader = req.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      const userClient = supabaseFromAccessToken(token)
      const { data: { user } } = await userClient.auth.getUser()
      if (user) userId = user.id
    }

    // 2. Parse request body
    const body = await req.json()
    const { question_id, answer_text } = body

    if (!question_id || !answer_text) {
      return NextResponse.json(
        { error: 'question_id and answer_text are required' },
        { status: 400 }
      )
    }

    const admin = supabaseAdmin()

    // 3. If logged in, check for duplicate answer
    if (userId) {
      const { data: existing } = await admin
        .from('user_answers')
        .select('id')
        .eq('user_id', userId)
        .eq('question_id', question_id)
        .maybeSingle()

      if (existing) {
        return NextResponse.json(
          { error: 'You have already answered this question' },
          { status: 409 }
        )
      }
    }

    // 4. Compute embedding for the user's answer
    const embedding = await computeEmbedding(answer_text)

    // 5. If logged in, save the answer to the database
    let answerId: string | null = null
    if (userId) {
      const { data: answer, error: insertErr } = await admin
        .from('user_answers')
        .insert({
          user_id: userId,
          question_id,
          answer_text,
          embedding: JSON.stringify(embedding),
        })
        .select('id')
        .single()

      if (insertErr || !answer) {
        console.error('Error inserting answer:', insertErr)
        // Non-fatal for the matching - continue without saving
      } else {
        answerId = answer.id
      }
    }

    // 6. Match perspectives using the SQL function (question-specific)
    const { data: matches, error: matchErr } = await admin.rpc('match_perspectives', {
      p_answer_embedding: JSON.stringify(embedding),
      p_question_id: question_id,
      p_match_count: 10,
    })

    if (matchErr) {
      console.error('Error matching perspectives:', matchErr)
      return NextResponse.json({ error: 'Failed to compute similarities' }, { status: 500 })
    }

    // 6b. Match against full philosopher corpus (top passage per philosopher, top 5)
    const { data: corpusMatches, error: corpusErr } = await admin.rpc('match_corpus_by_philosopher', {
      p_answer_embedding: JSON.stringify(embedding),
      p_top_n: 5,
    })

    if (corpusErr) {
      console.error('Error matching corpus:', corpusErr)
      // Non-fatal: continue without corpus matches
    }

    // 7. Fetch source field for each perspective
    const perspectiveIds = (matches || []).map((m: { perspective_id: string }) => m.perspective_id)
    const { data: perspectiveSources } = await admin
      .from('philosopher_perspectives')
      .select('id, source')
      .in('id', perspectiveIds)

    const sourceMap = new Map(
      (perspectiveSources || []).map((p: { id: string; source: string | null }) => [p.id, p.source])
    )

    // 8. Build similarity results + save scores/fingerprint if logged in
    const similarities = []
    for (const match of matches || []) {
      // If logged in and answer was saved, persist scores and update fingerprint
      if (userId && answerId) {
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

    // 9. Increment questions_answered on user profile (if logged in)
    if (userId && answerId) {
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

    // 10. Build corpus match results
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
    })
  } catch (err) {
    console.error('Unexpected error in /api/hard-question/answer:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabaseFromAccessToken } from '@/lib/supabase/server'
import { computeEmbedding } from '@/lib/openai'

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
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

    // 3. Check if user already answered this question
    const { data: existing } = await admin
      .from('user_answers')
      .select('id')
      .eq('user_id', user.id)
      .eq('question_id', question_id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'You have already answered this question' },
        { status: 409 }
      )
    }

    // 4. Compute embedding for the user's answer
    const embedding = await computeEmbedding(answer_text)

    // 5. Insert user answer with embedding
    const { data: answer, error: insertErr } = await admin
      .from('user_answers')
      .insert({
        user_id: user.id,
        question_id,
        answer_text,
        embedding: JSON.stringify(embedding),
      })
      .select('id')
      .single()

    if (insertErr || !answer) {
      console.error('Error inserting answer:', insertErr)
      return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 })
    }

    // 6. Match perspectives using the SQL function
    const { data: matches, error: matchErr } = await admin.rpc('match_perspectives', {
      p_answer_embedding: JSON.stringify(embedding),
      p_question_id: question_id,
      p_match_count: 10, // get all perspectives for the question
    })

    if (matchErr) {
      console.error('Error matching perspectives:', matchErr)
      return NextResponse.json({ error: 'Failed to compute similarities' }, { status: 500 })
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

    // 8. Insert similarity scores and update fingerprints
    const similarities = []
    for (const match of matches || []) {
      // Insert similarity score
      const { error: scoreErr } = await admin
        .from('similarity_scores')
        .insert({
          user_answer_id: answer.id,
          perspective_id: match.perspective_id,
          score: match.similarity,
          school: match.school,
        })

      if (scoreErr) {
        console.error('Error inserting similarity score:', scoreErr)
      }

      // Update philosophical fingerprint
      const { error: fpErr } = await admin.rpc('update_fingerprint', {
        p_user_id: user.id,
        p_school: match.school,
        p_new_score: match.similarity,
      })

      if (fpErr) {
        console.error('Error updating fingerprint:', fpErr)
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

    // 9. Increment questions_answered on user profile
    const { data: profile } = await admin
      .from('user_profiles')
      .select('questions_answered')
      .eq('id', user.id)
      .single()

    if (profile) {
      await admin
        .from('user_profiles')
        .update({ questions_answered: (profile.questions_answered || 0) + 1 })
        .eq('id', user.id)
    }

    return NextResponse.json({
      answer_id: answer.id,
      similarities,
    })
  } catch (err) {
    console.error('Unexpected error in /api/hard-question/answer:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabaseFromAccessToken } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const questionId = req.nextUrl.searchParams.get('question_id')

    if (!questionId) {
      return NextResponse.json(
        { error: 'question_id query parameter is required' },
        { status: 400 }
      )
    }

    const admin = supabaseAdmin()

    // Determine user tier
    let userId: string | null = null
    let tier: 'free' | 'paid' = 'free'

    const authHeader = req.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      try {
        const userClient = supabaseFromAccessToken(token)
        const {
          data: { user },
        } = await userClient.auth.getUser()

        if (user) {
          userId = user.id

          const { data: profile } = await admin
            .from('user_profiles')
            .select('tier')
            .eq('id', user.id)
            .maybeSingle()

          if (profile?.tier === 'paid') {
            tier = 'paid'
          }
        }
      } catch {
        // Auth failed - treat as free tier
      }
    }

    // If user is authenticated, fetch their answer and similarity scores.
    if (userId) {
      const { data: answer } = await admin
        .from('user_answers')
        .select('id, embedding')
        .eq('user_id', userId)
        .eq('question_id', questionId)
        .maybeSingle()

      if (!answer) {
        return NextResponse.json(
          { error: 'You must answer the question before viewing perspectives' },
          { status: 403 }
        )
      }

      // Fetch similarity scores with perspective details.
      const { data: scores, error: scoresErr } = await admin
        .from('similarity_scores')
        .select(`
          score,
          perspective_id,
          school,
          philosopher_perspectives (
            id,
            philosopher_name,
            school,
            perspective_text,
            summary,
            source,
            sort_order
          )
        `)
        .eq('user_answer_id', answer.id)
        .order('score', { ascending: false })

      if (scoresErr) {
        console.error('Error fetching scores:', scoresErr)
        return NextResponse.json({ error: 'Failed to fetch perspectives' }, { status: 500 })
      }

      const mappedPerspectives = (scores || []).map((s: any) => ({
        perspective_id: s.perspective_id,
        philosopher_name: s.philosopher_perspectives.philosopher_name,
        school: s.philosopher_perspectives.school,
        perspective_text: s.philosopher_perspectives.perspective_text,
        summary: s.philosopher_perspectives.summary,
        source: s.philosopher_perspectives.source ?? null,
        similarity: s.score,
      }))

      // Returning-user corpus matches: reuse stored answer embedding.
      let corpusMatches: Array<{
        corpus_id: string
        philosopher: string
        school: string
        work: string
        section: string | null
        passage_text: string
        similarity: number
      }> = []

      if (answer.embedding) {
        const embeddingParam =
          typeof answer.embedding === 'string'
            ? answer.embedding
            : JSON.stringify(answer.embedding)

        const { data: corpusData, error: corpusErr } = await admin.rpc(
          'match_corpus_by_philosopher',
          {
            p_answer_embedding: embeddingParam,
            p_top_n: 5,
          }
        )

        if (corpusErr) {
          console.error('Error fetching returning-user corpus matches:', corpusErr)
        } else {
          corpusMatches = (corpusData || []).map((m: any) => ({
            corpus_id: m.corpus_id,
            philosopher: m.philosopher,
            school: m.school,
            work: m.work,
            section: m.section,
            passage_text: m.passage_text,
            similarity: m.similarity,
          }))
        }
      }

      const perspectives = tier === 'free' ? mappedPerspectives.slice(0, 1) : mappedPerspectives

      return NextResponse.json({
        perspectives,
        corpus_matches: corpusMatches,
        tier,
        total_count: mappedPerspectives.length,
      })
    }

    // Not authenticated: return basic perspective info without scores.
    const { data: perspectives, error: perspErr } = await admin
      .from('philosopher_perspectives')
      .select('id, philosopher_name, school, summary, source, sort_order')
      .eq('question_id', questionId)
      .order('sort_order')

    if (perspErr) {
      console.error('Error fetching perspectives:', perspErr)
      return NextResponse.json({ error: 'Failed to fetch perspectives' }, { status: 500 })
    }

    // Unauthenticated: only show first perspective summary (teaser).
    return NextResponse.json({
      perspectives: (perspectives || []).slice(0, 1).map((p: any) => ({
        perspective_id: p.id,
        philosopher_name: p.philosopher_name,
        school: p.school,
        perspective_text: '',
        summary: p.summary,
        source: p.source ?? null,
        similarity: 0,
      })),
      corpus_matches: [],
      tier: 'free',
      total_count: (perspectives || []).length,
    })
  } catch (err) {
    console.error('Unexpected error in /api/hard-question/perspectives:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

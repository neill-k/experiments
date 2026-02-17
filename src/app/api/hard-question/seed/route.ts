import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { computeEmbedding } from '@/lib/openai'
import type { SeedQuestion } from '@/app/e/hard-question/lib/types'

export async function POST(req: NextRequest) {
  try {
    // Admin-only: check for service role key or admin authorization
    const authHeader = req.headers.get('authorization')
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!authHeader?.startsWith('Bearer ') || authHeader.slice(7) !== serviceRoleKey) {
      return NextResponse.json(
        { error: 'Admin access required. Provide service role key as Bearer token.' },
        { status: 403 }
      )
    }

    // Dynamically import seed data
    let seedQuestions: SeedQuestion[]
    try {
      const seedModule = await import('@/app/e/hard-question/data/seed-questions')
      seedQuestions = seedModule.seedQuestions
    } catch (importErr) {
      console.error('Error importing seed data:', importErr)
      return NextResponse.json(
        { error: 'Seed data file not found at @/app/e/hard-question/data/seed-questions' },
        { status: 404 }
      )
    }

    if (!seedQuestions || seedQuestions.length === 0) {
      return NextResponse.json({ error: 'No seed questions found' }, { status: 400 })
    }

    const admin = supabaseAdmin()
    const results: {
      question_text: string
      status: 'created' | 'skipped' | 'error'
      error?: string
      perspectives_created?: number
    }[] = []

    // Parse optional start_date from body, default to 2026-02-17
    let body: { start_date?: string } = {}
    try {
      body = await req.json()
    } catch {
      // No body or invalid JSON — use defaults
    }

    const startDate = new Date(body.start_date || '2026-02-17')

    for (let i = 0; i < seedQuestions.length; i++) {
      const sq = seedQuestions[i]

      // Calculate published_date: startDate + i days
      const publishedDate = new Date(startDate)
      publishedDate.setUTCDate(publishedDate.getUTCDate() + i)
      const dateStr = publishedDate.toISOString().slice(0, 10)

      try {
        // Insert question
        const { data: question, error: qErr } = await admin
          .from('questions')
          .upsert(
            {
              question_text: sq.question_text,
              context: sq.context,
              category: sq.category,
              difficulty: sq.difficulty,
              published_date: dateStr,
            },
            { onConflict: 'published_date' }
          )
          .select('id')
          .single()

        if (qErr || !question) {
          results.push({
            question_text: sq.question_text,
            status: 'error',
            error: qErr?.message || 'Failed to insert question',
          })
          continue
        }

        // Insert perspectives with computed embeddings
        let perspectivesCreated = 0
        for (const sp of sq.perspectives) {
          try {
            // Compute embedding for the perspective text
            const embedding = await computeEmbedding(sp.perspective_text)

            const { error: pErr } = await admin
              .from('philosopher_perspectives')
              .upsert(
                {
                  question_id: question.id,
                  philosopher_name: sp.philosopher_name,
                  school: sp.school,
                  perspective_text: sp.perspective_text,
                  summary: sp.summary,
                  source: sp.source,
                  sort_order: sp.sort_order,
                  embedding: JSON.stringify(embedding),
                },
                { onConflict: 'question_id,philosopher_name' }
              )

            if (pErr) {
              console.error(
                `Error inserting perspective ${sp.philosopher_name} for "${sq.question_text}":`,
                pErr
              )
            } else {
              perspectivesCreated++
            }
          } catch (embErr) {
            console.error(
              `Error computing embedding for ${sp.philosopher_name}:`,
              embErr
            )
          }
        }

        results.push({
          question_text: sq.question_text,
          status: 'created',
          perspectives_created: perspectivesCreated,
        })
      } catch (questionErr) {
        results.push({
          question_text: sq.question_text,
          status: 'error',
          error: questionErr instanceof Error ? questionErr.message : 'Unknown error',
        })
      }
    }

    const created = results.filter((r) => r.status === 'created').length
    const errors = results.filter((r) => r.status === 'error').length

    return NextResponse.json({
      message: `Seeded ${created} questions (${errors} errors)`,
      total: seedQuestions.length,
      created,
      errors,
      results,
    })
  } catch (err) {
    console.error('Unexpected error in /api/hard-question/seed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

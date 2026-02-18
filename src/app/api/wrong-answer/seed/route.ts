import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { seedQuestions } from '@/app/e/wrong-answer/data/seed-questions'

export async function POST() {
  const db = supabaseAdmin()

  const rows = seedQuestions.map((q) => ({
    text: q.text,
    correct_answer: q.correct_answer,
    category: q.category,
    difficulty: q.difficulty,
  }))

  const { data, error } = await db
    .from('wrong_answer_questions')
    .insert(rows)
    .select('id')

  if (error) {
    console.error('[wrong-answer] Seed error:', error)
    return NextResponse.json(
      { error: 'Failed to seed questions', details: error.message },
      { status: 500 },
    )
  }

  return NextResponse.json({ inserted: data.length })
}

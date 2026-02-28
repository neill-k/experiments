import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const problemSlug = searchParams.get('problem')
  const sortBy = searchParams.get('sort') ?? 'total_score'
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100)

  const db = supabaseAdmin()

  // Validate sort column
  const validSorts = ['total_score', 'computational_waste', 'overengineering', 'style_points', 'upvotes', 'i_hate_this_count', 'would_pass_review']
  const sortColumn = validSorts.includes(sortBy) ? sortBy : 'total_score'

  let query = db
    .from('ono_solutions')
    .select(`
      id, problem_id, github_username, github_repo_url,
      total_score, computational_waste, overengineering, style_points,
      loc, execution_time_ms, peak_memory_bytes,
      upvotes, i_hate_this_count, would_pass_review,
      created_at
    `)
    .eq('all_tests_passed', true)
    .order(sortColumn, { ascending: false })
    .limit(limit)

  // Filter by problem if specified
  if (problemSlug) {
    const { data: problem } = await db
      .from('ono_problems')
      .select('id')
      .eq('slug', problemSlug)
      .single()

    if (problem) {
      query = query.eq('problem_id', problem.id)
    }
  }

  const { data: solutions, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ solutions: solutions ?? [] })
}

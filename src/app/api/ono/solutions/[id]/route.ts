import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const db = supabaseAdmin()

  const { data: solution, error } = await db
    .from('ono_solutions')
    .select(`
      id, problem_id, github_username, github_repo_url, source_code,
      all_tests_passed, test_results,
      total_score, computational_waste, overengineering, style_points,
      execution_time_ms, peak_memory_bytes,
      loc, num_functions, num_classes, num_imports,
      avg_name_length, long_names_count, comment_lines, total_lines,
      upvotes, i_hate_this_count, would_pass_review,
      execution_error, created_at
    `)
    .eq('id', id)
    .eq('all_tests_passed', true)
    .single()

  if (error || !solution) {
    return NextResponse.json({ error: 'Solution not found' }, { status: 404 })
  }

  // Fetch the problem info
  const { data: problem } = await db
    .from('ono_problems')
    .select('slug, title, function_name, optimal_loc, optimal_time_ms, optimal_memory_bytes')
    .eq('id', solution.problem_id)
    .single()

  return NextResponse.json({ solution, problem })
}

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const db = supabaseAdmin()

  const { data: problem, error } = await db
    .from('ono_problems')
    .select('id, slug, title, description, constraints, category, difficulty, function_name, function_sig, test_cases, optimal_loc, optimal_time_ms, optimal_memory_bytes, created_at')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !problem) {
    return NextResponse.json({ error: 'Problem not found' }, { status: 404 })
  }

  // Fetch top solutions for this problem
  const { data: solutions } = await db
    .from('ono_solutions')
    .select('id, github_username, github_repo_url, total_score, computational_waste, overengineering, style_points, loc, execution_time_ms, peak_memory_bytes, upvotes, i_hate_this_count, would_pass_review, created_at')
    .eq('problem_id', problem.id)
    .eq('all_tests_passed', true)
    .order('total_score', { ascending: false })
    .limit(20)

  // Hide test case expected outputs — only show inputs for unsolved
  const publicTestCases = (problem.test_cases as { input: unknown[]; expected: unknown }[]).map(
    (tc, i) => ({
      index: i,
      input: tc.input,
      // Show expected for the first 2 test cases only
      expected: i < 2 ? tc.expected : '???',
    }),
  )

  return NextResponse.json({
    problem: { ...problem, test_cases: publicTestCases },
    solutions: solutions ?? [],
  })
}

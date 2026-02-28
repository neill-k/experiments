import { NextResponse } from 'next/server'
import { supabaseAdmin, supabaseFromAccessToken } from '@/lib/supabase/server'
import { fetchSolutionFromRepo } from '@/lib/ono/github'
import { executeSolution } from '@/lib/ono/sandbox'
import { computeScore } from '@/lib/ono/scorer'

export async function POST(req: Request) {
  // Auth check
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const userClient = supabaseFromAccessToken(token)
  const { data: { user }, error: authErr } = await userClient.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }

  const body = await req.json()
  const { problemSlug, repoUrl } = body as { problemSlug?: string; repoUrl?: string }

  if (!problemSlug || !repoUrl) {
    return NextResponse.json(
      { error: 'Missing problemSlug or repoUrl' },
      { status: 400 },
    )
  }

  const db = supabaseAdmin()

  // Fetch the problem
  const { data: problem, error: probErr } = await db
    .from('ono_problems')
    .select('*')
    .eq('slug', problemSlug)
    .eq('is_active', true)
    .single()

  if (probErr || !problem) {
    return NextResponse.json({ error: 'Problem not found' }, { status: 404 })
  }

  // Fetch solution code from GitHub
  const fetchResult = await fetchSolutionFromRepo(repoUrl)
  if ('error' in fetchResult) {
    return NextResponse.json({ error: fetchResult.error }, { status: 400 })
  }

  const { code, username } = fetchResult

  // Basic validation
  if (code.length > 100_000) {
    return NextResponse.json(
      { error: 'Solution exceeds 100KB. Even we have limits.' },
      { status: 400 },
    )
  }

  // Execute the solution in a sandbox
  const execResult = await executeSolution(
    code,
    problem.function_name,
    problem.test_cases as { input: unknown[]; expected: unknown }[],
  )

  if (execResult.error && !execResult.allPassed) {
    // Save the failed attempt
    await db.from('ono_solutions').insert({
      problem_id: problem.id,
      user_id: user.id,
      github_repo_url: repoUrl,
      github_username: username,
      source_code: code,
      all_tests_passed: false,
      test_results: execResult.testResults,
      execution_error: execResult.error,
    })

    return NextResponse.json({
      accepted: false,
      error: execResult.error,
      testResults: execResult.testResults,
    })
  }

  if (!execResult.allPassed) {
    // Save the failed attempt
    await db.from('ono_solutions').insert({
      problem_id: problem.id,
      user_id: user.id,
      github_repo_url: repoUrl,
      github_username: username,
      source_code: code,
      all_tests_passed: false,
      test_results: execResult.testResults,
    })

    return NextResponse.json({
      accepted: false,
      error: 'Not all test cases passed. Your solution must be correct.',
      testResults: execResult.testResults,
    })
  }

  // Compute the score
  const score = computeScore(
    {
      executionTimeMs: execResult.metrics.totalExecutionMs,
      peakMemoryBytes: execResult.metrics.peakMemoryBytes,
      loc: execResult.metrics.loc,
      numFunctions: execResult.metrics.numFunctions,
      numClasses: execResult.metrics.numClasses,
      numImports: execResult.metrics.numImports,
      avgNameLength: execResult.metrics.avgNameLength,
      longNamesCount: execResult.metrics.longNamesCount,
      commentLines: execResult.metrics.commentLines,
      totalLines: execResult.metrics.totalLines,
    },
    {
      timeMs: problem.optimal_time_ms,
      memoryBytes: problem.optimal_memory_bytes,
      loc: problem.optimal_loc,
    },
  )

  // Save the accepted solution
  const { data: solution, error: insertErr } = await db
    .from('ono_solutions')
    .insert({
      problem_id: problem.id,
      user_id: user.id,
      github_repo_url: repoUrl,
      github_username: username,
      source_code: code,
      all_tests_passed: true,
      test_results: execResult.testResults,
      total_score: score.total,
      computational_waste: score.computationalWaste,
      overengineering: score.overengineering,
      style_points: score.stylePoints,
      execution_time_ms: execResult.metrics.totalExecutionMs,
      peak_memory_bytes: execResult.metrics.peakMemoryBytes,
      loc: execResult.metrics.loc,
      num_functions: execResult.metrics.numFunctions,
      num_classes: execResult.metrics.numClasses,
      num_imports: execResult.metrics.numImports,
      avg_name_length: execResult.metrics.avgNameLength,
      long_names_count: execResult.metrics.longNamesCount,
      comment_lines: execResult.metrics.commentLines,
      total_lines: execResult.metrics.totalLines,
    })
    .select('id')
    .single()

  if (insertErr) {
    return NextResponse.json({ error: 'Failed to save solution' }, { status: 500 })
  }

  return NextResponse.json({
    accepted: true,
    solutionId: solution?.id,
    score,
    testResults: execResult.testResults,
    metrics: execResult.metrics,
  })
}

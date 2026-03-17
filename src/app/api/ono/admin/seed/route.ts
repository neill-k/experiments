import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { SEED_PROBLEMS } from '@/lib/ono/problems'

/**
 * POST /api/ono/admin/seed
 * Seeds the database with the initial problem set.
 * Requires the SUPABASE_SERVICE_ROLE_KEY (admin only).
 */
export async function POST(req: Request) {
  // Simple admin check via a secret header
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = supabaseAdmin()
  const results: { slug: string; status: string }[] = []

  for (const problem of SEED_PROBLEMS) {
    const { error } = await db.from('ono_problems').upsert(
      {
        slug: problem.slug,
        title: problem.title,
        description: problem.description,
        constraints: problem.constraints,
        category: problem.category,
        difficulty: problem.difficulty,
        function_name: problem.functionName,
        function_sig: problem.functionSig,
        test_cases: problem.testCases,
        optimal_code: problem.optimalCode,
        optimal_loc: problem.optimalLoc,
        optimal_time_ms: problem.optimalTimeMs,
        optimal_memory_bytes: problem.optimalMemoryBytes,
        is_active: true,
      },
      { onConflict: 'slug' },
    )

    results.push({
      slug: problem.slug,
      status: error ? `error: ${error.message}` : 'ok',
    })
  }

  return NextResponse.json({ seeded: results })
}

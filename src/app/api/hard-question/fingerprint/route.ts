import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabaseFromAccessToken } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    // Auth required
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

    const admin = supabaseAdmin()

    // Fetch philosophical fingerprints
    const { data: fingerprint, error: fpErr } = await admin
      .from('philosophical_fingerprints')
      .select('school, avg_score, sample_count')
      .eq('user_id', user.id)
      .order('avg_score', { ascending: false })

    if (fpErr) {
      console.error('Error fetching fingerprint:', fpErr)
      return NextResponse.json({ error: 'Failed to fetch fingerprint' }, { status: 500 })
    }

    // Fetch total answers count
    const { count, error: countErr } = await admin
      .from('user_answers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (countErr) {
      console.error('Error counting answers:', countErr)
      return NextResponse.json({ error: 'Failed to count answers' }, { status: 500 })
    }

    return NextResponse.json({
      fingerprint: fingerprint || [],
      total_answers: count || 0,
    })
  } catch (err) {
    console.error('Unexpected error in /api/hard-question/fingerprint:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

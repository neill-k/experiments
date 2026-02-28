import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  const db = supabaseAdmin()
  const { data, error } = await db
    .from('ono_problems')
    .select('id, slug, title, description, constraints, category, difficulty, function_name, function_sig, optimal_loc, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ problems: data })
}

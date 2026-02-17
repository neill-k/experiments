import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabaseFromAccessToken } from '@/lib/supabase/server'

async function authenticateUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice(7)
  const userClient = supabaseFromAccessToken(token)
  const { data: { user }, error } = await userClient.auth.getUser()

  if (error || !user) return null
  return user
}

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const admin = supabaseAdmin()

    const { data: favorites, error: favErr } = await admin
      .from('user_favorites')
      .select(`
        id,
        question_id,
        created_at,
        questions (
          id,
          question_text,
          context,
          category,
          difficulty,
          published_date
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (favErr) {
      console.error('Error fetching favorites:', favErr)
      return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
    }

    return NextResponse.json({ favorites: favorites || [] })
  } catch (err) {
    console.error('Unexpected error in GET /api/hard-question/favorites:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json()
    const { question_id } = body

    if (!question_id) {
      return NextResponse.json({ error: 'question_id is required' }, { status: 400 })
    }

    const admin = supabaseAdmin()

    // Check if already favorited
    const { data: existing } = await admin
      .from('user_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('question_id', question_id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Already favorited' }, { status: 409 })
    }

    const { data: favorite, error: insertErr } = await admin
      .from('user_favorites')
      .insert({
        user_id: user.id,
        question_id,
      })
      .select('id, question_id, created_at')
      .single()

    if (insertErr) {
      console.error('Error inserting favorite:', insertErr)
      return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 })
    }

    return NextResponse.json({ favorite }, { status: 201 })
  } catch (err) {
    console.error('Unexpected error in POST /api/hard-question/favorites:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await authenticateUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json()
    const { question_id } = body

    if (!question_id) {
      return NextResponse.json({ error: 'question_id is required' }, { status: 400 })
    }

    const admin = supabaseAdmin()

    const { error: deleteErr } = await admin
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('question_id', question_id)

    if (deleteErr) {
      console.error('Error deleting favorite:', deleteErr)
      return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Unexpected error in DELETE /api/hard-question/favorites:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

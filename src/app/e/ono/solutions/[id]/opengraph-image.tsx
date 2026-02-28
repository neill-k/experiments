import { ImageResponse } from 'next/og'
import { supabaseAdmin } from '@/lib/supabase/server'

export const runtime = 'edge'
export const alt = 'O(no) Solution Score'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Fetch solution data
  let username = 'Unknown'
  let score = 0
  let tier = 'UNKNOWN'
  let tierColor = '#888'
  let problemTitle = 'Unknown Problem'
  let waste = 0
  let overeng = 0
  let style = 0
  let loc = 0

  try {
    const db = supabaseAdmin()
    const { data: solution } = await db
      .from('ono_solutions')
      .select('github_username, total_score, computational_waste, overengineering, style_points, loc, problem_id')
      .eq('id', id)
      .single()

    if (solution) {
      username = solution.github_username
      score = solution.total_score
      waste = solution.computational_waste
      overeng = solution.overengineering
      style = solution.style_points
      loc = solution.loc

      if (score >= 1000) { tier = 'LEGENDARY'; tierColor = '#e63946' }
      else if (score >= 500) { tier = 'EXCELLENT'; tierColor = '#f5a623' }
      else if (score >= 200) { tier = 'NOTABLE'; tierColor = '#4ade80' }
      else if (score >= 50) { tier = 'ADEQUATE'; tierColor = 'rgba(235,235,235,0.5)' }
      else { tier = 'DISAPPOINTING'; tierColor = 'rgba(235,235,235,0.25)' }

      const { data: problem } = await db
        .from('ono_problems')
        .select('title')
        .eq('id', solution.problem_id)
        .single()

      if (problem) problemTitle = problem.title
    }
  } catch {
    // Use defaults
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          background: '#08080a',
          padding: '60px 80px',
          position: 'relative',
          fontFamily: 'monospace',
        }}
      >
        {/* Top stripe */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: `linear-gradient(90deg, ${tierColor}, ${tierColor}80)`,
          }}
        />

        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <span style={{ fontSize: 36, color: '#f5a623' }}>O(no)</span>
            <span style={{ fontSize: 16, color: 'rgba(235,235,235,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Performance Review
            </span>
          </div>
          <div style={{ display: 'flex', fontSize: 18, color: 'rgba(235,235,235,0.4)', marginTop: '8px' }}>
            {problemTitle} &mdash; by {username}
          </div>
        </div>

        {/* Score */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px' }}>
          <span style={{ fontSize: 120, lineHeight: 1, color: tierColor, fontWeight: 'bold' }}>
            {score.toFixed(1)}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '16px' }}>
            <span
              style={{
                fontSize: 20,
                color: tierColor,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                border: `2px solid ${tierColor}`,
                padding: '4px 12px',
              }}
            >
              {tier}
            </span>
          </div>
        </div>

        {/* Breakdown */}
        <div style={{ display: 'flex', gap: '48px' }}>
          <ScoreItem label="WASTE" value={waste.toFixed(1)} color="#e63946" />
          <ScoreItem label="OVERENG." value={overeng.toFixed(1)} color="#f5a623" />
          <ScoreItem label="STYLE" value={style.toFixed(1)} color="#4ade80" />
          <ScoreItem label="LOC" value={`${loc}`} color="rgba(235,235,235,0.5)" />
        </div>
      </div>
    ),
    { ...size },
  )
}

function ScoreItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: 11, color: 'rgba(235,235,235,0.25)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
        {label}
      </span>
      <span style={{ fontSize: 28, color, fontWeight: 'bold', marginTop: '4px' }}>
        {value}
      </span>
    </div>
  )
}

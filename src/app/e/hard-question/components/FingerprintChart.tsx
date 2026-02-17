'use client'

import { useMemo } from 'react'
import type { PhilosophicalFingerprint } from '../lib/types'
import { getSchoolColor, getSchoolLabel } from '../lib/school-colors'

interface FingerprintChartProps {
  fingerprint: PhilosophicalFingerprint[]
}

export function FingerprintChart({ fingerprint }: FingerprintChartProps) {
  const data = useMemo(() => {
    return fingerprint
      .filter((f) => f.sample_count > 0)
      .sort((a, b) => b.avg_score - a.avg_score)
  }, [fingerprint])

  const size = 400
  const center = size / 2
  const radius = size * 0.38
  const levels = 5

  if (data.length < 3) {
    return (
      <div className="flex items-center justify-center py-12">
        <p
          className="text-sm"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--muted)',
          }}
        >
          Answer more questions to see your chart (need at least 3 schools)
        </p>
      </div>
    )
  }

  const n = data.length
  const angleStep = (2 * Math.PI) / n

  function getPoint(index: number, value: number): [number, number] {
    const angle = angleStep * index - Math.PI / 2
    const r = radius * value
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)]
  }

  // Grid rings
  const gridRings = Array.from({ length: levels }, (_, i) => {
    const frac = (i + 1) / levels
    const points = Array.from({ length: n }, (_, j) => getPoint(j, frac))
    return points.map(([x, y]) => `${x},${y}`).join(' ')
  })

  // Axes
  const axes = Array.from({ length: n }, (_, i) => getPoint(i, 1))

  // Data polygon
  const dataPoints = data.map((d, i) => {
    const value = Math.max(0.05, d.avg_score)
    return getPoint(i, value)
  })
  const dataPolygon = dataPoints.map(([x, y]) => `${x},${y}`).join(' ')

  // Labels
  const labelPoints = data.map((d, i) => {
    const [x, y] = getPoint(i, 1.18)
    return { x, y, label: getSchoolLabel(d.school), color: getSchoolColor(d.school) }
  })

  return (
    <div className="fingerprint-chart flex justify-center overflow-hidden px-4">
      <svg
        viewBox={`-40 -40 ${size + 80} ${size + 80}`}
        className="w-full max-w-md"
      >
        {/* Grid rings */}
        {gridRings.map((points, i) => (
          <polygon
            key={i}
            points={points}
            fill="none"
            stroke="var(--border)"
            strokeWidth="0.5"
          />
        ))}

        {/* Axes */}
        {axes.map(([x, y], i) => (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="var(--border)"
            strokeWidth="0.5"
          />
        ))}

        {/* Data polygon */}
        <polygon
          points={dataPolygon}
          fill="var(--fg)"
          fillOpacity="0.08"
          stroke="var(--fg)"
          strokeWidth="1.5"
          className="chart-polygon"
        />

        {/* Data points */}
        {dataPoints.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="3.5"
            fill={getSchoolColor(data[i].school)}
            className="chart-dot"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}

        {/* Labels */}
        {labelPoints.map((lp, i) => (
          <text
            key={i}
            x={lp.x}
            y={lp.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={lp.color}
            fontSize="9"
            fontFamily="var(--font-mono)"
          >
            {lp.label}
          </text>
        ))}
      </svg>

      <style jsx>{`
        .chart-polygon {
          animation: chartDraw 1s ease-out both;
        }
        .chart-dot {
          opacity: 0;
          animation: dotAppear 0.4s ease-out forwards;
        }
        @keyframes chartDraw {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes dotAppear {
          from { opacity: 0; r: 0; }
          to { opacity: 1; r: 3.5; }
        }
      `}</style>
    </div>
  )
}

import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'O(no) — Competitive programming for the rest of us'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: '#08080a',
          padding: '80px',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: 'monospace',
        }}
      >
        {/* Caution tape diagonal stripes */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '8px',
            background: 'repeating-linear-gradient(90deg, #f5a623 0px, #f5a623 20px, #08080a 20px, #08080a 40px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '8px',
            background: 'repeating-linear-gradient(90deg, #e63946 0px, #e63946 20px, #08080a 20px, #08080a 40px)',
          }}
        />

        {/* Glow orb */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245, 166, 35, 0.15) 0%, transparent 70%)',
          }}
        />

        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: 96,
            color: '#f5a623',
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
        >
          O(no)
        </div>

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            fontSize: 28,
            color: 'rgba(235,235,235,0.5)',
            marginTop: '20px',
          }}
        >
          Solutions that work. We&apos;re so sorry.
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: 'flex',
            fontSize: 20,
            color: 'rgba(235,235,235,0.25)',
            marginTop: '32px',
            maxWidth: '700px',
            lineHeight: 1.5,
          }}
        >
          Competitive programming where scoring rewards inefficiency, over-engineering, and computational horror.
        </div>

        {/* Bottom label */}
        <div
          style={{
            display: 'flex',
            fontSize: 14,
            color: 'rgba(235,235,235,0.15)',
            marginTop: '40px',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
          }}
        >
          experiments.neillkillgore.com/e/ono
        </div>
      </div>
    ),
    { ...size },
  )
}

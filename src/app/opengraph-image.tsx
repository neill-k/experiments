import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Experiments - Neill Killgore'
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
        }}
      >
        {/* Gradient orbs */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-10%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(240,90,255,0.12) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-30%',
            right: '-5%',
            width: '700px',
            height: '700px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(90,190,255,0.10) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '20%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(120,255,180,0.08) 0%, transparent 70%)',
          }}
        />

        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: 72,
            fontWeight: 400,
            color: '#ebebeb',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          Experiments
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: 'flex',
            fontSize: 24,
            color: 'rgba(235,235,235,0.45)',
            marginTop: '24px',
            lineHeight: 1.5,
            maxWidth: '700px',
          }}
        >
          Daily shipped prototypes - interactive tools, creative canvases, and AI utilities. Built overnight by an autonomous pipeline.
        </div>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            width: '64px',
            height: '1px',
            background: 'rgba(235,235,235,0.2)',
            marginTop: '40px',
          }}
        />

        {/* Attribution */}
        <div
          style={{
            display: 'flex',
            fontSize: 18,
            color: 'rgba(235,235,235,0.25)',
            marginTop: '24px',
          }}
        >
          experiments.neillkillgore.com
        </div>
      </div>
    ),
    { ...size },
  )
}

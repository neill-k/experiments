import { ImageResponse } from 'next/og'

export const ogSize = { width: 1200, height: 630 }

/**
 * Generate an OG image for an experiment page.
 * Shared across all experiment opengraph-image.tsx files.
 */
export function experimentOgImage({
  icon,
  title,
  description,
  tags,
}: {
  icon?: string
  title: string
  description: string
  tags: string[]
}) {
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
            background:
              'radial-gradient(circle, rgba(240,90,255,0.12) 0%, transparent 70%)',
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
            background:
              'radial-gradient(circle, rgba(90,190,255,0.10) 0%, transparent 70%)',
          }}
        />

        {/* Site label */}
        <div
          style={{
            display: 'flex',
            fontSize: 16,
            color: 'rgba(235,235,235,0.25)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: '32px',
          }}
        >
          Experiments
        </div>

        {/* Icon + Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          {icon && (
            <div style={{ display: 'flex', fontSize: 64 }}>{icon}</div>
          )}
          <div
            style={{
              display: 'flex',
              fontSize: 64,
              fontWeight: 400,
              color: '#ebebeb',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            {title}
          </div>
        </div>

        {/* Description */}
        <div
          style={{
            display: 'flex',
            fontSize: 24,
            color: 'rgba(235,235,235,0.45)',
            marginTop: '24px',
            lineHeight: 1.5,
            maxWidth: '900px',
          }}
        >
          {description}
        </div>

        {/* Tags */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginTop: '40px',
          }}
        >
          {tags.map((tag) => (
            <div
              key={tag}
              style={{
                display: 'flex',
                fontSize: 14,
                color: 'rgba(235,235,235,0.3)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                border: '1px solid rgba(235,235,235,0.1)',
                padding: '6px 14px',
              }}
            >
              {tag}
            </div>
          ))}
        </div>

        {/* Bottom attribution */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '80px',
            display: 'flex',
            fontSize: 16,
            color: 'rgba(235,235,235,0.2)',
          }}
        >
          experiments.neillkillgore.com
        </div>
      </div>
    ),
    { ...ogSize },
  )
}

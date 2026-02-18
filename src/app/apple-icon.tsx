import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'
export const runtime = 'edge'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#08080a',
          borderRadius: 36,
        }}
      >
        {/* Larger version of the "E" mark for Apple touch icon */}
        <svg
          width="110"
          height="110"
          viewBox="0 0 22 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="22" y2="22">
              <stop offset="0%" stopColor="#c87aff" />
              <stop offset="50%" stopColor="#5abedc" />
              <stop offset="100%" stopColor="#78ffb4" />
            </linearGradient>
          </defs>
          <rect x="3" y="3" width="16" height="2.5" rx="1" fill="url(#g)" />
          <rect x="3" y="9.5" width="12" height="2.5" rx="1" fill="url(#g)" />
          <rect x="3" y="16" width="16" height="2.5" rx="1" fill="url(#g)" />
          <rect x="3" y="3" width="2.5" height="15.5" rx="1" fill="url(#g)" />
        </svg>
      </div>
    ),
    { ...size },
  )
}

import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Blog Platform'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
            }}
          >
            📝
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: 'white',
            }}
          >
            Blog Platform
          </div>
        </div>

        <div
          style={{
            fontSize: 32,
            color: 'rgba(255, 255, 255, 0.85)',
            textAlign: 'center',
            maxWidth: '800px',
          }}
        >
          글을 작성하고 공유하는 블로그 플랫폼
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

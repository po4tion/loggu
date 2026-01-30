import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'
export const alt = 'User Profile'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

interface Props {
  params: Promise<{ username: string }>
}

export default async function OGImage({ params }: Props) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name, bio')
    .eq('username', username)
    .single()

  const displayName = profile?.display_name || profile?.username || username
  const bio = profile?.bio || ''
  const initials = displayName.slice(0, 2).toUpperCase()

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
          padding: '60px',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        }}
      >
        <div
          style={{
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 64,
            fontWeight: 700,
            color: 'white',
            marginBottom: '32px',
          }}
        >
          {initials}
        </div>

        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: 'white',
            marginBottom: '12px',
          }}
        >
          {displayName}
        </div>

        <div
          style={{
            fontSize: 28,
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '24px',
          }}
        >
          @{profile?.username || username}
        </div>

        {bio && (
          <div
            style={{
              fontSize: 24,
              color: 'rgba(255, 255, 255, 0.8)',
              textAlign: 'center',
              maxWidth: '800px',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {bio}
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 24,
            color: 'rgba(255, 255, 255, 0.5)',
            fontWeight: 600,
          }}
        >
          loggu
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

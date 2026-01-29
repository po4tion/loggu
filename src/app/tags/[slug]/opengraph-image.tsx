import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'
export const alt = 'Tag'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function OGImage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: tag } = await supabase
    .from('tags')
    .select('name')
    .eq('slug', slug)
    .single()

  const tagName = tag?.name || slug

  // 태그에 해당하는 포스트 수 조회
  const { count } = await supabase
    .from('post_tags')
    .select('*', { count: 'exact', head: true })
    .eq('tag_id', slug)

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
          background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        }}
      >
        <div
          style={{
            fontSize: 32,
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: '16px',
          }}
        >
          태그
        </div>

        <div
          style={{
            fontSize: 80,
            fontWeight: 700,
            color: 'white',
            marginBottom: '24px',
          }}
        >
          #{tagName}
        </div>

        {count !== null && (
          <div
            style={{
              fontSize: 28,
              color: 'rgba(255, 255, 255, 0.85)',
            }}
          >
            {count}개의 글
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 24,
            color: 'rgba(255, 255, 255, 0.6)',
            fontWeight: 600,
          }}
        >
          Blog Platform
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

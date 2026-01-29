import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'
export const alt = 'Blog Post'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function OGImage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select(`
      title,
      excerpt,
      profiles!posts_author_id_fkey (
        display_name,
        username
      )
    `)
    .eq('slug', slug)
    .eq('published', true)
    .single()

  const title = post?.title || 'Blog Post'
  const excerpt = post?.excerpt || ''
  const author = post?.profiles as unknown as { display_name: string | null; username: string } | null
  const authorName = author?.display_name || author?.username || 'Anonymous'

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: 'white',
              lineHeight: 1.2,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </div>
          {excerpt && (
            <div
              style={{
                fontSize: 28,
                color: 'rgba(255, 255, 255, 0.85)',
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {excerpt}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: 600,
                color: 'white',
              }}
            >
              {authorName.slice(0, 2).toUpperCase()}
            </div>
            <div
              style={{
                fontSize: 24,
                color: 'white',
                fontWeight: 500,
              }}
            >
              {authorName}
            </div>
          </div>

          <div
            style={{
              fontSize: 24,
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: 600,
            }}
          >
            Blog Platform
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

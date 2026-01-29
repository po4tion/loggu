import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PostCard } from '@/components/post/post-card'

interface TagPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { data: tag } = await supabase
    .from('tags')
    .select('name')
    .eq('slug', slug)
    .single()

  if (!tag) {
    return {
      title: '태그를 찾을 수 없음',
      robots: { index: false },
    }
  }

  const title = `#${tag.name} 태그`
  const description = `${tag.name} 태그가 달린 글 모음`
  const canonicalUrl = `${siteUrl}/tags/${slug}`

  return {
    title,
    description,
    keywords: [tag.name],
    openGraph: {
      type: 'website',
      title,
      description,
      url: canonicalUrl,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  }
}

export default async function TagPage({ params }: TagPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: tag } = await supabase
    .from('tags')
    .select('id, name, slug')
    .eq('slug', slug)
    .single()

  if (!tag) {
    notFound()
  }

  // 해당 태그가 달린 발행된 글 목록 조회
  const { data: postTags } = await supabase
    .from('post_tags')
    .select(
      `
      posts!inner (
        id,
        title,
        slug,
        excerpt,
        cover_image_url,
        published,
        published_at,
        views,
        author_id,
        profiles!posts_author_id_fkey (
          username,
          display_name,
          avatar_url
        )
      )
    `
    )
    .eq('tag_id', tag.id)

  // 발행된 글만 필터링하고 형식 변환
  const posts = (postTags || [])
    .map((pt) => pt.posts as unknown as {
      id: string
      title: string
      slug: string
      excerpt: string | null
      cover_image_url: string | null
      published: boolean
      published_at: string | null
      views: number
      author_id: string
      profiles: {
        username: string
        display_name: string | null
        avatar_url: string | null
      }
    })
    .filter((post) => post.published)

  // 좋아요 수 조회
  const postsWithLikes = await Promise.all(
    posts.map(async (post) => {
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id)

      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        cover_image_url: post.cover_image_url,
        published_at: post.published_at,
        views: post.views,
        author_username: post.profiles.username,
        author_display_name: post.profiles.display_name,
        author_avatar_url: post.profiles.avatar_url,
        likes_count: count ?? 0,
      }
    })
  )

  return (
    <main className="container mx-auto py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">#{tag.name}</h1>
        <p className="text-muted-foreground mt-2">
          {postsWithLikes.length}개의 글
        </p>
      </header>

      {postsWithLikes.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {postsWithLikes.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground text-lg">
            이 태그가 달린 글이 없습니다.
          </p>
        </div>
      )}
    </main>
  )
}

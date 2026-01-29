import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PostContent } from '@/components/post/post-content'
import { PostActions } from '@/components/post/post-actions'

interface PostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select('title, excerpt, cover_image_url')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!post) {
    return { title: '글을 찾을 수 없음 | Blog Platform' }
  }

  return {
    title: `${post.title} | Blog Platform`,
    description: post.excerpt || post.title,
    openGraph: {
      title: post.title,
      description: post.excerpt || post.title,
      images: post.cover_image_url ? [post.cover_image_url] : undefined,
    },
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select(
      `
      id,
      title,
      slug,
      content,
      excerpt,
      cover_image_url,
      published,
      published_at,
      views,
      author_id,
      profiles!posts_author_id_fkey (
        id,
        username,
        display_name,
        avatar_url
      )
    `
    )
    .eq('slug', slug)
    .single()

  if (!post) {
    notFound()
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthor = user?.id === post.author_id
  const canView = post.published || isAuthor

  if (!canView) {
    notFound()
  }

  // Increment view count (only for published posts, not for author)
  if (post.published && !isAuthor) {
    await supabase.rpc('increment_post_views', { post_id: post.id })
  }

  const author = post.profiles as unknown as {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }

  const displayName = author.display_name || author.username
  const initials = displayName.slice(0, 2).toUpperCase()
  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <main className="container max-w-4xl py-10">
      <article>
        {post.cover_image_url && (
          <div className="relative mb-8 aspect-video overflow-hidden rounded-lg">
            <Image
              src={post.cover_image_url}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <header className="mb-8">
          {!post.published && (
            <span className="mb-2 inline-block rounded bg-yellow-100 px-2 py-1 text-sm text-yellow-800">
              임시저장
            </span>
          )}
          <h1 className="text-4xl leading-tight font-bold">{post.title}</h1>

          <div className="mt-6 flex items-center justify-between">
            <Link
              href={`/profile/${author.username}`}
              className="flex items-center gap-3 hover:opacity-80"
            >
              <Avatar>
                <AvatarImage src={author.avatar_url ?? undefined} alt={displayName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{displayName}</p>
                <p className="text-muted-foreground text-sm">
                  {publishedDate && <span>{publishedDate}</span>}
                  {publishedDate && post.views > 0 && <span> · </span>}
                  {post.views > 0 && <span>조회 {post.views}</span>}
                </p>
              </div>
            </Link>

            {isAuthor && <PostActions postId={post.id} slug={post.slug} />}
          </div>
        </header>

        <PostContent content={post.content} />
      </article>
    </main>
  )
}
